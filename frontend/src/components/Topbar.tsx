import React from 'react';
import { 
  Upload, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

export const Topbar: React.FC = () => {
  const { 
    currentImage, 
    calibration, 
    setActiveTab, 
    hasData
  } = useAnalysis();

  return (
    <header className="h-14 bg-dark-900/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between select-none z-20">
      {/* Left: Active Dataset Status */}
      <div className="flex items-center space-x-3">
        {hasData ? (
          <div className="flex items-center space-x-2.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-200 tracking-wide">
              {currentImage?.filename}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-slate-400 border border-slate-700">
              {currentImage?.width} × {currentImage?.height} px
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-slate-400 border border-slate-700">
              {currentImage?.format}
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            <span>Workspace Idle · Upload an aerial/satellite image to begin</span>
          </div>
        )}

        {/* Calibration Badge */}
        {hasData && (
          <div className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
            calibration.isCalibrated 
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
              : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
          }`}>
            {calibration.isCalibrated ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>CALIBRATED (METRIC ELEVATION)</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>RELATIVE DEPTH (UNCALIBRATED)</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-3">
        {/* Upload Button */}
        <button
          onClick={() => setActiveTab('upload')}
          className="flex items-center space-x-1.5 px-4 py-1.5 rounded-md text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-all shadow-sm"
        >
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span>Upload Image</span>
        </button>
      </div>
    </header>
  );
};
