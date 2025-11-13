/**
 * Native Renderer Utilities
 * 
 * Utilities for converting between app data structures and native module formats
 */
import { Point } from '../geospatial/GeospatialProcessor';
import { MapPoint, InitialRegion } from 'expo-optimised-map-renderer';

/**
 * Convert Point[] (app format) to MapPoint[] (native module format)
 * 
 * @param points Array of Point objects with coords as [longitude, latitude]
 * @returns Array of MapPoint objects with latitude and longitude as separate properties
 */
export const convertPointsToNativeFormat = (points: Point[]): MapPoint[] => {
  return points.map((point) => ({
    id: point.id,
    latitude: point.coords[1], // coords is [longitude, latitude]
    longitude: point.coords[0],
  }));
};

/**
 * Calculate initial region from points
 * 
 * @param points Array of points
 * @param defaultLat Default latitude if no points
 * @param defaultLon Default longitude if no points
 * @returns InitialRegion for the native map renderer
 */
export const calculateInitialRegion = (
  points: Point[],
  defaultLat: number = 34.05,
  defaultLon: number = -118.24
): InitialRegion => {
  if (points.length === 0) {
    return {
      latitude: defaultLat,
      longitude: defaultLon,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  }

  // Calculate bounding box
  const lats = points.map((p) => p.coords[1]);
  const lons = points.map((p) => p.coords[0]);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;
  const latDelta = Math.max(maxLat - minLat, 0.01) * 1.2; // Add 20% padding
  const lonDelta = Math.max(maxLon - minLon, 0.01) * 1.2;

  return {
    latitude: centerLat,
    longitude: centerLon,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
};

/**
 * Calculate initial region from current map center and zoom
 * 
 * @param center Current map center [longitude, latitude]
 * @param zoomLevel Current zoom level
 * @returns InitialRegion for the native map renderer
 */
export const calculateRegionFromCenterAndZoom = (
  center: [number, number] | undefined,
  zoomLevel: number
): InitialRegion => {
  if (!center) {
    return {
      latitude: 34.05,
      longitude: -118.24,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  }

  // Approximate delta based on zoom level
  // Higher zoom = smaller delta
  const baseDelta = 180 / Math.pow(2, zoomLevel);
  const latDelta = baseDelta * 0.8;
  const lonDelta = baseDelta * 0.8;

  return {
    latitude: center[1],
    longitude: center[0],
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
};

