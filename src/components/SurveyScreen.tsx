/**
 * Survey Screen Component
 * Main mapping interface with all survey features
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useMapEngine, initializeMapEngine } from '../map/MapEngine';
import MapLibreGL from '@maplibre/maplibre-react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useGnss } from '../context/GnssContext';
import { useStakeout } from '../context/StakeoutContext';
import {
  Point,
  Line,
  getAllCoordinates,
  calculateLineLength,
} from '../geospatial/GeospatialProcessor';
import {
  exportToJSON,
  exportToGeoJSON,
  exportToCSV,
  importFromJSON,
  importFromGeoJSON,
  importFromCSV,
  Code,
  SurveyData,
} from '../data/DataImporterExporter';
import { transformToWebMercator } from '../coordinate/CoordinateTransformer';
import * as turf from '@turf/turf';
import { throttle } from '../utils/performance';
import { clusterPoints, getClusterRadius } from '../utils/clustering';
import { processBatch } from '../utils/batchProcessor';
import { useWindowDimensions } from 'react-native';
import StakeoutBottomSheet from './StakeoutBottomSheet';
import StakeoutCircularView from './StakeoutCircularView';
import { MAP_CONFIG } from '../config/mapConfig';

const mapStyle = require('../assets/style.json');

// Initialize map engine
initializeMapEngine();

export default function SurveyScreen() {
  const { gnssStatus } = useGnss();
  const { mapRef, cameraRef, getZoom, getCenter, setCamera, fitBounds } =
    useMapEngine();

  const addSheetRef = useRef<BottomSheet>(null);
  const codeSheetRef = useRef<BottomSheet>(null);
  const detailSheetRef = useRef<BottomSheet>(null);
  const randomSheetRef = useRef<BottomSheet>(null);
  const stakeoutSheetRef = useRef<BottomSheet>(null);

  const [useExternalGnss, setUseExternalGnss] = useState(false);
  const [internalLocation, setInternalLocation] =
    useState<Location.LocationObject['coords'] | null>(null);
  const [zoomLevel, setZoomLevel] = useState(MAP_CONFIG.DEFAULT_ZOOM_LEVEL);
  const zoomLockRef = useRef(false);

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    altitude?: number;
  } | null>(null);
  const [codes, setCodes] = useState<Code[]>([
    { id: 'NO-CODE', name: 'NO CODE', type: 'point' },
  ]);
  const [selectedCodeId, setSelectedCodeId] = useState('NO-CODE');
  const [formPointId, setFormPointId] = useState('');
  const [points, setPoints] = useState<Point[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [activeLinePoints, setActiveLinePoints] = useState<string[]>([]);
  const [closeOnEnd, setCloseOnEnd] = useState(false);
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeType, setNewCodeType] = useState<'point' | 'line'>('point');
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [heading, setHeading] = useState(0);
  const { startStakeout, stopStakeout, updateGuidance, isActive: isStakeoutActive, target: stakeoutTarget } = useStakeout();
  const [randPointsCount, setRandPointsCount] = useState('10');
  const [randLinesCount, setRandLinesCount] = useState('5');
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  
  const { width, height } = useWindowDimensions();
  
  // Use Map for O(1) point lookups instead of O(n) array.find()
  const pointsMap = useMemo(() => {
    const map = new Map<string, Point>();
    points.forEach((p) => map.set(p.id, p));
    return map;
  }, [points]);

  // Request location permissions and watch position
  useEffect(() => {
    let watcher: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: MAP_CONFIG.LOCATION_UPDATE_INTERVAL,
          },
          (loc) => setInternalLocation(loc.coords)
        );
      }
    })();
    return () => watcher && watcher.remove();
  }, []);

  // Choose between internal and external GNSS source
  useEffect(() => {
    if (useExternalGnss && gnssStatus?.lat && gnssStatus?.lon) {
      setLocation({
        latitude: gnssStatus.lat,
        longitude: gnssStatus.lon,
        altitude: gnssStatus.alt || 0,
      });
    } else if (internalLocation) {
      setLocation({
        latitude: internalLocation.latitude,
        longitude: internalLocation.longitude,
        altitude: internalLocation.altitude,
      });
    }
  }, [useExternalGnss, gnssStatus, internalLocation]);

  // Update heading from location
  useEffect(() => {
    if (internalLocation?.heading !== undefined) {
      setHeading(internalLocation.heading);
    }
  }, [internalLocation]);

  // Throttled camera update function for smooth performance
  // Animation duration controlled by MAP_CONFIG (disabled during testing)
  const updateCameraPosition = React.useMemo(
    () =>
      throttle((lon: number, lat: number, zoom: number) => {
        if (cameraRef.current) {
          setCamera({
            centerCoordinate: [lon, lat],
            zoomLevel: zoom,
            // animationDuration handled by mapConfig.ts
          });
        }
      }, MAP_CONFIG.CAMERA_UPDATE_THROTTLE_MS),
    []
  );

  // Move map when active GNSS updates (throttled for smooth performance)
  useEffect(() => {
    if (!location) return;
    updateCameraPosition(location.longitude, location.latitude, zoomLevel);
    
    // Update stakeout guidance when location changes
    if (isStakeoutActive && location) {
      updateGuidance({
        lat: location.latitude,
        lon: location.longitude,
        alt: location.altitude,
      });
    }
  }, [location, zoomLevel, updateCameraPosition, isStakeoutActive, updateGuidance]);

  // Toggle GNSS source
  const toggleGnssSource = () => {
    setUseExternalGnss((prev) => !prev);
    Alert.alert(
      'GNSS Source Changed',
      `Now using ${!useExternalGnss ? 'External Bluetooth GNSS' : 'Internal GPS'}`
    );
  };

  // Helper functions
  const nextPointId = () => `P${points.length + 1}`;
  const nextLineId = () => `L${lines.length + 1}`;

  const createPointAtCurrentLocation = (
    givenId?: string,
    codeId?: string
  ): Point | null => {
    if (!location) {
      Alert.alert('No GPS', 'Waiting for GPS fix...');
      return null;
    }
    const id = givenId || nextPointId();
    const p: Point = {
      id,
      codeId: codeId || 'NO-CODE',
      coords: [location.longitude, location.latitude],
      elevation: location.altitude ?? null,
      ts: new Date().toISOString(),
    };
    setPoints((prev) => [...prev, p]);
    return p;
  };

  // Capture Logic
  const onSavePoint = () => {
    const code = codes.find((c) => c.id === selectedCodeId) || {
      id: 'NO-CODE',
    };
    const id = formPointId.trim() || nextPointId();
    if (points.some((p) => p.id === id)) {
      Alert.alert('Duplicate ID', 'A point with this ID already exists.');
      return;
    }
    const created = createPointAtCurrentLocation(id, code.id);
    if (created) {
      addSheetRef.current?.close();
      setFormPointId('');
    }
  };

  const onStartLine = () => {
    const code = codes.find((c) => c.id === selectedCodeId);
    if (!code || code.type !== 'line') {
      Alert.alert('Line code required', 'Select or create a line-type code first.');
      return;
    }
    const first = createPointAtCurrentLocation(
      formPointId.trim() || nextPointId(),
      'NO-CODE'
    );
    if (first) {
      setActiveLinePoints([first.id]);
      setIsRecording(true);
    }
  };

  const onSavePointOnLine = () => {
    if (!isRecording) return Alert.alert('Not recording', 'Start a line first.');
    const p = createPointAtCurrentLocation(nextPointId(), 'NO-CODE');
    if (p) setActiveLinePoints((arr) => [...arr, p.id]);
  };

  const onEndLine = () => {
    if (!isRecording) return;
    if (activeLinePoints.length < 2) {
      Alert.alert('Too few points', 'A line needs at least two points.');
      setIsRecording(false);
      setActiveLinePoints([]);
      return;
    }
    const code = codes.find((c) => c.id === selectedCodeId) || {
      id: 'NO-CODE',
    };
    const ln: Line = {
      id: nextLineId(),
      codeId: code.id,
      pointIds: [...activeLinePoints],
      closed: !!closeOnEnd && activeLinePoints.length >= 3,
      ts: new Date().toISOString(),
    };
    setLines((prev) => [...prev, ln]);
    setPoints((prev) =>
      prev.map((p) =>
        activeLinePoints.includes(p.id) ? { ...p, codeId: code.id } : p
      )
    );
    setIsRecording(false);
    setActiveLinePoints([]);
    setCloseOnEnd(false);
    addSheetRef.current?.close();
    setFormPointId('');
  };

  // Codes
  const addCode = () => {
    const name = newCodeName.trim();
    if (!name) return Alert.alert('Enter code name');
    if (codes.some((c) => c.name.toLowerCase() === name.toLowerCase()))
      return Alert.alert('Duplicate code');
    const id = `C-${Date.now()}`;
    setCodes((prev) => [...prev, { id, name, type: newCodeType }]);
    setNewCodeName('');
  };

  const onSelectCode = (c: Code) => {
    setSelectedCodeId(c.id);
    codeSheetRef.current?.close();
  };

  // Optimized GeoJSON generation with clustering and efficient lookups
  const pointsGeoJSON = useMemo(() => {
    // For large datasets, use clustering when zoomed out
    if (points.length > 1000 && zoomLevel <= 15) {
      const clusterRadius = getClusterRadius(zoomLevel);
      const clusterData = clusterPoints(
        points.map((p) => ({
          id: p.id,
          coords: p.coords,
          properties: {
            id: p.id,
            code: (codes.find((c) => c.id === p.codeId) || {}).name,
          },
        })),
        zoomLevel,
        clusterRadius
      );

      const features: any[] = [];

      // Add clusters
      clusterData.clusters.forEach((cluster) => {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: cluster.coords },
          properties: {
            id: `cluster-${cluster.coords.join('-')}`,
            code: `${cluster.count} points`,
            cluster: true,
            count: cluster.count,
            pointIds: cluster.pointIds,
          },
        });
      });

      // Add unclustered points
      clusterData.unclustered.forEach((p) => {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: p.coords },
          properties: p.properties,
        });
      });

      return { type: 'FeatureCollection', features };
    }

    // For smaller datasets or high zoom, render all points
    return {
      type: 'FeatureCollection',
      features: points.map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: p.coords },
        properties: {
          id: p.id,
          code: (codes.find((c) => c.id === p.codeId) || {}).name,
        },
      })),
    };
  }, [points, codes, zoomLevel]);

  // Optimized lines GeoJSON with efficient point lookups
  const linesGeoJSON = useMemo(() => {
    const codeMap = new Map(codes.map((c) => [c.id, c.name]));
    
    return {
      type: 'FeatureCollection',
      features: lines.map((l) => {
        // Use Map for O(1) lookup instead of array.find()
        const coords = l.pointIds
          .map((pid) => pointsMap.get(pid))
          .filter(Boolean)
          .map((pp) => pp!.coords);
        const finalCoords =
          l.closed && coords.length >= 3 ? [...coords, coords[0]] : coords;
        return {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: finalCoords },
          properties: {
            id: l.id,
            code: codeMap.get(l.codeId) || 'NO CODE',
          },
        };
      }),
    };
  }, [lines, pointsMap, codes]);

  // On feature press
  const onFeaturePress = (e: any) => {
    const feature = e.features?.[0];
    if (!feature) return;

    let fullFeature = feature;

    if (feature.geometry.type === 'LineString') {
      const line = lines.find((l) => l.id === feature.properties.id);
      if (line) {
        // Use Map for O(1) lookup
        const coords = line.pointIds
          .map((pid) => pointsMap.get(pid))
          .filter(Boolean)
          .map((pp) => pp!.coords);
        const finalCoords =
          line.closed && coords.length >= 3 ? [...coords, coords[0]] : coords;
        fullFeature = {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: finalCoords },
          properties: feature.properties,
        };
      }
    } else if (feature.geometry.type === 'Point') {
      // Handle cluster clicks
      if (feature.properties.cluster) {
        // Zoom into cluster
        const clusterCoords = feature.geometry.coordinates as [number, number];
        setCamera({
          centerCoordinate: clusterCoords,
          zoomLevel: Math.min(zoomLevel + 2, MAP_CONFIG.MAX_ZOOM_LEVEL),
          // animationDuration handled by mapConfig.ts
        });
        return;
      }
      
      // Use Map for O(1) lookup
      const point = pointsMap.get(feature.properties.id);
      if (point) {
        fullFeature = {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: point.coords },
          properties: feature.properties,
        };
      }
    }

    setSelectedFeature(fullFeature);
    detailSheetRef.current?.expand();
  };

  // Highlight GeoJSON
  const highlightGeoJSON = useMemo(() => {
    if (!selectedFeature) return null;
    return {
      type: 'FeatureCollection',
      features: [selectedFeature],
    };
  }, [selectedFeature]);

  const zoomIn = async () => {
    zoomLockRef.current = true;
    const z = (await getZoom()) ?? zoomLevel;
    const center = await getCenter();
    if (!center) return;
    const newZoom = Math.min((z ?? MAP_CONFIG.DEFAULT_ZOOM_LEVEL) + 1, MAP_CONFIG.MAX_ZOOM_LEVEL);
    setZoomLevel(newZoom);
    setCamera({ 
      zoomLevel: newZoom, 
      centerCoordinate: center,
      // animationDuration handled by mapConfig.ts (disabled during testing)
    });
    setTimeout(() => (zoomLockRef.current = false), 300);
  };

  const zoomOut = async () => {
    zoomLockRef.current = true;
    const z = (await getZoom()) ?? zoomLevel;
    const center = await getCenter();
    if (!center) return;
    const newZoom = Math.max((z ?? MAP_CONFIG.DEFAULT_ZOOM_LEVEL) - 1, MAP_CONFIG.MIN_ZOOM_LEVEL);
    setZoomLevel(newZoom);
    setCamera({ 
      zoomLevel: newZoom, 
      centerCoordinate: center,
      // animationDuration handled by mapConfig.ts (disabled during testing)
    });
    setTimeout(() => (zoomLockRef.current = false), 300);
  };

  const headingArrowGeoJSON = useMemo(() => {
    if (!location) return null;
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude],
          },
          properties: { rotation: heading },
        },
      ],
    };
  }, [location, heading]);

  // Stakeout line GeoJSON (dashed line from rover to target)
  const stakeoutLineGeoJSON = useMemo(() => {
    if (!isStakeoutActive || !location || !stakeoutTarget) return null;

    let targetCoords: [number, number] | null = null;

    if (stakeoutTarget.type === 'point' && stakeoutTarget.coordinates) {
      targetCoords = stakeoutTarget.coordinates;
    } else if (stakeoutTarget.type === 'line' && stakeoutTarget.lineCoordinates && stakeoutTarget.lineCoordinates.length > 0) {
      // For line stakeout, find closest point on line
      const roverPoint = turf.point([location.longitude, location.latitude]);
      let minDistance = Infinity;
      let closestPoint: [number, number] | null = null;

      for (let i = 0; i < stakeoutTarget.lineCoordinates.length - 1; i++) {
        const segment = turf.lineString([
          stakeoutTarget.lineCoordinates[i],
          stakeoutTarget.lineCoordinates[i + 1],
        ]);
        const nearestPoint = turf.nearestPointOnLine(segment, roverPoint);
        const dist = turf.distance(roverPoint, nearestPoint, { units: 'meters' });
        if (dist < minDistance) {
          minDistance = dist;
          closestPoint = nearestPoint.geometry.coordinates as [number, number];
        }
      }
      targetCoords = closestPoint;
    }

    if (!targetCoords) return null;

    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [location.longitude, location.latitude],
              targetCoords,
            ],
          },
          properties: {},
        },
      ],
    };
  }, [isStakeoutActive, location, stakeoutTarget]);

  const focusAll = async () => {
    try {
      const allCoords = getAllCoordinates(points, lines);
      if (location) allCoords.push([location.longitude, location.latitude]);

      if (allCoords.length === 0) {
        Alert.alert('No features', 'No points, lines, or location to focus on.');
        return;
      }

      const bbox = turf.bbox({
        type: 'FeatureCollection',
        features: allCoords.map((c) => turf.point(c)),
      });

      const [minX, minY, maxX, maxY] = bbox;
      // fitBounds duration handled by mapConfig.ts (disabled during testing)
      fitBounds([minX, minY], [maxX, maxY], 50);

      // Small delay to ensure bounds are set (only needed if animations enabled)
      if (MAP_CONFIG.ENABLE_ANIMATIONS) {
        await new Promise((resolve) => setTimeout(resolve, 850));
        setCamera({ animationDuration: 0 });
      }
    } catch (e) {
      console.error('FocusAll error:', e);
    }
  };

  // Random data generation
  const randomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 4 + Math.floor(Math.random() * 2) })
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join('');
  };

  const generateRandomData = () => {
    try {
      const numPoints = parseInt(randPointsCount) || 0;
      const numLines = parseInt(randLinesCount) || 0;
      if (!location) {
        Alert.alert('No GPS', 'Need current location to generate nearby points.');
        return;
      }

      const { latitude, longitude } = location;
      const spacing = 0.00007; // ~7 meters per step
      const cols = Math.ceil(Math.sqrt(numPoints));
      const rows = Math.ceil(numPoints / cols);
      const newPoints: Point[] = [];
      let count = 0;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols && count < numPoints; c++) {
          const lat = latitude + r * spacing;
          const lon = longitude + c * spacing;
          newPoints.push({
            id: `R${count + 1}`,
            codeId: 'NO-CODE',
            coords: [lon, lat],
            elevation: 0,
            ts: new Date().toISOString(),
          });
          count++;
        }
      }

      const newLines: Line[] = [];
      const availablePoints = [...newPoints];

      for (let i = 0; i < numLines; i++) {
        if (availablePoints.length < 2) break;

        const vertexCount = Math.min(
          2 + Math.floor(Math.random() * 4),
          availablePoints.length
        );

        const linePoints: Point[] = [];
        for (let j = 0; j < vertexCount; j++) {
          const idx = Math.floor(Math.random() * availablePoints.length);
          const [pt] = availablePoints.splice(idx, 1);
          linePoints.push(pt);
        }

        const codeId = `C-${randomCode()}`;
        setCodes((prev) => [
          ...prev,
          { id: codeId, name: randomCode(), type: 'line' },
        ]);

        newLines.push({
          id: `L${i + 1}`,
          codeId,
          pointIds: linePoints.map((p) => p.id),
          closed: false,
          ts: new Date().toISOString(),
        });
      }

      setPoints((prev) => [...prev, ...newPoints]);
      setLines((prev) => [...prev, ...newLines]);

      randomSheetRef.current?.close();
      Alert.alert(
        'Random Data',
        `${newPoints.length} points and ${newLines.length} lines generated!`
      );
    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.message);
    }
  };

  // Export functions
  const exportData = async (format: 'JSON' | 'GeoJSON' | 'CSV' = 'JSON') => {
    try {
      const data: SurveyData = { points, lines, codes };
      let fileUri: string;

      switch (format) {
        case 'JSON':
          fileUri = await exportToJSON(data);
          break;
        case 'GeoJSON':
          fileUri = await exportToGeoJSON(data);
          break;
        case 'CSV':
          fileUri = await exportToCSV(data);
          break;
        default:
          fileUri = await exportToJSON(data);
      }

      // Note: If using sharing fallback, the share dialog will open automatically
      // Only show alert if StorageAccessFramework was used (Android) or on iOS
      Alert.alert('Exported', `File exported successfully as ${format}!`);
    } catch (e: any) {
      Alert.alert('Export Failed', e.message);
    }
  };

  // Import functions with progress tracking for large datasets
  const importData = async (format: 'JSON' | 'GeoJSON' | 'CSV' = 'JSON') => {
    try {
      setIsLoading(true);
      setImportProgress(0);
      
      let data: SurveyData;

      switch (format) {
        case 'JSON':
          data = await importFromJSON();
          break;
        case 'GeoJSON':
          data = await importFromGeoJSON();
          break;
        case 'CSV':
          data = await importFromCSV();
          break;
        default:
          data = await importFromJSON();
      }

      const totalFeatures = (data.points?.length || 0) + (data.lines?.length || 0);
      
      // For large datasets (>5000 features), process in batches
      if (totalFeatures > 5000) {
        setImportProgress(50);
        
        // Process points in batches
        if (data.points && data.points.length > 0) {
          await processBatch(
            data.points,
            (point) => point,
            1000,
            (processed, total) => {
              setImportProgress(50 + (processed / total) * 25);
            }
          );
        }
        
        setImportProgress(75);
        
        // Process lines in batches
        if (data.lines && data.lines.length > 0) {
          await processBatch(
            data.lines,
            (line) => line,
            1000,
            (processed, total) => {
              setImportProgress(75 + (processed / total) * 25);
            }
          );
        }
      }

      setImportProgress(100);
      
      setPoints(data.points || []);
      setLines(data.lines || []);
      setCodes(
        data.codes || [{ id: 'NO-CODE', name: 'NO CODE', type: 'point' }]
      );

      setIsLoading(false);
      setImportProgress(0);
      
      Alert.alert(
        'Import Successful',
        `Imported ${data.points?.length || 0} points and ${data.lines?.length || 0} lines!`
      );
    } catch (e: any) {
      console.error(e);
      setIsLoading(false);
      setImportProgress(0);
      Alert.alert('Import Failed', e.message);
    }
  };

  // Request file permissions on Android (if StorageAccessFramework is available)
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
        try {
          const { status } =
            await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (status !== 'granted') {
            // Permission not granted, but don't show alert on mount
            console.log('File access permission not granted');
          }
        } catch (error) {
          // StorageAccessFramework not available or error occurred
          console.log('StorageAccessFramework not available:', error);
        }
      }
    })();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <View style={styles.gnssBar}>
          <Ionicons
            name={gnssStatus.connected ? 'radio' : 'radio-outline'}
            size={18}
            color={gnssStatus.connected ? '#4CAF50' : '#d32f2f'}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.gnssText}>
            {gnssStatus.fixType || 'No Fix'} | {gnssStatus.satellites || 0} Sat
          </Text>
        </View>

        {/* Loading indicator for large imports */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <Text style={styles.loadingText}>Importing data...</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${importProgress}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(importProgress)}%
              </Text>
            </View>
          </View>
        )}

        <MapLibreGL.MapView
          ref={mapRef}
          style={{ flex: 1 }}
          mapStyle={mapStyle}
          attributionEnabled={false}
          logoEnabled={false}
          pitchEnabled={false}
          rotateEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
          onRegionDidChange={async () => {
            try {
              const z = await getZoom();
              if (typeof z === 'number' && !zoomLockRef.current) {
                setZoomLevel(z);
              }
            } catch {}
          }}
          onRegionWillChange={() => {
            // Suppress warnings during region changes
          }}
        >
          <MapLibreGL.Camera
            ref={cameraRef}
            defaultZoomLevel={MAP_CONFIG.DEFAULT_ZOOM_LEVEL}
            maxZoomLevel={MAP_CONFIG.MAX_ZOOM_LEVEL}
            minZoomLevel={MAP_CONFIG.MIN_ZOOM_LEVEL}
            animationMode={MAP_CONFIG.ENABLE_ANIMATIONS ? "easeTo" : "none"}
            animationDuration={MAP_CONFIG.ENABLE_ANIMATIONS ? MAP_CONFIG.DEFAULT_ANIMATION_DURATION : 0}
            followUserLocation={MAP_CONFIG.FOLLOW_USER_LOCATION}
            zoomLevel={zoomLevel}
          />

          <MapLibreGL.ShapeSource
            id="lns"
            shape={linesGeoJSON}
            onPress={onFeaturePress}
            cluster={false}
            clusterRadius={50}
          >
            <MapLibreGL.LineLayer
              id="ln-layer"
              style={{ 
                lineColor: '#000', 
                lineWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </MapLibreGL.ShapeSource>

          <MapLibreGL.ShapeSource
            id="pts"
            shape={pointsGeoJSON}
            onPress={onFeaturePress}
            cluster={false}
            clusterRadius={50}
          >
            <MapLibreGL.CircleLayer
              id="pts-layer"
              style={{
                circleColor: '#fff',
                circleRadius: 3,
                circleStrokeColor: '#000',
                circleStrokeWidth: 4,
                circlePitchAlignment: 'map',
              }}
            />

            <MapLibreGL.SymbolLayer
              id="pts-labels"
              style={{
                textField: ['concat', ['get', 'id'], '\n\n', ['get', 'code']],
                textSize: [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  10,
                  9,
                  15,
                  11,
                  20,
                  13,
                ],
                textHaloColor: '#fff',
                textHaloWidth: 1.5,
                textColor: '#111',
                textOffset: [0, -0.02],
                textAllowOverlap: false,
                textIgnorePlacement: false,
                textFont: ['Open Sans Regular', 'Arial Unicode MS Regular'],
              }}
            />
          </MapLibreGL.ShapeSource>

          {highlightGeoJSON && (
            <MapLibreGL.ShapeSource id="highlight" shape={highlightGeoJSON}>
              <MapLibreGL.LineLayer
                id="highlight-line"
                style={{ lineColor: '#0665bd', lineWidth: 5 }}
              />
              <MapLibreGL.CircleLayer
                id="highlight-point"
                style={{
                  circleColor: '#0665bd',
                  circleRadius: 6,
                  circleStrokeColor: '#fff',
                  circleStrokeWidth: 2,
                }}
              />
            </MapLibreGL.ShapeSource>
          )}

          {headingArrowGeoJSON && (
            <MapLibreGL.ShapeSource id="heading-arrow" shape={headingArrowGeoJSON}>
              <MapLibreGL.SymbolLayer
                id="heading-symbol"
                style={{
                  iconImage: require('../assets/heading-arrow.png'),
                  iconSize: 0.26,
                  iconRotate: ['get', 'rotation'],
                  iconAllowOverlap: true,
                  iconIgnorePlacement: true,
                }}
              />
            </MapLibreGL.ShapeSource>
          )}

          {location && (
            <MapLibreGL.ShapeSource
              id="me"
              shape={{
                type: 'FeatureCollection',
                features: [
                  {
                    type: 'Feature',
                    geometry: {
                      type: 'Point',
                      coordinates: [location.longitude, location.latitude],
                    },
                  },
                ],
              }}
            >
              <MapLibreGL.CircleLayer
                id="me-layer"
                style={{
                  circleColor: '#00C853',
                  circleRadius: 8,
                  circleStrokeColor: '#fff',
                  circleStrokeWidth: 3,
                }}
              />
            </MapLibreGL.ShapeSource>
          )}

          {/* Stakeout Line (dashed line from rover to target) */}
          {stakeoutLineGeoJSON && (
            <MapLibreGL.ShapeSource id="stakeout-line" shape={stakeoutLineGeoJSON}>
              <MapLibreGL.LineLayer
                id="stakeout-line-layer"
                style={{
                  lineColor: '#FF6B35',
                  lineWidth: 3,
                  lineDasharray: [2, 2],
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </MapLibreGL.ShapeSource>
          )}
        </MapLibreGL.MapView>

        <TouchableOpacity style={styles.sourceBtn} onPress={toggleGnssSource}>
          <Ionicons
            name={useExternalGnss ? 'bluetooth' : 'locate'}
            size={18}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.sourceText}>
            {useExternalGnss ? 'External GNSS' : 'Internal GPS'}
          </Text>
        </TouchableOpacity>

        <View style={styles.zoomContainer}>
          <TouchableOpacity style={styles.zoomBtn} onPress={zoomIn}>
            <Text style={styles.zoomText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.zoomBtn} onPress={zoomOut}>
            <Text style={styles.zoomText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.focusBtn} onPress={focusAll}>
            <Text style={styles.zoomText}>◎</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ioContainer}>
          <TouchableOpacity
            style={styles.ioBtn}
            onPress={() => exportData('JSON')}
          >
            <Text style={styles.ioText}>Export JSON</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.ioBtn, { backgroundColor: '#4CAF50' }]}
            onPress={() => importData('JSON')}
          >
            <Text style={styles.ioText}>Import JSON</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.randomBtn}
          onPress={() => randomSheetRef.current?.expand()}
        >
          <Text style={styles.randomText}>Random</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => addSheetRef.current?.expand()}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {/* Capture BottomSheet */}
        <BottomSheet ref={addSheetRef} index={-1} snapPoints={['45%']}>
          <BottomSheetView style={styles.sheet}>
            <ScrollView>
              <View style={styles.rowBetween}>
                <Text style={styles.title}>Capture Feature</Text>
                <TouchableOpacity onPress={() => addSheetRef.current?.close()}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text>Point ID</Text>
              <TextInput
                value={formPointId}
                onChangeText={setFormPointId}
                placeholder="optional ID"
                style={styles.input}
              />
              <Text style={{ marginTop: 8 }}>Code</Text>
              <TouchableOpacity
                style={styles.selectCode}
                onPress={() => codeSheetRef.current?.expand()}
              >
                <Text>
                  {(codes.find((c) => c.id === selectedCodeId) || {}).name}
                </Text>
              </TouchableOpacity>

              <View style={{ marginTop: 12 }}>
                {(() => {
                  const code =
                    codes.find((c) => c.id === selectedCodeId) || { type: 'point' };
                  if (code.type === 'point')
                    return (
                      <TouchableOpacity
                        style={styles.btnPrimary}
                        onPress={onSavePoint}
                      >
                        <Text style={{ color: '#fff' }}>Save Point</Text>
                      </TouchableOpacity>
                    );
                  if (!isRecording)
                    return (
                      <TouchableOpacity
                        style={styles.btnSecondary}
                        onPress={onStartLine}
                      >
                        <Text>Start Line</Text>
                      </TouchableOpacity>
                    );
                  return (
                    <>
                      <TouchableOpacity
                        style={styles.btnPrimary}
                        onPress={onSavePointOnLine}
                      >
                        <Text style={{ color: '#fff' }}>Save Point on Line</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.btnDanger, { marginTop: 8 }]}
                        onPress={onEndLine}
                      >
                        <Text style={{ color: '#fff' }}>End Line</Text>
                      </TouchableOpacity>
                    </>
                  );
                })()}
              </View>
            </ScrollView>
          </BottomSheetView>
        </BottomSheet>

        {/* Code Selection BottomSheet */}
        <BottomSheet ref={codeSheetRef} index={-1} snapPoints={['85%']}>
          <BottomSheetView style={[styles.sheet, { flex: 1 }]}>
            <View style={styles.rowBetween}>
              <Text style={styles.title}>Select / Add Code</Text>
              <TouchableOpacity onPress={() => codeSheetRef.current?.close()}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={codes}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.codeItem}
                  onPress={() => onSelectCode(item)}
                >
                  <Text style={{ fontSize: 15 }}>{item.name}</Text>
                  <Text style={{ color: '#666' }}>{item.type}</Text>
                </TouchableOpacity>
              )}
            />

            <Text style={{ marginTop: 12, fontWeight: '600' }}>Add New Code</Text>
            <TextInput
              value={newCodeName}
              onChangeText={setNewCodeName}
              placeholder="Code name"
              style={styles.input}
            />
            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  newCodeType === 'point' && styles.typeBtnActive,
                ]}
                onPress={() => setNewCodeType('point')}
              >
                <Text
                  style={{ color: newCodeType === 'point' ? '#fff' : '#000' }}
                >
                  Point (.)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  newCodeType === 'line' && styles.typeBtnActive,
                  { marginLeft: 8 },
                ]}
                onPress={() => setNewCodeType('line')}
              >
                <Text
                  style={{ color: newCodeType === 'line' ? '#fff' : '#000' }}
                >
                  Line (-)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addBtn, { marginLeft: 8 }]}
                onPress={addCode}
              >
                <Text style={{ color: '#fff' }}>+ Add</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetView>
        </BottomSheet>

        {/* Feature Detail BottomSheet */}
        <BottomSheet ref={detailSheetRef} index={-1} snapPoints={['45%']}>
          <BottomSheetView style={styles.sheet}>
            <View style={styles.rowBetween}>
              <Text style={styles.title}>Feature Details</Text>
              <TouchableOpacity
                onPress={() => {
                  detailSheetRef.current?.close();
                  setSelectedFeature(null);
                }}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedFeature ? (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.detailLabel}>
                  ID:{' '}
                  <Text style={styles.detailValue}>
                    {selectedFeature.properties.id}
                  </Text>
                </Text>
                <Text style={styles.detailLabel}>
                  Code:{' '}
                  <Text style={styles.detailValue}>
                    {selectedFeature.properties.code || '—'}
                  </Text>
                </Text>
                <Text style={styles.detailLabel}>
                  Type:{' '}
                  <Text style={styles.detailValue}>
                    {selectedFeature.geometry.type}
                  </Text>
                </Text>

                {selectedFeature.geometry.type === 'Point' && (() => {
                  const [lon, lat] = selectedFeature.geometry.coordinates;
                  const mercator = transformToWebMercator(lon, lat);
                  const elev =
                    points.find((p) => p.id === selectedFeature.properties.id)
                      ?.elevation ?? '—';

                  return (
                    <>
                      <Text style={styles.detailLabel}>
                        Latitude:{' '}
                        <Text style={styles.detailValue}>{lat.toFixed(7)}</Text>
                      </Text>
                      <Text style={styles.detailLabel}>
                        Longitude:{' '}
                        <Text style={styles.detailValue}>{lon.toFixed(7)}</Text>
                      </Text>
                      <Text style={styles.detailLabel}>
                        Easting (approx):{' '}
                        <Text style={styles.detailValue}>
                          {mercator.easting.toFixed(2)} m
                        </Text>
                      </Text>
                      <Text style={styles.detailLabel}>
                        Northing (approx):{' '}
                        <Text style={styles.detailValue}>
                          {mercator.northing.toFixed(2)} m
                        </Text>
                      </Text>
                      <Text style={styles.detailLabel}>
                        Elevation:{' '}
                        <Text style={styles.detailValue}>
                          {typeof elev === 'number'
                            ? elev.toFixed(2) + ' m'
                            : '—'}
                        </Text>
                      </Text>
                    </>
                  );
                })()}

                {selectedFeature.geometry.type === 'LineString' && (() => {
                  const line = turf.lineString(
                    selectedFeature.geometry.coordinates
                  );
                  const length = calculateLineLength(
                    selectedFeature.geometry.coordinates
                  );
                  const numPoints = selectedFeature.geometry.coordinates.length;

                  return (
                    <>
                      <Text style={styles.detailLabel}>
                        No. of Points:{' '}
                        <Text style={styles.detailValue}>{numPoints}</Text>
                      </Text>
                      <Text style={styles.detailLabel}>
                        2D Distance:{' '}
                        <Text style={styles.detailValue}>
                          {length.toFixed(2)} m
                        </Text>
                      </Text>
                    </>
                  );
                })()}

                {/* Stakeout Button */}
                <TouchableOpacity
                  style={[styles.btnPrimary, { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
                  onPress={() => {
                    if (selectedFeature.geometry.type === 'Point') {
                      const [lon, lat] = selectedFeature.geometry.coordinates;
                      const point = points.find((p) => p.id === selectedFeature.properties.id);
                      startStakeout({
                        type: 'point',
                        pointId: selectedFeature.properties.id,
                        coordinates: [lon, lat],
                      });
                    } else if (selectedFeature.geometry.type === 'LineString') {
                      const line = lines.find((l) => l.id === selectedFeature.properties.id);
                      if (line) {
                        const lineCoords = line.pointIds
                          .map((pid) => points.find((p) => p.id === pid))
                          .filter(Boolean)
                          .map((p) => p!.coords);
                        startStakeout({
                          type: 'line',
                          lineId: selectedFeature.properties.id,
                          lineCoordinates: lineCoords,
                        });
                      }
                    }
                    detailSheetRef.current?.close();
                    stakeoutSheetRef.current?.expand();
                  }}
                >
                  <Ionicons name="navigate" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#fff', fontWeight: '600' }}>Stakeout</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={{ marginTop: 8, color: '#666' }}>
                No feature selected
              </Text>
            )}
          </BottomSheetView>
        </BottomSheet>

        {/* Stakeout Bottom Sheet */}
        <StakeoutBottomSheet
          sheetRef={stakeoutSheetRef}
          featureName={
            selectedFeature
              ? `${selectedFeature.properties.id}${selectedFeature.properties.code ? ` • ${selectedFeature.properties.code}` : ''}`
              : 'Stakeout'
          }
        />

        {/* Stakeout Circular View (overlay when close) */}
        {isStakeoutActive && <StakeoutCircularView />}

        {/* Random Data BottomSheet */}
        <BottomSheet ref={randomSheetRef} index={-1} snapPoints={['40%']}>
          <BottomSheetView style={styles.sheet}>
            <View style={styles.rowBetween}>
              <Text style={styles.title}>Generate Random Data</Text>
              <TouchableOpacity onPress={() => randomSheetRef.current?.close()}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ marginTop: 8 }}>Number of Points</Text>
            <TextInput
              style={styles.input}
              value={randPointsCount}
              onChangeText={setRandPointsCount}
              keyboardType="numeric"
              placeholder="e.g. 20"
            />

            <Text style={{ marginTop: 8 }}>Number of Lines</Text>
            <TextInput
              style={styles.input}
              value={randLinesCount}
              onChangeText={setRandLinesCount}
              keyboardType="numeric"
              placeholder="e.g. 10"
            />

            <TouchableOpacity
              style={[styles.btnPrimary, { marginTop: 16 }]}
              onPress={generateRandomData}
            >
              <Text style={{ color: '#fff' }}>Generate</Text>
            </TouchableOpacity>
          </BottomSheetView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 20,
    backgroundColor: '#007bff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  sheet: { padding: 16 },
  title: { fontWeight: '700', fontSize: 16, color: '#111' },
  closeText: { fontSize: 20, color: '#007bff', fontWeight: '600' },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnDanger: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  selectCode: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 6,
    marginTop: 6,
  },
  zoomContainer: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 6,
    elevation: 4,
  },
  zoomBtn: { paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center' },
  zoomText: { fontSize: 18, fontWeight: '700' },
  codeItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeBtn: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  typeBtnActive: { backgroundColor: '#007bff', borderColor: '#007bff' },
  addBtn: { backgroundColor: '#007bff', padding: 8, borderRadius: 6 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  ioContainer: {
    position: 'absolute',
    top: 180,
    right: 20,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  ioBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    elevation: 4,
    marginTop: 6,
  },
  ioText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  randomBtn: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    elevation: 4,
  },
  randomText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  focusBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  gnssBar: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
    elevation: 10,
  },
  gnssText: { fontWeight: '600', color: '#111', fontSize: 13 },
  sourceBtn: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  detailLabel: { marginTop: 8, fontSize: 14, color: '#666' },
  detailValue: { fontWeight: '600', color: '#111' },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#111',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007bff',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
});

