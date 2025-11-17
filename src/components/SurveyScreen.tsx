/**
 * Survey Screen Component
 * Main mapping interface with all survey features
 */
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import MapLibreGL from '@maplibre/maplibre-react-native';
import * as turf from '@turf/turf';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  FlatList,
  Image,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MAP_CONFIG } from '../config/mapConfig';
import { useGnss } from '../context/GnssContext';
import { useStakeout } from '../context/StakeoutContext';
import { useSurveyData } from '../context/SurveyDataContext';
import { transformToWebMercator } from '../coordinate/CoordinateTransformer';
import {
  Code,
} from '../data/DataImporterExporter';
import {
  Line,
  Point,
  calculateLineLength,
  getAllCoordinates,
} from '../geospatial/GeospatialProcessor';
import { initializeMapEngine, useMapEngine } from '../map/MapEngine';
import { clusterPoints, getClusterRadius } from '../utils/clustering';
import { throttle } from '../utils/performance';
import ExportFormatScreen from './ExportFormatScreen';
import MeasurementInterface, { MeasurementSettings } from './MeasurementInterface';
import ObjectListScreen from './ObjectListScreen';
import StakeoutBottomSheet from './StakeoutBottomSheet';
import StakeoutCircularView from './StakeoutCircularView';

const mapStyle = require('../assets/style.json');

// Initialize map engine
initializeMapEngine();

export default function SurveyScreen() {
  const router = useRouter();
  const { gnssStatus } = useGnss();
  const { mapRef, cameraRef, getZoom, getCenter, setCamera, fitBounds } =
    useMapEngine();
  const { points, lines, codes, setPoints, setLines, setCodes, exportData, isLoading, importProgress, currentProject } = useSurveyData();

  const addSheetRef = useRef<BottomSheet>(null);
  const codeSheetRef = useRef<BottomSheet>(null);
  const detailSheetRef = useRef<BottomSheet>(null);
  const randomSheetRef = useRef<BottomSheet>(null);
  const stakeoutSheetRef = useRef<BottomSheet>(null);
  const measurementSheetRef = useRef<BottomSheet>(null);
  const exportSheetRef = useRef<BottomSheet>(null);
  const objectListSheetRef = useRef<BottomSheet>(null);

  const [useExternalGnss] = useState(false); // Always use internal GPS
  const [internalLocation, setInternalLocation] =
    useState<Location.LocationObject['coords'] | null>(null);
  const [zoomLevel, setZoomLevel] = useState(15); // Lower zoom to show map properly
  const zoomLockRef = useRef(false);
  const [isUserPanning, setIsUserPanning] = useState(false);
  const [shouldFollowLocation, setShouldFollowLocation] = useState(true); // Start with following enabled for real-time tracking

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    altitude?: number;
  } | null>(null);
  const [selectedCodeId, setSelectedCodeId] = useState('NO-CODE');
  const [formPointId, setFormPointId] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [activeLinePoints, setActiveLinePoints] = useState<string[]>([]);
  const [closeOnEnd, setCloseOnEnd] = useState(false);
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeType, setNewCodeType] = useState<'point' | 'line'>('point');
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [selectedPointForEdit, setSelectedPointForEdit] = useState<Point | null>(null);
  const [showDetailMenu, setShowDetailMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [heading, setHeading] = useState(0);
  const { startStakeout, stopStakeout, updateGuidance, isActive: isStakeoutActive, target: stakeoutTarget } = useStakeout();
  const [randPointsCount, setRandPointsCount] = useState('10');
  const [randLinesCount, setRandLinesCount] = useState('5');
  const [isPaused, setIsPaused] = useState(false);
  const [showTopMenu, setShowTopMenu] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurementProgress, setMeasurementProgress] = useState(0);
  const [measurementStatus, setMeasurementStatus] = useState('');
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(true);
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const projectName = currentProject?.name || 'No Project';
  const deviceName = 'My Surv 01 -rover';

  const { width, height } = useWindowDimensions();
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const measurementIntervalsRef = useRef<{ progress?: NodeJS.Timeout; reading?: NodeJS.Timeout }>({});

  // Use Map for O(1) point lookups instead of O(n) array.find()
  const pointsMap = useMemo(() => {
    const map = new Map<string, Point>();
    points.forEach((p) => map.set(p.id, p));
    return map;
  }, [points]);

  // Function to start location tracking
  const startLocationTracking = React.useCallback(async () => {
    // Check if location services are enabled
    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      console.log('Location services are disabled');
      return null;
    }

    // Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permissions not granted');
      return null;
    }

    // Clean up existing watcher if any
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }

    // First, try to get last known position immediately (very fast)
    try {
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        setInternalLocation(lastKnown.coords);
      }
    } catch (error) {
      console.log('Could not get last known position:', error);
    }

    // Then try to get current position quickly (faster than watch)
    try {
      const currentPos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (currentPos) {
        setInternalLocation(currentPos.coords);
      }
    } catch (error) {
      console.log('Could not get current position quickly:', error);
    }

    // Finally, start watching for continuous updates with high accuracy (real-time)
    try {
      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: MAP_CONFIG.LOCATION_UPDATE_INTERVAL, // 0 = update on every movement
          timeInterval: 50, // Update every 50ms for ultra-smooth real-time tracking
        },
        (loc) => {
          // Update location immediately for real-time tracking
          setInternalLocation(loc.coords);
        }
      );
      watcherRef.current = watcher;
      return watcher;
    } catch (error) {
      console.log('Could not start watching position:', error);
      return null;
    }
  }, []);

  // Initial location setup
  useEffect(() => {
    startLocationTracking();
    return () => {
      if (watcherRef.current) {
        watcherRef.current.remove();
        watcherRef.current = null;
      }
    };
  }, [startLocationTracking]);

  // Cleanup measurement intervals on unmount
  useEffect(() => {
    return () => {
      if (measurementIntervalsRef.current.progress) {
        clearInterval(measurementIntervalsRef.current.progress);
      }
      if (measurementIntervalsRef.current.reading) {
        clearInterval(measurementIntervalsRef.current.reading);
      }
      measurementIntervalsRef.current = {};
    };
  }, []);

  // Monitor location services status and restart tracking when GPS is enabled
  // Also enforce location services to be enabled (compulsory)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let appStateSubscription: any = null;
    let wasGpsDisabled = false;
    let alertShown = false;

    const checkLocationServices = async () => {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        setLocationServicesEnabled(servicesEnabled);

        if (servicesEnabled) {
          // If services are enabled but we don't have a watcher, start tracking
          if (!watcherRef.current) {
            // If GPS was previously disabled, enable auto-follow when it's turned back on
            if (wasGpsDisabled) {
              setIsUserPanning(false);
              setShouldFollowLocation(true);
              wasGpsDisabled = false;
            }
            await startLocationTracking();
          }
          // Reset alert flag when location is enabled
          if (alertShown) {
            alertShown = false;
            setShowLocationAlert(false);
          }
        } else {
          // If services are disabled, clean up watcher and mark as disabled
          wasGpsDisabled = true;
          if (watcherRef.current) {
            watcherRef.current.remove();
            watcherRef.current = null;
          }

          // Show alert if not already shown (to avoid spam)
          if (!alertShown) {
            alertShown = true;
            setShowLocationAlert(true);
            Alert.alert(
              'Location Services Required',
              'Location services must be enabled to use the Survey screen. Please enable location services in your device settings.',
              [
                {
                  text: 'Open Settings',
                  onPress: () => {
                    Linking.openSettings();
                  },
                },
                {
                  text: 'OK',
                  style: 'cancel',
                },
              ],
              { cancelable: false }
            );
          }
        }
      } catch (error) {
        console.log('Error checking location services:', error);
      }
    };

    // Check immediately on mount
    checkLocationServices();

    // Check periodically (every 2 seconds)
    intervalId = setInterval(checkLocationServices, 2000);

    // Also check when app comes to foreground
    appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkLocationServices();
      }
    });

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (appStateSubscription) {
        appStateSubscription.remove();
      }
    };
  }, [startLocationTracking]);

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

  // Optimized camera update function for ultra-smooth real-time tracking
  // Uses smooth animations with minimal throttle for fluid movement
  const updateCameraPosition = React.useMemo(
    () =>
      throttle((lon: number, lat: number, zoom: number) => {
        if (cameraRef.current) {
          setCamera({
            centerCoordinate: [lon, lat],
            zoomLevel: zoom,
            animationDuration: 150, // Smooth animation for real-time tracking
          });
        }
      }, MAP_CONFIG.CAMERA_UPDATE_THROTTLE_MS),
    []
  );

  // Move map when active GNSS updates (real-time tracking)
  // Follow location continuously unless user has manually panned
  useEffect(() => {
    if (!location) return;

    // Update camera in real-time if user hasn't manually panned (continuous following)
    if (!isUserPanning) {
      // Update camera immediately for real-time tracking (throttled internally at 100ms)
      updateCameraPosition(location.longitude, location.latitude, zoomLevel);
    } else if (shouldFollowLocation) {
      // If explicitly requested to follow (e.g., when GPS is enabled), do it once
      updateCameraPosition(location.longitude, location.latitude, zoomLevel);
      setShouldFollowLocation(false); // Reset after following
    }

    // Update stakeout guidance when location changes (real-time)
    if (isStakeoutActive && location) {
      updateGuidance({
        lat: location.latitude,
        lon: location.longitude,
        alt: location.altitude,
      });
    }
  }, [location, zoomLevel, updateCameraPosition, isStakeoutActive, updateGuidance, isUserPanning, shouldFollowLocation]);

  // Always use internal GPS - no toggle needed

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

    // If recording a line and clicking on a point, add it to the line
    if (isRecording && feature.geometry.type === 'Point') {
      // Handle cluster clicks - don't add clusters to line
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

      const pointId = feature.properties.id;
      // Check if point already in the line
      if (activeLinePoints.includes(pointId)) {
        Alert.alert('Point already added', 'This point is already part of the line.');
        return;
      }

      // Add existing point to the line
      setActiveLinePoints((arr) => [...arr, pointId]);
      Alert.alert('Point added', `Point ${pointId} added to line.`, [{ text: 'OK' }]);
      return;
    }

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

  const focusOnLocation = () => {
    if (!location) {
      Alert.alert('No location', 'Waiting for GPS fix...');
      return;
    }
    // Re-enable following location and center on current position
    setIsUserPanning(false);
    setShouldFollowLocation(true);
    updateCameraPosition(location.longitude, location.latitude, zoomLevel);
  };

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

  // Handlers for edit, delete, and menu actions
  const handleEditPoint = () => {
    if (selectedFeature && selectedFeature.geometry.type === 'Point') {
      const point = points.find(p => p.id === selectedFeature.properties.id);
      if (point) {
        setSelectedPointForEdit(point);
        setShowDetailMenu(false);
        detailSheetRef.current?.close();
        router.push({ pathname: '/edit-point', params: { pointId: point.id } });
      }
    }
  };

  const handleDeleteFeature = () => {
    if (!selectedFeature) return;

    Alert.alert(
      'Delete Feature',
      `Are you sure you want to delete ${selectedFeature.properties.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (selectedFeature.geometry.type === 'Point') {
              setPoints(prev => prev.filter(p => p.id !== selectedFeature.properties.id));
            } else if (selectedFeature.geometry.type === 'LineString') {
              setLines(prev => prev.filter(l => l.id !== selectedFeature.properties.id));
            }
            setSelectedFeature(null);
            setShowDetailMenu(false);
            detailSheetRef.current?.close();
          },
        },
      ]
    );
  };

  const handleSavePointEdit = (pointId: string, updates: { id?: string; codeId?: string }) => {
    setPoints(prev => prev.map(p => {
      if (p.id === pointId) {
        return {
          ...p,
          id: updates.id || p.id,
          codeId: updates.codeId || p.codeId,
        };
      }
      return p;
    }));
    setSelectedPointForEdit(null);
  };

  // Check if GPS has fix (good accuracy)
  const hasGpsFix = (coords: Location.LocationObject['coords'] | null): boolean => {
    if (!coords) return false;
    // horizontalAccuracy: lower is better, typically < 15m is acceptable fix
    // If accuracy is null/undefined, assume no fix
    if (coords.accuracy === null || coords.accuracy === undefined) return false;
    // Consider accuracy < 15m as acceptable fix (relaxed from 10m for better compatibility)
    return coords.accuracy < 15;
  };

  const handleMeasurePoint = async (settings: MeasurementSettings) => {
    // Check if location is available
    if (!location) {
      Alert.alert('No GPS', 'Waiting for GPS fix...');
      return;
    }

    // Check FIX only requirement - get fresh GPS reading for accurate check
    if (settings.fixOnly) {
      try {
        // Get fresh GPS reading to check current fix status
        const currentPos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!currentPos || !currentPos.coords) {
          Alert.alert(
            'No GPS Fix',
            'Could not get GPS reading. Please wait for better signal or disable "FIX only" option.',
            [{ text: 'OK' }]
          );
          return;
        }

        if (!hasGpsFix(currentPos.coords)) {
          const accuracy = currentPos.coords.accuracy;
          const accuracyText = accuracy !== null && accuracy !== undefined
            ? `Current accuracy: ${accuracy.toFixed(1)}m (need < 15m)`
            : 'Accuracy not available';

          Alert.alert(
            'No GPS Fix',
            `GPS fix is not available. ${accuracyText}\n\nPlease wait for better signal or disable "FIX only" option.`,
            [{ text: 'OK' }]
          );
          return;
        }
      } catch (error) {
        console.log('Error checking GPS fix:', error);
        Alert.alert(
          'GPS Error',
          'Could not check GPS fix status. Please try again or disable "FIX only" option.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    // Check for duplicate point ID
    const pointId = settings.pointId.trim() || nextPointId();
    if (points.some((p) => p.id === pointId)) {
      Alert.alert('Duplicate ID', 'A point with this ID already exists.');
      return;
    }

    // Calculate total averaging time in milliseconds
    const totalAveragingMs = (settings.averagingMinutes * 60 + settings.averagingSeconds) * 1000;

    // If no averaging needed, create point immediately
    if (totalAveragingMs === 0) {
      const created = createPointAtCurrentLocation(pointId, settings.codeId);
      if (created) {
        measurementSheetRef.current?.close();
        setFormPointId('');
        Alert.alert('Success', `Point ${pointId} created successfully.`);
      }
      return;
    }

    // Start averaging process
    setIsMeasuring(true);
    setMeasurementProgress(0);
    setMeasurementStatus('Starting measurement...');

    const readings: Array<{ lat: number; lon: number; alt?: number }> = [];
    const startTime = Date.now();
    const updateInterval = 200; // Update progress every 200ms
    const readingInterval = 500; // Collect GPS reading every 500ms

    // Store intervals for cleanup
    measurementIntervalsRef.current = {};
    let progressInterval: NodeJS.Timeout | undefined;
    let readingCollectionInterval: NodeJS.Timeout | undefined;

    // Progress update interval
    progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / totalAveragingMs) * 100);
      setMeasurementProgress(progress);

      const remainingSeconds = Math.ceil((totalAveragingMs - elapsed) / 1000);
      if (remainingSeconds > 0) {
        setMeasurementStatus(`Measuring... ${remainingSeconds}s remaining`);
      } else {
        setMeasurementStatus('Finalizing...');
      }
    }, updateInterval);

    // GPS reading collection interval
    readingCollectionInterval = setInterval(async () => {
      try {
        // Get current position
        const currentPos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });

        if (currentPos && currentPos.coords) {
          // Check fix if required
          if (settings.fixOnly && !hasGpsFix(currentPos.coords)) {
            // Skip this reading if fix is required but not available
            return;
          }

          readings.push({
            lat: currentPos.coords.latitude,
            lon: currentPos.coords.longitude,
            alt: currentPos.coords.altitude ?? undefined,
          });
        }
      } catch (error) {
        console.log('Error collecting GPS reading:', error);
      }
    }, readingInterval);

    // Store intervals in ref for potential cleanup
    measurementIntervalsRef.current.progress = progressInterval;
    measurementIntervalsRef.current.reading = readingCollectionInterval;

    // Wait for averaging time to complete
    setTimeout(async () => {
      if (progressInterval) clearInterval(progressInterval);
      if (readingCollectionInterval) clearInterval(readingCollectionInterval);
      measurementIntervalsRef.current = {};

      if (readings.length === 0) {
        setIsMeasuring(false);
        setMeasurementProgress(0);
        setMeasurementStatus('');
        Alert.alert(
          'Measurement Failed',
          'Could not collect GPS readings. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Calculate average coordinates
      const avgLat = readings.reduce((sum, r) => sum + r.lat, 0) / readings.length;
      const avgLon = readings.reduce((sum, r) => sum + r.lon, 0) / readings.length;
      const avgAlt = readings.some(r => r.alt !== undefined)
        ? readings.reduce((sum, r) => sum + (r.alt || 0), 0) / readings.filter(r => r.alt !== undefined).length
        : null;

      // Create point with averaged coordinates
      const p: Point = {
        id: pointId,
        codeId: settings.codeId,
        coords: [avgLon, avgLat],
        elevation: avgAlt,
        ts: new Date().toISOString(),
      };

      setPoints((prev) => [...prev, p]);

      setIsMeasuring(false);
      setMeasurementProgress(0);
      setMeasurementStatus('');
      measurementSheetRef.current?.close();
      setFormPointId('');

      Alert.alert(
        'Success',
        `Point ${pointId} created with ${readings.length} averaged readings.`,
        [{ text: 'OK' }]
      );
    }, totalAveragingMs);
  };

  const handleAddPoint = () => {
    setShowAddMenu(false);
    measurementSheetRef.current?.expand();
  };

  const handleAddLine = () => {
    setShowAddMenu(false);
    addSheetRef.current?.expand();
  };

  const handleOpenObjectList = () => {
    objectListSheetRef.current?.expand();
  };

  const handleExport = () => {
    exportSheetRef.current?.expand();
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="rgba(255, 255, 255, 0.95)" translucent={false} />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          {/* Location Services Warning Banner */}
          {!locationServicesEnabled && (
            <View style={styles.locationWarningBanner}>
              <Ionicons name="location-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.locationWarningText}>
                Location services are disabled. Please enable location services to use this screen.
              </Text>
              <TouchableOpacity
                style={styles.locationWarningButton}
                onPress={() => Linking.openSettings()}
              >
                <Text style={styles.locationWarningButtonText}>Open Settings</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Top Bar with Project Name and Menu */}
          <View style={styles.topBarContainer}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButtonTop}>
                <Ionicons name="arrow-back" size={24} color="#111" />
              </TouchableOpacity>
              <Text style={styles.projectName} numberOfLines={1}>{projectName}</Text>
              <TouchableOpacity onPress={() => setShowTopMenu(!showTopMenu)}>
                <Ionicons name="ellipsis-vertical" size={24} color="#111" />
              </TouchableOpacity>
              {showTopMenu && (
                <View style={styles.topMenu}>
                  <TouchableOpacity
                    style={styles.topMenuItem}
                    onPress={() => {
                      objectListSheetRef.current?.expand();
                      setShowTopMenu(false);
                    }}
                  >
                    <Ionicons name="list" size={20} color="#111" />
                    <Text style={styles.topMenuText}>Object list</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.topMenuItem}
                    onPress={() => {
                      // Project details functionality
                      setShowTopMenu(false);
                    }}
                  >
                    <Ionicons name="information-circle" size={20} color="#111" />
                    <Text style={styles.topMenuText}>Project details</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
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
                  // Clamp zoom level to prevent exceeding max zoom (which causes blank tiles)
                  const clampedZoom = Math.min(Math.max(z, MAP_CONFIG.MIN_ZOOM_LEVEL), MAP_CONFIG.MAX_ZOOM_LEVEL);
                  setZoomLevel(clampedZoom);
                  // If zoom was clamped, update camera to enforce limit
                  if (clampedZoom !== z && clampedZoom === MAP_CONFIG.MAX_ZOOM_LEVEL) {
                    const center = await getCenter();
                    if (center) {
                      setCamera({
                        zoomLevel: MAP_CONFIG.MAX_ZOOM_LEVEL,
                        centerCoordinate: center,
                      });
                    }
                  }
                }
              } catch { }
              // Mark that user has finished panning (but keep isUserPanning true to prevent auto-follow)
            }}
            onRegionWillChange={() => {
              // User is manually panning the map - disable auto-follow
              setIsUserPanning(true);
            }}
          >
            <MapLibreGL.Camera
              ref={cameraRef}
              defaultZoomLevel={15}
              maxZoomLevel={MAP_CONFIG.MAX_ZOOM_LEVEL}
              minZoomLevel={MAP_CONFIG.MIN_ZOOM_LEVEL}
              animationMode={MAP_CONFIG.ENABLE_ANIMATIONS ? "easeTo" : "none"}
              animationDuration={MAP_CONFIG.ENABLE_ANIMATIONS ? MAP_CONFIG.DEFAULT_ANIMATION_DURATION : 0}
              followUserLocation={false}
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
                    circleColor: '#FF6B35',
                    circleRadius: 10,
                    circleStrokeColor: '#000',
                    circleStrokeWidth: 2,
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

          {/* Zoom Controls with Image Assets */}
          <View style={styles.zoomContainer}>
            <TouchableOpacity style={styles.zoomBtn} onPress={zoomIn}>
              <Image
                source={require('../assets/plus.png')}
                style={styles.zoomIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomBtn} onPress={zoomOut}>
              <Image
                source={require('../assets/minus.png')}
                style={styles.zoomIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.focusBtn} onPress={focusOnLocation}>
              <Ionicons name="locate" size={20} color="#111" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.zoomBoxBtn} onPress={focusAll}>
              <Image
                source={require('../assets/zoombox.png')}
                style={styles.zoomBoxIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
          {/* Left Panel with Device Status */}
          <View style={styles.leftPanel}>
            <View style={styles.devicePanel}>
              <Text style={styles.deviceName}>{deviceName}</Text>
              <TouchableOpacity
                style={styles.pauseButton}
                onPress={() => setIsPaused(!isPaused)}
              >
                <Ionicons
                  name={isPaused ? 'play' : 'pause'}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
              <View style={styles.modeIndicator}>
                <View style={styles.modeIconContainer}>
                  <Ionicons name="git-branch" size={16} color="#d32f2f" />
                </View>
                <Text style={styles.modeText}>Single</Text>
                <Text style={styles.modeNumber}>32</Text>
              </View>
              <View style={styles.heightIndicator}>
                <Text style={styles.heightLabel}>T</Text>
                <Text style={styles.heightValue}>1.80m</Text>
              </View>
            </View>
          </View>


          {/* Random button */}
          <TouchableOpacity
            style={styles.randomBtn}
            onPress={() => randomSheetRef.current?.expand()}
          >
            <Text style={styles.randomText}>Random</Text>
          </TouchableOpacity>

          {/* Add menu button */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowAddMenu(!showAddMenu)}
          >
            <Text style={styles.fabText}>+ Collect</Text>
          </TouchableOpacity>

          {/* Add menu */}
          {showAddMenu && (
            <View style={styles.addMenu}>
              <TouchableOpacity
                style={styles.addMenuItem}
                onPress={handleAddPoint}
              >
                <Ionicons name="radio-button-on" size={20} color="#007bff" />
                <Text style={styles.addMenuText}>Add point</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addMenuItem}
                onPress={handleAddLine}
              >
                <Ionicons name="git-branch" size={20} color="#007bff" />
                <Text style={styles.addMenuText}>Add line or polygon</Text>
              </TouchableOpacity>
            </View>
          )}

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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => setShowDetailMenu(!showDetailMenu)}
                    style={{ marginRight: 12, padding: 8 }}
                  >
                    <Ionicons name="ellipsis-vertical" size={24} color="#111" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      detailSheetRef.current?.close();
                      setSelectedFeature(null);
                      setShowDetailMenu(false);
                    }}
                  >
                    <Text style={styles.closeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Three-dot menu */}
              {showDetailMenu && (
                <View style={styles.detailMenu}>
                  {selectedFeature?.geometry.type === 'Point' && (
                    <TouchableOpacity
                      style={styles.detailMenuItem}
                      onPress={handleEditPoint}
                    >
                      <Ionicons name="create-outline" size={20} color="#666" />
                      <Text style={styles.detailMenuText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.detailMenuItem, styles.detailMenuDelete]}
                    onPress={handleDeleteFeature}
                  >
                    <Ionicons name="trash-outline" size={20} color="#dc3545" />
                    <Text style={[styles.detailMenuText, { color: '#dc3545' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}

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

          {/* Measurement Interface */}
          <MeasurementInterface
            sheetRef={measurementSheetRef}
            onMeasure={handleMeasurePoint}
            onCancel={() => {
              if (!isMeasuring) {
                measurementSheetRef.current?.close();
              }
            }}
            codes={codes}
            selectedCodeId={selectedCodeId}
            onCodeSelect={setSelectedCodeId}
            onCodeSheetOpen={() => codeSheetRef.current?.expand()}
            isMeasuring={isMeasuring}
            measurementProgress={measurementProgress}
            measurementStatus={measurementStatus}
          />

          {/* Object List Screen */}
          <BottomSheet ref={objectListSheetRef} index={-1} snapPoints={['90%']} enablePanDownToClose>
            <BottomSheetView style={{ flex: 1 }}>
              <ObjectListScreen
                points={points}
                lines={lines}
                codes={codes}
                onFeaturePress={(feature) => {
                  objectListSheetRef.current?.close();
                  // Find and select the feature
                  if (feature.type === 'point') {
                    const point = points.find(p => p.id === feature.id);
                    if (point) {
                      const fullFeature = {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: point.coords },
                        properties: {
                          id: point.id,
                          code: (codes.find(c => c.id === point.codeId) || {}).name,
                        },
                      };
                      setSelectedFeature(fullFeature);
                      detailSheetRef.current?.expand();
                    }
                  } else {
                    const line = lines.find(l => l.id === feature.id);
                    if (line) {
                      const linePoints = line.pointIds.map(pid => points.find(p => p.id === pid)).filter(Boolean) as Point[];
                      const coords = linePoints.map(p => p.coords);
                      const finalCoords = line.closed && coords.length >= 3 ? [...coords, coords[0]] : coords;
                      const fullFeature = {
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: finalCoords },
                        properties: {
                          id: line.id,
                          code: (codes.find(c => c.id === line.codeId) || {}).name,
                        },
                      };
                      setSelectedFeature(fullFeature);
                      detailSheetRef.current?.expand();
                    }
                  }
                }}
                onExport={handleExport}
              />
            </BottomSheetView>
          </BottomSheet>

          {/* Export Format Screen */}
          <ExportFormatScreen
            sheetRef={exportSheetRef}
            onExport={(format, columnFormat) => {
              exportData(format, columnFormat);
              exportSheetRef.current?.close();
            }}
            onClose={() => exportSheetRef.current?.close()}
          />
        </View>
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 20,
    backgroundColor: '#FF682C',
    width: '30%',
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  listFab: {
    bottom: 95,
  },
  addMenu: {
    position: 'absolute',
    bottom: 95,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 180,
  },
  addMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
  },
  addMenuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#111',
  },
  detailMenu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  detailMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
  },
  detailMenuDelete: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 4,
  },
  detailMenuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#111',
  },
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
  locationWarningBanner: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 2000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  locationWarningText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
  },
  locationWarningButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  locationWarningButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  topBarContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    zIndex: 1000,
    elevation: 8,
  },
  topBar: {
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  backButtonTop: {
    padding: 4,
    marginRight: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    flex: 1,
    marginHorizontal: 8,
  },
  topMenu: {
    position: 'absolute',
    top: 50,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 180,
    zIndex: 1001,
  },
  topMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
  },
  topMenuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#111',
  },
  leftPanel: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 100,
    left: 10,
    width: 80,
    // zIndex: 999,
    elevation: 8,
  },
  devicePanel: {
    backgroundColor: 'rgba(60, 60, 60, 0.9)',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  deviceName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  pauseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    padding: 6,
    marginBottom: 8,
  },
  modeIconContainer: {
    marginRight: 4,
  },
  modeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  modeNumber: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  heightIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    padding: 6,
  },
  heightLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  heightValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  zoomContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  zoomBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  zoomIcon: {
    width: 20,
    height: 20,
  },
  zoomText: { fontSize: 18, fontWeight: '700' },
  zoomBoxBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderColor: '#ddd',
    minWidth: 44,
    minHeight: 44,
  },
  zoomBoxIcon: {
    width: 20,
    height: 20,
  },
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
  collectButton: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 0,
    alignItems: 'center',
    elevation: 8,
    zIndex: 998,
  },
  collectButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  randomBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 60,
    left: 20,
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    elevation: 4,
  },
  randomText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  focusBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderColor: '#ddd',
    minWidth: 44,
    minHeight: 44,
  },
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

