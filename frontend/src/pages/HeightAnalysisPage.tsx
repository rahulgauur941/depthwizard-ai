import React, { useState } from 'react';
import { 
  Mountain, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight,
  BarChart3,
  Box,
  Compass,
  Layers
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useAnalysis } from '../context/AnalysisContext';

export const HeightAnalysisPage: React.FC = () => {
  const { 
    heightData, 
    calibration, 
    updateCalibration, 
    setActiveTab, 
    hasData,
    currentImage
  } = useAnalysis();

  const [isCalibrated, setIsCalibrated] = useState<boolean>(calibration.isCalibrated);
  const [gsd, setGsd] = useState<number>(calibration.gsd);
  const [altitude, setAltitude] = useState<number>(calibration.cameraAltitude);
  const [refHeight, setRefHeight] = useState<string>(calibration.referenceHeight ? String(calibration.referenceHeight) : '');
  const [datum, setDatum] = useState<string>(calibration.referenceDatum);

  const handleSaveCalibration = async () => {
    await updateCalibration({
      isCalibrated,
      gsd,
      cameraAltitude: altitude,
      referenceHeight: refHeight ? parseFloat(refHeight) : undefined,
      referenceDatum: datum
    });
  };

  if (!hasData) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-dark-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
          <Mountain className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-200">No Elevation Data Available</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Upload an aerial image to perform metric height calibration and view elevation histograms.
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

  const distributionData = heightData?.elevation_distribution || [
    { range: '0 - 10', count: 120, percentage: 25, elevation: 5 },
    { range: '10 - 25', count: 180, percentage: 35, elevation: 17.5 },
    { range: '25 - 50', count: 90, percentage: 20, elevation: 37.5 },
    { range: '50 - 80', count: 45, percentage: 12, elevation: 65 },
    { range: '80 - 112', count: 20, percentage: 8, elevation: 96 },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>Height Estimation & Photogrammetric Calibration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Convert monocular disparity gradients into calibrated vertical meters using flight geometry.
          </p>
        </div>

        {/* Calibration Badge */}
        <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold flex items-center gap-2 ${
          calibration.isCalibrated
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
        }`}>
          {calibration.isCalibrated ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>METRIC CALIBRATION ACTIVE (METERS)</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>RELATIVE DISPARITY (UNCALIBRATED)</span>
            </>
          )}
        </div>
      </div>

      {/* Mandatory Scientific Honesty Alert Box */}
      <div className="p-4 rounded-lg bg-dark-900 border-l-4 border-amber-500 border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <AlertTriangle className="w-4 h-4" />
          <span>SCIENTIFIC INTEGRITY GUIDELINE</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          {heightData?.scientific_note || 'Relative height estimate. Absolute height requires scene calibration or elevation reference data.'}
        </p>
        {!calibration.isCalibrated && (
          <div className="text-[11px] font-mono text-amber-300 bg-amber-950/30 p-2 rounded border border-amber-500/20">
            "Relative height estimate — Absolute height requires scene calibration or elevation reference data."
          </div>
        )}
      </div>

      {/* Primary KPI Elevation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-900 border border-slate-800 rounded-lg p-5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Maximum Height
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">
            {heightData?.max_height} <span className="text-sm font-sans font-normal text-slate-400">{heightData?.unit}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Tallest localized structure</div>
        </div>

        <div className="bg-dark-900 border border-slate-800 rounded-lg p-5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Average Elevation
          </div>
          <div className="text-3xl font-black font-mono text-cyan-400">
            {heightData?.average_height} <span className="text-sm font-sans font-normal text-slate-400">{heightData?.unit}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Mean terrain / rooftop plane</div>
        </div>

        <div className="bg-dark-900 border border-slate-800 rounded-lg p-5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Minimum Baseline
          </div>
          <div className="text-3xl font-black font-mono text-slate-200">
            {heightData?.min_height} <span className="text-sm font-sans font-normal text-slate-400">{heightData?.unit}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ground plane zero datum</div>
        </div>

        <div className="bg-dark-900 border border-slate-800 rounded-lg p-5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
            Total Height Range (ΔZ)
          </div>
          <div className="text-3xl font-black font-mono text-purple-400">
            {heightData?.height_range} <span className="text-sm font-sans font-normal text-slate-400">{heightData?.unit}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Max relief displacement</div>
        </div>
      </div>

      {/* Main Grid: Interactive Calibration Panel & Elevation Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 1 Col: Calibration Inputs */}
        <div className="bg-dark-900 border border-slate-800 rounded-lg p-6 space-y-5 shadow-card-dark">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Photogrammetric Calibration</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400">SIH Tool</span>
          </div>

          {/* Toggle Calibration Mode */}
          <div className="flex items-center justify-between bg-dark-850 p-3 rounded-lg border border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-200">Enable Metric Calibration</div>
              <div className="text-[10px] text-slate-400">Scale relative units to meters</div>
            </div>
            <button
              onClick={() => setIsCalibrated(!isCalibrated)}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 ${
                isCalibrated ? 'bg-cyan-500' : 'bg-dark-800 border border-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                isCalibrated ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* GSD Input */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <label className="text-slate-300 font-medium">Ground Sampling Distance (GSD):</label>
              <span className="font-mono text-cyan-400">{gsd} m/px</span>
            </div>
            <input
              type="number"
              step="0.05"
              min="0.05"
              max="5.0"
              value={gsd}
              onChange={(e) => setGsd(parseFloat(e.target.value) || 0.35)}
              className="w-full bg-dark-850 border border-slate-700 rounded px-3 py-2 text-slate-200 font-mono focus:border-cyan-400 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400">Distance on ground represented by one pixel.</p>
          </div>

          {/* Flight Altitude */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <label className="text-slate-300 font-medium">Camera Flight Altitude:</label>
              <span className="font-mono text-cyan-400">{altitude} m</span>
            </div>
            <input
              type="number"
              step="10"
              min="20"
              max="5000"
              value={altitude}
              onChange={(e) => setAltitude(parseFloat(e.target.value) || 500)}
              className="w-full bg-dark-850 border border-slate-700 rounded px-3 py-2 text-slate-200 font-mono focus:border-cyan-400 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400">Drone flight AGL or aircraft survey altitude.</p>
          </div>

          {/* Known Landmark Reference Height */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <label className="text-slate-300 font-medium">Known Reference Height (Optional):</label>
              <span className="font-mono text-slate-400">{refHeight ? `${refHeight} m` : 'None'}</span>
            </div>
            <input
              type="number"
              placeholder="e.g., 86.4 (surveyed tower height)"
              value={refHeight}
              onChange={(e) => setRefHeight(e.target.value)}
              className="w-full bg-dark-850 border border-slate-700 rounded px-3 py-2 text-slate-200 font-mono focus:border-cyan-400 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400">Anchors the vertical ceiling to a known surveyed building.</p>
          </div>

          {/* Elevation Datum */}
          <div className="space-y-1.5 text-xs">
            <label className="text-slate-300 font-medium">Elevation Reference Datum:</label>
            <select
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              className="w-full bg-dark-850 border border-slate-700 rounded px-3 py-2 text-slate-200 font-mono focus:border-cyan-400 focus:outline-none"
            >
              <option value="Ground Baseline">Local Ground Baseline (0m AGL)</option>
              <option value="Mean Sea Level (MSL)">Mean Sea Level (MSL Datum)</option>
              <option value="WGS84 Ellipsoid">WGS84 Reference Ellipsoid</option>
            </select>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveCalibration}
            className="w-full py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-cyan-sm font-mono"
          >
            <span>APPLY CALIBRATION SETTINGS</span>
          </button>
        </div>

        {/* Right 2 Cols: Elevation Histogram Chart & Interactive Height Legend */}
        <div className="lg:col-span-2 space-y-6">
          {/* Elevation Distribution Bar Chart */}
          <div className="bg-dark-900 border border-slate-800 rounded-lg p-6 space-y-4 shadow-card-dark">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Elevation Frequency Distribution</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-400">
                10-Band Histogram ({heightData?.unit})
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="range" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    angle={-25} 
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#070d1e', borderColor: '#1e293b', fontSize: '11px', color: '#e2e8f0' }}
                    formatter={(val: any) => [`${val} pixels`, 'Frequency']}
                  />
                  <Bar dataKey="count" fill="#00f0ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Interactive Height Legend: LOW -> MEDIUM -> HIGH */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-300">Elevation Color Classification Legend:</div>
              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded bg-dark-850 border border-slate-800 flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded bg-blue-600 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">LOW ELEVATION</div>
                    <div className="text-[10px] text-slate-400">
                      0.0 - {Math.round((heightData?.max_height || 100) * 0.33)} {heightData?.unit}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-dark-850 border border-slate-800 flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded bg-amber-500 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">MEDIUM ELEVATION</div>
                    <div className="text-[10px] text-slate-400">
                      {Math.round((heightData?.max_height || 100) * 0.33)} - {Math.round((heightData?.max_height || 100) * 0.66)} {heightData?.unit}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-dark-850 border border-slate-800 flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 rounded bg-rose-600 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-slate-200">HIGH ELEVATION</div>
                    <div className="text-[10px] text-slate-400">
                      {Math.round((heightData?.max_height || 100) * 0.66)} - {heightData?.max_height} {heightData?.unit}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Link to 3D Reconstruction CTA */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-dark-900 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-200">Ready to explore in 3D?</div>
              <div className="text-[11px] text-slate-400">Examine the calibrated height-field mesh with custom exaggeration and lighting.</div>
            </div>
            <button
              onClick={() => setActiveTab('3d-reconstruction')}
              className="py-2 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-cyan-sm font-mono"
            >
              <span>Launch 3D Viewport</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
