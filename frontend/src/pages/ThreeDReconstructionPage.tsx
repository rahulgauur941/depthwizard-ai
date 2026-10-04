import React from 'react';
import { Box, PlaneTakeoff, Info, Download, Sparkles } from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';
import { ThreeDViewer } from '../components/ThreeDViewer';

export const ThreeDReconstructionPage: React.FC = () => {
  const { setActiveTab, hasData } = useAnalysis();

  if (!hasData) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-dark-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <Box className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-200">No 3D Reconstruction Available</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please upload an aerial image to reconstruct a structured 3D geospatial scene.
        </p>
        <button
          onClick={() => setActiveTab('upload')}
          className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs font-mono transition-all shadow-cyan-sm"
        >
          Upload Aerial Image
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>3D Height-Field Terrain Reconstruction</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time WebGL mesh generation with custom height exaggeration, dynamic lighting, and measurement.
          </p>
        </div>

        {/* Enter Flythrough Button */}
        <button
          onClick={() => setActiveTab('flythrough')}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-dark-950 border border-cyan-300 transition-all shadow-cyan-sm font-mono"
        >
          <PlaneTakeoff className="w-4 h-4" />
          <span>START AERIAL FLYTHROUGH</span>
        </button>
      </div>

      {/* 3D Viewport Component */}
      <div className="w-full">
        <ThreeDViewer 
          interactive={true} 
          compact={false}
          onEnterFlythrough={() => setActiveTab('flythrough')} 
        />
      </div>

      {/* Feature Guidance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-lg bg-dark-900 border border-slate-800 space-y-1.5">
          <div className="text-xs font-bold text-cyan-300">Surface Shading & Texturing</div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Switch seamlessly between satellite photo-draping, false-color elevation heatmaps, and wireframe topography.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-dark-900 border border-slate-800 space-y-1.5">
          <div className="text-xs font-bold text-emerald-300">Point-to-Point 3D Measurement</div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Click 'Measure' in the top toolbar to click any two spots on the terrain. Computes 3D Euclidean distance and vertical height differential.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-dark-900 border border-slate-800 space-y-1.5">
          <div className="text-xs font-bold text-purple-300">Export Ready Models</div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Download the reconstructed 3D mesh directly as a standard GLB/GLTF or Wavefront OBJ file for GIS, Blender, and CAD software.
          </p>
        </div>
      </div>
    </div>
  );
};
