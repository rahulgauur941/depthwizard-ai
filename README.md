---
title: DepthWizard AI
emoji: 🛰️
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# DepthWizard AI 🛰️
> **Single-View Height Estimation & 3D Flythrough**  
> **Team PARALLAX · Smart India Hackathon**

---

## 📌 Executive Summary

**DepthWizard AI** is a presentation-ready geospatial artificial intelligence web application engineered for the Smart India Hackathon problem statement:

> *"DepthWizard – Single-View Height Estimation and 3D Flythrough"*

The platform transforms single monocular aerial or satellite imagery into dense 3D elevation height-fields, segmented building footprints, and interactive first-person flight simulators without requiring expensive LiDAR hardware or multi-baseline stereo rigs.

```
INPUT SATELLITE IMAGE
       ↓
AI DEPTH ESTIMATION (Depth Anything V2)
       ↓
DEPTH NORMALIZATION & FILTERING
       ↓
PHOTOGRAMMETRIC HEIGHT CALIBRATION (GSD / Altitude)
       ↓
3D TERRAIN & BUILDING RECONSTRUCTION
       ↓
OBJECT ANALYSIS & ELEVATION SEGMENTATION
       ↓
INTERACTIVE 3D ORBIT VIEW & MEASUREMENT
       ↓
FIRST-PERSON DRONE FLYTHROUGH SIMULATOR
```

---

## 🔬 Scientific Honesty & Photogrammetric Calibration

Monocular depth models estimate **relative disparity** across a single camera view. DepthWizard AI strictly differentiates between **Relative Depth** and **Calibrated Physical Height**:

- **Relative Mode (Uncalibrated):** When sensor metadata is unknown, elevations are strictly labeled as relative scene units `[0.0 – 100.0]`. The UI issues transparent scientific notifications.
- **Calibrated Mode (Meters):** The user or ingest pipeline supplies flight altitude (\(H\)), Ground Sampling Distance (\(\text{GSD}\)), or known ground control anchors. The system anchors the vertical datum and calculates true metric building heights.

---

## 🚀 Key Features

| Capability | Description |
| :--- | :--- |
| **AI Depth Estimation** | Integrates **Depth Anything V2** architecture with sub-pixel edge sharpness and an automated structural computer-vision aerial fallback. |
| **Interactive 3D Height-Field** | Dynamic Three.js `BufferGeometry` terrain mesh with real-time height exaggeration (`0.5x`, `1x`, `2x`, `5x`, `10x`), sun angle simulation, and photo draping. |
| **Point-to-Point 3D Measurement** | Click any two points on the 3D surface to calculate Euclidean distance (\(D\)) and height differential (\(\Delta Z\)). |
| **First-Person Drone Flythrough** | Full 6-DOF aerial flight with WASD keys, Space/Ctrl vertical climb, pitch/yaw mouse look, speed multipliers, flight HUD telemetry, and terrain collision avoidance. |
| **Object & Building Detection** | Automated morphological footprint segmentation, building height attribution, and synchronized 3D bounding box pins. |
| **Export Center** | Real one-click downloads for **GLB 3D models**, **Wavefront OBJ**, **Point Cloud PLY**, **DEM Height PNG**, **Depth PNG**, **JSON Analysis**, and **Printable Technical Reports**. |
| **SIH Keynote Presentation Mode** | Cinema-grade full-screen deck with projector-optimized visualizers and hotkeys `1`–`5`. |

---

## 🏗️ Architecture & Technology Stack

### Frontend
- **Framework:** React 19 + TypeScript + Vite 5
- **Styling:** Tailwind CSS + Custom Futuristic Cyber Dark Theme
- **3D Graphics:** Three.js + React Three Fiber / Drei (`WebGL 2.0`)
- **Visualizations:** Recharts (Elevation distribution histograms)
- **Icons:** Lucide React

### Backend
- **Framework:** Python 3.11 + FastAPI + Uvicorn (ASGI)
- **Computer Vision:** OpenCV + NumPy + SciPy + Pillow
- **Deep Learning:** PyTorch + Hugging Face Transformers (`Depth Anything V2`)
- **Export Engines:** Three.js GLTFExporter, Custom Wavefront OBJ generator, ASCII PLY point cloud writer

---

## 📦 Project Structure

```
d:/SIH Project/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py            # FastAPI REST endpoints
│   │   ├── inference/
│   │   │   └── depth_engine.py      # Depth Anything V2 + CV fallback engine
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── export_service.py    # GLB, OBJ, PLY, and HTML report exporter
│   │   │   ├── height_service.py    # Photogrammetric metric calibration
│   │   │   └── object_service.py    # Footprint segmentation & height attribution
│   │   ├── utils/
│   │   │   ├── colormaps.py         # Turbo, Viridis, Inferno, Plasma, Terrain LUTs
│   │   │   └── mesh_generator.py    # 3D OBJ mesh builder
│   │   └── main.py                  # FastAPI application entrypoint with CORS
│   ├── models/                      # Checkpoints directory for PyTorch .pth weights
│   ├── outputs/                     # Generated 3D meshes, DEM rasters, and reports
│   ├── static/demo/                 # Pre-bundled offline aerial demo datasets
│   ├── uploads/                     # User-uploaded imagery
│   └── requirements.txt             # Python dependencies
├── frontend/
│   ├── public/demo/                 # High-resolution demo aerial scenes & depth maps
│   ├── src/
│   │   ├── components/
│   │   │   ├── FlythroughController.tsx  # 3D first-person flight simulator
│   │   │   ├── PresentationMode.tsx      # SIH Keynote Presentation overlay
│   │   │   ├── Sidebar.tsx               # Navigation & system status badges
│   │   │   ├── ThreeDViewer.tsx          # 3D height-field viewer with measurement tool
│   │   │   └── Topbar.tsx                # Status pills, demo picker & dataset chips
│   │   ├── context/
│   │   │   └── AnalysisContext.tsx       # Global application state management
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx         # Command-center KPI dashboard
│   │   │   ├── DepthAnalysisPage.tsx     # Split-slider depth comparison
│   │   │   ├── ExportPage.tsx            # Export center & report generator
│   │   │   ├── FlythroughPage.tsx        # Dedicated flight view
│   │   │   ├── HeightAnalysisPage.tsx    # Calibration panel & elevation histogram
│   │   │   ├── LandingPage.tsx           # Product overview landing page
│   │   │   ├── ObjectAnalysisPage.tsx    # Structural footprint inspection table
│   │   │   ├── SettingsPage.tsx          # System diagnostics & hardware info
│   │   │   └── ThreeDReconstructionPage.tsx # Full 3D elevation workbench
│   │   ├── services/
│   │   │   ├── api.ts                    # Backend REST API client
│   │   │   └── demoData.ts               # Pre-packaged offline demo scenes
│   │   ├── types/
│   │   │   └── index.ts                  # TypeScript interface contracts
│   │   ├── App.tsx                       # Root view router
│   │   ├── index.css                     # Dark glassmorphic styles & scrollbars
│   │   └── main.tsx                      # Vite React entry point
│   ├── index.html                        # Application HTML shell
│   ├── package.json                      # Frontend dependencies
│   ├── tailwind.config.js                # Tailwind configuration
│   └── tsconfig.json                     # TypeScript compiler configuration
├── .env.example                          # Environment variable template
└── README.md                             # Project documentation
```

---

## ⚡ Quick Start & Setup Instructions

### Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **Python:** v3.10 or v3.11
- **uv** (recommended for instant Python package management) or standard `pip`

---

### Step 1: Start the Backend Server

```bash
# Navigate to backend directory
cd backend

# Create virtual environment using uv or python
uv venv venv
# or: python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
uv pip install -r requirements.txt
# or: pip install -r requirements.txt

# Launch FastAPI server with live reload
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

*The backend server will start at: `http://127.0.0.1:8000`*  
*Swagger API Documentation is available at: `http://127.0.0.1:8000/docs`*

---

### Step 2: Start the Frontend Application

Open a second terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```

*Open your browser and navigate to: `http://127.0.0.1:5173`*

---

## 🤖 AI Model Setup (Depth Anything V2)

DepthWizard AI supports dual-mode inference:

1. **Automatic Online / Transformers Mode:**
   If internet access is available, the backend automatically accesses Hugging Face:
   `depth-anything/Depth-Anything-V2-Small-hf` via `transformers.pipeline`.

2. **Offline Weights Mode:**
   Download the official Depth Anything V2 PyTorch checkpoints:
   - [Depth Anything V2 Small (ViT-S)](https://huggingface.co/depth-anything/Depth-Anything-V2-Small/resolve/main/depth_anything_v2_vits.pth)
   - Place the file in:
     ```
     backend/models/depth_anything_v2_vits.pth
     ```

3. **High-Accuracy CV Fallback (No Internet / Airgapped Hackathon):**
   If PyTorch weights or GPU acceleration are unavailable, DepthWizard AI automatically activates its built-in **Structural Aerial Depth Estimator**. This engine performs multi-scale white top-hat morphological transforms, structure tensor edge detection, and bilateral edge-preserving smoothing. It runs 100% locally with zero external network calls.

---

## 🎮 Navigation & Keyboard Controls

### 3D Orbit Controls
- **Rotate / Orbit:** Left Click + Drag
- **Pan:** Right Click + Drag
- **Zoom:** Mouse Scroll Wheel
- **Reset Camera:** Top Toolbar Reset Icon

### First-Person Drone Flythrough
- **W:** Move Forward
- **S:** Move Backward
- **A:** Strafe Left
- **D:** Strafe Right
- **Space:** Ascend (Climb Vertically)
- **Ctrl / C:** Descend
- **Shift:** 2.5x Speed Sprint Boost
- **Mouse Look:** Left Click + Drag anywhere on screen
- **Speed Multiplier:** Click `0.5x`, `1.0x`, `2.0x`, or `5.0x` in the HUD

### Presentation Keynote Mode
- **P:** Toggle SIH Presentation Mode on/off
- **1:** Original Monocular Aerial View
- **2:** AI Dense Depth Heatmap
- **3:** Height Estimation & Photogrammetric Calibration
- **4:** 3D Reconstructed Mesh
- **5:** Aerial Flythrough Simulator
- **Arrow Left / Right:** Previous / Next Slide
- **Esc:** Exit Presentation Mode

---

## 🛠️ Verification & Test Suite

Both frontend and backend include automated health validation:

- **Backend Health Check:**
  ```bash
  curl http://127.0.0.1:8000/api/health
  ```
- **End-to-End Pipeline Test:**
  ```bash
  curl -X POST http://127.0.0.1:8000/api/process -F "image_id=demo-urban" -F "is_calibrated=true" -F "gsd=0.35" -F "camera_altitude=450"
  ```
- **Production Frontend Build:**
  ```bash
  cd frontend
  npm run build
  ```

---

## ⚠️ Known Limitations & Assumptions

1. **Relative vs Absolute Scale:** Single-view images lack stereoscopic baseline disparity. Scale accuracy is directly proportional to the accuracy of input calibration parameters (GSD, altitude, or reference building height).
2. **Extreme Occlusion:** Surfaces completely occluded by steep overhangs or deep shadows are estimated via spatial bilateral interpolation.
3. **Complex Glass Reflections:** Highly reflective glass facades on skyscrapers may introduce optical artifacts in pure monocular estimation; morphological bilateral filtering is applied to mitigate noise.

---

## 🗺️ Future Roadmap

- [ ] Direct integration with GeoTIFF and GDAL/Rasterio for multi-band multispectral Sentinel-2 & Landsat-9 imagery.
- [ ] Automated solar ephemeris shadow-length building height calculation using capture timestamp and coordinates.
- [ ] Integration of Cesium ion / 3D Tiles 1.1 for streaming city-scale massive point clouds.
- [ ] Real-time edge inference on mobile UAV controllers using ONNX Runtime Web.

---

## 👥 Team PARALLAX

- **Project:** DepthWizard AI
- **Competition:** Smart India Hackathon
- **Domain:** AI / GIS / Remote Sensing / Computer Vision
