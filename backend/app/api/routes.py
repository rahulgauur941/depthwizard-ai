import os
import uuid
import time
import shutil
import json
import numpy as np
from PIL import Image
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse

from app.models.schemas import (
    UploadResponse, CalibrationParams, DepthRequest, DepthResponse,
    HeightRequest, HeightResponse, ObjectsResponse, ReconstructionRequest,
    ReconstructionResponse, ExportRequest, ExportResponse, PipelineProcessResponse,
    DetectedObject
)
from app.inference.depth_engine import depth_engine
from app.services.height_service import height_service
from app.services.object_service import object_service
from app.services.export_service import ExportService
from app.utils.colormaps import apply_colormap

router = APIRouter(prefix="/api")

# Directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
STATIC_DEMO_DIR = os.path.join(BASE_DIR, "static", "demo")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)
os.makedirs(STATIC_DEMO_DIR, exist_ok=True)

export_service = ExportService(OUTPUTS_DIR)

# In-memory session cache for processed arrays
PROCESSED_CACHE: dict = {}

def get_image_path(image_id: str) -> str:
    for ext in [".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]:
        path = os.path.join(UPLOADS_DIR, f"{image_id}{ext}")
        if os.path.exists(path):
            return path
    # Check static demo directory
    if image_id.startswith("demo-") or "demo" in image_id:
        scene = image_id.replace("demo-", "")
        for ext in [".jpg", ".png"]:
            p = os.path.join(STATIC_DEMO_DIR, f"{scene}_aerial{ext}")
            if os.path.exists(p):
                return p
    raise HTTPException(status_code=404, detail=f"Image with id {image_id} not found")

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "system": "DepthWizard AI",
        "team": "PARALLAX",
        "ai_model": depth_engine.model_name,
        "is_ai_loaded": depth_engine.is_ai_loaded,
        "device": depth_engine.device,
        "supported_formats": ["JPG", "JPEG", "PNG", "WEBP", "TIFF"],
        "version": "1.0.0"
    }

@router.post("/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    filename = file.filename or "uploaded_image.png"
    ext = os.path.splitext(filename)[1].lower()
    
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]:
        raise HTTPException(status_code=400, detail=f"Unsupported file extension {ext}. Allowed: JPG, PNG, WEBP, TIFF")
        
    image_id = str(uuid.uuid4())[:8]
    dest_path = os.path.join(UPLOADS_DIR, f"{image_id}{ext}")
    
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        with Image.open(dest_path) as img:
            width, height = img.size
            img_format = img.format or ext.replace(".", "").upper()
            file_size_kb = round(os.path.getsize(dest_path) / 1024, 2)
    except Exception as e:
        if os.path.exists(dest_path):
            os.remove(dest_path)
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted image: {str(e)}")

    return UploadResponse(
        image_id=image_id,
        filename=filename,
        width=width,
        height=height,
        file_size_kb=file_size_kb,
        format=img_format,
        image_url=f"/uploads/{image_id}{ext}"
    )

@router.post("/depth", response_model=DepthResponse)
def estimate_depth_endpoint(req: DepthRequest):
    img_path = get_image_path(req.image_id)
    with Image.open(img_path) as pil_img:
        orig_img = pil_img.convert("RGB")
        norm_depth, proc_time, model_name, confidence = depth_engine.estimate_depth(orig_img)

    if req.invert:
        norm_depth = 1.0 - norm_depth
        
    if req.contrast != 1.0:
        norm_depth = np.clip((norm_depth - 0.5) * req.contrast + 0.5, 0.0, 1.0)

    # Save to session cache
    PROCESSED_CACHE[req.image_id] = {
        "depth": norm_depth,
        "image_path": img_path,
        "model_name": model_name
    }

    # Generate Grayscale Depth PNG and Colormap PNG
    gray_filename = export_service.export_depth_png(norm_depth, req.image_id, colormap="grayscale")
    color_filename = export_service.export_depth_png(norm_depth, req.image_id, colormap=req.colormap)

    stats = {
        "min": round(float(norm_depth.min()), 3),
        "max": round(float(norm_depth.max()), 3),
        "mean": round(float(norm_depth.mean()), 3),
        "std": round(float(norm_depth.std()), 3),
    }

    return DepthResponse(
        image_id=req.image_id,
        depth_map_url=f"/outputs/{color_filename}",
        normalized_depth_url=f"/outputs/{gray_filename}",
        colormap_url=f"/outputs/{color_filename}",
        processing_time=proc_time,
        model_name=model_name,
        confidence=confidence,
        raw_depth_stats=stats,
        is_relative=True,
        scientific_note="Monocular depth estimation produces relative disparity. Scene calibration is recommended for physical elevation metrics."
    )

@router.post("/height", response_model=HeightResponse)
def calculate_height_endpoint(req: HeightRequest):
    # Retrieve cached depth or generate on demand
    cached = PROCESSED_CACHE.get(req.image_id)
    if not cached:
        img_path = get_image_path(req.image_id)
        with Image.open(img_path) as pil_img:
            norm_depth, _, _, _ = depth_engine.estimate_depth(pil_img.convert("RGB"))
            PROCESSED_CACHE[req.image_id] = {"depth": norm_depth, "image_path": img_path}
    else:
        norm_depth = cached["depth"]

    height_field, ground_field, stats = height_service.calculate_heights(norm_depth, req.calibration)
    PROCESSED_CACHE[req.image_id]["height_field"] = height_field
    PROCESSED_CACHE[req.image_id]["ground_field"] = ground_field
    PROCESSED_CACHE[req.image_id]["calibration"] = req.calibration

    height_filename = export_service.export_height_png(height_field, req.image_id)
    ground_filename = export_service.export_ground_png(ground_field, req.image_id)

    return HeightResponse(
        image_id=req.image_id,
        min_height=stats["min_height"],
        max_height=stats["max_height"],
        average_height=stats["average_height"],
        height_range=stats["height_range"],
        height_map_url=f"/outputs/{height_filename}",
        ground_map_url=f"/outputs/{ground_filename}",
        calibration_status=stats["calibration_status"],
        unit=stats["unit"],
        elevation_distribution=stats["elevation_distribution"],
        scientific_note=stats["scientific_note"]
    )

@router.post("/objects", response_model=ObjectsResponse)
def detect_objects_endpoint(req: HeightRequest):
    cached = PROCESSED_CACHE.get(req.image_id)
    img_path = get_image_path(req.image_id)
    with Image.open(img_path) as pil_img:
        img_np = np.array(pil_img.convert("RGB"))
        if not cached:
            norm_depth, _, _, _ = depth_engine.estimate_depth(pil_img.convert("RGB"))
            PROCESSED_CACHE[req.image_id] = {"depth": norm_depth, "image_path": img_path}
        else:
            norm_depth = cached["depth"]

    start = time.time()
    objects = object_service.detect_objects(img_np, norm_depth, req.calibration)
    tallest = objects[0].name if objects else None
    proc_time = round(time.time() - start, 3)

    PROCESSED_CACHE[req.image_id]["objects"] = objects

    return ObjectsResponse(
        image_id=req.image_id,
        objects=objects,
        total_detected=len(objects),
        tallest_object=tallest,
        processing_time=proc_time
    )

@router.post("/reconstruct", response_model=ReconstructionResponse)
def reconstruct_mesh_endpoint(req: ReconstructionRequest):
    cached = PROCESSED_CACHE.get(req.image_id)
    if not cached or "ground_field" not in cached:
        img_path = get_image_path(req.image_id)
        with Image.open(img_path) as pil_img:
            norm_depth, _, _, _ = depth_engine.estimate_depth(pil_img.convert("RGB"))
        height_field, ground_field, _ = height_service.calculate_heights(norm_depth, CalibrationParams())
        objects = None
    else:
        ground_field = cached.get("ground_field", cached.get("height_field"))
        height_field = cached.get("height_field")
        objects = cached.get("objects")

    start = time.time()
    obj_filename = export_service.export_obj(ground_field, req.image_id, objects=objects, grid_size=req.resolution)
    proc_time = round(time.time() - start, 3)

    grid_dim = min(req.resolution, ground_field.shape[0])
    vert_count = grid_dim * grid_dim
    face_count = (grid_dim - 1) * (grid_dim - 1) * 2

    return ReconstructionResponse(
        image_id=req.image_id,
        grid_width=grid_dim,
        grid_height=grid_dim,
        vertex_count=vert_count,
        face_count=face_count,
        mesh_obj_url=f"/outputs/{obj_filename}",
        mesh_glb_url=None,  # Three.js creates client-side GLB exporter
        height_stats={
            "min": round(float(height_field.min()), 2),
            "max": round(float(height_field.max()), 2),
            "mean": round(float(height_field.mean()), 2)
        },
        processing_time=proc_time
    )

@router.post("/process", response_model=PipelineProcessResponse)
def process_pipeline_endpoint(
    image_id: str = Form(...),
    is_calibrated: bool = Form(False),
    gsd: float = Form(0.35),
    camera_altitude: float = Form(500.0),
    reference_height: float = Form(None)
):
    """
    Executes the entire end-to-end pipeline in sequence:
    01 Preprocessing -> 02 AI Depth -> 03 Normalization -> 04 Height -> 05 Objects -> 06 3D Mesh
    """
    total_start = time.time()
    img_path = get_image_path(image_id)
    
    calib = CalibrationParams(
        is_calibrated=is_calibrated,
        gsd=gsd,
        camera_altitude=camera_altitude,
        reference_height=reference_height if reference_height and reference_height > 0 else None
    )

    with Image.open(img_path) as pil_img:
        orig_img = pil_img.convert("RGB")
        width, height = orig_img.size
        img_np = np.array(orig_img)

    # 1. Depth estimation
    norm_depth, depth_time, model_name, confidence = depth_engine.estimate_depth(orig_img)
    
    # 2. Height calculation & Bare-earth Ground
    height_field, ground_field, h_stats = height_service.calculate_heights(norm_depth, calib, img_np)
    
    # 3. Object analysis (Footprints, Coherent Heights, Polygons)
    objects = object_service.detect_objects(img_np, norm_depth, calib)
    
    # 4. Structured 3D OBJ generation (Smooth Ground Terrain + Extruded Buildings)
    obj_filename = export_service.export_obj(ground_field, image_id, objects=objects, grid_size=128)
    
    # 5. Output image maps
    depth_png = export_service.export_depth_png(norm_depth, image_id, colormap="turbo")
    height_png = export_service.export_height_png(height_field, image_id)
    ground_png = export_service.export_ground_png(ground_field, image_id)

    total_time = round(time.time() - total_start, 3)
    
    # Store complete result
    payload = {
        "id": image_id,
        "status": "completed",
        "image_url": f"/uploads/{os.path.basename(img_path)}" if "uploads" in img_path else f"/demo/{os.path.basename(img_path)}",
        "depth_map_url": f"/outputs/{depth_png}",
        "height_map_url": f"/outputs/{height_png}",
        "ground_map_url": f"/outputs/{ground_png}",
        "mesh_obj_url": f"/outputs/{obj_filename}",
        "metadata": {
            "resolution": f"{width} x {height} px",
            "depth_model": model_name,
            "confidence": confidence,
            "processing_time": total_time,
            "device": depth_engine.device
        },
        "height_stats": h_stats,
        "calibration": calib,
        "objects": objects,
        "processing_time": total_time,
        "scientific_disclaimer": "These values are AI-assisted estimates and should not be treated as survey-grade measurements unless calibrated against appropriate geospatial reference data."
    }
    
    PROCESSED_CACHE[image_id] = {
        "depth": norm_depth,
        "height_field": height_field,
        "ground_field": ground_field,
        "objects": objects,
        "payload": payload,
        "image_path": img_path
    }

    # Generate JSON and HTML reports automatically
    export_service.export_json_analysis(payload, image_id)
    export_service.generate_html_report(payload, image_id)

    return PipelineProcessResponse(**payload)

@router.post("/export", response_model=ExportResponse)
def export_endpoint(req: ExportRequest):
    cached = PROCESSED_CACHE.get(req.image_id)
    if not cached:
        # Run fast process
        img_path = get_image_path(req.image_id)
        with Image.open(img_path) as pil_img:
            norm_depth, _, _, _ = depth_engine.estimate_depth(pil_img.convert("RGB"))
        height_field, ground_field, _ = height_service.calculate_heights(norm_depth, req.calibration or CalibrationParams())
        objects = None
    else:
        norm_depth = cached.get("depth")
        height_field = cached.get("height_field")
        ground_field = cached.get("ground_field", height_field)
        objects = cached.get("objects")
        
    fmt = req.export_format.lower()
    
    if fmt == "depth_png":
        fn = export_service.export_depth_png(norm_depth, req.image_id, colormap="turbo")
    elif fmt == "height_png":
        fn = export_service.export_height_png(height_field, req.image_id)
    elif fmt == "ground_png":
        fn = export_service.export_ground_png(ground_field, req.image_id)
    elif fmt == "obj":
        fn = export_service.export_obj(ground_field, req.image_id, objects=objects, grid_size=128)
    elif fmt == "point_cloud" or fmt == "ply":
        img_path = get_image_path(req.image_id)
        with Image.open(img_path) as pimg:
            rgb_arr = np.array(pimg.convert("RGB"))
        fn = export_service.export_point_cloud_ply(height_field, rgb_arr, req.image_id)
    elif fmt == "report" or fmt == "html":
        payload = (cached.get("payload") if (cached and cached.get("payload")) else None) or {}
        fn = export_service.generate_html_report(payload, req.image_id)
    else:  # Default JSON
        payload = (cached.get("payload") if (cached and cached.get("payload")) else None) or {"image_id": req.image_id}
        fn = export_service.export_json_analysis(payload, req.image_id)

    fpath = os.path.join(OUTPUTS_DIR, fn)
    size_kb = round(os.path.getsize(fpath) / 1024, 2) if os.path.exists(fpath) else 0.0

    return ExportResponse(
        image_id=req.image_id,
        format=fmt,
        download_url=f"/outputs/{fn}",
        filename=fn,
        file_size_kb=size_kb
    )

@router.get("/result/{image_id}")
def get_result(image_id: str):
    cached = PROCESSED_CACHE.get(image_id)
    if cached and "payload" in cached:
        return cached["payload"]
        
    # Check if demo metadata exists
    demo_meta_path = os.path.join(STATIC_DEMO_DIR, f"{image_id.replace('demo-', '')}_meta.json")
    if os.path.exists(demo_meta_path):
        with open(demo_meta_path, "r", encoding="utf-8") as f:
            return json.load(f)
            
    raise HTTPException(status_code=404, detail="Analysis result not found")
