import React from 'react';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Layers, 
  Mountain, 
  Box, 
  PlaneTakeoff, 
  Crosshair, 
  Download, 
  Settings, 
  Cpu,
  Activity
} from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    backendHealth
  } = useAnalysis();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Image Analysis', icon: UploadCloud },
    { id: 'depth-analysis', label: 'Depth Map', icon: Layers },
    { id: 'height-analysis', label: 'Height Estimation', icon: Mountain },
    { id: '3d-reconstruction', label: '3D Reconstruction', icon: Box },
    { id: 'flythrough', label: 'Flythrough Simulator', icon: PlaneTakeoff },
    { id: 'object-analysis', label: 'Object Analysis', icon: Crosshair },
    { id: 'export', label: 'Export Center', icon: Download },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen bg-dark-900 border-r border-slate-800 flex flex-col justify-between select-none z-30 flex-shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-cyan-sm">
            <Box className="w-5 h-5 text-dark-950 font-black" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider text-cyan-glow flex items-center gap-1.5">
              DEPTHWIZARD <span className="text-xs px-1 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">AI</span>
            </h1>
            <div className="text-[10px] tracking-widest text-slate-400 font-mono uppercase font-semibold">
              PARALLAX · SIH 2024
            </div>
          </div>
        </div>
        <p className="text-[11px] text-slate-400 mt-2.5 font-light leading-tight">
          Single-View Height Estimation & 3D Flythrough
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-cyan-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800/80 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span className="tracking-wide">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-dark-950/70 text-[11px] space-y-2">
        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>System Status</span>
          </div>
          <span className="text-emerald-400 font-mono font-medium">ONLINE</span>
        </div>

        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-1.5 truncate max-w-[130px]">
            <Cpu className="w-3 h-3 text-cyan-400" />
            <span className="truncate">AI Engine</span>
          </div>
          <span className="text-cyan-300 font-mono text-[10px] truncate max-w-[100px]" title={backendHealth?.ai_model || "Depth Anything V2"}>
            {backendHealth?.is_ai_loaded ? "DA-V2 Torch" : "DA-V2 Hybrid"}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-1.5">
            <Box className="w-3 h-3 text-blue-400" />
            <span>WebGL 2.0</span>
          </div>
          <span className="text-blue-400 font-mono text-[10px]">ACTIVE</span>
        </div>
      </div>
    </aside>
  );
};
