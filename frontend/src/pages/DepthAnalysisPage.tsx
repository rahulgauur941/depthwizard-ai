import React, { useState } from 'react';
import { 
  Layers, 
  Sliders, 
  RefreshCw, 
  Eye, 
  AlertTriangle, 
  SplitSquareVertical, 
  ArrowRight,
  Info,
  Maximize2
} from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

export const DepthAnalysisPage: React.FC = () => {
  const { 
    currentImage, 
    depthData, 
    updateDepthSettings, 
    setActiveTab, 
    hasData 
  } = useAnalysis();

  const [colormap, setColormap] = useState<string>('turbo');
  const [invert, setInvert] = useState<boolean>(false);
  const [contrast, setContrast] = useState<number>(1.0);
  const [sliderPos, setSliderPos] = useState<number>(50); // Split slider 0 to 100
  const [viewMode, setViewMode] = useState<'split' | 'side-by-side'>('split');

  const handleApplySettings = async () => {
    await updateDepthSettings(colormap, invert, contrast);
  };

  if (!hasData) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-dark-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-200">No Image Loaded for Depth Analysis</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please upload an aerial image to estimate the dense monocular depth field.
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

  const originalImgUrl = currentImage?.url || '/demo/urban_aerial.jpg';
  const depthImgUrl = depthData?.colormapUrl || depthData?.depthMapUrl || '/demo/urban_depth.png';

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Scientific Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>AI Monocular Depth Analysis</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Model: <span className="font-mono text-cyan-400">{depthData?.modelName || 'Depth Anything V2'}</span> · Inference Latency: <span className="font-mono text-slate-200">{depthData?.processingTime}s</span>
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2 bg-dark-900 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              viewMode === 'split'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Interactive Split View
          </button>
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Side-by-Side
          </button>
        </div>
      </div>

      {/* Mandatory Scientific Honesty Banner */}
      <div className="p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-cyan-300">SCIENTIFIC HONESTY SPECIFICATION:</span> Monocular depth estimation maps optical disparity to relative depth [0.0 - 1.0]. A single view does not contain absolute scale metrics. To derive true metric building heights, proceed to the Height Calibration tab to provide camera altitude or reference ground sampling distance.
        </div>
      </div>

      {/* Main Visual Comparison Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Visualizer (3 Cols) */}
        <div className="lg:col-span-3 bg-dark-950 border border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center min-h-[520px] relative overflow-hidden">
          {viewMode === 'split' ? (
            /* Interactive Split Comparison Slider */
            <div className="relative w-full max-w-[560px] aspect-square rounded-lg overflow-hidden border border-slate-700 shadow-2xl select-none">
              {/* Background: Depth Map */}
              <img
                src={depthImgUrl}
                alt="AI Depth Field"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute bottom-3 right-3 z-10 px-2 py-0.5 rounded bg-dark-950/80 backdrop-blur-md text-[10px] font-mono text-cyan-300 border border-cyan-500/40">
                AI DEPTH FIELD
              </div>

              {/* Foreground: Original Image (Clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <img
                  src={originalImgUrl}
                  alt="Original Aerial View"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute bottom-3 left-3 z-10 px-2 py-0.5 rounded bg-dark-950/80 backdrop-blur-md text-[10px] font-mono text-slate-300 border border-slate-700">
                  ORIGINAL AERIAL
                </div>
              </div>

              {/* Split Divider Handle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 cursor-ew-resize z-20"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-400 text-dark-950 flex items-center justify-center shadow-cyan-sm">
                  <SplitSquareVertical className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Invisible interactive drag overlay */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
              />
            </div>
          ) : (
            /* Side-by-Side Dual Images */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-[800px]">
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Input Aerial View</span>
                  <span>512 × 512</span>
                </div>
                <div className="aspect-square rounded-lg overflow-hidden border border-slate-700 bg-dark-900">
                  <img src={originalImgUrl} alt="Original" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Depth Anything V2</span>
                  <span>Normalized [0, 1]</span>
                </div>
                <div className="aspect-square rounded-lg overflow-hidden border border-cyan-500/40 bg-dark-900 shadow-cyan-sm">
                  <img src={depthImgUrl} alt="Depth Map" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls Sidebar (1 Col) */}
        <div className="space-y-5">
          {/* Depth Adjustments Card */}
          <div className="bg-dark-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Colormap & Contrast</span>
            </h3>

            {/* Colormap Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Palette Color Ramp:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {['turbo', 'viridis', 'inferno', 'plasma', 'terrain', 'grayscale'].map((cm) => (
                  <button
                    key={cm}
                    onClick={() => { setColormap(cm); updateDepthSettings(cm, invert, contrast); }}
                    className={`px-2 py-1.5 rounded text-xs capitalize font-medium transition-all ${
                      colormap === cm
                        ? 'bg-cyan-500 text-dark-950 font-bold shadow-cyan-sm'
                        : 'bg-dark-800 text-slate-400 hover:text-slate-200 border border-slate-700'
                    }`}
                  >
                    {cm}
                  </button>
                ))}
              </div>
            </div>

            {/* Depth Contrast Slider */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Depth Contrast:</span>
                <span className="font-mono text-cyan-400">{contrast.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Invert Depth Toggle */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">Invert Disparity:</span>
              <button
                onClick={() => {
                  const newInv = !invert;
                  setInvert(newInv);
                  updateDepthSettings(colormap, newInv, contrast);
                }}
                className={`w-10 h-5 rounded-full transition-colors p-0.5 ${
                  invert ? 'bg-cyan-500' : 'bg-dark-800 border border-slate-700'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  invert ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApplySettings}
              className="w-full py-2 px-3 rounded-lg bg-dark-800 hover:bg-dark-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors mt-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update Colormap</span>
            </button>
          </div>

          {/* Next Step CTA */}
          <div className="bg-dark-900 border border-slate-800 rounded-lg p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Next Stage: Metric Elevation
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Convert these normalized relative gradients into real metric heights by configuring camera parameters and GSD.
            </p>
            <button
              onClick={() => setActiveTab('height-analysis')}
              className="w-full py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-cyan-sm"
            >
              <span>Go to Height Estimation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
