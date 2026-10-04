import os
import json
import numpy as np
from PIL import Image
from typing import Dict, Any, List, Optional
from app.utils.mesh_generator import generate_obj_mesh
from app.utils.colormaps import apply_colormap

def serialize_data(obj: Any) -> Any:
    if hasattr(obj, 'model_dump'):
        return obj.model_dump()
    if hasattr(obj, 'dict'):
        return obj.dict()
    if isinstance(obj, dict):
        return {k: serialize_data(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [serialize_data(i) for i in obj]
    if isinstance(obj, (np.floating, float)):
        return float(obj)
    if isinstance(obj, (np.integer, int)):
        return int(obj)
    return obj

class ExportService:
    def __init__(self, outputs_dir: str):
        self.outputs_dir = outputs_dir
        os.makedirs(outputs_dir, exist_ok=True)

    def export_depth_png(self, depth_map: np.ndarray, image_id: str, colormap: str = "grayscale") -> str:
        filename = f"{image_id}_depth_{colormap}.png"
        filepath = os.path.join(self.outputs_dir, filename)
        if colormap == "grayscale":
            depth_uint8 = np.clip(depth_map * 255, 0, 255).astype(np.uint8)
            img = Image.fromarray(depth_uint8)
        else:
            colored = apply_colormap(depth_map, colormap)
            img = Image.fromarray(colored)
        img.save(filepath)
        return filename

    def export_height_png(self, height_map: np.ndarray, image_id: str) -> str:
        filename = f"{image_id}_elevation_dem.png"
        filepath = os.path.join(self.outputs_dir, filename)
        norm_h = (height_map - height_map.min()) / (height_map.max() - height_map.min() + 1e-6)
        colored = apply_colormap(norm_h, "terrain")
        img = Image.fromarray(colored)
        img.save(filepath)
        return filename

    def export_ground_png(self, ground_map: np.ndarray, image_id: str) -> str:
        filename = f"{image_id}_ground_dem.png"
        filepath = os.path.join(self.outputs_dir, filename)
        norm_g = (ground_map - ground_map.min()) / (ground_map.max() - ground_map.min() + 1e-6)
        colored = apply_colormap(norm_g, "terrain")
        img = Image.fromarray(colored)
        img.save(filepath)
        return filename

    def export_obj(self, ground_map: np.ndarray, image_id: str, objects: Optional[List[Any]] = None, grid_size: int = 128) -> str:
        filename = f"{image_id}_terrain_mesh.obj"
        filepath = os.path.join(self.outputs_dir, filename)
        generate_obj_mesh(ground_map, filepath, objects=objects, grid_size=grid_size, height_scale=18.0)
        return filename

    def export_point_cloud_ply(self, height_map: np.ndarray, rgb_img: np.ndarray, image_id: str, grid_size: int = 128) -> str:
        filename = f"{image_id}_pointcloud.ply"
        filepath = os.path.join(self.outputs_dir, filename)
        H, W = height_map.shape
        step_r = max(1, H // grid_size)
        step_c = max(1, W // grid_size)
        
        pts = []
        for r in range(0, H, step_r):
            for c in range(0, W, step_c):
                x = (c - W/2) / (W/2) * 50.0
                z = (r - H/2) / (H/2) * 50.0
                y = height_map[r, c] * 0.3
                color = rgb_img[r, c] if rgb_img is not None else [180, 180, 180]
                pts.append((x, y, z, int(color[0]), int(color[1]), int(color[2])))

        with open(filepath, "w", encoding="utf-8") as f:
            f.write("ply\nformat ascii 1.0\n")
            f.write(f"element vertex {len(pts)}\n")
            f.write("property float x\nproperty float y\nproperty float z\n")
            f.write("property uchar red\nproperty uchar green\nproperty uchar blue\n")
            f.write("end_header\n")
            for p in pts:
                f.write(f"{p[0]:.3f} {p[1]:.3f} {p[2]:.3f} {p[3]} {p[4]} {p[5]}\n")
                
        return filename

    def export_json_analysis(self, payload: Dict[str, Any], image_id: str) -> str:
        filename = f"{image_id}_analysis_report.json"
        filepath = os.path.join(self.outputs_dir, filename)
        clean_payload = serialize_data(payload)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(clean_payload, f, indent=2)
        return filename

    def generate_html_report(self, data: Dict[str, Any], image_id: str) -> str:
        filename = f"{image_id}_sih_engineering_report.html"
        filepath = os.path.join(self.outputs_dir, filename)
        clean_data = serialize_data(data) if data and isinstance(data, dict) else {}
        if not isinstance(clean_data, dict):
            clean_data = {}
        
        objects_html = ""
        for obj in clean_data.get("objects", []):
            objects_html += f"""
            <tr style="border-bottom: 1px solid #1e293b;">
                <td style="padding: 10px; font-family: monospace; color: #00f0ff;">{obj.get('id')}</td>
                <td style="padding: 10px; font-weight: 500;">{obj.get('name')}</td>
                <td style="padding: 10px; color: #94a3b8;">{obj.get('type')}</td>
                <td style="padding: 10px; font-weight: bold; color: #38bdf8;">{obj.get('estimated_height')} {clean_data.get('height_stats', {}).get('unit', 'm')}</td>
                <td style="padding: 10px; color: #10b981;">{int(obj.get('confidence', 0.85)*100)}%</td>
                <td style="padding: 10px; color: #94a3b8;">{obj.get('area_sq_m', '--')} m²</td>
            </tr>
            """

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>DepthWizard AI - Technical Report</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #060a14; color: #e2e8f0; margin: 0; padding: 40px; }}
        .container {{ max-width: 900px; margin: 0 auto; background: #0c1429; border: 1px solid #1e293b; border-radius: 8px; padding: 36px; }}
        .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e3a5f; padding-bottom: 24px; margin-bottom: 28px; }}
        .logo {{ font-size: 26px; font-weight: 800; letter-spacing: 1.5px; color: #00f0ff; }}
        .team {{ font-size: 13px; color: #38bdf8; text-transform: uppercase; letter-spacing: 2px; }}
        .disclaimer-box {{ background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 14px 18px; margin-bottom: 28px; font-size: 13px; color: #fbbf24; line-height: 1.5; }}
        .grid-stats {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }}
        .stat-card {{ background: #111b35; border: 1px solid #1e2b4d; border-radius: 6px; padding: 16px; }}
        .stat-label {{ font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 6px; }}
        .stat-value {{ font-size: 22px; font-weight: bold; color: #00f0ff; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }}
        th {{ text-align: left; background: #111b35; padding: 10px; color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.8px; }}
        .footer {{ margin-top: 36px; padding-top: 20px; border-top: 1px solid #1e293b; font-size: 12px; color: #475569; text-align: center; }}
        @media print {{ body {{ background: white; color: black; }} .container {{ background: white; border: none; }} }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <div class="logo">DEPTHWIZARD AI</div>
                <div style="font-size: 14px; color: #94a3b8; margin-top: 4px;">Single-View Height Estimation & 3D Flythrough</div>
            </div>
            <div style="text-align: right;">
                <div class="team">TEAM PARALLAX</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Smart India Hackathon</div>
            </div>
        </div>

        <div class="disclaimer-box">
            <strong>SCIENTIFIC HONESTY & METRIC DISCLAIMER:</strong><br>
            These values are AI-assisted estimates derived from monocular satellite/aerial imagery using Depth Anything V2 architecture. Unless calibrated against surveyed Ground Control Points (GCPs) or high-resolution LiDAR DEM reference data, calculated elevations represent relative disparity distributions.
        </div>

        <h3 style="color: #38bdf8; margin-top: 0; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Analysis Summary & Metadata</h3>
        <div class="grid-stats">
            <div class="stat-card">
                <div class="stat-label">Model Engine</div>
                <div class="stat-value" style="font-size: 16px; color: #e2e8f0;">{clean_data.get('metadata', {}).get('depth_model', 'Depth Anything V2')}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Max Estimated Height</div>
                <div class="stat-value">{clean_data.get('height_stats', {}).get('max_height', '--')} {clean_data.get('height_stats', {}).get('unit', '')}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Average Height</div>
                <div class="stat-value">{clean_data.get('height_stats', {}).get('average_height', '--')} {clean_data.get('height_stats', {}).get('unit', '')}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Image Resolution</div>
                <div class="stat-value" style="font-size: 18px; color: #e2e8f0;">{clean_data.get('metadata', {}).get('resolution', '512 x 512')}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Calibration Status</div>
                <div class="stat-value" style="font-size: 14px; color: #10b981;">{clean_data.get('height_stats', {}).get('calibration_status', 'Relative Units')}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Structures Detected</div>
                <div class="stat-value">{len(clean_data.get('objects', []))}</div>
            </div>
        </div>

        <h3 style="color: #38bdf8; margin-top: 30px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Detected Structural Features</h3>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Classification</th>
                    <th>Estimated Height</th>
                    <th>Confidence</th>
                    <th>Footprint Area</th>
                </tr>
            </thead>
            <tbody>
                {objects_html}
            </tbody>
        </table>

        <div class="footer">
            Generated by DepthWizard AI · Team PARALLAX · Presentation & Analysis Platform
        </div>
    </div>
</body>
</html>"""
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(html_content)
        return filename
