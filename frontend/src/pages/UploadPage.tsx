import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Cpu, 
  ArrowRight,
  Mountain,
  Building,
  Compass,
  Info
} from 'lucide-react';
import { useAnalysis } from '../context/AnalysisContext';

export const UploadPage: React.FC = () => {
  const { 
    processUploadedFile, 
    isProcessing, 
    pipelineProgress, 
    currentImage,
    setActiveTab
  } = useAnalysis();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setErrorMsg(null);
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'tif', 'tiff'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      setErrorMsg(`Unsupported file type (.${ext}). Allowed: JPG, JPEG, PNG, WEBP, TIFF`);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File size exceeds maximum 25 MB limit.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) return;
    try {
      await processUploadedFile(selectedFile);
      setActiveTab('dashboard');
    } catch {
      setErrorMsg('Failed to process image through AI pipeline.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
          <UploadCloud className="w-6 h-6 text-cyan-400" />
          <span>Aerial Image Ingestion & Analysis</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 font-light">
          Upload satellite or drone photography to trigger the AI depth, height photogrammetry, and structured 3D reconstruction engine.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Drag & Drop Uploader */}
        <div className="lg:col-span-2 space-y-6">
          {/* Uploader Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]' 
                : 'border-slate-800 hover:border-slate-700 bg-dark-900/60 hover:bg-dark-900/90'
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".jpg,.jpeg,.png,.webp,.tif,.tiff" 
              onChange={handleFileChange}
              className="hidden" 
            />

            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-cyan-sm">
              <UploadCloud className="w-8 h-8" />
            </div>

            <h3 className="text-sm font-bold text-slate-100">
              Drag & Drop Aerial Image Here
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Or click to browse from local workstation. Supported: JPG, PNG, WEBP, TIFF (Max 25 MB).
            </p>

            <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded bg-dark-800 border border-slate-700">JPEG</span>
              <span className="px-2 py-0.5 rounded bg-dark-800 border border-slate-700">PNG</span>
              <span className="px-2 py-0.5 rounded bg-dark-800 border border-slate-700">WEBP</span>
              <span className="px-2 py-0.5 rounded bg-dark-800 border border-slate-700">GeoTIFF</span>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Selected File Card & Preview */}
          {selectedFile && previewUrl && (
            <div className="bg-dark-900 border border-slate-800 rounded-lg p-5 space-y-4 shadow-card-dark">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{selectedFile.name}</h4>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · {selectedFile.type || 'image/jpeg'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleStartAnalysis}
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs font-mono shadow-cyan-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>{isProcessing ? 'Processing Pipeline...' : 'Analyze Image'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Thumbnail Preview */}
              <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-dark-950 max-h-64 flex items-center justify-center">
                <img 
                  src={previewUrl} 
                  alt="Upload Preview" 
                  className="max-h-64 w-auto object-contain rounded"
                />
              </div>
            </div>
          )}

          {/* Processing Pipeline Live Status */}
          {isProcessing && (
            <div className="bg-dark-900 border border-cyan-500/40 rounded-lg p-5 space-y-4 shadow-cyan-sm animate-pulse-subtle">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold flex items-center gap-2">
                  <Cpu className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>{pipelineProgress.label}</span>
                </span>
                <span className="text-slate-300 font-bold">{pipelineProgress.percent}%</span>
              </div>

              <div className="w-full h-2 bg-dark-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${pipelineProgress.percent}%` }}
                />
              </div>

              {/* 7 Standard Pipeline Stages */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-[10px]">
                {[
                  { id: 1, name: 'Image Preprocessing' },
                  { id: 2, name: 'AI Depth Estimation' },
                  { id: 3, name: 'Depth Denoising' },
                  { id: 4, name: 'Height Photogrammetry' },
                  { id: 5, name: 'Object Segmentation' },
                  { id: 6, name: '3D Mesh Generation' },
                  { id: 7, name: 'Scene Optimization' }
                ].map((st) => (
                  <div 
                    key={st.id}
                    className={`p-2 rounded border text-left ${
                      pipelineProgress.step >= st.id
                        ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300'
                        : 'border-slate-800 bg-dark-950/60 text-slate-400'
                    }`}
                  >
                    <div className="font-mono font-bold">STEP 0{st.id}</div>
                    <div className="font-semibold text-slate-200 truncate">{st.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Geospatial Ingestion Guidelines & Specs */}
        <div className="space-y-4">
          <div className="bg-dark-900 border border-slate-800 rounded-lg p-5 space-y-4 shadow-card-dark">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ingestion Standards</span>
              </h2>
              <span className="text-[10px] font-mono text-cyan-400">Orthographic / Aerial</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              DepthWizard AI processes top-down, nadir, or high-altitude oblique aerial imagery. For optimal 3D geometry reconstruction, adhere to these photogrammetric specifications:
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-dark-850 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Viewing Angle & Projection</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Approx. orthographic or nadir angle (0°–25° off-nadir) delivers the cleanest building footprint extraction and minimum facade occlusion.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-dark-850 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Recommended Resolution</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  512 × 512 px to 2048 × 2048 px. Sub-meter Ground Sampling Distance (GSD 0.15m to 0.50m/px) yields accurate footprint polygons.
                </div>
              </div>

              <div className="p-3 rounded-lg bg-dark-850 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Scientific Scale Anchoring</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Provide camera altitude or a known building reference height in System Settings to calibrate relative depth into exact metric meters.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
