import { OptimizedMapRenderer, MapPoint } from 'expo-optimised-map-renderer';
import { SafeAreaView, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useState } from 'react';

// Helper function to generate mock points
const generateMockPoints = (count: number): MapPoint[] => {
  const points: MapPoint[] = [];
  const baseLat = 34.05;
  const baseLon = -118.24;
  for (let i = 0; i < count; i++) {
    points.push({
      id: `p${i}`,
      latitude: baseLat + Math.random() * 0.1,
      longitude: baseLon + Math.random() * 0.1,
    });
  }
  return points;
};

export default function App() {
  const [points] = useState(() => generateMockPoints(10000));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Optimized Map Renderer Example</Text>
        <Group name="Map View">
          <Text style={styles.info}>
            Rendering {points.length.toLocaleString()} points natively
          </Text>
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
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 30,
    margin: 20,
    fontWeight: 'bold',
  },
  groupHeader: {
    fontSize: 20,
    marginBottom: 20,
    fontWeight: '600',
  },
  group: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#eee',
  },
  map: {
    flex: 1,
    height: 400,
    marginTop: 10,
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
});
