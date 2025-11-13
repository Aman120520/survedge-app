// Reexport the native module. On web, it will be resolved to ExpoOptimisedMapRendererModule.web.ts
// and on native platforms to ExpoOptimisedMapRendererModule.ts
export { default } from './ExpoOptimisedMapRendererModule';
export { default as OptimizedMapRenderer } from './ExpoOptimisedMapRendererView';
export { default as ExpoOptimisedMapRendererView } from './ExpoOptimisedMapRendererView';
export * from './ExpoOptimisedMapRenderer.types';
export type { MapPoint, InitialRegion } from './ExpoOptimisedMapRenderer.types';
