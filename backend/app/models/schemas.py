from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CalibrationParams(BaseModel):
    is_calibrated: bool = Field(default=False, description="Whether scene calibration has been applied")
    gsd: float = Field(default=0.35, description="Ground Sampling Distance in meters/pixel")
    camera_altitude: float = Field(default=500.0, description="Camera flight altitude in meters")
    reference_height: Optional[float] = Field(default=None, description="Known reference building or ground height in meters")
    reference_datum: str = Field(default="Ground Baseline", description="Elevation datum: Ground Baseline or MSL")
    focal_length_mm: Optional[float] = Field(default=35.0, description="Camera focal length in mm")

class UploadResponse(BaseModel):
    image_id: str
    filename: str
    width: int
    height: int
    file_size_kb: float
    format: str
    image_url: str

class DepthRequest(BaseModel):
    image_id: str
    colormap: str = "turbo"  # viridis, turbo, inferno, plasma, grayscale
    invert: bool = False
    contrast: float = 1.0

class DepthResponse(BaseModel):
    image_id: str
    depth_map_url: str
    normalized_depth_url: str
    colormap_url: str
    processing_time: float
    model_name: str
    confidence: float
    raw_depth_stats: Dict[str, float]
    is_relative: bool = True
    scientific_note: str

class HeightRequest(BaseModel):
    image_id: str
    calibration: CalibrationParams = Field(default_factory=CalibrationParams)

class HeightResponse(BaseModel):
    image_id: str
    min_height: float
    max_height: float
    average_height: float
    height_range: float
    height_map_url: str
    ground_map_url: Optional[str] = None
    calibration_status: str
    unit: str
    elevation_distribution: List[Dict[str, Any]]
    scientific_note: str

class DetectedObject(BaseModel):
    id: str
    name: str
    type: str
    box: List[int] = Field(description="[x1, y1, x2, y2] bounding box")
    estimated_height: float
    confidence: float
    area_sq_m: float
    footprint_norm: List[float] = Field(description="Normalized coordinates [nx1, ny1, nx2, ny2]")
    relative_depth: float
    polygon: Optional[List[List[float]]] = Field(default=None, description="Normalized polygon vertices [[nx, ny], ...]")
    centroid: Optional[List[float]] = Field(default=None, description="Normalized centroid [cx, cy]")
    orientation: Optional[float] = Field(default=0.0, description="Orientation angle in degrees")
    roof_type: str = Field(default="flat", description="Roof geometry type: flat or sloped")

class ObjectsResponse(BaseModel):
    image_id: str
    objects: List[DetectedObject]
    total_detected: int
    tallest_object: Optional[str]
    processing_time: float

class ReconstructionRequest(BaseModel):
    image_id: str
    resolution: int = 128  # Grid vertices: 64, 128, 256
    height_scale: float = 1.0
    smoothing: float = 0.5

class ReconstructionResponse(BaseModel):
    image_id: str
    grid_width: int
    grid_height: int
    vertex_count: int
    face_count: int
    mesh_obj_url: str
    mesh_glb_url: Optional[str] = None
    height_stats: Dict[str, Any]
    processing_time: float

class ExportRequest(BaseModel):
    image_id: str
    export_format: str  # "glb", "obj", "depth_png", "height_png", "json", "report"
    calibration: Optional[CalibrationParams] = None

class ExportResponse(BaseModel):
    image_id: str
    format: str
    download_url: str
    filename: str
    file_size_kb: float
    expires_in_hours: int = 24

class PipelineProcessResponse(BaseModel):
    id: str
    status: str
    image_url: str
    depth_map_url: str
    height_map_url: str
    ground_map_url: Optional[str] = None
    mesh_obj_url: str
    metadata: Dict[str, Any]
    height_stats: Dict[str, Any]
    calibration: CalibrationParams
    objects: List[DetectedObject]
    processing_time: float
    scientific_disclaimer: str
