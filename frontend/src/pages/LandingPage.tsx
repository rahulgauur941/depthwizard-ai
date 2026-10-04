import React from 'react';
import { 
  Box, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Mountain, 
  PlaneTakeoff, 
  Crosshair, 
  Download, 
  CheckCircle2, 
  Compass,
  Cpu,
  ShieldCheck
} from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

export const LandingPage: React.FC = () => {
  const { setActiveTab } = useAnalysis();

  const steps = [
    { num: '01', title: 'Upload Aerial Imagery', desc: 'Ingest monocular high-res satellite or drone photos without needing multi-view baseline or LiDAR.' },
    { num: '02', title: 'Estimate Dense Depth', desc: 'Execute Depth Anything V2 architecture to predict dense pixel disparity and optical relief.' },
    { num: '03', title: 'Calibrate Metric Height', desc: 'Ground the vertical scale using camera flight altitude, GSD, or known reference ground anchors.' },
    { num: '04', title: 'Reconstruct 3D Terrain', desc: 'Synthesize dynamic BufferGeometry meshes with photo draping and customizable height exaggeration.' },
    { num: '05', title: 'Explore & Fly Through', desc: 'Pilot an interactive first-person drone through the reconstructed cityscape with collision avoidance.' },
  ];

  const capabilities = [
    {
      title: 'AI Depth Estimation',
      desc: 'Depth Anything V2 transformer pipeline producing high-frequency disparity maps with sub-pixel edge sharpness.',
      icon: Layers,
      color: 'text-cyan-400'
    },
    {
      title: 'Photogrammetric Calibration',
      desc: 'Rigorous scientific distinction between relative disparity indices and absolute metric elevations in meters.',
      icon: Mountain,
      color: 'text-emerald-400'
    },
    {
      title: 'Interactive 3D Reconstruction',
      desc: 'Three.js WebGL terrain height-field with orbit navigation, wireframe topography, and dynamic sun angles.',
      icon: Box,
      color: 'text-blue-400'
    },
    {
      title: 'Building Footprint Analysis',
      desc: 'Contour-based structure segmentation with height attribution, footprint area, and 3D beacon pins.',
      icon: Crosshair,
      color: 'text-purple-400'
    },
    {
      title: 'Drone Flythrough Simulator',
      desc: 'First-person WASD flight controls with smooth physics, altitude AGL gauges, and terrain collision avoidance.',
      icon: PlaneTakeoff,
      color: 'text-amber-400'
    },
    {
      title: 'Universal Deliverable Export',
      desc: 'Download standardized GLB 3D assets, Wavefront OBJ, DEM elevation maps, and printable technical reports.',
      icon: Download,
      color: 'text-rose-400'
    },
  ];

  return (
    <div className="min-h-screen bg-[#040711] text-slate-100 overflow-y-auto">
      {/* Landing Navbar */}
      <header className="h-16 border-b border-slate-800/80 bg-dark-900/60 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-black text-dark-950">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-black tracking-wider text-cyan-400">DEPTHWIZARD AI</span>
            <span className="text-[10px] text-slate-400 font-mono ml-2">PARALLAX · SIH</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('upload')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-dark-800 hover:bg-dark-700 text-slate-300 border border-slate-700 transition-all"
          >
            Upload Image
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-dark-950 transition-all shadow-cyan-sm font-mono flex items-center gap-1.5"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-8 text-center max-w-5xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>SMART INDIA HACKATHON 2024 · TEAM PARALLAX</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-slate-100 tracking-tight leading-tight">
          From a single view to an <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
            explorable 3D world.
          </span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
          AI-assisted single-view depth estimation, height reconstruction and interactive 3D flythrough for geospatial aerial intelligence.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setActiveTab('upload')}
            className="px-6 py-3 rounded-lg text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-dark-950 transition-all shadow-cyan-glow flex items-center gap-2 font-mono"
          >
            <span>Upload Aerial Image</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-6 py-3 rounded-lg text-sm font-semibold bg-dark-850 hover:bg-dark-800 text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
          >
            <span>View 3D Dashboard</span>
          </button>
        </div>

        {/* Hero Visual Banner */}
        <div className="pt-10">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-dark-950 p-2 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800">
                <img src="/demo/urban_aerial.jpg" alt="Aerial Image" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-dark-950/80 text-[10px] font-mono text-slate-300">
                  01 · AERIAL INPUT
                </div>
              </div>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-cyan-500/40">
                <img src="/demo/urban_depth.png" alt="AI Depth" className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-dark-950/80 text-[10px] font-mono text-cyan-300">
                  02 · AI DEPTH MAP
                </div>
              </div>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-dark-900 flex items-center justify-center">
                <div className="text-center p-4 space-y-1">
                  <Box className="w-8 h-8 text-cyan-400 mx-auto" />
                  <div className="text-xs font-bold text-slate-200">03 · 3D TERRAIN MESH</div>
                  <div className="text-[10px] text-slate-400 font-mono">112m Calibrated Spire</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-8 max-w-5xl mx-auto border-t border-slate-800/80 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            PROCESSING WORKFLOW
          </span>
          <h2 className="text-3xl font-extrabold text-slate-100">
            How It Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((st) => (
            <div key={st.num} className="bg-dark-900 border border-slate-800 rounded-lg p-4 space-y-2 relative">
              <span className="text-2xl font-black font-mono text-cyan-500/40">
                {st.num}
              </span>
              <h3 className="text-xs font-bold text-slate-200">
                {st.title}
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Key Capabilities Grid */}
      <section className="py-16 px-8 max-w-5xl mx-auto border-t border-slate-800/80 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            TECHNICAL SPECIFICATIONS
          </span>
          <h2 className="text-3xl font-extrabold text-slate-100">
            Key Capabilities
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {capabilities.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="bg-dark-900 border border-slate-800 hover:border-slate-700 rounded-lg p-5 space-y-3 transition-all">
                <div className={`p-2.5 rounded-lg bg-dark-800 border border-slate-700 w-fit ${c.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">{c.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{c.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Scientific Integrity Disclaimer */}
      <section className="py-12 px-8 max-w-5xl mx-auto border-t border-slate-800/80">
        <div className="p-6 rounded-xl bg-dark-900 border border-amber-500/30 flex flex-col md:flex-row items-center gap-4">
          <ShieldCheck className="w-10 h-10 text-amber-400 flex-shrink-0" />
          <div className="space-y-1 text-xs">
            <div className="font-bold text-amber-300">SCIENTIFIC HONESTY & PHOTOGRAMMETRIC STANDARDS</div>
            <p className="text-slate-400 leading-relaxed">
              DepthWizard AI strictly distinguishes uncalibrated relative optical depth from physical surveyed heights. Absolute building elevations require geometric scene calibration (GSD or flight altitude). Fabricated statistics are never displayed as ground truth.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-slate-800 text-center text-xs text-slate-400 font-mono">
        <div>DEPTHWIZARD AI · TEAM PARALLAX · SMART INDIA HACKATHON 2024</div>
        <div className="text-[11px] text-slate-400 mt-1">Single-View Height Estimation & 3D Flythrough Platform</div>
      </footer>
    </div>
  );
};
