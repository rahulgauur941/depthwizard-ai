import { CalibrationSettings, DepthAnalysisResult, HeightStats, DetectedStructure } from '../types';

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : '/api';

export const resolveAssetUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  const origin = rawApiUrl ? rawApiUrl.replace(/\/api\/?$/, '') : '';
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${origin}${cleanUrl}`;
};

export interface HealthStatus {
  status: string;
  system: string;
  team: string;
  ai_model: string;
  is_ai_loaded: boolean;
  device: string;
  supported_formats: string[];
  version: string;
}

export const api = {
  async getHealth(): Promise<HealthStatus> {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch {
      return {
        status: 'offline',
        system: 'DepthWizard AI',
        team: 'PARALLAX',
        ai_model: 'Depth Anything V2 (Client Simulation / Demo)',
        is_ai_loaded: false,
        device: 'browser WebGL',
        supported_formats: ['JPG', 'PNG', 'WEBP'],
        version: '1.0.0'
      };
    }
  },

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Upload failed');
    }
    return await res.json();
  },

  async estimateDepth(imageId: string, colormap = 'turbo', invert = false, contrast = 1.0): Promise<DepthAnalysisResult> {
    const res = await fetch(`${API_BASE}/depth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_id: imageId, colormap, invert, contrast }),
    });
    if (!res.ok) throw new Error('Depth estimation failed');
    const data = await res.json();
    return {
      depthMapUrl: data.depth_map_url,
      normalizedDepthUrl: data.normalized_depth_url,
      colormapUrl: data.colormap_url,
      processingTime: data.processing_time,
      modelName: data.model_name,
      confidence: data.confidence,
      rawStats: data.raw_depth_stats,
      isRelative: data.is_relative,
      scientificNote: data.scientific_note,
    };
  },

  async calculateHeight(imageId: string, calibration: CalibrationSettings): Promise<HeightStats> {
    const res = await fetch(`${API_BASE}/height`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_id: imageId,
        calibration: {
          is_calibrated: calibration.isCalibrated,
          gsd: calibration.gsd,
          camera_altitude: calibration.cameraAltitude,
          reference_height: calibration.referenceHeight,
          reference_datum: calibration.referenceDatum
        }
      }),
    });
    if (!res.ok) throw new Error('Height calculation failed');
    const data = await res.json();
    return {
      min_height: data.min_height,
      max_height: data.max_height,
      average_height: data.average_height,
      height_range: data.height_range,
      unit: data.unit,
      calibration_status: data.calibration_status,
      scientific_note: data.scientific_note,
      height_map_url: data.height_map_url,
      ground_map_url: data.ground_map_url,
      elevation_distribution: data.elevation_distribution,
    };
  },

  async detectObjects(imageId: string, calibration: CalibrationSettings): Promise<DetectedStructure[]> {
    const res = await fetch(`${API_BASE}/objects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_id: imageId,
        calibration: {
          is_calibrated: calibration.isCalibrated,
          gsd: calibration.gsd,
          camera_altitude: calibration.cameraAltitude,
          reference_height: calibration.referenceHeight,
        }
      }),
    });
    if (!res.ok) throw new Error('Object detection failed');
    const data = await res.json();
    return data.objects;
  },

  async processFullPipeline(imageId: string, calibration: CalibrationSettings) {
    const formData = new FormData();
    formData.append('image_id', imageId);
    formData.append('is_calibrated', String(calibration.isCalibrated));
    formData.append('gsd', String(calibration.gsd));
    formData.append('camera_altitude', String(calibration.cameraAltitude));
    if (calibration.referenceHeight) {
      formData.append('reference_height', String(calibration.referenceHeight));
    }

    const res = await fetch(`${API_BASE}/process`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Pipeline processing failed');
    return await res.json();
  },

  async exportAsset(imageId: string, format: string, calibration?: CalibrationSettings) {
    const res = await fetch(`${API_BASE}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_id: imageId,
        export_format: format,
        calibration: calibration ? {
          is_calibrated: calibration.isCalibrated,
          gsd: calibration.gsd,
          camera_altitude: calibration.cameraAltitude,
          reference_height: calibration.referenceHeight
        } : undefined
      }),
    });
    if (!res.ok) throw new Error('Export generation failed');
    return await res.json();
  }
};
