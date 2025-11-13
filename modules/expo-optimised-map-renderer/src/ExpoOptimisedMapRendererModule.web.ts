import { registerWebModule, NativeModule } from 'expo';

import { ExpoOptimisedMapRendererModuleEvents } from './ExpoOptimisedMapRenderer.types';

class ExpoOptimisedMapRendererModule extends NativeModule<ExpoOptimisedMapRendererModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ExpoOptimisedMapRendererModule, 'ExpoOptimisedMapRendererModule');
