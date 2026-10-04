import { DetectedStructure, HeightStats, ImageMetadata, DepthAnalysisResult } from '../types';

export interface DemoScene {
  id: string;
  name: string;
  category: string;
  description: string;
  image: ImageMetadata;
  depth: DepthAnalysisResult;
  height: HeightStats;
  objects: DetectedStructure[];
}

export const DEMO_SCENES: Record<string, DemoScene> = {
  urban: {
    id: "demo-urban",
    name: "Metropolitan Financial District",
    category: "High-Density Urban Satellite",
    description: "Multi-tier commercial skyscrapers and civic transit hub with complex shadow relief and perpendicular facades.",
    image: {
      id: "demo-urban",
      filename: "urban_aerial.jpg",
      url: "/demo/urban_aerial.jpg",
      width: 512,
      height: 512,
      fileSizeKb: 142.5,
      format: "JPEG"
    },
    depth: {
      depthMapUrl: "/demo/urban_depth.png",
      normalizedDepthUrl: "/demo/urban_depth.png",
      colormapUrl: "/demo/urban_depth.png",
      processingTime: 0.42,
      modelName: "Depth Anything V2 (Metric / Relative)",
      confidence: 0.94,
      rawStats: { min: 0.08, max: 0.99, mean: 0.36, std: 0.28 },
      isRelative: true,
      scientific_note: "Relative monocular depth estimation. Vertical scale anchored to calibrated scene parameters.",
      scientificNote: "Relative monocular depth estimation. Vertical scale anchored to calibrated scene parameters."
    },
    height: {
      min_height: 0.0,
      max_height: 112.0,
      average_height: 26.4,
      height_range: 112.0,
      unit: "meters",
      calibration_status: "Calibrated (GSD: 0.35m/px, Alt: 450m)",
      scientific_note: "Calibrated using photogrammetric ground baseline and sensor altitude parameters.",
      elevation_distribution: [
        { range: "0.0 - 11.2", count: 18450, percentage: 38.2, elevation: 5.6 },
        { range: "11.2 - 22.4", count: 9240, percentage: 19.1, elevation: 16.8 },
        { range: "22.4 - 33.6", count: 5410, percentage: 11.2, elevation: 28.0 },
        { range: "33.6 - 44.8", count: 4200, percentage: 8.7, elevation: 39.2 },
        { range: "44.8 - 56.0", count: 3100, percentage: 6.4, elevation: 50.4 },
        { range: "56.0 - 67.2", count: 2850, percentage: 5.9, elevation: 61.6 },
        { range: "67.2 - 78.4", count: 2150, percentage: 4.5, elevation: 72.8 },
        { range: "78.4 - 89.6", count: 1650, percentage: 3.4, elevation: 84.0 },
        { range: "89.6 - 100.8", count: 820, percentage: 1.7, elevation: 95.2 },
        { range: "100.8 - 112.0", count: 450, percentage: 0.9, elevation: 106.4 },
      ]
    },
    objects: [
      { id: "BLD-01", name: "Apex Center Tower", type: "Commercial High-Rise", box: [40, 40, 160, 160], estimated_height: 86.4, confidence: 0.95, area_sq_m: 1764.0, footprint_norm: [0.078, 0.078, 0.312, 0.312], relative_depth: 0.88 },
      { id: "BLD-02", name: "Meridian Financial Spire", type: "Skyscraper", box: [190, 35, 280, 170], estimated_height: 112.0, confidence: 0.97, area_sq_m: 1488.0, footprint_norm: [0.371, 0.068, 0.547, 0.332], relative_depth: 0.96 },
      { id: "BLD-03", name: "CyberTech Hub", type: "Office Complex", box: [310, 45, 470, 150], estimated_height: 45.2, confidence: 0.92, area_sq_m: 2058.0, footprint_norm: [0.605, 0.088, 0.918, 0.293], relative_depth: 0.52 },
      { id: "BLD-04", name: "Horizon Plaza A", type: "Residential Tower", box: [45, 190, 140, 320], estimated_height: 62.8, confidence: 0.93, area_sq_m: 1512.0, footprint_norm: [0.088, 0.371, 0.273, 0.625], relative_depth: 0.68 },
      { id: "BLD-05", name: "Horizon Plaza B", type: "Residential Tower", box: [160, 195, 275, 305], estimated_height: 58.5, confidence: 0.91, area_sq_m: 1548.0, footprint_norm: [0.312, 0.381, 0.537, 0.596], relative_depth: 0.64 },
      { id: "BLD-06", name: "Civic Transit Pavilion", type: "Transit Terminal", box: [305, 190, 480, 320], estimated_height: 22.0, confidence: 0.89, area_sq_m: 2795.0, footprint_norm: [0.596, 0.371, 0.938, 0.625], relative_depth: 0.28 },
      { id: "BLD-07", name: "Grand Metropolis Hotel", type: "Luxury Hotel", box: [40, 350, 150, 480], estimated_height: 74.0, confidence: 0.94, area_sq_m: 1750.0, footprint_norm: [0.078, 0.684, 0.293, 0.938], relative_depth: 0.78 },
      { id: "BLD-08", name: "North Logistics Center", type: "Warehouse", box: [180, 345, 330, 475], estimated_height: 18.5, confidence: 0.88, area_sq_m: 2390.0, footprint_norm: [0.352, 0.674, 0.645, 0.928], relative_depth: 0.22 },
      { id: "BLD-09", name: "BioScience Research Lab", type: "Research Facility", box: [355, 355, 475, 475], estimated_height: 38.6, confidence: 0.90, area_sq_m: 1764.0, footprint_norm: [0.693, 0.693, 0.928, 0.928], relative_depth: 0.44 },
    ]
  },
  mountain: {
    id: "demo-mountain",
    name: "Alpine Ridge & Basin Topography",
    category: "Rugged Mountainous Elevation",
    description: "Natural terrain topography with steep ridges, alluvial basin, and high-altitude alpine peaks.",
    image: {
      id: "demo-mountain",
      filename: "mountain_aerial.jpg",
      url: "/demo/mountain_aerial.jpg",
      width: 512,
      height: 512,
      fileSizeKb: 168.0,
      format: "JPEG"
    },
    depth: {
      depthMapUrl: "/demo/mountain_depth.png",
      normalizedDepthUrl: "/demo/mountain_depth.png",
      colormapUrl: "/demo/mountain_depth.png",
      processingTime: 0.38,
      modelName: "Depth Anything V2 (Metric / Relative)",
      confidence: 0.96,
      rawStats: { min: 0.05, max: 0.98, mean: 0.48, std: 0.24 },
      isRelative: true,
      scientific_note: "Relative topographical height-field.",
      scientificNote: "Relative topographical height-field."
    },
    height: {
      min_height: 12.0,
      max_height: 348.5,
      average_height: 164.2,
      height_range: 336.5,
      unit: "meters",
      calibration_status: "Calibrated (GSD: 1.2m/px, Alt: 1800m)",
      scientific_note: "Topographic elevation calibrated to regional datum contours.",
      elevation_distribution: [
        { range: "12.0 - 45.6", count: 8200, percentage: 17.0, elevation: 28.8 },
        { range: "45.6 - 79.2", count: 9100, percentage: 18.8, elevation: 62.4 },
        { range: "79.2 - 112.8", count: 7400, percentage: 15.3, elevation: 96.0 },
        { range: "112.8 - 146.4", count: 6200, percentage: 12.8, elevation: 129.6 },
        { range: "146.4 - 180.0", count: 5400, percentage: 11.2, elevation: 163.2 },
        { range: "180.0 - 213.6", count: 4300, percentage: 8.9, elevation: 196.8 },
        { range: "213.6 - 247.2", count: 3200, percentage: 6.6, elevation: 230.4 },
        { range: "247.2 - 280.8", count: 2400, percentage: 5.0, elevation: 264.0 },
        { range: "280.8 - 314.4", count: 1400, percentage: 2.9, elevation: 297.6 },
        { range: "314.4 - 348.5", count: 700, percentage: 1.5, elevation: 331.4 },
      ]
    },
    objects: [
      { id: "GEO-01", name: "Summit Peak Alpha", type: "Mountain Summit", box: [220, 180, 290, 250], estimated_height: 348.5, confidence: 0.96, area_sq_m: 7056.0, footprint_norm: [0.43, 0.35, 0.57, 0.49], relative_depth: 0.98 },
      { id: "GEO-02", name: "Eagle Ridge Spur", type: "Ridgeline", box: [110, 240, 210, 340], estimated_height: 265.0, confidence: 0.92, area_sq_m: 14400.0, footprint_norm: [0.21, 0.47, 0.41, 0.66], relative_depth: 0.79 },
      { id: "GEO-03", name: "Alpine Valley Basin", type: "Depression / Meadow", box: [310, 320, 420, 440], estimated_height: 45.0, confidence: 0.89, area_sq_m: 18900.0, footprint_norm: [0.61, 0.63, 0.82, 0.86], relative_depth: 0.18 },
      { id: "GEO-04", name: "Northern Escarpment", type: "Cliff Face", box: [70, 70, 190, 170], estimated_height: 290.2, confidence: 0.91, area_sq_m: 17280.0, footprint_norm: [0.14, 0.14, 0.37, 0.33], relative_depth: 0.84 },
    ]
  },
  harbor: {
    id: "demo-harbor",
    name: "Maritime Terminal & Industrial Harbor",
    category: "Coastal Infrastructure & Port",
    description: "Maritime shipping berths, cylindrical fuel silos, gantry cranes, and logistics stacks with sea-level reference datum.",
    image: {
      id: "demo-harbor",
      filename: "harbor_aerial.jpg",
      url: "/demo/harbor_aerial.jpg",
      width: 512,
      height: 512,
      fileSizeKb: 156.0,
      format: "JPEG"
    },
    depth: {
      depthMapUrl: "/demo/harbor_depth.png",
      normalizedDepthUrl: "/demo/harbor_depth.png",
      colormapUrl: "/demo/harbor_depth.png",
      processingTime: 0.44,
      modelName: "Depth Anything V2 (Metric / Relative)",
      confidence: 0.93,
      rawStats: { min: 0.00, max: 0.85, mean: 0.22, std: 0.19 },
      isRelative: true,
      scientific_note: "Relative coastal elevation field with 0.0 sea level datum.",
      scientificNote: "Relative coastal elevation field with 0.0 sea level datum."
    },
    height: {
      min_height: 0.0,
      max_height: 65.0,
      average_height: 14.8,
      height_range: 65.0,
      unit: "meters",
      calibration_status: "Calibrated (GSD: 0.50m/px, Sea Level Datum: 0.0m)",
      scientific_note: "Sea level utilized as primary zero-elevation reference anchor.",
      elevation_distribution: [
        { range: "0.0 - 6.5", count: 21500, percentage: 44.5, elevation: 3.25 },
        { range: "6.5 - 13.0", count: 12200, percentage: 25.3, elevation: 9.75 },
        { range: "13.0 - 19.5", count: 6400, percentage: 13.3, elevation: 16.25 },
        { range: "19.5 - 26.0", count: 3800, percentage: 7.9, elevation: 22.75 },
        { range: "26.0 - 32.5", count: 2100, percentage: 4.4, elevation: 29.25 },
        { range: "32.5 - 39.0", count: 1200, percentage: 2.5, elevation: 35.75 },
        { range: "39.0 - 45.5", count: 600, percentage: 1.2, elevation: 42.25 },
        { range: "45.5 - 52.0", count: 320, percentage: 0.7, elevation: 48.75 },
        { range: "52.0 - 58.5", count: 150, percentage: 0.3, elevation: 55.25 },
        { range: "58.5 - 65.0", count: 60, percentage: 0.1, elevation: 61.75 },
      ]
    },
    objects: [
      { id: "MAR-01", name: "Container Ship 'Pacific Titan'", type: "Vessel", box: [60, 100, 130, 260], estimated_height: 28.5, confidence: 0.95, area_sq_m: 2800.0, footprint_norm: [0.12, 0.20, 0.25, 0.51], relative_depth: 0.35 },
      { id: "IND-01", name: "Cylindrical Fuel Silo Alpha", type: "Storage Tank", box: [170, 50, 240, 120], estimated_height: 32.0, confidence: 0.93, area_sq_m: 1225.0, footprint_norm: [0.33, 0.10, 0.47, 0.23], relative_depth: 0.45 },
      { id: "IND-02", name: "Cylindrical Fuel Silo Beta", type: "Storage Tank", box: [260, 50, 330, 120], estimated_height: 32.0, confidence: 0.94, area_sq_m: 1225.0, footprint_norm: [0.51, 0.10, 0.64, 0.23], relative_depth: 0.45 },
      { id: "IND-03", name: "Logistics Hangar 04", type: "Industrial Warehouse", box: [360, 40, 490, 160], estimated_height: 21.0, confidence: 0.91, area_sq_m: 3900.0, footprint_norm: [0.70, 0.08, 0.96, 0.31], relative_depth: 0.30 },
      { id: "IND-04", name: "Container Stacking Yard A", type: "Cargo Stack", box: [170, 160, 320, 320], estimated_height: 18.2, confidence: 0.88, area_sq_m: 6000.0, footprint_norm: [0.33, 0.31, 0.62, 0.62], relative_depth: 0.26 },
      { id: "IND-05", name: "Quay Gantry Crane North", type: "Port Crane", box: [135, 140, 165, 230], estimated_height: 65.0, confidence: 0.90, area_sq_m: 675.0, footprint_norm: [0.26, 0.27, 0.32, 0.45], relative_depth: 0.82 },
      { id: "IND-06", name: "Deepwater Dock Basin", type: "Marine Slipway", box: [0, 0, 140, 512], estimated_height: 0.0, confidence: 0.99, area_sq_m: 17920.0, footprint_norm: [0.0, 0.0, 0.27, 1.0], relative_depth: 0.02 },
    ]
  }
};
