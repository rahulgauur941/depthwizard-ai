import numpy as np
import os
from typing import Tuple, List, Optional, Any

def generate_obj_mesh(
    ground_map: np.ndarray,
    output_path: str,
    objects: Optional[List[Any]] = None,
    grid_size: int = 128,
    height_scale: float = 18.0
) -> Tuple[int, int]:
    """
    Generates a structured Wavefront OBJ mesh containing:
    1. Smooth bare-earth ground terrain grid
    2. Discrete extruded 3D building geometries with vertical walls and coherent flat roofs
    """
    H, W = ground_map.shape
    
    # Resample smooth ground_map to grid_size x grid_size
    grid_rows = min(grid_size, H)
    grid_cols = min(grid_size, W)
    
    row_indices = np.linspace(0, H - 1, grid_rows).astype(int)
    col_indices = np.linspace(0, W - 1, grid_cols).astype(int)
    
    sampled_ground = ground_map[np.ix_(row_indices, col_indices)]
    # Normalize ground to [0, 1] relative scale for export
    g_min = sampled_ground.min()
    g_max = sampled_ground.max()
    norm_ground = (sampled_ground - g_min) / (g_max - g_min + 1e-6)
    
    # Terrain world coordinates [-50.0, 50.0]
    x_coords = np.linspace(-50.0, 50.0, grid_cols)
    z_coords = np.linspace(-50.0, 50.0, grid_rows)
    
    vertex_count = 0
    face_count = 0

    with open(output_path, "w", encoding="utf-8") as f:
        f.write("# DepthWizard AI - Structured 3D Geospatial Scene\n")
        f.write("# Team PARALLAX - Smart India Hackathon\n")
        f.write("# Architecture: Semantic Terrain + Extruded Building Geometry\n\n")
        
        # ==============================================================
        # GROUP 1: BARE-EARTH SMOOTH GROUND TERRAIN
        # ==============================================================
        f.write("o Ground_Terrain\n")
        
        # 1. Terrain Vertices
        for r in range(grid_rows):
            for c in range(grid_cols):
                x = x_coords[c]
                z = z_coords[r]
                y = norm_ground[r, c] * (height_scale * 0.35)  # Gentle terrain elevation
                f.write(f"v {x:.4f} {y:.4f} {z:.4f}\n")
                vertex_count += 1
                
        # 2. Terrain Texture coordinates (UVs)
        for r in range(grid_rows):
            for c in range(grid_cols):
                u = c / (grid_cols - 1)
                v = 1.0 - (r / (grid_rows - 1))
                f.write(f"vt {u:.4f} {v:.4f}\n")
                
        # 3. Terrain Vertex Normals
        for r in range(grid_rows):
            for c in range(grid_cols):
                c_prev = max(0, c - 1)
                c_next = min(grid_cols - 1, c + 1)
                r_prev = max(0, r - 1)
                r_next = min(grid_rows - 1, r + 1)
                
                dx = (norm_ground[r, c_next] - norm_ground[r, c_prev]) * (height_scale * 0.35)
                dz = (norm_ground[r_next, c] - norm_ground[r_prev, c]) * (height_scale * 0.35)
                
                normal = np.array([-dx, 2.0, -dz], dtype=np.float32)
                norm_len = np.linalg.norm(normal)
                if norm_len > 1e-6:
                    normal /= norm_len
                else:
                    normal = np.array([0.0, 1.0, 0.0])
                    
                f.write(f"vn {normal[0]:.4f} {normal[1]:.4f} {normal[2]:.4f}\n")
                
        # 4. Terrain Faces
        for r in range(grid_rows - 1):
            for c in range(grid_cols - 1):
                tl = r * grid_cols + c + 1
                tr = tl + 1
                bl = (r + 1) * grid_cols + c + 1
                br = bl + 1
                
                f.write(f"f {tl}/{tl}/{tl} {bl}/{bl}/{bl} {tr}/{tr}/{tr}\n")
                f.write(f"f {tr}/{tr}/{tr} {bl}/{bl}/{bl} {br}/{br}/{br}\n")
                face_count += 2

        # ==============================================================
        # GROUP 2: EXTRUDED BUILDINGS (VERTICAL WALLS + COHERENT ROOFS)
        # ==============================================================
        if objects:
            bldg_idx = 1
            for obj in objects:
                # Extract polygon
                poly = getattr(obj, "polygon", None)
                if not poly and isinstance(obj, dict):
                    poly = obj.get("polygon")
                    
                if not poly or len(poly) < 3:
                    continue

                obj_type = getattr(obj, "type", "") if hasattr(obj, "type") else (obj.get("type", "") if isinstance(obj, dict) else "")
                if "vegetation" in obj_type.lower() or "tree" in obj_type.lower():
                    continue  # Trees are kept separate or on ground

                est_h = getattr(obj, "estimated_height", 15.0) if hasattr(obj, "estimated_height") else (obj.get("estimated_height", 15.0) if isinstance(obj, dict) else 15.0)
                # Building extrusion height
                bldg_height = max(1.5, min(45.0, float(est_h) * 0.35))
                
                f.write(f"\no Building_{bldg_idx:02d}\n")
                bldg_idx += 1
                
                N = len(poly)
                base_start = vertex_count + 1
                
                # Sample local ground height at centroid
                cx = getattr(obj, "centroid", [0.5, 0.5])[0] if hasattr(obj, "centroid") and obj.centroid else 0.5
                cy = getattr(obj, "centroid", [0.5, 0.5])[1] if hasattr(obj, "centroid") and obj.centroid else 0.5
                r_idx = min(grid_rows - 1, max(0, int(cy * (grid_rows - 1))))
                c_idx = min(grid_cols - 1, max(0, int(cx * (grid_cols - 1))))
                local_y = norm_ground[r_idx, c_idx] * (height_scale * 0.35)
                roof_y = local_y + bldg_height
                
                # Write Base Vertices (on ground)
                for pt in poly:
                    wx = (float(pt[0]) - 0.5) * 100.0
                    wz = (float(pt[1]) - 0.5) * 100.0
                    f.write(f"v {wx:.4f} {local_y:.4f} {wz:.4f}\n")
                    f.write(f"vt {pt[0]:.4f} {1.0 - pt[1]:.4f}\n")
                    f.write(f"vn 0.0 -1.0 0.0\n")
                    vertex_count += 1
                    
                # Write Roof Vertices (elevated)
                for pt in poly:
                    wx = (float(pt[0]) - 0.5) * 100.0
                    wz = (float(pt[1]) - 0.5) * 100.0
                    f.write(f"v {wx:.4f} {roof_y:.4f} {wz:.4f}\n")
                    f.write(f"vt {pt[0]:.4f} {1.0 - pt[1]:.4f}\n")
                    f.write(f"vn 0.0 1.0 0.0\n")
                    vertex_count += 1
                    
                # Write Vertical Wall Faces (connecting base and roof)
                roof_start = base_start + N
                for i in range(N):
                    next_i = (i + 1) % N
                    b1 = base_start + i
                    b2 = base_start + next_i
                    r1 = roof_start + i
                    r2 = roof_start + next_i
                    
                    # Wall Quad = 2 Triangles
                    f.write(f"f {b1}/{b1}/{b1} {r1}/{r1}/{r1} {r2}/{r2}/{r2}\n")
                    f.write(f"f {b1}/{b1}/{b1} {r2}/{r2}/{r2} {b2}/{b2}/{b2}\n")
                    face_count += 2
                    
                # Write Flat Roof Face (Triangulated Triangle Fan)
                for i in range(1, N - 1):
                    f.write(f"f {roof_start}/{roof_start}/{roof_start} {roof_start + i}/{roof_start + i}/{roof_start + i} {roof_start + i + 1}/{roof_start + i + 1}/{roof_start + i + 1}\n")
                    face_count += 1

    return vertex_count, face_count
