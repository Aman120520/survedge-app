/**
 * Map SDK / Mapping Engine Module
 * 
 * Approach Justification:
 * - MapLibre GL: Open-source, high-performance vector map rendering
 * - Offline capability: Supports offline tile caching and custom style sources
 * - High precision: Native coordinate rendering with sub-meter accuracy
 * - Custom layer drawing: Full support for custom GeoJSON layers and annotations
 * - Smooth rendering: Hardware-accelerated rendering for survey features
 * - External device support: Real-time position updates from GNSS devices
 */
import React, { useRef, RefObject } from 'react';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { suppressMapLibreWarnings } from '../utils/performance';

export interface MapEngineRef {
  getZoom: () => Promise<number | undefined>;
  getCenter: () => Promise<[number, number] | undefined>;
  setCamera: (config: {
    centerCoordinate?: [number, number];
    zoomLevel?: number;
    animationDuration?: number;
  }) => void;
  fitBounds: (
    southwest: [number, number],
    northeast: [number, number],
    padding?: number,
    duration?: number
  ) => void;
}

export const initializeMapEngine = () => {
  // Set access token to null for MapLibre (open source)
  MapLibreGL.setAccessToken(null);
  
  // Suppress noisy warnings about canceled requests (normal during pan/zoom)
  suppressMapLibreWarnings();
};

export const useMapEngine = () => {
  const mapRef = useRef<MapLibreGL.MapView>(null);
  const cameraRef = useRef<MapLibreGL.Camera>(null);

  const getZoom = async (): Promise<number | undefined> => {
    try {
      return await mapRef.current?.getZoom();
    } catch (error) {
      console.error('Error getting zoom:', error);
      return undefined;
    }
  };

  const getCenter = async (): Promise<[number, number] | undefined> => {
    try {
      return await mapRef.current?.getCenter();
    } catch (error) {
      console.error('Error getting center:', error);
      return undefined;
    }
  };

  const setCamera = (config: {
    centerCoordinate?: [number, number];
    zoomLevel?: number;
    animationDuration?: number;
  }) => {
    // Use smooth animation for better UX (default 300ms if not specified)
    const smoothConfig = {
      ...config,
      animationDuration: config.animationDuration ?? 300,
    };
    cameraRef.current?.setCamera(smoothConfig);
  };

  const fitBounds = (
    southwest: [number, number],
    northeast: [number, number],
    padding: number = 50,
    duration: number = 1000
  ) => {
    cameraRef.current?.fitBounds(southwest, northeast, padding, duration);
  };

  return {
    mapRef,
    cameraRef,
    getZoom,
    getCenter,
    setCamera,
    fitBounds,
  };
};

// MapLibreGL is exported from the main package

