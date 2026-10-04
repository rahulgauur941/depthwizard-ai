import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  PlaneTakeoff, 
  XCircle, 
  Gauge, 
  Compass, 
  ArrowUp, 
  Navigation, 
  Maximize2,
  Minimize2,
  Sparkles
} from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

export const FlythroughController: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentImage, depthData, calibration, heightData, objects, setActiveTab } = useAnalysis();

  const [isFlying, setIsFlying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [telemetry, setTelemetry] = useState<{
    altitudeAgl: number;
    speed: number;
    heading: number;
    pitch: number;
    x: number;
    y: number;
    z: number;
  }>({
    altitudeAgl: 45.0,
    speed: 12.5,
    heading: 0,
    pitch: 0,
    x: 0,
    y: 45,
    z: 50
  });

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const rawHeightsRef = useRef<Float32Array | null>(null);
  const buildingGroupRef = useRef<THREE.Group | null>(null);

  // Flight Physics State
  const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const cameraRotationRef = useRef<{ pitch: number; yaw: number }>({ pitch: -0.2, yaw: 0 });
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040711);
    scene.fog = new THREE.FogExp2(0x060c1c, 0.0035);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 3000);
    camera.position.set(0, 35, 60);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting & Environment
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.4);
    sunLight.position.set(100, 150, 100);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const skyHemi = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.6);
    scene.add(skyHemi);

    const buildingGroup = new THREE.Group();
    scene.add(buildingGroup);
    buildingGroupRef.current = buildingGroup;

    // 5. Build Smooth Bare-Earth Ground Terrain Mesh
    const groundUrl = heightData?.ground_map_url || depthData?.normalizedDepthUrl || depthData?.depthMapUrl || '/demo/urban_depth.png';
    const textureUrl = currentImage?.url || '/demo/urban_aerial.jpg';

    const texLoader = new THREE.TextureLoader();
    texLoader.load(textureUrl, (satTex) => {
      satTex.wrapS = THREE.ClampToEdgeWrapping;
      satTex.wrapT = THREE.ClampToEdgeWrapping;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = groundUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const gridDim = 96;
        canvas.width = gridDim;
        canvas.height = gridDim;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, gridDim, gridDim);
        const imgData = ctx.getImageData(0, 0, gridDim, gridDim).data;

        const vertexCount = gridDim * gridDim;
        const heights = new Float32Array(vertexCount);
        for (let i = 0; i < vertexCount; i++) {
          heights[i] = imgData[i * 4] / 255.0;
        }
        rawHeightsRef.current = heights;

        // Smooth ground terrain plane
        const geom = new THREE.PlaneGeometry(120, 120, gridDim - 1, gridDim - 1);
        geom.rotateX(-Math.PI / 2);
        const pos = geom.attributes.position;
        const heightScale = 3.5; // Smooth low-pass terrain

        for (let i = 0; i < pos.count; i++) {
          pos.setY(i, heights[i] * heightScale);
        }
        geom.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({ map: satTex, roughness: 0.8 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.receiveShadow = true;
        scene.add(mesh);
        terrainMeshRef.current = mesh;

        // Build Extruded 3D Buildings & Controlled Trees
        if (objects && objects.length > 0) {
          objects.forEach((obj) => {
            const isVegetation = obj.type.toLowerCase().includes('vegetation') || obj.type.toLowerCase().includes('tree');

            if (isVegetation) {
              const cx = ((obj.centroid?.[0] ?? (obj.footprint_norm[0] + obj.footprint_norm[2]) / 2) - 0.5) * 120;
              const cz = ((obj.centroid?.[1] ?? (obj.footprint_norm[1] + obj.footprint_norm[3]) / 2) - 0.5) * 120;
              const treeRadius = Math.max(1.5, Math.sqrt(obj.area_sq_m || 25) * 0.25);
              const treeH = Math.max(3.0, Math.min(10.0, (obj.estimated_height / 100.0) * 12.0));

              const coneGeom = new THREE.ConeGeometry(treeRadius, treeH, 7);
              coneGeom.translate(0, treeH / 2, 0);
              const treeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
              const treeMesh = new THREE.Mesh(coneGeom, treeMat);
              treeMesh.position.set(cx, 0.2, cz);
              buildingGroup.add(treeMesh);
              return;
            }

            // Building polygon extrusion
            let pts: { x: number; z: number }[] = [];
            if (obj.polygon && obj.polygon.length >= 3) {
              pts = obj.polygon.map((p) => ({
                x: (p[0] - 0.5) * 120,
                z: (p[1] - 0.5) * 120
              }));
            } else {
              const [nx1, ny1, nx2, ny2] = obj.footprint_norm;
              pts = [
                { x: (nx1 - 0.5) * 120, z: (ny1 - 0.5) * 120 },
                { x: (nx2 - 0.5) * 120, z: (ny1 - 0.5) * 120 },
                { x: (nx2 - 0.5) * 120, z: (ny2 - 0.5) * 120 },
                { x: (nx1 - 0.5) * 120, z: (ny2 - 0.5) * 120 }
              ];
            }

            if (pts.length < 3) return;

            const bldgH = Math.max(2.5, Math.min(55.0, (obj.estimated_height / 100.0) * 22.0));

            const shape = new THREE.Shape();
            shape.moveTo(pts[0].x, -pts[0].z);
            for (let i = 1; i < pts.length; i++) {
              shape.lineTo(pts[i].x, -pts[i].z);
            }
            shape.closePath();

            const extrudeGeom = new THREE.ExtrudeGeometry(shape, {
              depth: bldgH,
              bevelEnabled: false
            });
            extrudeGeom.rotateX(Math.PI / 2);

            const bldgMat = new THREE.MeshStandardMaterial({
              color: 0x475569,
              roughness: 0.5,
              metalness: 0.1
            });
            const bldgMesh = new THREE.Mesh(extrudeGeom, bldgMat);
            bldgMesh.castShadow = true;
            bldgMesh.receiveShadow = true;
            buildingGroup.add(bldgMesh);
          });
        }
      };
    });

    // 6. Keyboard & Mouse Listeners
    const onKeyDown = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
    };

    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (e.target === renderer.domElement) {
        isMouseDown = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      cameraRotationRef.current.yaw -= deltaX * 0.004;
      cameraRotationRef.current.pitch -= deltaY * 0.004;
      cameraRotationRef.current.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, cameraRotationRef.current.pitch));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    // 7. Render & Physics Loop
    let lastTime = performance.now();
    let animId: number;

    const animateLoop = () => {
      animId = requestAnimationFrame(animateLoop);
      const now = performance.now();
      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      if (isFlying && cameraRef.current) {
        const cam = cameraRef.current;
        const keys = keysPressedRef.current;
        const baseSpeed = 16.0 * speedMultiplier;
        const speed = keys['ShiftLeft'] || keys['ShiftRight'] ? baseSpeed * 2.2 : baseSpeed;

        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.x = cameraRotationRef.current.pitch;
        euler.y = cameraRotationRef.current.yaw;
        cam.quaternion.setFromEuler(euler);

        const moveDir = new THREE.Vector3();
        if (keys['KeyW']) moveDir.z -= 1;
        if (keys['KeyS']) moveDir.z += 1;
        if (keys['KeyA']) moveDir.x -= 1;
        if (keys['KeyD']) moveDir.x += 1;
        moveDir.normalize();
        moveDir.applyQuaternion(cam.quaternion);

        if (keys['Space']) moveDir.y += 1.0;
        if (keys['ControlLeft'] || keys['KeyC']) moveDir.y -= 1.0;

        cam.position.addScaledVector(moveDir, speed * delta);

        const sampleGroundY = getTerrainElevationAt(cam.position.x, cam.position.z);
        const minFlightAlt = sampleGroundY + 3.0; // Stay at least 3m above terrain
        if (cam.position.y < minFlightAlt) {
          cam.position.y = minFlightAlt;
        }

        const agl = Math.round((cam.position.y - sampleGroundY) * 10) / 10;
        let headingDeg = Math.round((-cameraRotationRef.current.yaw * 180 / Math.PI) % 360);
        if (headingDeg < 0) headingDeg += 360;
        const pitchDeg = Math.round(cameraRotationRef.current.pitch * 180 / Math.PI);

        setTelemetry({
          altitudeAgl: agl,
          speed: Math.round(speed * 10) / 10,
          heading: headingDeg,
          pitch: pitchDeg,
          x: Math.round(cam.position.x * 10) / 10,
          y: Math.round(cam.position.y * 10) / 10,
          z: Math.round(cam.position.z * 10) / 10,
        });
      }

      renderer.render(scene, camera);
    };
    animateLoop();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isFlying, speedMultiplier, currentImage, depthData, heightData, objects]);

  // Elevation sampling helper at world coordinate (x, z)
  const getTerrainElevationAt = (wx: number, wz: number): number => {
    let groundY = 0;
    if (rawHeightsRef.current) {
      const gridDim = 96;
      const u = (wx + 60) / 120;
      const v = (wz + 60) / 120;
      if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
        const col = Math.min(gridDim - 1, Math.max(0, Math.floor(u * gridDim)));
        const row = Math.min(gridDim - 1, Math.max(0, Math.floor(v * gridDim)));
        const idx = row * gridDim + col;
        groundY = rawHeightsRef.current[idx] * 3.5;
      }
    }

    // Check if within any building footprint
    if (objects && objects.length > 0) {
      for (const obj of objects) {
        const [nx1, ny1, nx2, ny2] = obj.footprint_norm;
        const bx1 = (nx1 - 0.5) * 120;
        const bz1 = (ny1 - 0.5) * 120;
        const bx2 = (nx2 - 0.5) * 120;
        const bz2 = (ny2 - 0.5) * 120;
        const minX = Math.min(bx1, bx2);
        const maxX = Math.max(bx1, bx2);
        const minZ = Math.min(bz1, bz2);
        const maxZ = Math.max(bz1, bz2);

        if (wx >= minX && wx <= maxX && wz >= minZ && wz <= maxZ) {
          const bldgH = Math.max(2.5, Math.min(55.0, (obj.estimated_height / 100.0) * 22.0));
          return groundY + bldgH;
        }
      }
    }

    return groundY;
  };

  const getCompassDirection = (deg: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  return (
    <div className="relative w-full h-[620px] bg-dark-950 border border-slate-800 rounded-lg overflow-hidden select-none">
      {/* 3D Canvas Mount Point */}
      <div 
        ref={containerRef} 
        className={`w-full h-full ${isFlying ? 'cursor-move' : 'cursor-default'}`} 
      />

      {/* Flight Mode Header HUD */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center space-x-2 pointer-events-auto bg-dark-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-card-dark">
          <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
            <PlaneTakeoff className="w-3.5 h-3.5" />
            <span>DRONE FLYTHROUGH</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] font-mono text-slate-300">
            {isFlying ? 'SIMULATOR ACTIVE' : 'FLIGHT STANDBY'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          {!isFlying ? (
            <button
              onClick={() => setIsFlying(true)}
              className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs shadow-cyan-md transition-all active:scale-95"
            >
              <PlaneTakeoff className="w-4 h-4" />
              <span>START FLIGHT</span>
            </button>
          ) : (
            <button
              onClick={() => setIsFlying(false)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs transition-all shadow-sm"
            >
              <XCircle className="w-4 h-4" />
              <span>EXIT SIMULATION</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Flight Telemetry HUD Overlay */}
      {isFlying && (
        <>
          {/* Top-Right Flight Instruments */}
          <div className="absolute top-16 right-4 z-20 pointer-events-none bg-dark-900/85 backdrop-blur-md p-3.5 rounded-lg border border-slate-700/80 shadow-2xl font-mono text-xs space-y-2.5 min-w-[200px]">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
              <span className="text-[10px] text-slate-400 font-bold tracking-wider">TELEMETRY</span>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                REAL-TIME
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                <ArrowUp className="w-3 h-3 text-cyan-400" /> ALT AGL:
              </span>
              <span className="font-bold text-cyan-300 text-sm">
                {telemetry.altitudeAgl} m
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Gauge className="w-3 h-3 text-amber-400" /> SPEED:
              </span>
              <span className="font-bold text-amber-300 text-sm">
                {telemetry.speed} m/s
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Compass className="w-3 h-3 text-cyan-400" /> HDG:
              </span>
              <span className="font-bold text-slate-200">
                {telemetry.heading}° ({getCompassDirection(telemetry.heading)})
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400 text-[11px]">PITCH:</span>
              <span className="font-bold text-slate-200">{telemetry.pitch}°</span>
            </div>

            <div className="border-t border-slate-700/80 pt-1.5 text-[10px] text-slate-400 flex justify-between">
              <span>POS:</span>
              <span>[{telemetry.x}, {telemetry.y}, {telemetry.z}]</span>
            </div>
          </div>

          {/* Center Crosshair Aim */}
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 rounded-full border border-cyan-400/40 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 shadow-cyan-sm" />
            </div>
            <div className="absolute w-16 h-px bg-cyan-400/20" />
            <div className="absolute h-16 w-px bg-cyan-400/20" />
          </div>

          {/* Bottom Speed Multiplier Controls */}
          <div className="absolute bottom-4 right-4 z-20 pointer-events-auto bg-dark-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-card-dark flex items-center space-x-2 text-xs">
            <span className="text-[11px] text-slate-400 font-mono">THROTTLE:</span>
            {[0.5, 1.0, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] transition-all ${
                  speedMultiplier === s
                    ? 'bg-cyan-500 text-dark-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200 bg-dark-800'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Bottom Left Flight Controls Guide */}
          <div className="absolute bottom-4 left-4 z-20 pointer-events-none bg-dark-900/85 backdrop-blur-md px-3.5 py-2 rounded-lg border border-slate-700/80 shadow-card-dark text-[11px] font-mono text-slate-300 space-y-1">
            <div className="text-[10px] font-bold text-cyan-400">FLIGHT CONTROLS:</div>
            <div className="flex gap-3 text-slate-400 text-[10px]">
              <span><b className="text-slate-200">W / S</b> Throttle</span>
              <span><b className="text-slate-200">A / D</b> Bank/Roll</span>
              <span><b className="text-slate-200">Space</b> Climb</span>
              <span><b className="text-slate-200">Ctrl</b> Descend</span>
              <span><b className="text-slate-200">Drag</b> Look</span>
            </div>
          </div>
        </>
      )}

      {/* Standby Banner when flight is idle */}
      {!isFlying && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-dark-950/40 backdrop-blur-[2px] pointer-events-none">
          <div className="bg-dark-900/90 border border-slate-700 px-6 py-4 rounded-xl shadow-2xl flex flex-col items-center text-center max-w-sm pointer-events-auto">
            <PlaneTakeoff className="w-8 h-8 text-cyan-400 mb-2 animate-bounce-subtle" />
            <h3 className="text-sm font-bold text-slate-100 mb-1">Interactive 3D Flythrough</h3>
            <p className="text-xs text-slate-400 mb-4">
              Fly through the structured 3D terrain and extruded buildings with first-person drone flight controls and real-time telemetry.
            </p>
            <button
              onClick={() => setIsFlying(true)}
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs shadow-cyan-md transition-all active:scale-95 flex items-center gap-2"
            >
              <PlaneTakeoff className="w-4 h-4" />
              <span>LAUNCH FLIGHT SIMULATOR</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
