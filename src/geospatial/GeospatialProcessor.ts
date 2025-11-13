/**
 * Geospatial Data Processing Module
 * 
 * Approach:
 * - Uses Turf.js for geometric calculations (industry standard, mobile-optimized)
 * - All calculations run on-device for offline capability
 * - Optimized for mobile performance with efficient algorithms
 * - Supports distance, area, bearing, offsets, and feature editing
 */
import * as turf from '@turf/turf';

export interface Point {
  id: string;
  codeId: string;
  coords: [number, number]; // [longitude, latitude]
  elevation?: number | null;
  ts: string;
}

export interface Line {
  id: string;
  codeId: string;
  pointIds: string[];
  closed: boolean;
  ts: string;
}

/**
 * Calculate distance between two points in meters
 */
export const calculateDistance = (
  point1: [number, number],
  point2: [number, number]
): number => {
  const from = turf.point(point1);
  const to = turf.point(point2);
  return turf.distance(from, to, { units: 'meters' });
};

/**
 * Calculate area of a polygon in square meters
 */
export const calculateArea = (coordinates: [number, number][]): number => {
  if (coordinates.length < 3) return 0;
  // Close the polygon if not already closed
  const closedCoords =
    coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
    coordinates[0][1] !== coordinates[coordinates.length - 1][1]
      ? [...coordinates, coordinates[0]]
      : coordinates;

  const polygon = turf.polygon([closedCoords]);
  return turf.area(polygon);
};

/**
 * Calculate bearing between two points in degrees
 */
export const calculateBearing = (
  point1: [number, number],
  point2: [number, number]
): number => {
  const from = turf.point(point1);
  const to = turf.point(point2);
  return turf.bearing(from, to);
};

/**
 * Calculate offset point from a reference point
 * @param point Reference point [lon, lat]
 * @param distance Distance in meters
 * @param bearing Bearing in degrees (0 = North, 90 = East)
 */
export const calculateOffset = (
  point: [number, number],
  distance: number,
  bearing: number
): [number, number] => {
  const from = turf.point(point);
  const destination = turf.destination(from, distance / 1000, bearing, {
    units: 'kilometers',
  });
  return destination.geometry.coordinates as [number, number];
};

/**
 * Calculate line length in meters
 */
export const calculateLineLength = (
  coordinates: [number, number][]
): number => {
  if (coordinates.length < 2) return 0;
  const line = turf.lineString(coordinates);
  return turf.length(line, { units: 'meters' });
};

/**
 * Edit point coordinates
 */
export const editPoint = (
  point: Point,
  newCoords: [number, number],
  newElevation?: number | null
): Point => {
  return {
    ...point,
    coords: newCoords,
    elevation: newElevation !== undefined ? newElevation : point.elevation,
  };
};

/**
 * Edit line by adding/removing points
 */
export const editLine = (
  line: Line,
  pointIds: string[],
  closed?: boolean
): Line => {
  return {
    ...line,
    pointIds,
    closed: closed !== undefined ? closed : line.closed,
  };
};

/**
 * Get bounding box for a collection of points
 */
export const getBoundingBox = (
  points: Point[]
): [[number, number], [number, number]] => {
  if (points.length === 0) {
    throw new Error('Cannot calculate bounding box for empty point set');
  }

  const coordinates = points.map((p) => p.coords);
  const featureCollection = turf.featureCollection(
    coordinates.map((coord) => turf.point(coord))
  );
  const bbox = turf.bbox(featureCollection);
  return [
    [bbox[0], bbox[1]], // Southwest
    [bbox[2], bbox[3]], // Northeast
  ];
};

/**
 * Get bounding box for lines
 */
export const getBoundingBoxForLines = (
  lines: Line[],
  points: Point[]
): [[number, number], [number, number]] => {
  const allCoords: [number, number][] = [];

  lines.forEach((line) => {
    line.pointIds.forEach((pointId) => {
      const point = points.find((p) => p.id === pointId);
      if (point) {
        allCoords.push(point.coords);
      }
    });
  });

  if (allCoords.length === 0) {
    throw new Error('Cannot calculate bounding box for empty line set');
  }

  const featureCollection = turf.featureCollection(
    allCoords.map((coord) => turf.point(coord))
  );
  const bbox = turf.bbox(featureCollection);
  return [
    [bbox[0], bbox[1]], // Southwest
    [bbox[2], bbox[3]], // Northeast
  ];
};

/**
 * Get all coordinates from points and lines for bounding box calculation
 */
export const getAllCoordinates = (
  points: Point[],
  lines: Line[]
): [number, number][] => {
  const allCoords: [number, number][] = [];

  // Add all point coordinates
  points.forEach((p) => allCoords.push(p.coords));

  // Add all line point coordinates
  lines.forEach((l) => {
    l.pointIds.forEach((pid) => {
      const pp = points.find((p) => p.id === pid);
      if (pp) allCoords.push(pp.coords);
    });
  });

  return allCoords;
};

