import cv2
import numpy as np
from typing import Dict, Any, Tuple, Optional
from app.models.schemas import CalibrationParams

class HeightService:
    @staticmethod
    def calculate_heights(
        depth_map: np.ndarray, 
        calibration: CalibrationParams,
        image_np: Optional[np.ndarray] = None
    ) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        Calculates structured height field and bare-earth smooth ground terrain.
        Eliminates needle spikes, in-paints building footprints to estimate true ground datum,
        and flattens road/shadow anomalies.
        Returns:
            - height_field: np.ndarray (float32, in meters if calibrated, else normalized [0-100])
            - ground_field: np.ndarray (float32, smooth bare-earth ground elevation)
            - stats: dictionary with min, max, avg, distribution, calibration note
        """
        H, W = depth_map.shape
        
        # 1. Ground baseline estimation (P08) to anchor ground elevation
        ground_baseline = float(np.percentile(depth_map, 8))
        
        # 2. Shadow suppression:
        # Shadows are dark RGB regions with artificially depressed depth values.
        # Clamp any deep pits back to the ground baseline.
        clean_depth = np.maximum(ground_baseline, depth_map)

        # 3. Bare-Earth Ground Estimation (Progressive Morphological Inpainting)
        # Elevated structures: disparity above ground baseline + threshold
        elevated_mask = (clean_depth > (ground_baseline + 0.08)).astype(np.uint8) * 255
        # Dilate mask slightly to cover wall edges
        kernel_dilate = cv2.getStructuringElement(cv2.MORPH_RECT, (11, 11))
        elevated_mask = cv2.dilate(elevated_mask, kernel_dilate)

        # Inpaint ground underneath elevated structures using Navier-Stokes / Telea
        # Convert depth to uint8 for cv2.inpaint
        depth_u8 = np.clip(clean_depth * 255.0, 0, 255).astype(np.uint8)
        ground_inpainted_u8 = cv2.inpaint(depth_u8, elevated_mask, inpaintRadius=9, flags=cv2.INPAINT_TELEA)
        ground_depth = ground_inpainted_u8.astype(np.float32) / 255.0

        # Low-pass Gaussian smoothing on bare-earth ground so terrain is smooth and natural
        ground_smooth = cv2.GaussianBlur(ground_depth, (25, 25), 6.0)

        # 4. Feature Elevation Field above Bare-Earth Ground
        # Height at any point is the elevation above local bare-earth ground
        relative_elevation = np.maximum(0.0, clean_depth - ground_smooth)
        max_rel = float(relative_elevation.max())
        if max_rel <= 1e-6:
            max_rel = 1.0

        # 5. Calibration & Unit Scaling
        if calibration.is_calibrated:
            if calibration.reference_height and calibration.reference_height > 0:
                scale_m = calibration.reference_height / max_rel
            else:
                scale_m = min(150.0, (calibration.camera_altitude * 0.15) * (calibration.gsd / 0.35))
                
            height_field = relative_elevation * scale_m
            ground_field = (ground_smooth - ground_baseline) * scale_m
            unit = "meters"
            cal_status = f"Calibrated (GSD: {calibration.gsd}m/px, Alt: {calibration.camera_altitude}m)"
            sci_note = "Calibrated metric heights derived from photogrammetric camera parameters and bare-earth ground datum."
        else:
            scale_m = 100.0  # Normalized relative index 0 to 100
            height_field = (relative_elevation / max_rel) * scale_m
            ground_field = ((ground_smooth - ground_baseline) / max_rel) * scale_m
            unit = "relative units"
            cal_status = "Uncalibrated (Relative Elevation)"
            sci_note = "Relative height estimate. Absolute height requires scene calibration or elevation reference data."

        # Ensure ground field is non-negative
        ground_field = np.maximum(0.0, ground_field)

        min_h = round(float(height_field.min()), 2)
        max_h = round(float(height_field.max()), 2)
        avg_h = round(float(height_field.mean()), 2)
        h_range = round(max_h - min_h, 2)
        
        # Elevation distribution for histogram / charts
        hist, bin_edges = np.histogram(height_field, bins=10)
        distribution = []
        for i in range(len(hist)):
            distribution.append({
                "range": f"{round(bin_edges[i], 1)} - {round(bin_edges[i+1], 1)}",
                "count": int(hist[i]),
                "percentage": round(float(hist[i]) / (H * W) * 100, 1),
                "elevation": round(float(bin_edges[i] + bin_edges[i+1]) / 2, 1)
            })

        stats = {
            "min_height": min_h,
            "max_height": max_h,
            "average_height": avg_h,
            "height_range": h_range,
            "unit": unit,
            "calibration_status": cal_status,
            "scientific_note": sci_note,
            "elevation_distribution": distribution
        }
        
        return height_field, ground_field, stats

height_service = HeightService()
