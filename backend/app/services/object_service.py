import cv2
import numpy as np
from typing import List, Tuple
from app.models.schemas import DetectedObject, CalibrationParams

class ObjectService:
    @staticmethod
    def detect_objects(image_np: np.ndarray, depth_map: np.ndarray, calibration: CalibrationParams) -> List[DetectedObject]:
        """
        Segments elevated structures, buildings, and controlled vegetation from aerial imagery.
        Extracts clean 2D polygonal footprints using Douglas-Peucker simplification,
        computes local ground datums via dilated ring buffers, and estimates robust,
        single-coherent-height elevations.
        """
        H, W = depth_map.shape
        
        # 1. Ground baseline estimation (P10)
        ground_baseline = float(np.percentile(depth_map, 10))
        
        # 2. Vegetation Index (Excess Green = 2*G - R - B) to separate trees from roofs
        if image_np.ndim == 3 and image_np.shape[2] >= 3:
            r = image_np[:, :, 0].astype(np.float32)
            g = image_np[:, :, 1].astype(np.float32)
            b = image_np[:, :, 2].astype(np.float32)
            ex_green = 2.0 * g - r - b
            # Normalized vegetation mask
            is_green = (ex_green > 25.0) & (g > r) & (g > b)
        else:
            is_green = np.zeros((H, W), dtype=bool)

        # 3. Elevated feature mask (relative elevation above ground baseline)
        elev_thresh = ground_baseline + 0.08
        elevated_mask = (depth_map > elev_thresh).astype(np.uint8) * 255

        # 4. Morphological cleaning:
        # - Close small roof holes (HVAC, skylights)
        # - Open to detach thin wires, road lines, small artifacts
        kernel_close = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
        kernel_open = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        cleaned_mask = cv2.morphologyEx(elevated_mask, cv2.MORPH_CLOSE, kernel_close)
        cleaned_mask = cv2.morphologyEx(cleaned_mask, cv2.MORPH_OPEN, kernel_open)

        # Fill internal holes in building masks
        cnts, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        filled_mask = np.zeros((H, W), dtype=np.uint8)
        for c in cnts:
            if cv2.contourArea(c) > 200:
                cv2.drawContours(filled_mask, [c], -1, 255, -1)

        # Find external contours of individual building candidates
        contours, _ = cv2.findContours(filled_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)

        objects: List[DetectedObject] = []
        obj_counter = 1

        for cnt in contours:
            area_px = cv2.contourArea(cnt)
            # Filter noise and whole-frame boundaries
            if area_px < 350 or area_px > (H * W * 0.70):
                continue

            # Check if this object is predominantly vegetation/tree cluster
            mask_single = np.zeros((H, W), dtype=np.uint8)
            cv2.drawContours(mask_single, [cnt], -1, 255, -1)
            cnt_pixels = mask_single > 0
            green_ratio = float(np.sum(is_green & cnt_pixels)) / float(np.sum(cnt_pixels) + 1e-5)
            is_veg = green_ratio > 0.48

            # Simplify contour into clean polygon (Douglas-Peucker)
            peri = cv2.arcLength(cnt, True)
            epsilon = max(2.5, 0.022 * peri)
            approx = cv2.approxPolyDP(cnt, epsilon, True)

            # Ensure valid polygon with at least 3 vertices
            if len(approx) < 3:
                # Fallback to minimal bounding box if simplification degenerated
                rect = cv2.minAreaRect(cnt)
                box_pts = cv2.boxPoints(rect).astype(np.int32)
                approx = box_pts.reshape(-1, 1, 2)

            # Clean polygon normalized coordinates
            polygon_norm = [
                [round(float(pt[0][0]) / W, 4), round(float(pt[0][1]) / H, 4)]
                for pt in approx
            ]

            # Bounding box & Center of Mass (Moments)
            x, y, w, h = cv2.boundingRect(cnt)
            M = cv2.moments(cnt)
            if M["m00"] > 0:
                cx = float(M["m10"] / M["m00"])
                cy = float(M["m01"] / M["m00"])
            else:
                cx = float(x + w / 2)
                cy = float(y + h / 2)

            # Minimum Area Rect for building orientation and aspect ratio
            rect = cv2.minAreaRect(cnt)
            rect_w, rect_h = rect[1]
            orientation_angle = round(float(rect[2]), 1)
            aspect_ratio = float(max(rect_w, rect_h) / (min(rect_w, rect_h) + 1e-5))

            # 5. Local Ground Reference via Dilated Ring Buffer (15-20 px ring)
            kernel_ring = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))
            dilated = cv2.dilate(mask_single, kernel_ring)
            # Subtract all elevated masks to ensure we only sample true bare ground
            ground_ring_mask = (dilated > 0) & (filled_mask == 0)
            ground_samples = depth_map[ground_ring_mask]

            if len(ground_samples) > 20:
                local_ground = float(np.median(ground_samples))
            else:
                local_ground = ground_baseline

            # 6. Building Height Estimation:
            # Sample depths strictly inside building footprint
            building_depths = depth_map[cnt_pixels]
            if len(building_depths) == 0:
                continue

            # Robust statistical percentiles (P10, P50, P90)
            p10 = float(np.percentile(building_depths, 10))
            p50 = float(np.percentile(building_depths, 50))
            p90 = float(np.percentile(building_depths, 90))

            # Trimmed median elevation difference
            rel_elevation = max(0.015, p50 - local_ground)

            # Check for roof slope (depth gradient along major axis)
            depth_variance = float(p90 - p10)
            roof_type = "sloped" if (depth_variance > 0.14 and not is_veg) else "flat"

            # 7. Physical Scale / Metric Height Calculation
            if calibration.is_calibrated:
                if calibration.reference_height and calibration.reference_height > 0:
                    scale = calibration.reference_height / (depth_map.max() - ground_baseline + 1e-5)
                else:
                    scale = (calibration.camera_altitude * 0.15) * (calibration.gsd / 0.35)
                est_height = round(float(rel_elevation * scale), 1)
                area_sq_m = round(float(area_px * (calibration.gsd ** 2)), 1)
            else:
                est_height = round(float(rel_elevation * 100.0), 1)
                area_sq_m = round(float(area_px), 1)

            # Classify structure type
            if is_veg:
                obj_type = "Vegetation Canopy / Trees"
                confidence = round(min(0.96, max(0.80, 0.85 + (area_px / (H * W)) * 0.3)), 2)
            else:
                if est_height > 50.0:
                    obj_type = "Commercial High-Rise"
                elif est_height > 25.0:
                    obj_type = "Commercial Complex"
                elif aspect_ratio > 2.5:
                    obj_type = "Industrial / Logistics Facility"
                elif 0.8 < aspect_ratio < 1.25 and area_px < 3500:
                    obj_type = "Compact Urban Building"
                else:
                    obj_type = "Residential Structure"

                # Confidence based on contour compactness and depth contrast
                compactness = (4 * np.pi * area_px) / (peri * peri + 1e-5)
                confidence = round(min(0.98, max(0.82, 0.84 + min(0.12, rel_elevation * 0.3) + compactness * 0.04)), 2)

            obj = DetectedObject(
                id=f"STR-{obj_counter:02d}",
                name=f"{'Tree Cluster' if is_veg else 'Building'} {obj_counter:02d} ({obj_type})",
                type=obj_type,
                box=[int(x), int(y), int(x + w), int(y + h)],
                estimated_height=est_height,
                confidence=confidence,
                area_sq_m=area_sq_m,
                footprint_norm=[
                    round(x / W, 4),
                    round(y / H, 4),
                    round((x + w) / W, 4),
                    round((y + h) / H, 4)
                ],
                relative_depth=round(p50, 3),
                polygon=polygon_norm,
                centroid=[round(cx / W, 4), round(cy / H, 4)],
                orientation=orientation_angle,
                roof_type=roof_type
            )
            objects.append(obj)
            obj_counter += 1
            if len(objects) >= 20:  # Allow up to 20 prominent structures
                break

        return objects

object_service = ObjectService()
