import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  CalibrationSettings, 
  DetectedStructure, 
  HeightStats, 
  ImageMetadata, 
  DepthAnalysisResult 
} from '../types';
import { api, HealthStatus } from '../services/api';

interface AnalysisContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentImage: ImageMetadata | null;
  depthData: DepthAnalysisResult | null;
  heightData: HeightStats | null;
  objects: DetectedStructure[];
  calibration: CalibrationSettings;
  selectedObjectId: string | null;
  setSelectedObjectId: (id: string | null) => void;
  isProcessing: boolean;
  pipelineProgress: { step: number; label: string; percent: number };
  backendHealth: HealthStatus | null;
  processUploadedFile: (file: File) => Promise<void>;
  updateCalibration: (newCalib: Partial<CalibrationSettings>) => Promise<void>;
  updateDepthSettings: (colormap: string, invert: boolean, contrast: number) => Promise<void>;
  hasData: boolean;
}

const defaultCalibration: CalibrationSettings = {
  isCalibrated: false,
  gsd: 0.35,
  cameraAltitude: 500.0,
  referenceHeight: undefined,
  referenceDatum: "Ground Baseline",
  focalLengthMm: 35.0,
};

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export const AnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentImage, setCurrentImage] = useState<ImageMetadata | null>(null);
  const [depthData, setDepthData] = useState<DepthAnalysisResult | null>(null);
  const [heightData, setHeightData] = useState<HeightStats | null>(null);
  const [objects, setObjects] = useState<DetectedStructure[]>([]);
  const [calibration, setCalibration] = useState<CalibrationSettings>(defaultCalibration);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [pipelineProgress, setPipelineProgress] = useState<{ step: number; label: string; percent: number }>({
    step: 0,
    label: 'Ready',
    percent: 0,
  });
  const [backendHealth, setBackendHealth] = useState<HealthStatus | null>(null);

  // Poll initial backend health
  useEffect(() => {
    api.getHealth().then(setBackendHealth);
  }, []);

  const processUploadedFile = async (file: File) => {
    setIsProcessing(true);
    try {
      // Step 1: Preprocessing & Upload
      setPipelineProgress({ step: 1, label: 'STEP 01: Image Preprocessing & Ingestion', percent: 15 });
      const uploadRes = await api.uploadImage(file);
      
      const newImg: ImageMetadata = {
        id: uploadRes.image_id,
        filename: uploadRes.filename,
        url: uploadRes.image_url,
        width: uploadRes.width,
        height: uploadRes.height,
        fileSizeKb: uploadRes.file_size_kb,
        format: uploadRes.format
      };
      setCurrentImage(newImg);

      // Step 2 & 3: Depth Estimation
      setPipelineProgress({ step: 2, label: 'STEP 02: AI Depth Estimation (Depth Anything V2)', percent: 35 });
      const depthRes = await api.estimateDepth(uploadRes.image_id, 'turbo');
      setDepthData(depthRes);

      // Step 4: Height & Ground Reconstruction
      setPipelineProgress({ step: 4, label: 'STEP 04: Height Field & Bare-Earth Ground Reconstruction', percent: 60 });
      const heightRes = await api.calculateHeight(uploadRes.image_id, calibration);
      setHeightData(heightRes);

      // Step 5: Object Analysis (Footprints, Polygons, Coherent Heights)
      setPipelineProgress({ step: 5, label: 'STEP 05: Structural Footprint & Elevation Segmentation', percent: 80 });
      const objRes = await api.detectObjects(uploadRes.image_id, calibration);
      setObjects(objRes);

      // Step 6 & 7: Structured 3D Mesh Generation & Optimization
      setPipelineProgress({ step: 6, label: 'STEP 06: Structured 3D Geometry Extrusion', percent: 95 });
      await api.exportAsset(uploadRes.image_id, 'obj', calibration);

      setPipelineProgress({ step: 7, label: 'STEP 07: Scene Reconstruction Completed', percent: 100 });
      setSelectedObjectId(null);
    } catch (err: any) {
      console.error('Pipeline processing error:', err);
      setPipelineProgress({ step: 0, label: `Error: ${err.message || 'Processing failed'}`, percent: 0 });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateCalibration = async (newCalib: Partial<CalibrationSettings>) => {
    const updated = { ...calibration, ...newCalib };
    setCalibration(updated);
    if (currentImage && depthData) {
      try {
        setIsProcessing(true);
        const heightRes = await api.calculateHeight(currentImage.id, updated);
        setHeightData(heightRes);

        const objRes = await api.detectObjects(currentImage.id, updated);
        setObjects(objRes);
      } catch (err) {
        console.error('Calibration update error:', err);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const updateDepthSettings = async (colormap: string, invert: boolean, contrast: number) => {
    if (!currentImage) return;
    try {
      const res = await api.estimateDepth(currentImage.id, colormap, invert, contrast);
      setDepthData(res);
    } catch {
      if (depthData) {
        setDepthData({
          ...depthData,
          colormapUrl: depthData.depthMapUrl,
        });
      }
    }
  };

  return (
    <AnalysisContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentImage,
        depthData,
        heightData,
        objects,
        calibration,
        selectedObjectId,
        setSelectedObjectId,
        isProcessing,
        pipelineProgress,
        backendHealth,
        processUploadedFile,
        updateCalibration,
        updateDepthSettings,
        hasData: currentImage !== null,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
};
