import * as React from 'react';

import { ExpoOptimisedMapRendererViewProps } from './ExpoOptimisedMapRenderer.types';

export default function ExpoOptimisedMapRendererView(props: ExpoOptimisedMapRendererViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
