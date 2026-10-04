import os
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def generate_demo_assets():
    backend_demo_dir = os.path.join(os.path.dirname(__file__), "static", "demo")
    frontend_demo_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "demo")
    
    os.makedirs(backend_demo_dir, exist_ok=True)
    os.makedirs(frontend_demo_dir, exist_ok=True)
    
    W, H = 512, 512
    
    # -------------------------------------------------------------
    # DEMO 1: URBAN METROPOLIS (Skyscrapers, office blocks, avenues)
    # -------------------------------------------------------------
    img_urban = Image.new("RGB", (W, H), (45, 52, 58))
    draw_urban = ImageDraw.Draw(img_urban)
    depth_urban = np.zeros((H, W), dtype=np.float32) + 0.08  # Ground plane elevation
    
    # Roads & blocks
    road_color = (32, 35, 40)
    for x in range(0, W, 96):
        draw_urban.rectangle([x, 0, x+16, H], fill=road_color)
    for y in range(0, H, 96):
        draw_urban.rectangle([0, y, W, y+16], fill=road_color)
        
    # Buildings with distinct heights
    buildings = [
        {"id": "BLD-01", "name": "Apex Center Tower", "type": "Commercial High-Rise", "box": [40, 40, 160, 160], "height": 86.4, "norm_depth": 0.88, "color": (160, 185, 205), "roof_color": (110, 140, 165)},
        {"id": "BLD-02", "name": "Meridian Financial", "type": "Skyscraper", "box": [190, 35, 280, 170], "height": 112.0, "norm_depth": 0.96, "color": (140, 170, 195), "roof_color": (95, 125, 150)},
        {"id": "BLD-03", "name": "CyberTech Hub", "type": "Office Complex", "box": [310, 45, 470, 150], "height": 45.2, "norm_depth": 0.52, "color": (180, 175, 165), "roof_color": (130, 125, 115)},
        {"id": "BLD-04", "name": "Horizon Plaza A", "type": "Residential Tower", "box": [45, 190, 140, 320], "height": 62.8, "norm_depth": 0.68, "color": (175, 190, 195), "roof_color": (120, 140, 150)},
        {"id": "BLD-05", "name": "Horizon Plaza B", "type": "Residential Tower", "box": [160, 195, 275, 305], "height": 58.5, "norm_depth": 0.64, "color": (170, 185, 190), "roof_color": (115, 135, 145)},
        {"id": "BLD-06", "name": "Civic Transit Pavilion", "type": "Transit Terminal", "box": [305, 190, 480, 320], "height": 22.0, "norm_depth": 0.28, "color": (150, 160, 165), "roof_color": (100, 110, 115)},
        {"id": "BLD-07", "name": "Grand Metropolis Hotel", "type": "Luxury Hotel", "box": [40, 350, 150, 480], "height": 74.0, "norm_depth": 0.78, "color": (195, 185, 175), "roof_color": (145, 135, 125)},
        {"id": "BLD-08", "name": "North Logistics Center", "type": "Warehouse & Logistics", "box": [180, 345, 330, 475], "height": 18.5, "norm_depth": 0.22, "color": (130, 140, 145), "roof_color": (85, 95, 100)},
        {"id": "BLD-09", "name": "BioScience Research Lab", "type": "Research Facility", "box": [355, 355, 475, 475], "height": 38.6, "norm_depth": 0.44, "color": (165, 180, 190), "roof_color": (115, 130, 140)},
    ]
    
    for b in buildings:
        bx1, by1, bx2, by2 = b["box"]
        # Building shadow
        draw_urban.rectangle([bx1+12, by1+12, bx2+18, by2+18], fill=(20, 24, 28))
        # Building roof
        draw_urban.rectangle([bx1, by1, bx2, by2], fill=b["color"], outline=(200, 220, 235), width=2)
        # Inner structure details
        pad = 8
        draw_urban.rectangle([bx1+pad, by1+pad, bx2-pad, by2-pad], fill=b["roof_color"])
        # HVAC & rooftop units
        draw_urban.rectangle([bx1+pad+4, by1+pad+4, bx1+pad+16, by1+pad+16], fill=(220, 230, 240))
        draw_urban.rectangle([bx2-pad-16, by2-pad-16, bx2-pad-4, by2-pad-4], fill=(210, 220, 230))
        
        # In depth map
        depth_urban[by1:by2, bx1:bx2] = b["norm_depth"]
        # Add slight roof gradient
        for yy in range(by1+pad, by2-pad):
            for xx in range(bx1+pad, bx2-pad):
                depth_urban[yy, xx] = min(1.0, b["norm_depth"] + 0.03)

    # Save Urban demo
    urban_img_path = os.path.join(frontend_demo_dir, "urban_aerial.jpg")
    img_urban.save(urban_img_path, quality=95)
    img_urban.save(os.path.join(backend_demo_dir, "urban_aerial.jpg"), quality=95)
    
    # Generate Depth Map image (Viridis and Grayscale)
    depth_urban_norm = np.clip(depth_urban * 255, 0, 255).astype(np.uint8)
    depth_urban_img = Image.fromarray(depth_urban_norm)
    depth_urban_img.save(os.path.join(frontend_demo_dir, "urban_depth.png"))
    depth_urban_img.save(os.path.join(backend_demo_dir, "urban_depth.png"))
    
    # Save urban metadata
    urban_meta = {
        "id": "demo-urban",
        "title": "Metropolitan Central District",
        "category": "Urban Satellite / Aerial",
        "image_url": "/demo/urban_aerial.jpg",
        "depth_url": "/demo/urban_depth.png",
        "resolution": "512 x 512 px",
        "file_size": "142 KB",
        "format": "JPEG",
        "processing_time": 0.42,
        "model_name": "Depth Anything V2 (Metric / Relative)",
        "confidence": 0.94,
        "calibration_status": "Calibrated (GSD: 0.35m/px, Alt: 450m)",
        "min_height": 0.0,
        "max_height": 112.0,
        "average_height": 26.4,
        "objects": buildings
    }
    with open(os.path.join(frontend_demo_dir, "urban_meta.json"), "w") as f:
        json.dump(urban_meta, f, indent=2)
    with open(os.path.join(backend_demo_dir, "urban_meta.json"), "w") as f:
        json.dump(urban_meta, f, indent=2)

    # -------------------------------------------------------------
    # DEMO 2: MOUNTAIN RIDGE & VALLEY (Rugged terrain, elevation gradients)
    # -------------------------------------------------------------
    x = np.linspace(-3, 3, W)
    y = np.linspace(-3, 3, H)
    X, Y = np.meshgrid(x, y)
    
    # Multi-frequency mountain elevation
    Z = (
        0.55 * np.exp(-((X - 0.5)**2 + (Y + 0.3)**2) / 1.8) +
        0.45 * np.exp(-((X + 1.2)**2 + (Y - 0.8)**2) / 2.2) +
        0.35 * np.sin(2.5 * X) * np.cos(2.2 * Y) * 0.35 +
        0.20 * np.sin(5.0 * X + 1.2) * np.cos(4.8 * Y) * 0.15 +
        0.15 * np.sin(10.0 * X) * 0.05
    )
    Z = (Z - Z.min()) / (Z.max() - Z.min())  # Normalized 0 to 1
    
    # Mountain satellite color synthesis
    mountain_rgb = np.zeros((H, W, 3), dtype=np.uint8)
    # Valley greens and river
    for r in range(H):
        for c in range(W):
            elev = Z[r, c]
            if elev < 0.22:
                # River / basin
                mountain_rgb[r, c] = [38 + int(elev*40), 55 + int(elev*50), 48 + int(elev*30)]
            elif elev < 0.55:
                # Forest slopes
                t = (elev - 0.22) / 0.33
                mountain_rgb[r, c] = [int(45 + t*40), int(85 - t*15), int(42 + t*25)]
            elif elev < 0.80:
                # Exposed rocky ridges
                t = (elev - 0.55) / 0.25
                mountain_rgb[r, c] = [int(115 + t*45), int(105 + t*35), int(95 + t*30)]
            else:
                # Snow / high alpine summit
                t = (elev - 0.80) / 0.20
                mountain_rgb[r, c] = [int(190 + t*55), int(195 + t*55), int(205 + t*45)]

    img_mountain = Image.fromarray(mountain_rgb).filter(ImageFilter.GaussianBlur(radius=0.8))
    img_mountain.save(os.path.join(frontend_demo_dir, "mountain_aerial.jpg"), quality=95)
    img_mountain.save(os.path.join(backend_demo_dir, "mountain_aerial.jpg"), quality=95)
    
    depth_mountain_norm = np.clip(Z * 255, 0, 255).astype(np.uint8)
    depth_mountain_img = Image.fromarray(depth_mountain_norm)
    depth_mountain_img.save(os.path.join(frontend_demo_dir, "mountain_depth.png"))
    depth_mountain_img.save(os.path.join(backend_demo_dir, "mountain_depth.png"))
    
    mountain_objects = [
        {"id": "GEO-01", "name": "Summit Peak Alpha", "type": "Mountain Summit", "box": [220, 180, 290, 250], "height": 348.5, "norm_depth": 0.98, "confidence": 0.96},
        {"id": "GEO-02", "name": "Eagle Ridge Spur", "type": "Ridgeline", "box": [110, 240, 210, 340], "height": 265.0, "norm_depth": 0.79, "confidence": 0.92},
        {"id": "GEO-03", "name": "Alpine Valley Basin", "type": "Depression / Meadow", "box": [310, 320, 420, 440], "height": 45.0, "norm_depth": 0.18, "confidence": 0.89},
        {"id": "GEO-04", "name": "Northern Escarpment", "type": "Cliff Face", "box": [70, 70, 190, 170], "height": 290.2, "norm_depth": 0.84, "confidence": 0.91}
    ]
    
    mountain_meta = {
        "id": "demo-mountain",
        "title": "Alpine Ridge & Basin Topography",
        "category": "Rugged Terrain Elevation",
        "image_url": "/demo/mountain_aerial.jpg",
        "depth_url": "/demo/mountain_depth.png",
        "resolution": "512 x 512 px",
        "file_size": "168 KB",
        "format": "JPEG",
        "processing_time": 0.38,
        "model_name": "Depth Anything V2 (Metric / Relative)",
        "confidence": 0.96,
        "calibration_status": "Calibrated (GSD: 1.2m/px, Alt: 1800m)",
        "min_height": 12.0,
        "max_height": 348.5,
        "average_height": 164.2,
        "objects": mountain_objects
    }
    with open(os.path.join(frontend_demo_dir, "mountain_meta.json"), "w") as f:
        json.dump(mountain_meta, f, indent=2)
    with open(os.path.join(backend_demo_dir, "mountain_meta.json"), "w") as f:
        json.dump(mountain_meta, f, indent=2)

    # -------------------------------------------------------------
    # DEMO 3: HARBOR & INDUSTRIAL MARITIME (Sea level 0m, containers, tanks)
    # -------------------------------------------------------------
    img_harbor = Image.new("RGB", (W, H), (18, 38, 54))  # Sea water
    draw_harbor = ImageDraw.Draw(img_harbor)
    depth_harbor = np.zeros((H, W), dtype=np.float32)  # Sea level 0.0
    
    # Pier / concrete quay
    draw_harbor.rectangle([140, 0, W, H], fill=(75, 82, 88), outline=(120, 130, 138), width=3)
    depth_harbor[:, 140:] = 0.12  # Quay elevation ~ 5m
    
    # Berths and ships
    draw_harbor.polygon([(60, 120), (130, 100), (130, 260), (60, 240)], fill=(130, 45, 40), outline=(220, 120, 100))
    depth_harbor[100:260, 60:130] = 0.35  # Cargo vessel
    
    harbor_objects = [
        {"id": "MAR-01", "name": "Container Ship 'Pacific Titan'", "type": "Vessel", "box": [60, 100, 130, 260], "height": 28.5, "norm_depth": 0.35, "confidence": 0.95},
        {"id": "IND-01", "name": "Cylindrical Fuel Silo Alpha", "type": "Storage Tank", "box": [170, 50, 240, 120], "height": 32.0, "norm_depth": 0.45, "confidence": 0.93},
        {"id": "IND-02", "name": "Cylindrical Fuel Silo Beta", "type": "Storage Tank", "box": [260, 50, 330, 120], "height": 32.0, "norm_depth": 0.45, "confidence": 0.94},
        {"id": "IND-03", "name": "Logistics Hangar 04", "type": "Industrial Warehouse", "box": [360, 40, 490, 160], "height": 21.0, "norm_depth": 0.30, "confidence": 0.91},
        {"id": "IND-04", "name": "Container Stacking Yard A", "type": "Cargo Stack", "box": [170, 160, 320, 320], "height": 18.2, "norm_depth": 0.26, "confidence": 0.88},
        {"id": "IND-05", "name": "Quay Gantry Crane North", "type": "Port Crane", "box": [135, 140, 165, 230], "height": 65.0, "norm_depth": 0.82, "confidence": 0.90},
        {"id": "IND-06", "name": "Deepwater Dock Basin", "type": "Marine Slipway", "box": [0, 0, 140, H], "height": 0.0, "norm_depth": 0.02, "confidence": 0.99},
    ]
    
    # Draw tanks and yards
    for ho in harbor_objects:
        bx1, by1, bx2, by2 = ho["box"]
        if "Silo" in ho["name"]:
            draw_harbor.ellipse([bx1, by1, bx2, by2], fill=(185, 195, 200), outline=(230, 235, 240), width=2)
            draw_harbor.ellipse([bx1+8, by1+8, bx2-8, by2-8], fill=(140, 150, 155))
            depth_harbor[by1:by2, bx1:bx2] = ho["norm_depth"]
        elif "Hangar" in ho["name"] or "Stack" in ho["name"]:
            draw_harbor.rectangle([bx1, by1, bx2, by2], fill=(160, 140, 110), outline=(210, 190, 160), width=2)
            depth_harbor[by1:by2, bx1:bx2] = ho["norm_depth"]
        elif "Crane" in ho["name"]:
            draw_harbor.line([(bx1, by1), (bx2, by2)], fill=(255, 140, 0), width=4)
            depth_harbor[by1:by2, bx1:bx2] = ho["norm_depth"]
            
    img_harbor.save(os.path.join(frontend_demo_dir, "harbor_aerial.jpg"), quality=95)
    img_harbor.save(os.path.join(backend_demo_dir, "harbor_aerial.jpg"), quality=95)
    
    depth_harbor_norm = np.clip(depth_harbor * 255, 0, 255).astype(np.uint8)
    depth_harbor_img = Image.fromarray(depth_harbor_norm)
    depth_harbor_img.save(os.path.join(frontend_demo_dir, "harbor_depth.png"))
    depth_harbor_img.save(os.path.join(backend_demo_dir, "harbor_depth.png"))
    
    harbor_meta = {
        "id": "demo-harbor",
        "title": "Maritime Terminal & Industrial Harbor",
        "category": "Coastal Infrastructure",
        "image_url": "/demo/harbor_aerial.jpg",
        "depth_url": "/demo/harbor_depth.png",
        "resolution": "512 x 512 px",
        "file_size": "156 KB",
        "format": "JPEG",
        "processing_time": 0.44,
        "model_name": "Depth Anything V2 (Metric / Relative)",
        "confidence": 0.93,
        "calibration_status": "Calibrated (GSD: 0.50m/px, Sea Level Datum: 0.0m)",
        "min_height": 0.0,
        "max_height": 65.0,
        "average_height": 14.8,
        "objects": harbor_objects
    }
    with open(os.path.join(frontend_demo_dir, "harbor_meta.json"), "w") as f:
        json.dump(harbor_meta, f, indent=2)
    with open(os.path.join(backend_demo_dir, "harbor_meta.json"), "w") as f:
        json.dump(harbor_meta, f, indent=2)
        
    print("Demo assets generated successfully for Urban, Mountain, and Harbor scenes!")

if __name__ == "__main__":
    generate_demo_assets()
