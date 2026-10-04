export interface CalibrationSettings {
  isCalibrated: boolean;
  gsd: number; // Ground Sampling Distance in m/px
  cameraAltitude: number; // Camera flight altitude in meters
  referenceHeight?: number; // Known building/feature height in meters
  referenceDatum: string; // e.g., "Ground Baseline" or "Mean Sea Level (MSL)"
  focalLengthMm?: number;
}

export interface DetectedStructure {
  id: string;
  name: string;
  type: string;
  box: [number, number, number, number]; // [x1, y1, x2, y2]
  estimated_height: number;
  confidence: number;
  area_sq_m: number;
  footprint_norm: [number, number, number, number];
  relative_depth: number;
  polygon?: [number, number][]; // Normalized [[nx, ny], ...]
  centroid?: [number, number]; // Normalized [cx, cy]
  orientation?: number; // Orientation in degrees
  roof_type?: string; // "flat" | "sloped"
}

export interface ElevationBin {
  range: string;
  count: number;
  percentage: number;
  elevation: number;
}

export interface HeightStats {
  min_height: number;
  max_height: number;
  average_height: number;
  height_range: number;
  unit: string;
  calibration_status: string;
  scientific_note: string;
  height_map_url?: string;
  ground_map_url?: string;
  elevation_distribution?: ElevationBin[];
}

export interface ImageMetadata {
  id: string;
  filename: string;
  url: string;
  width: number;
  height: number;
  fileSizeKb: number;
  format: string;
}

export interface DepthAnalysisResult {
  depthMapUrl: string;
  normalizedDepthUrl: string;
  colormapUrl: string;
  processingTime: number;
  modelName: string;
  confidence: number;
  rawStats: {
    min: number;
    max: number;
    mean: number;
    std: number;
  };
  isRelative: boolean;
  scientificNote: string;
  scientific_note?: string;
}

export interface PipelineStep {
  id: number;
  label: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

export interface MeshExportOptions {
  exaggeration: number;
  wireframe: boolean;
  textureMode: 'satellite' | 'elevation' | 'solid';
  colormap: string;
}
