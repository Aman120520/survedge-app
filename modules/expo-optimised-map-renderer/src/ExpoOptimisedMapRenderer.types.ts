import type { StyleProp, ViewStyle } from 'react-native';

export type MapPoint = {
  id: string;
  latitude: number;
  longitude: number;
  // Add other properties if needed
};

export type InitialRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type ExpoOptimisedMapRendererModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

export type ChangeEventPayload = {
  value: string;
};

export type ExpoOptimisedMapRendererViewProps = {
  points: MapPoint[];
  initialRegion: InitialRegion;
  style?: StyleProp<ViewStyle>;
};
