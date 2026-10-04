import React from 'react';
import { PlaneTakeoff, ArrowLeft, Sparkles } from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';
import { FlythroughController } from '../components/FlythroughController';

export const FlythroughPage: React.FC = () => {
  const { setActiveTab, hasData } = useAnalysis();

  if (!hasData) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-dark-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <PlaneTakeoff className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-200">No Flythrough Scene Available</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please upload an aerial image first to fly through the reconstructed environment.
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
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('3d-reconstruction')}
            className="p-2 rounded-lg bg-dark-900 hover:bg-dark-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Back to 3D Orbit View"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <span>Aerial Drone Flythrough Simulation</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Navigate first-person through the 3D environment with collision avoidance and real-time flight telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 bg-cyan-950/40 px-3 py-1.5 rounded-lg border border-cyan-500/30">
          <span>COLLISION AVOIDANCE: ON (4m MIN AGL)</span>
        </div>
      </div>

      {/* Flythrough Viewport */}
      <FlythroughController />
    </div>
  );
};
