/**
 * Viewport Culling Utilities
 * Only render features visible in the current viewport for performance
 */

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Calculate bounding box from viewport coordinates
 */
export const getViewportBounds = (
  center: [number, number],
  zoom: number,
  width: number,
  height: number
): BoundingBox => {
  // Approximate degrees per pixel at given zoom level
  const degreesPerPixel = 360 / (256 * Math.pow(2, zoom));
  
  const latRange = (height * degreesPerPixel) / 2;
  const lonRange = (width * degreesPerPixel) / 2;
  
  // Account for latitude scaling
  const latScale = Math.cos((center[1] * Math.PI) / 180);
  
  return {
    minX: center[0] - lonRange / latScale,
    maxX: center[0] + lonRange / latScale,
    minY: center[1] - latRange,
    maxY: center[1] + latRange,
  };
};

/**
 * Check if a point is within bounding box
 */
export const isPointInBounds = (
  point: [number, number],
  bounds: BoundingBox
): boolean => {
  return (
    point[0] >= bounds.minX &&
    point[0] <= bounds.maxX &&
    point[1] >= bounds.minY &&
    point[1] <= bounds.maxY
  );
};

/**
 * Check if a line intersects with bounding box
 */
export const isLineInBounds = (
  coordinates: [number, number][],
  bounds: BoundingBox
): boolean => {
  // Quick check: if any point is in bounds, render it
  for (const coord of coordinates) {
    if (isPointInBounds(coord, bounds)) {
      return true;
    }
  }
  
  // Also check if line crosses the bounds (simplified check)
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [x1, y1] = coordinates[i];
    const [x2, y2] = coordinates[i + 1];
    
    // Check if line segment intersects bounds
    if (
      (x1 < bounds.minX && x2 > bounds.maxX) ||
      (x1 > bounds.maxX && x2 < bounds.minX) ||
      (y1 < bounds.minY && y2 > bounds.maxY) ||
      (y1 > bounds.maxY && y2 < bounds.minY)
    ) {
      return true;
    }
  }
  
  return false;
};

/**
 * Filter features by viewport bounds
 */
export const filterFeaturesByViewport = <T extends { coords: [number, number] }>(
  features: T[],
  bounds: BoundingBox
): T[] => {
  return features.filter((feature) => isPointInBounds(feature.coords, bounds));
};

/**
 * Filter lines by viewport bounds
 */
export const filterLinesByViewport = <T extends { pointIds: string[] }>(
  lines: T[],
  points: Map<string, { coords: [number, number] }>,
  bounds: BoundingBox
): T[] => {
  return lines.filter((line) => {
    const lineCoords = line.pointIds
      .map((id) => points.get(id))
      .filter(Boolean)
      .map((p) => p!.coords);
    
    return isLineInBounds(lineCoords, bounds);
  });
};

