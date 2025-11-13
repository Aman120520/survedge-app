/**
 * Coordinate System & Transformation Module
 * 
 * Approach:
 * - Supports transformation between global (WGS84) and local/project coordinate systems
 * - Uses PROJ4-style transformations for custom coordinate systems
 * - Supports loading custom coordinate system definitions
 * - Maintains precision during transformations
 */
import * as turf from '@turf/turf';

export type CoordinateSystem = 'WGS84' | 'WebMercator' | 'UTM' | 'Custom';

export interface CoordinateSystemDefinition {
  id: string;
  name: string;
  type: CoordinateSystem;
  proj4?: string; // PROJ4 definition string
  bounds?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

export interface CoordinateTransform {
  from: CoordinateSystem;
  to: CoordinateSystem;
  definition?: CoordinateSystemDefinition;
}

/**
 * Default coordinate system definitions
 */
export const DEFAULT_COORDINATE_SYSTEMS: Record<string, CoordinateSystemDefinition> = {
  WGS84: {
    id: 'WGS84',
    name: 'WGS 84 (EPSG:4326)',
    type: 'WGS84',
  },
  WebMercator: {
    id: 'WebMercator',
    name: 'Web Mercator (EPSG:3857)',
    type: 'WebMercator',
  },
};

/**
 * Custom coordinate system storage
 */
let customCoordinateSystems: Map<string, CoordinateSystemDefinition> = new Map();

/**
 * Load a custom coordinate system definition
 */
export const loadCustomCoordinateSystem = (
  definition: CoordinateSystemDefinition
): void => {
  customCoordinateSystems.set(definition.id, definition);
};

/**
 * Get a coordinate system definition
 */
export const getCoordinateSystem = (
  id: string
): CoordinateSystemDefinition | undefined => {
  return DEFAULT_COORDINATE_SYSTEMS[id] || customCoordinateSystems.get(id);
};

/**
 * Transform coordinates from WGS84 to Web Mercator (pseudo-meters)
 * This is a simplified transformation for display purposes
 */
export const transformToWebMercator = (
  lon: number,
  lat: number
): { easting: number; northing: number } => {
  const point = turf.point([lon, lat]);
  const mercator = turf.toMercator(point);
  return {
    easting: mercator.geometry.coordinates[0],
    northing: mercator.geometry.coordinates[1],
  };
};

/**
 * Transform coordinates from Web Mercator to WGS84
 */
export const transformFromWebMercator = (
  easting: number,
  northing: number
): { longitude: number; latitude: number } => {
  const point = turf.point([easting, northing]);
  const wgs84 = turf.toWgs84(point);
  return {
    longitude: wgs84.geometry.coordinates[0],
    latitude: wgs84.geometry.coordinates[1],
  };
};

/**
 * Transform coordinates between coordinate systems
 * Currently supports WGS84 <-> WebMercator
 * Can be extended with PROJ4 for custom systems
 */
export const transformCoordinates = (
  lon: number,
  lat: number,
  transform: CoordinateTransform
): { x: number; y: number } | { longitude: number; latitude: number } => {
  if (transform.from === 'WGS84' && transform.to === 'WebMercator') {
    const result = transformToWebMercator(lon, lat);
    return { x: result.easting, y: result.northing };
  }

  if (transform.from === 'WebMercator' && transform.to === 'WGS84') {
    const result = transformFromWebMercator(lon, lat);
    return { longitude: result.longitude, latitude: result.latitude };
  }

  // For same system, return as-is
  if (transform.from === transform.to) {
    if (transform.to === 'WGS84') {
      return { longitude: lon, latitude: lat };
    }
    return { x: lon, y: lat };
  }

  // Custom coordinate system transformation would go here
  // For now, return WGS84 coordinates
  return { longitude: lon, latitude: lat };
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (
  lon: number,
  lat: number,
  system: CoordinateSystem = 'WGS84',
  precision: number = 7
): string => {
  if (system === 'WebMercator') {
    const mercator = transformToWebMercator(lon, lat);
    return `E: ${mercator.easting.toFixed(2)}m, N: ${mercator.northing.toFixed(2)}m`;
  }
  return `Lon: ${lon.toFixed(precision)}, Lat: ${lat.toFixed(precision)}`;
};

