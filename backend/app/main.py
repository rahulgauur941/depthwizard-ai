import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.routes import router

app = FastAPI(
    title="DepthWizard AI API",
    description="Backend AI Services for Single-View Height Estimation & 3D Flythrough (Smart India Hackathon - Team PARALLAX)",
    version="1.0.0"
)

# Enable CORS for frontend Vite development server & production builds
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base directories
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
STATIC_DEMO_DIR = os.path.join(BASE_DIR, "static", "demo")
FRONTEND_DIST = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)
os.makedirs(STATIC_DEMO_DIR, exist_ok=True)

# Mount static file directories for image/depth/mesh access
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
app.mount("/outputs", StaticFiles(directory=OUTPUTS_DIR), name="outputs")
app.mount("/demo", StaticFiles(directory=STATIC_DEMO_DIR), name="demo")

# Include API endpoints
app.include_router(router)

# Mount frontend production assets & SPA routing if build exists
if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        # Exclude API and static mount paths from being intercepted
        if full_path.startswith(("api", "uploads", "outputs", "demo", "docs", "openapi.json")):
            raise HTTPException(status_code=404, detail="Not found")
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend build index not found")
else:
    @app.get("/")
    def root():
        return {
            "project": "DEPTHWIZARD AI",
            "tagline": "Single-View Height Estimation & 3D Flythrough",
            "team": "PARALLAX",
            "docs_url": "/docs",
            "health_check": "/api/health"
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port)
