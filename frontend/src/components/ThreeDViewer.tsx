import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Ruler, 
  Grid, 
  Sun, 
  Download, 
  Eye, 
  Box, 
  Compass,
  Check,
  Layers
} from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

interface ThreeDViewerProps {
  interactive?: boolean;
  compact?: boolean;
  onEnterFlythrough?: () => void;
}

export const ThreeDViewer: React.FC<ThreeDViewerProps> = ({ 
  interactive = true, 
  compact = false,
  onEnterFlythrough 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    currentImage, 
    depthData, 
    heightData, 
    calibration, 
    objects, 
    selectedObjectId, 
    setSelectedObjectId 
  } = useAnalysis();

  // 3D Viewport Controls State
  const [exaggeration, setExaggeration] = useState<number>(1.5);
  const [textureMode, setTextureMode] = useState<'satellite' | 'elevation' | 'solid' | 'wireframe'>('satellite');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [measuringMode, setMeasuringMode] = useState<boolean>(false);
  const [measurementPoints, setMeasurementPoints] = useState<THREE.Vector3[]>([]);
  const [measurementResult, setMeasurementResult] = useState<{ distance: number; heightDiff: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isExportingGLB, setIsExportingGLB] = useState<boolean>(false);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  // Semantic Groups Hierarchy
  const groundGroupRef = useRef<THREE.Group | null>(null);
  const buildingGroupRef = useRef<THREE.Group | null>(null);
  const vegetationGroupRef = useRef<THREE.Group | null>(null);
  const roadGroupRef = useRef<THREE.Group | null>(null);
  const markerGroupRef = useRef<THREE.Group | null>(null);
  const objectBoxesGroupRef = useRef<THREE.Group | null>(null);
  
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const satTextureRef = useRef<THREE.Texture | null>(null);
  const groundElevDataRef = useRef<Float32Array | null>(null);

  // Helper Turbo colormap generator for elevation texture
  const getTurboColor = (t: number): [number, number, number] => {
    const clamped = Math.max(0, Math.min(1, t));
    const r = Math.min(255, Math.max(0, Math.sin(clamped * Math.PI - 0.2) * 255 + (clamped > 0.6 ? (clamped - 0.6) * 400 : 0)));
    const g = Math.min(255, Math.max(0, Math.sin(clamped * Math.PI) * 230));
    const b = Math.min(255, Math.max(0, Math.cos(clamped * Math.PI * 0.8) * 240));
    return [Math.round(r), Math.round(g), Math.round(b)];
  };

  const getTurboColorHex = (t: number): number => {
    const [r, g, b] = getTurboColor(t);
    return (r << 16) | (g << 8) | b;
  };

  // Initialize Three.js Viewport
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060a14);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 75, 95);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and high precision
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05; // Don't go below ground plane
    controls.minDistance = 10;
    controls.maxDistance = 450;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(60, 100, 60);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 300;
    dirLight.shadow.camera.left = -60;
    dirLight.shadow.camera.right = 60;
    dirLight.shadow.camera.top = 60;
    dirLight.shadow.camera.bottom = -60;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    fillLight.position.set(-60, 50, -60);
    scene.add(fillLight);

    // 6. Grid Helper
    const gridHelper = new THREE.GridHelper(100, 20, 0x00f0ff, 0x1e293b);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    // 7. Semantic Object Hierarchy Groups
    const groundGroup = new THREE.Group();
    groundGroup.name = "groundGroup";
    scene.add(groundGroup);
    groundGroupRef.current = groundGroup;

    const roadGroup = new THREE.Group();
    roadGroup.name = "roadGroup";
    scene.add(roadGroup);
    roadGroupRef.current = roadGroup;

    const buildingGroup = new THREE.Group();
    buildingGroup.name = "buildingGroup";
    scene.add(buildingGroup);
    buildingGroupRef.current = buildingGroup;

    const vegetationGroup = new THREE.Group();
    vegetationGroup.name = "vegetationGroup";
    scene.add(vegetationGroup);
    vegetationGroupRef.current = vegetationGroup;

    const markerGroup = new THREE.Group();
    scene.add(markerGroup);
    markerGroupRef.current = markerGroup;

    const objectBoxesGroup = new THREE.Group();
    scene.add(objectBoxesGroup);
    objectBoxesGroupRef.current = objectBoxesGroup;

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Build the Structured Scene: Smooth Ground + Extruded Buildings + Controlled Vegetation
  useEffect(() => {
    if (!sceneRef.current || !groundGroupRef.current || !buildingGroupRef.current || !vegetationGroupRef.current) return;

    const groundGroup = groundGroupRef.current;
    const buildingGroup = buildingGroupRef.current;
    const vegetationGroup = vegetationGroupRef.current;
    const objectBoxesGroup = objectBoxesGroupRef.current;

    // Clear previous geometries
    groundGroup.clear();
    buildingGroup.clear();
    vegetationGroup.clear();
    if (objectBoxesGroup) objectBoxesGroup.clear();

    const textureUrl = currentImage?.url || '/demo/urban_aerial.jpg';
    const groundUrl = heightData?.ground_map_url || depthData?.normalizedDepthUrl || depthData?.depthMapUrl || '/demo/urban_depth.png';

    // 1. Load Satellite Texture
    const texLoader = new THREE.TextureLoader();
    texLoader.load(textureUrl, (satTex) => {
      satTex.wrapS = THREE.ClampToEdgeWrapping;
      satTex.wrapT = THREE.ClampToEdgeWrapping;
      satTex.generateMipmaps = true;
      satTextureRef.current = satTex;

      // 2. Load Smooth Ground Elevation
      const groundImg = new Image();
      groundImg.crossOrigin = 'anonymous';
      groundImg.src = groundUrl;
      groundImg.onload = () => {
        const gridDim = 96;
        const canvas = document.createElement('canvas');
        canvas.width = gridDim;
        canvas.height = gridDim;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(groundImg, 0, 0, gridDim, gridDim);
        const imgData = ctx.getImageData(0, 0, gridDim, gridDim).data;

        const groundHeights = new Float32Array(gridDim * gridDim);
        for (let i = 0; i < gridDim * gridDim; i++) {
          // Low-pass normalized ground elevation [0, 1]
          groundHeights[i] = imgData[i * 4] / 255.0;
        }
        groundElevDataRef.current = groundHeights;

        // ==============================================================
        // SEMANTIC LAYER 1: SMOOTH BARE-EARTH TERRAIN
        // ==============================================================
        const terrainGeom = new THREE.PlaneGeometry(80, 80, gridDim - 1, gridDim - 1);
        terrainGeom.rotateX(-Math.PI / 2); // Lay flat on XZ plane
        const posAttr = terrainGeom.attributes.position;
        const terrainScale = 2.5 * Math.min(2.0, exaggeration); // Gentle, smooth bare-earth terrain

        for (let i = 0; i < posAttr.count; i++) {
          posAttr.setY(i, groundHeights[i] * terrainScale);
        }
        terrainGeom.computeVertexNormals();

        let groundMat: THREE.Material;
        if (textureMode === 'satellite') {
          groundMat = new THREE.MeshStandardMaterial({
            map: satTex,
            roughness: 0.85,
            metalness: 0.05,
            side: THREE.DoubleSide
          });
        } else if (textureMode === 'elevation') {
          // Colormap elevation texture for terrain
          const elevCanvas = document.createElement('canvas');
          elevCanvas.width = gridDim;
          elevCanvas.height = gridDim;
          const elevCtx = elevCanvas.getContext('2d')!;
          const elevImgData = elevCtx.createImageData(gridDim, gridDim);
          for (let i = 0; i < gridDim * gridDim; i++) {
            const rgb = getTurboColor(groundHeights[i]);
            elevImgData.data[i * 4] = rgb[0];
            elevImgData.data[i * 4 + 1] = rgb[1];
            elevImgData.data[i * 4 + 2] = rgb[2];
            elevImgData.data[i * 4 + 3] = 255;
          }
          elevCtx.putImageData(elevImgData, 0, 0);
          groundMat = new THREE.MeshStandardMaterial({
            map: new THREE.CanvasTexture(elevCanvas),
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide
          });
        } else if (textureMode === 'solid') {
          groundMat = new THREE.MeshStandardMaterial({
            color: 0x64748b,
            roughness: 0.6,
            metalness: 0.1,
            side: THREE.DoubleSide
          });
        } else {
          groundMat = new THREE.MeshBasicMaterial({
            color: 0x00f0ff,
            wireframe: true
          });
        }

        const terrainMesh = new THREE.Mesh(terrainGeom, groundMat);
        terrainMesh.receiveShadow = true;
        terrainMesh.name = 'TerrainMesh';
        groundGroup.add(terrainMesh);
        terrainMeshRef.current = terrainMesh;

        // ==============================================================
        // SEMANTIC LAYER 2: EXTRUDED BUILDINGS (CLEAN WALLS + FLAT ROOFS)
        // ==============================================================
        if (objects && objects.length > 0) {
          objects.forEach((obj) => {
            const isVegetation = obj.type.toLowerCase().includes('vegetation') || obj.type.toLowerCase().includes('tree');
            const isSelected = selectedObjectId === obj.id;

            // Handle Trees as Controlled Volumes
            if (isVegetation) {
              const cx = ((obj.centroid?.[0] ?? (obj.footprint_norm[0] + obj.footprint_norm[2]) / 2) - 0.5) * 80;
              const cz = ((obj.centroid?.[1] ?? (obj.footprint_norm[1] + obj.footprint_norm[3]) / 2) - 0.5) * 80;
              const treeRadius = Math.max(1.2, Math.sqrt(obj.area_sq_m || 25) * 0.22);
              const treeH = Math.max(2.2, Math.min(8.0, (obj.estimated_height / 100.0) * 8.0 * exaggeration));

              const coneGeom = new THREE.ConeGeometry(treeRadius, treeH, 7);
              coneGeom.translate(0, treeH / 2, 0);
              const treeMat = new THREE.MeshStandardMaterial({
                color: textureMode === 'elevation' ? getTurboColorHex(0.3) : 0x15803d,
                roughness: 0.8,
                metalness: 0.05
              });
              const treeMesh = new THREE.Mesh(coneGeom, treeMat);
              treeMesh.position.set(cx, 0.2, cz);
              treeMesh.castShadow = true;
              treeMesh.receiveShadow = true;
              vegetationGroup.add(treeMesh);
              return;
            }

            // Extract 2D Polygon Vertices
            let pts: { x: number; z: number; u: number; v: number }[] = [];
            if (obj.polygon && obj.polygon.length >= 3) {
              pts = obj.polygon.map((p) => ({
                x: (p[0] - 0.5) * 80,
                z: (p[1] - 0.5) * 80,
                u: p[0],
                v: 1.0 - p[1]
              }));
            } else {
              // Fallback to bounding box corners
              const [nx1, ny1, nx2, ny2] = obj.footprint_norm;
              pts = [
                { x: (nx1 - 0.5) * 80, z: (ny1 - 0.5) * 80, u: nx1, v: 1.0 - ny1 },
                { x: (nx2 - 0.5) * 80, z: (ny1 - 0.5) * 80, u: nx2, v: 1.0 - ny1 },
                { x: (nx2 - 0.5) * 80, z: (ny2 - 0.5) * 80, u: nx2, v: 1.0 - ny2 },
                { x: (nx1 - 0.5) * 80, z: (ny2 - 0.5) * 80, u: nx1, v: 1.0 - ny2 }
              ];
            }

            if (pts.length < 3) return;

            // Building Height (Single coherent value)
            const bldgHeight = Math.max(1.8, Math.min(50.0, (obj.estimated_height / 100.0) * 16.0 * exaggeration));

            // Create 2D Three.js Shape
            const shape = new THREE.Shape();
            shape.moveTo(pts[0].x, -pts[0].z);
            for (let i = 1; i < pts.length; i++) {
              shape.lineTo(pts[i].x, -pts[i].z);
            }
            shape.closePath();

            // Extrude into solid 3D Building with Vertical Walls
            const extrudeGeom = new THREE.ExtrudeGeometry(shape, {
              depth: bldgHeight,
              bevelEnabled: false
            });
            extrudeGeom.rotateX(Math.PI / 2); // Rotate to stand upright on ground

            // Compute UV coordinates mapped to original aerial image on roof
            const pos = extrudeGeom.attributes.position;
            const uvs = extrudeGeom.attributes.uv;
            if (uvs && pos) {
              for (let i = 0; i < pos.count; i++) {
                const vx = pos.getX(i);
                const vy = pos.getY(i);
                const vz = pos.getZ(i);
                // Roof face: map orthographically to aerial texture
                if (vy >= bldgHeight - 0.05) {
                  uvs.setXY(i, (vx / 80) + 0.5, 1.0 - ((vz / 80) + 0.5));
                }
              }
              uvs.needsUpdate = true;
            }
            extrudeGeom.computeVertexNormals();

            // Dual Materials: Roof and Walls
            let roofMat: THREE.Material;
            let wallMat: THREE.Material;

            if (textureMode === 'satellite') {
              roofMat = new THREE.MeshStandardMaterial({
                map: satTex,
                roughness: 0.6,
                metalness: 0.1
              });
              wallMat = new THREE.MeshStandardMaterial({
                color: isSelected ? 0x00f0ff : 0x475569,
                roughness: 0.5,
                metalness: 0.15
              });
            } else if (textureMode === 'elevation') {
              const elevColor = getTurboColorHex(Math.min(1.0, bldgHeight / 30.0));
              roofMat = new THREE.MeshStandardMaterial({ color: elevColor, roughness: 0.5 });
              wallMat = new THREE.MeshStandardMaterial({ color: elevColor, roughness: 0.6 });
            } else if (textureMode === 'solid') {
              roofMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.4 });
              wallMat = new THREE.MeshStandardMaterial({ color: isSelected ? 0x38bdf8 : 0x64748b, roughness: 0.5 });
            } else {
              roofMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
              wallMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
            }

            // Material 0: Roof & Base, Material 1: Vertical Walls
            const bldgMesh = new THREE.Mesh(extrudeGeom, [roofMat, wallMat]);
            bldgMesh.castShadow = true;
            bldgMesh.receiveShadow = true;
            bldgMesh.name = `Building_${obj.id}`;
            bldgMesh.userData = { objectId: obj.id, object: obj };
            buildingGroup.add(bldgMesh);

            // Highlight selected building with cyan outline and beacon
            if (isSelected) {
              const edgesGeom = new THREE.EdgesGeometry(extrudeGeom);
              const edgesMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 });
              const edgesMesh = new THREE.LineSegments(edgesGeom, edgesMat);
              edgesMesh.position.y += 0.05;
              buildingGroup.add(edgesMesh);

              // Vertical beacon above building
              const cx = ((obj.centroid?.[0] ?? (obj.footprint_norm[0] + obj.footprint_norm[2]) / 2) - 0.5) * 80;
              const cz = ((obj.centroid?.[1] ?? (obj.footprint_norm[1] + obj.footprint_norm[3]) / 2) - 0.5) * 80;

              const pinGeom = new THREE.CylinderGeometry(0.25, 0.25, 5, 8);
              const pinMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
              const pinMesh = new THREE.Mesh(pinGeom, pinMat);
              pinMesh.position.set(cx, bldgHeight + 2.5, cz);
              buildingGroup.add(pinMesh);

              const ringGeom = new THREE.RingGeometry(1.2, 2.2, 16);
              ringGeom.rotateX(-Math.PI / 2);
              const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
              const ringMesh = new THREE.Mesh(ringGeom, ringMat);
              ringMesh.position.set(cx, bldgHeight + 5, cz);
              buildingGroup.add(ringMesh);
            }
          });
        }
      };
    });
  }, [depthData, heightData, currentImage, objects, textureMode, exaggeration, selectedObjectId]);

  // Click on Building or Terrain (Raycasting)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    // If measuring mode is active, measure distance on terrain or building roofs
    if (measuringMode) {
      const targets = [
        ...(terrainMeshRef.current ? [terrainMeshRef.current] : []),
        ...(buildingGroupRef.current ? buildingGroupRef.current.children : [])
      ];
      const intersects = raycaster.intersectObjects(targets, true);

      if (intersects.length > 0) {
        const hitPoint = intersects[0].point;
        const newPoints = [...measurementPoints, hitPoint];

        if (newPoints.length === 1) {
          setMeasurementPoints(newPoints);
          renderMeasurementMarkers(newPoints);
        } else if (newPoints.length === 2) {
          setMeasurementPoints(newPoints);
          renderMeasurementMarkers(newPoints);

          const p1 = newPoints[0];
          const p2 = newPoints[1];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dz = p2.z - p1.z;
          const rawDist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const rawHeightDiff = Math.abs(dy);

          let dist = rawDist3D;
          let hDiff = rawHeightDiff;
          if (calibration.isCalibrated) {
            const scaleToMeters = (512 * calibration.gsd) / 80.0;
            dist = Math.round(rawDist3D * scaleToMeters * 10) / 10;
            hDiff = Math.round((rawHeightDiff / (16.0 * exaggeration)) * (heightData?.max_height || 100) * 10) / 10;
          } else {
            dist = Math.round(rawDist3D * 10) / 10;
            hDiff = Math.round(rawHeightDiff * 10) / 10;
          }

          setMeasurementResult({ distance: dist, heightDiff: hDiff });
        } else {
          setMeasurementPoints([hitPoint]);
          setMeasurementResult(null);
          renderMeasurementMarkers([hitPoint]);
        }
      }
      return;
    }

    // Default Mode: Click on building to select it in dashboard
    if (buildingGroupRef.current) {
      const bldgIntersects = raycaster.intersectObjects(buildingGroupRef.current.children, true);
      if (bldgIntersects.length > 0) {
        const hitMesh = bldgIntersects[0].object;
        const objId = hitMesh.userData?.objectId;
        if (objId) {
          setSelectedObjectId(selectedObjectId === objId ? null : objId);
          return;
        }
      }
    }
  };

  const renderMeasurementMarkers = (pts: THREE.Vector3[]) => {
    if (!markerGroupRef.current) return;
    const group = markerGroupRef.current;
    group.clear();

    pts.forEach((pt, idx) => {
      const sphereGeom = new THREE.SphereGeometry(1.2, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({ color: idx === 0 ? 0x00f0ff : 0xf43f5e });
      const sphere = new THREE.Mesh(sphereGeom, sphereMat);
      sphere.position.copy(pt);
      group.add(sphere);
    });

    if (pts.length === 2) {
      const lineGeom = new THREE.BufferGeometry().setFromPoints([pts[0], pts[1]]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 3 });
      const line = new THREE.Line(lineGeom, lineMat);
      group.add(line);
    }
  };

  const resetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 75, 95);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Export Structured 3D Scene directly from Three.js to GLTF/GLB
  const handleExportGLB = () => {
    if (!sceneRef.current) return;
    setIsExportingGLB(true);
    const exporter = new GLTFExporter();
    
    // Export the entire structured scene (Ground + Buildings + Vegetation)
    const exportGroup = new THREE.Group();
    if (groundGroupRef.current) exportGroup.add(groundGroupRef.current.clone());
    if (buildingGroupRef.current) exportGroup.add(buildingGroupRef.current.clone());
    if (vegetationGroupRef.current) exportGroup.add(vegetationGroupRef.current.clone());

    exporter.parse(
      exportGroup,
      (gltf) => {
        const output = JSON.stringify(gltf, null, 2);
        const blob = new Blob([output], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${currentImage?.id || 'geospatial_scene'}_structured_3d.gltf`;
        link.click();
        URL.revokeObjectURL(url);
        setIsExportingGLB(false);
      },
      (error) => {
        console.error('GLTF Export error:', error);
        setIsExportingGLB(false);
      },
      { binary: false }
    );
  };

  return (
    <div className={`relative flex flex-col bg-dark-950 border border-slate-800 rounded-lg overflow-hidden select-none ${
      compact ? 'h-[360px]' : 'h-[620px]'
    }`}>
      {/* Top Viewport Toolbar */}
      {interactive && (
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
          {/* Left toolbar pills */}
          <div className="flex items-center space-x-2 pointer-events-auto bg-dark-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-card-dark">
            <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 mr-2">
              <Box className="w-3.5 h-3.5" />
              <span>STRUCTURED 3D</span>
            </span>

            {/* Texture Mode Selector */}
            <div className="flex items-center space-x-1 border-l border-slate-700 pl-2">
              {(['satellite', 'elevation', 'solid', 'wireframe'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTextureMode(mode)}
                  className={`text-[11px] px-2 py-0.5 rounded capitalize transition-all ${
                    textureMode === mode
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Grid Toggle */}
            <button
              onClick={() => {
                setShowGrid(!showGrid);
                if (gridHelperRef.current) gridHelperRef.current.visible = !showGrid;
              }}
              title="Toggle Ground Grid"
              className={`p-1.5 rounded transition-all ${
                showGrid ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>

            {/* Measurement Tool Toggle */}
            <button
              onClick={() => {
                setMeasuringMode(!measuringMode);
                setMeasurementPoints([]);
                setMeasurementResult(null);
                if (markerGroupRef.current) markerGroupRef.current.clear();
              }}
              title="3D Point-to-Point Measurement Tool"
              className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-all ${
                measuringMode
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Measure</span>
            </button>
          </div>

          {/* Right Toolbar: Flythrough, Reset, Fullscreen, GLB Export */}
          <div className="flex items-center space-x-2 pointer-events-auto bg-dark-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-700/80 shadow-card-dark">
            {onEnterFlythrough && (
              <button
                onClick={onEnterFlythrough}
                className="flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all shadow-cyan-sm animate-pulse-subtle"
              >
                <span>ENTER FLYTHROUGH</span>
              </button>
            )}

            <button
              onClick={handleExportGLB}
              disabled={isExportingGLB}
              title="Export Structured 3D Scene to GLTF"
              className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-dark-800 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={resetCamera}
              title="Reset Camera Orientation"
              className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-dark-800 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="p-1.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-dark-800 transition-all"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* 3D Canvas Mount Point */}
      <div 
        ref={containerRef} 
        onClick={handleCanvasClick}
        className={`w-full h-full cursor-grab active:cursor-grabbing ${
          measuringMode ? 'cursor-crosshair' : ''
        }`} 
      />

      {/* Measurement HUD Result Overlay */}
      {measuringMode && (
        <div className="absolute top-16 left-3 z-10 bg-dark-900/90 backdrop-blur-md p-3 rounded-lg border border-rose-500/30 text-xs shadow-2xl min-w-[220px]">
          <div className="flex items-center justify-between text-rose-400 font-bold mb-1.5">
            <div className="flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5" />
              <span>3D MEASUREMENT</span>
            </div>
            <span className="text-[10px] font-mono">
              {measurementPoints.length}/2 Points
            </span>
          </div>

          {measurementPoints.length === 0 && (
            <p className="text-[11px] text-slate-400">Click first point on terrain or building.</p>
          )}
          {measurementPoints.length === 1 && (
            <p className="text-[11px] text-amber-300">Point A selected. Click second point.</p>
          )}

          {measurementResult && (
            <div className="mt-2 pt-2 border-t border-slate-700/80 space-y-1 font-mono">
              <div className="flex justify-between text-slate-300">
                <span>3D Distance:</span>
                <span className="font-bold text-cyan-400">
                  {measurementResult.distance} {calibration.isCalibrated ? 'm' : 'units'}
                </span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Height ΔZ:</span>
                <span className="font-bold text-rose-400">
                  {measurementResult.heightDiff} {calibration.isCalibrated ? 'm' : 'units'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 pt-1">
                {calibration.isCalibrated ? 'Calibrated metric scale' : 'Relative scene units'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Controls Bar: Exaggeration & Coordinate Metadata */}
      {interactive && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
          {/* Height Exaggeration Slider */}
          <div className="pointer-events-auto bg-dark-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-card-dark flex items-center space-x-3 text-xs">
            <span className="text-slate-400 font-medium">Height Exaggeration:</span>
            <div className="flex items-center space-x-1.5">
              {[0.5, 1.0, 2.0, 5.0, 10.0].map((val) => (
                <button
                  key={val}
                  onClick={() => setExaggeration(val)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                    exaggeration === val
                      ? 'bg-cyan-500 text-dark-950 font-bold shadow-cyan-sm'
                      : 'text-slate-400 hover:text-slate-200 bg-dark-800'
                  }`}
                >
                  {val}x
                </button>
              ))}
            </div>
          </div>

          {/* Coordinate System Badge */}
          <div className="pointer-events-auto bg-dark-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-card-dark flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {calibration.isCalibrated 
                ? `UTM Grid · GSD: ${calibration.gsd}m/px` 
                : 'Local reconstruction coordinate system'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
