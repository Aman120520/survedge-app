# expo-optimised-map-renderer

Native module to optimize the rendering of 10,000+ map points efficiently on the native UI thread.

## Overview

This module provides a React Native component (`OptimizedMapRenderer`) that receives map points from JavaScript but handles the rendering entirely on the native side for maximum performance. This architecture allows you to render 10,000+ points smoothly without performance degradation.

## Installation

The module is already included in your project as a local package. To rebuild with native changes:

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

## Usage

```tsx
import { OptimizedMapRenderer, MapPoint } from 'expo-optimised-map-renderer';
import { View, StyleSheet } from 'react-native';

const points: MapPoint[] = [
  { id: '1', latitude: 34.05, longitude: -118.24 },
  { id: '2', latitude: 34.06, longitude: -118.25 },
  // ... up to 10,000+ points
];

export default function MyMapScreen() {
  return (
    <View style={styles.container}>
      <OptimizedMapRenderer
        points={points}
        initialRegion={{
          latitude: 34.09,
          longitude: -118.29,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
        style={styles.map}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
```

## API

### `OptimizedMapRenderer` Component

#### Props

- `points` (required): `MapPoint[]` - Array of point objects to render
- `initialRegion` (required): `InitialRegion` - Initial map region
- `style?`: `StyleProp<ViewStyle>` - Optional style for the map view

#### Types

```typescript
type MapPoint = {
  id: string;
  latitude: number;
  longitude: number;
};

type InitialRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
```

## Architecture

The module consists of:

1. **TypeScript Bridge** (`src/`): React component wrapper that passes props to native
2. **Android Implementation** (`android/`): Kotlin native view that receives and renders points
3. **iOS Implementation** (`ios/`): Swift native view that receives and renders points
4. **Web Fallback** (`src/ExpoOptimisedMapRendererView.web.tsx`): Simple web implementation

## Current Status

The module is currently set up with placeholder views that demonstrate the architecture. To achieve full 10,000+ point rendering performance, you'll need to integrate a native map library:

### Android
- MapLibre GL Native
- Google Maps SDK with clustering utilities
- Custom OpenGL rendering

### iOS
- MapLibre GL Native
- MapKit with annotation clustering
- Google Maps SDK
- Custom Metal/OpenGL rendering

The placeholder views currently log the received points and display a message. Replace the placeholder implementation with your chosen native map library in:
- `android/src/main/java/expo/modules/optimisedmaprenderer/ExpoOptimisedMapRendererView.kt`
- `ios/ExpoOptimisedMapRendererView.swift`

## Next Steps

1. Choose a native map library (MapLibre GL Native recommended for consistency with `@maplibre/maplibre-react-native`)
2. Integrate the library in the native view implementations
3. Implement efficient point rendering/clustering in the native code
4. Test with 10,000+ points to verify performance

## License

MIT
