import React from 'react';
import { 
  Crosshair, 
  Building, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Maximize2,
  MapPin,
  Sparkles
} from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

export const ObjectAnalysisPage: React.FC = () => {
  const { 
    objects, 
    selectedObjectId, 
    setSelectedObjectId, 
    currentImage, 
    calibration, 
    heightData, 
    setActiveTab, 
    hasData
  } = useAnalysis();

  if (!hasData) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-dark-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <Crosshair className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-200">No Object Analysis Available</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Upload an aerial image to detect building footprints and estimate structural heights.
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

  const selectedObject = objects.find(o => o.id === selectedObjectId) || objects[0];
  const imgUrl = currentImage?.url || '/demo/urban_aerial.jpg';

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>Object & Structural Footprint Analysis</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Photogrammetric building segmentation, vertical extrusion attribution, and 3D scene correlation.
          </p>
        </div>

        <div className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1.5 rounded-lg border border-cyan-500/30">
          TOTAL DETECTED: {objects.length} STRUCTURES
        </div>
      </div>

      {/* Main Grid: Interactive 2D Bounding Box Overlay on Left, Object Table & Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left (5 Cols): 2D Image with Bounding Box Overlays */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-dark-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center justify-between">
              <span>Footprint Delineation</span>
              <span className="text-[10px] font-mono text-slate-400">Click box to select</span>
            </div>

            <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-700 bg-dark-950">
              <img
                src={imgUrl}
                alt="Aerial Base"
                className="w-full h-full object-cover select-none"
              />

              {/* SVG Bounding Boxes Overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-auto">
                {objects.map((obj) => {
                  const isSelected = obj.id === selectedObjectId;
                  // Normalized [nx1, ny1, nx2, ny2]
                  const x = `${obj.footprint_norm[0] * 100}%`;
                  const y = `${obj.footprint_norm[1] * 100}%`;
                  const width = `${(obj.footprint_norm[2] - obj.footprint_norm[0]) * 100}%`;
                  const height = `${(obj.footprint_norm[3] - obj.footprint_norm[1]) * 100}%`;

                  return (
                    <g key={obj.id} onClick={() => setSelectedObjectId(obj.id)} className="cursor-pointer group">
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={isSelected ? 'rgba(0, 240, 255, 0.25)' : 'rgba(56, 189, 248, 0.1)'}
                        stroke={isSelected ? '#00f0ff' : '#38bdf8'}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                        strokeDasharray={isSelected ? 'none' : '3 3'}
                        className="transition-all"
                      />
                      <text
                        x={x}
                        y={y}
                        dy="-4"
                        fill={isSelected ? '#00f0ff' : '#94a3b8'}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {obj.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
              <span>Cyan Box = Selected Structure</span>
              <span>Blue Dashed = Detected Footprint</span>
            </div>
          </div>

          {/* Selected Structure Inspector Card */}
          {selectedObject && (
            <div className="bg-dark-900 border border-cyan-500/40 rounded-lg p-5 space-y-3 shadow-cyan-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-100">{selectedObject.name}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  {selectedObject.id}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Estimated Height</div>
                  <div className="text-xl font-bold font-mono text-cyan-300">
                    {selectedObject.estimated_height} {heightData?.unit}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {calibration.isCalibrated ? 'Calibrated elevation' : 'Relative index'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Confidence Score</div>
                  <div className="text-xl font-bold font-mono text-emerald-400">
                    {Math.round(selectedObject.confidence * 100)}%
                  </div>
                  <div className="text-[10px] text-slate-400">Edge sharpness metric</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Footprint Area</div>
                  <div className="text-sm font-semibold font-mono text-slate-200">
                    {selectedObject.area_sq_m} {calibration.isCalibrated ? 'm²' : 'px²'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Classification</div>
                  <div className="text-sm font-semibold text-slate-200">
                    {selectedObject.type}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setActiveTab('3d-reconstruction')}
                  className="px-3 py-1.5 rounded bg-dark-800 hover:bg-dark-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>Highlight in 3D Scene</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right (7 Cols): Structures Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-dark-900 border border-slate-800 rounded-lg overflow-hidden shadow-card-dark">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Detected Structures Register
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                Click any row to focus
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-dark-950/80 border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Object ID</th>
                    <th className="py-2.5 px-3">Structure Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-right">Height ({heightData?.unit})</th>
                    <th className="py-2.5 px-3 text-right">Confidence</th>
                    <th className="py-2.5 px-3 text-right">Area</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {objects.map((obj) => {
                    const isSelected = obj.id === selectedObjectId;
                    return (
                      <tr
                        key={obj.id}
                        onClick={() => setSelectedObjectId(obj.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-cyan-500/15 text-cyan-200'
                            : 'hover:bg-dark-800/80 text-slate-300'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-cyan-400">{obj.id}</td>
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-200">{obj.name}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400">{obj.type}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-cyan-300">
                          {obj.estimated_height}
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400">
                          {Math.round(obj.confidence * 100)}%
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-400">
                          {obj.area_sq_m}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
