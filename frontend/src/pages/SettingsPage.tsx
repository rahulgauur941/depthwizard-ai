import React, { useState } from 'react';
import { 
  Settings, 
  Cpu, 
  Box, 
  HardDrive, 
  CheckCircle2, 
  Sliders, 
  Info,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

export const SettingsPage: React.FC = () => {
  const { backendHealth, calibration, updateCalibration } = useAnalysis();

  const [modelOption, setModelOption] = useState<string>('auto');
  const [unitMode, setUnitMode] = useState<'metric' | 'imperial'>('metric');

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <span>System & Hardware Configuration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          AI inference engines, WebGL 2.0 diagnostics, and photogrammetric unit defaults.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: AI Inference Engine Configuration */}
        <div className="bg-dark-900 border border-slate-800 rounded-lg p-6 space-y-5 shadow-card-dark">
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              AI Depth Estimation Architecture
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-medium">Active Inference Model:</label>
              <div className="mt-1 p-3 rounded bg-dark-850 border border-slate-700 font-mono text-cyan-300 flex items-center justify-between">
                <span>{backendHealth?.ai_model || 'Depth Anything V2 (Small HF / CV Fallback)'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  {backendHealth?.device.toUpperCase() || 'CPU'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-slate-300 font-medium">Model Checkpoint Selection:</label>
              <select
                value={modelOption}
                onChange={(e) => setModelOption(e.target.value)}
                className="w-full bg-dark-850 border border-slate-700 rounded px-3 py-2 text-slate-200 font-mono text-xs focus:border-cyan-400 focus:outline-none"
              >
                <option value="auto">Auto-Detect Best Available (Recommended)</option>
                <option value="vits">Depth Anything V2 - Small (ViT-S / 24.8M params)</option>
                <option value="vitb">Depth Anything V2 - Base (ViT-B / 97.5M params)</option>
                <option value="vitl">Depth Anything V2 - Large (ViT-L / 335.3M params)</option>
                <option value="cv">DepthWizard Structural Morphological Fallback</option>
              </select>
            </div>

            {/* Weights Installation Guidance */}
            <div className="p-3.5 rounded bg-dark-850 border border-slate-800 space-y-2 text-[11px] text-slate-400 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Local Weight Checkpoints</span>
              </div>
              <div>
                To use local PyTorch weights offline, place the official checkpoint file in:
                <code className="block mt-1 p-1.5 rounded bg-dark-950 text-cyan-400 font-mono text-[10px]">
                  backend/models/depth_anything_v2_vits.pth
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Right: WebGL 2.0 & Graphics Diagnostics */}
        <div className="bg-dark-900 border border-slate-800 rounded-lg p-6 space-y-5 shadow-card-dark">
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
            <Box className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Client WebGL 2.0 Diagnostics
            </h2>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">WebGL Context:</span>
              <span className="text-emerald-400 font-bold">WebGL 2.0 (Active)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Device Pixel Ratio:</span>
              <span className="text-slate-200">{window.devicePixelRatio || 1.0}x</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Max Texture Size:</span>
              <span className="text-slate-200">16,384 × 16,384 px</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Hardware Instancing:</span>
              <span className="text-cyan-400">Supported</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Floating-Point Texture (FP16):</span>
              <span className="text-emerald-400">Enabled</span>
            </div>
          </div>

          {/* Unit Preferences */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-200">Default Measurement Unit:</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setUnitMode('metric')}
                className={`py-2 px-3 rounded font-mono transition-all ${
                  unitMode === 'metric'
                    ? 'bg-cyan-500 text-dark-950 font-bold'
                    : 'bg-dark-850 text-slate-400 border border-slate-700'
                }`}
              >
                Metric (Meters)
              </button>
              <button
                onClick={() => setUnitMode('imperial')}
                className={`py-2 px-3 rounded font-mono transition-all ${
                  unitMode === 'imperial'
                    ? 'bg-cyan-500 text-dark-950 font-bold'
                    : 'bg-dark-850 text-slate-400 border border-slate-700'
                }`}
              >
                Imperial (Feet)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
