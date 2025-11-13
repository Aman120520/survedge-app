import { NativeModule, requireNativeModule } from 'expo';

import { ExpoOptimisedMapRendererModuleEvents } from './ExpoOptimisedMapRenderer.types';

declare class ExpoOptimisedMapRendererModule extends NativeModule<ExpoOptimisedMapRendererModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoOptimisedMapRendererModule>('ExpoOptimisedMapRenderer');
