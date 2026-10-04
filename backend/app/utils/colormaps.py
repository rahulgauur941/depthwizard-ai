import numpy as np

def apply_colormap(normalized_data: np.ndarray, colormap: str = "turbo") -> np.ndarray:
    """
    Applies standard color ramps (turbo, viridis, inferno, plasma, grayscale, terrain)
    to a normalized 2D numpy array [0.0, 1.0].
    Returns uint8 RGB array (H, W, 3).
    """
    clipped = np.clip(normalized_data, 0.0, 1.0)
    H, W = clipped.shape
    
    if colormap == "grayscale":
        gray = (clipped * 255).astype(np.uint8)
        return np.stack([gray, gray, gray], axis=-1)
        
    # Colormap color keys: (position, (R, G, B))
    if colormap == "viridis":
        # Purple -> Blue -> Teal -> Green -> Yellow
        anchors = [
            (0.00, (68, 1, 84)),
            (0.25, (59, 82, 139)),
            (0.50, (33, 145, 140)),
            (0.75, (94, 201, 98)),
            (1.00, (253, 231, 37)),
        ]
    elif colormap == "inferno":
        # Black -> Purple -> Red -> Orange -> Yellow
        anchors = [
            (0.00, (0, 0, 4)),
            (0.25, (87, 16, 110)),
            (0.50, (187, 55, 84)),
            (0.75, (249, 142, 9)),
            (1.00, (252, 255, 164)),
        ]
    elif colormap == "plasma":
        # Blue -> Magenta -> Red -> Yellow
        anchors = [
            (0.00, (13, 8, 135)),
            (0.25, (126, 3, 168)),
            (0.50, (204, 71, 120)),
            (0.75, (248, 149, 64)),
            (1.00, (240, 249, 33)),
        ]
    elif colormap == "terrain":
        # Deep Blue -> Light Blue -> Green -> Brown -> White
        anchors = [
            (0.00, (30, 60, 180)),
            (0.15, (60, 120, 220)),
            (0.35, (40, 140, 50)),
            (0.65, (160, 130, 70)),
            (0.85, (130, 90, 60)),
            (1.00, (245, 245, 255)),
        ]
    else:  # Default: Google Turbo colormap (Rich multi-hued continuous palette)
        anchors = [
            (0.00, (48, 18, 59)),
            (0.12, (70, 107, 227)),
            (0.25, (40, 188, 235)),
            (0.37, (44, 222, 148)),
            (0.50, (164, 252, 60)),
            (0.62, (251, 216, 36)),
            (0.75, (251, 126, 33)),
            (0.87, (216, 50, 21)),
            (1.00, (122, 4, 3)),
        ]

    # Precompute 256-entry lookup table for maximum efficiency
    lut = np.zeros((256, 3), dtype=np.uint8)
    for i in range(256):
        pos = i / 255.0
        # Find segment
        for k in range(len(anchors) - 1):
            p0, c0 = anchors[k]
            p1, c1 = anchors[k+1]
            if p0 <= pos <= p1:
                t = (pos - p0) / (p1 - p0) if p1 > p0 else 0
                r = int(c0[0] + t * (c1[0] - c0[0]))
                g = int(c0[1] + t * (c1[1] - c0[1]))
                b = int(c0[2] + t * (c1[2] - c0[2]))
                lut[i] = [r, g, b]
                break

    indices = (clipped * 255).astype(np.uint8)
    return lut[indices]
