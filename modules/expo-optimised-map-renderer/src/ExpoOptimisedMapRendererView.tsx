import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoOptimisedMapRendererViewProps } from './ExpoOptimisedMapRenderer.types';

const NativeView: React.ComponentType<ExpoOptimisedMapRendererViewProps> =
  requireNativeView('ExpoOptimisedMapRenderer');

/**
 * React Native Component that renders points on the native side.
 * This component passes the points to the native side, where the rendering
 * is handled efficiently, achieving better performance than purely JS-based rendering.
 * 
 * @param props - points: Array of MapPoint objects, initialRegion: Initial map region
 */
export default function ExpoOptimisedMapRendererView(props: ExpoOptimisedMapRendererViewProps) {
  return <NativeView {...props} />;
}
