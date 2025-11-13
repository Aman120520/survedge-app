import * as React from 'react';

import { ExpoOptimisedMapRendererViewProps } from './ExpoOptimisedMapRenderer.types';

/**
 * Web implementation of OptimizedMapRenderer.
 * On web, this falls back to a simple display since native map rendering
 * is not available. For production web apps, consider using a web-based
 * map library like MapLibre GL JS or Leaflet.
 */
export default function ExpoOptimisedMapRendererView(props: ExpoOptimisedMapRendererViewProps) {
  const { points, initialRegion, style } = props;
  
  return (
    <div style={{ ...style, padding: '16px', backgroundColor: '#f0f0f0' }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        Optimized Map Renderer (Web)
      </div>
      <div style={{ marginBottom: '4px' }}>
        Points: {points.length}
      </div>
      <div style={{ marginBottom: '4px' }}>
        Region: {initialRegion.latitude.toFixed(4)}, {initialRegion.longitude.toFixed(4)}
      </div>
      <div style={{ fontSize: '12px', color: '#666' }}>
        Note: Native map rendering is not available on web.
        Consider using MapLibre GL JS or Leaflet for web map rendering.
      </div>
    </div>
  );
}
