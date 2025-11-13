import { requireNativeView } from 'expo';
import * as React from 'react';

import { ExpoOptimisedMapRendererViewProps } from './ExpoOptimisedMapRenderer.types';

const NativeView: React.ComponentType<ExpoOptimisedMapRendererViewProps> =
  requireNativeView('ExpoOptimisedMapRenderer');

export default function ExpoOptimisedMapRendererView(props: ExpoOptimisedMapRendererViewProps) {
  return <NativeView {...props} />;
}
