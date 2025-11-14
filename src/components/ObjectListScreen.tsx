/**
 * Object List Screen
 * Displays all geometries (points and lines) with export functionality
 */
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Point, Line, calculateLineLength, calculateArea } from '../geospatial/GeospatialProcessor';
import { Code } from '../data/DataImporterExporter';

interface DisplayFeature {
  type: 'point' | 'line';
  id: string;
  name: string;
  subtitle: string;
  timestamp: string;
  data: Point | Line;
}

interface ObjectListScreenProps {
  points: Point[];
  lines: Line[];
  codes: Code[];
  onFeaturePress: (feature: DisplayFeature) => void;
  onExport: () => void;
}

export default function ObjectListScreen({ points, lines, codes, onFeaturePress, onExport }: ObjectListScreenProps) {
  const insets = useSafeAreaInsets();
  const [searchTerm, setSearchTerm] = useState('');

  const codeMap = useMemo(() => new Map(codes.map((c) => [c.id, c.name])), [codes]);
  const pointsMap = useMemo(() => new Map(points.map((p) => [p.id, p])), [points]);

  const allFeatures = useMemo(() => {
    const combined: DisplayFeature[] = [];

    // Process Points
    points.forEach((p) => {
      const codeName = codeMap.get(p.codeId) || 'NO CODE';
      combined.push({
        type: 'point',
        id: p.id,
        name: `${p.id} ${codeName}`,
        subtitle: '',
        timestamp: p.ts,
        data: p,
      });
    });

    // Process Lines
    lines.forEach((l) => {
      const linePoints = l.pointIds.map(id => pointsMap.get(id)).filter(Boolean) as Point[];
      const coords = linePoints.map(p => p.coords);
      
      let calculation = '';
      if (coords.length >= 2) {
        if (l.closed && coords.length >= 3) {
          try {
            const area = calculateArea(coords);
            calculation = ` • ${area.toFixed(3)} m²`;
          } catch(e) {
            calculation = ' • Invalid geometry';
          }
        } else {
          const length = calculateLineLength(coords);
          calculation = ` • ${length.toFixed(3)} m`;
        }
      }

      combined.push({
        type: 'line',
        id: l.id,
        name: l.id,
        subtitle: `${linePoints.length} points${calculation}`,
        timestamp: l.ts,
        data: l,
      });
    });

    return combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [points, lines, codes, codeMap, pointsMap]);

  const filteredFeatures = useMemo(() => {
    if (!searchTerm) return allFeatures;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return allFeatures.filter(
      (f) => f.id.toLowerCase().includes(lowerCaseSearch) ||
             f.name.toLowerCase().includes(lowerCaseSearch) ||
             f.subtitle.toLowerCase().includes(lowerCaseSearch)
    );
  }, [allFeatures, searchTerm]);

  const renderFeatureItem = ({ item }: { item: DisplayFeature }) => {
    const isLine = item.type === 'line';
    const date = new Date(item.timestamp).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const time = new Date(item.timestamp).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return (
      <TouchableOpacity
        style={styles.featureItem}
        activeOpacity={0.7}
        onPress={() => onFeaturePress(item)}
      >
        <View style={styles.iconContainer}>
          {isLine ? (
            <Ionicons name="code-branch" size={20} color="#3F51B5" style={{ transform: [{ rotate: '90deg' }] }} />
          ) : (
            <View style={styles.pointIconInner}>
              <View style={styles.pointIconOuter} />
            </View>
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.featureName}>{item.name}</Text>
          <Text style={styles.featureSubtitle}>
            {isLine ? item.subtitle : `${date} • ${time}`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Objects {allFeatures.length}</Text>
        <TouchableOpacity onPress={onExport} style={styles.exportButton}>
          <Ionicons name="download-outline" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#BDBDBD" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#BDBDBD"
        />
      </View>

      <FlatList
        data={filteredFeatures}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={renderFeatureItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  exportButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 16,
    height: 40,
    color: '#111',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointIconInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointIconOuter: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#111',
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  featureSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
});

