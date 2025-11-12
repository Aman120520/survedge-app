# JIRA Ticket: Survey Mapping Application with Stakeout Feature

## Summary
Implement comprehensive survey mapping application with real-time GPS tracking, geospatial data management, and stakeout navigation functionality using React Native Expo CLI.

## Description

### Overview
Develop a production-ready survey mapping application (`survedge-app`) that enables field surveyors to capture, manage, and navigate to survey points and lines with high precision. The application must support large datasets (20,000+ features), provide smooth real-time performance, and include advanced stakeout navigation capabilities.

### Key Features Implemented

#### 1. Core Mapping Engine
- **Map SDK**: MapLibre GL Native for high-performance vector map rendering
- **Offline Capability**: Full offline map support with custom style
- **Custom Layer Drawing**: Support for points, lines, and polygons with custom styling
- **Real-time GPS Tracking**: Internal GPS and external GNSS device support
- **Smooth Camera Animations**: Optimized map pan/zoom with throttled updates

#### 2. Geospatial Data Processing
- **Geometric Calculations**: Distance, area, bearing, offsets using Turf.js
- **Feature Editing**: Point and line creation, modification, deletion
- **High Precision**: Accurate coordinate calculations for survey-grade applications
- **Mobile-Optimized**: Efficient processing without UI lag

#### 3. Coordinate System & Transformations
- **Global Coordinate System**: WGS84 support
- **Local Coordinate Systems**: Web Mercator transformations
- **Coordinate Formatting**: Multiple display formats (decimal degrees, meters)
- **Custom Coordinate Systems**: Framework for loading custom coordinate systems

#### 4. Data Import/Export
- **Supported Formats**: JSON, GeoJSON, CSV
- **Large Dataset Support**: Batch processing for 20,000+ features
- **Progress Indicators**: Real-time import progress for large files
- **Data Integrity**: Maintains object attributes and precision during conversions
- **Cross-Platform File Operations**: Android StorageAccessFramework with fallback

#### 5. Stakeout Navigation Feature
- **Point Stakeout**: Navigate to selected survey points
- **Line Stakeout**: Navigate along survey lines (finds closest point)
- **Real-time Guidance**: 
  - Distance to target
  - Directional arrows (North/South/East/West)
  - Azimuth (compass bearing)
  - Cut/Fill elevation differences
  - Delta E, N, U values
- **Visual Feedback**:
  - Dashed line from rover position to target on map
  - Circular crosshair view when < 1 meter from target
  - Green indicator when < 10cm from target
- **Performance Optimized**: Smooth 60fps updates with throttled calculations

#### 6. Performance Optimizations
- **Clustering**: Automatic point clustering at low zoom levels
- **Batch Processing**: Efficient handling of large datasets
- **Throttled Updates**: Smooth location and guidance updates
- **Memoization**: Optimized React component rendering
- **Viewport Culling**: Render only visible features
- **Warning Suppression**: Clean console output

## Technical Stack

### Core Technologies
- **Framework**: React Native (Expo CLI)
- **Map SDK**: @maplibre/maplibre-react-native (v10.4.0)
- **Geospatial Library**: @turf/turf (v7.2.0)
- **Navigation**: React Navigation (v7.x)
- **UI Components**: @gorhom/bottom-sheet, @expo/vector-icons
- **Location Services**: expo-location
- **File Operations**: expo-file-system, expo-document-picker, expo-sharing

### Architecture
- **Modular Structure**: All code contained in `src/` folder
- **Context API**: Global state management (GNSS, Stakeout)
- **TypeScript**: Full type safety throughout
- **Performance Utilities**: Custom throttling, debouncing, batch processing

## Acceptance Criteria

### Functional Requirements
- [x] Application loads and displays map with custom style
- [x] Real-time GPS location tracking (internal and external GNSS)
- [x] Capture survey points with codes and attributes
- [x] Create survey lines connecting multiple points
- [x] Import survey data from JSON, GeoJSON, CSV formats
- [x] Export survey data to JSON, GeoJSON, CSV formats
- [x] Handle large datasets (20,000+ features) without performance degradation
- [x] Stakeout feature for point navigation
- [x] Stakeout feature for line navigation
- [x] Real-time guidance display during stakeout
- [x] Circular view activates when < 1 meter from target
- [x] Green indicator when < 10cm from target
- [x] Smooth map interactions (pan, zoom, select)
- [x] Feature selection and details display
- [x] Code management (add, select, categorize)

### Performance Requirements
- [x] Smooth 60fps map rendering
- [x] No lag during stakeout navigation
- [x] Import 20,000 features in < 10 seconds
- [x] Responsive UI updates (< 100ms)
- [x] Efficient memory usage
- [x] No crashes with large datasets

### Technical Requirements
- [x] All code in `src/` folder structure
- [x] TypeScript throughout
- [x] Error handling and user feedback
- [x] Cross-platform compatibility (Android/iOS)
- [x] Proper file permissions handling
- [x] Progress indicators for long operations

## File Structure

```
survedge-app/
├── src/
│   ├── components/
│   │   ├── SurveyScreen.tsx          # Main mapping interface
│   │   ├── StakeoutBottomSheet.tsx   # Stakeout guidance UI
│   │   └── StakeoutCircularView.tsx  # Close-range circular view
│   ├── context/
│   │   ├── GnssContext.tsx           # GNSS device state
│   │   └── StakeoutContext.tsx       # Stakeout state & calculations
│   ├── map/
│   │   └── MapEngine.tsx             # MapLibre integration
│   ├── geospatial/
│   │   └── GeospatialProcessor.ts   # Turf.js calculations
│   ├── coordinate/
│   │   └── CoordinateTransformer.ts # Coordinate transformations
│   ├── data/
│   │   └── DataImporterExporter.ts  # Import/export functionality
│   └── utils/
│       ├── performance.ts            # Throttling, debouncing
│       ├── clustering.ts             # Point clustering
│       ├── batchProcessor.ts         # Batch processing
│       └── viewportCulling.ts        # Viewport optimization
├── app/
│   ├── _layout.tsx                   # Root layout with providers
│   └── (tabs)/
│       └── survey.tsx                # Survey tab entry point
└── test-data/
    └── test_survey_20000_features.json  # Test dataset
```

## Testing

### Test Scenarios
1. **Basic Mapping**
   - Map loads and displays correctly
   - GPS location updates in real-time
   - Map pan/zoom is smooth

2. **Data Capture**
   - Create points with codes
   - Create lines connecting points
   - Edit and delete features

3. **Data Import/Export**
   - Import JSON file with 20,000 features
   - Verify all features render correctly
   - Export data and verify integrity
   - Test CSV and GeoJSON formats

4. **Stakeout Feature**
   - Select point and start stakeout
   - Verify guidance updates in real-time
   - Test circular view activation (< 1m)
   - Test green indicator (< 10cm)
   - Test line stakeout functionality

5. **Performance**
   - Verify smooth 60fps during navigation
   - Test with large datasets (20,000+ features)
   - Verify no memory leaks
   - Test clustering at different zoom levels

### Test Data
- Test file: `test-data/test_survey_20000_features.json`
- Contains: 10,000 points + 10,000 lines
- Size: ~4.2 MB

## Known Issues / Limitations

### Current Limitations
- Circular view scale factor may need calibration for different screen sizes
- Line stakeout uses simplified closest point algorithm (sufficient for most use cases)
- File export on Android requires user to grant directory permissions

### Future Enhancements
- Support for additional coordinate systems (UTM, State Plane, etc.)
- KML format support
- Offline map tile caching
- Multi-point selection and batch operations
- Advanced filtering and search
- Measurement tools (area, perimeter)
- Annotation and notes on features

## Dependencies

### Key Dependencies
```json
{
  "@maplibre/maplibre-react-native": "^10.4.0",
  "@turf/turf": "^7.2.0",
  "expo": "~54.0.23",
  "expo-location": "~19.0.7",
  "expo-file-system": "~19.0.17",
  "expo-document-picker": "~14.0.7",
  "expo-sharing": "~14.0.7",
  "react": "19.1.0",
  "react-native": "0.81.5"
}
```

## Documentation

### User Documentation
- Feature usage guide
- Import/export instructions
- Stakeout navigation guide

### Technical Documentation
- Architecture overview
- Performance optimization guide
- API reference (internal modules)

## Related Documentation
- Library.pdf - Mapping requirements
- PROP-P0003-25.pdf - Technical specifications
- maptest project - Reference implementation

## Labels
- `survey-mapping`
- `react-native`
- `geospatial`
- `stakeout`
- `performance`
- `mobile`

## Priority
**High** - Core functionality for survey application

## Story Points
**13** - Complex feature with multiple components and performance requirements

## Sprint
To be assigned

---

## Implementation Notes

### Performance Optimizations Applied
1. **Throttled Updates**: Location and guidance updates throttled to prevent excessive calculations
2. **Memoization**: React components and expensive calculations memoized
3. **Clustering**: Automatic point clustering at low zoom levels
4. **Batch Processing**: Large dataset imports processed in batches
5. **Viewport Culling**: Only render visible features
6. **Optimized Calculations**: Reduced Turf.js calls, early exits in algorithms

### Stakeout Implementation Details
- Guidance calculations use Turf.js for accuracy
- Real-time updates every 100ms for smooth experience
- Circular view shows 2-meter diameter (1-meter radius) centered on target
- Color coding: Normal → Close (< 1m) → Very Close (< 10cm, green)
- Line stakeout finds closest point on line using nearestPointOnLine algorithm

### File Operations
- Android: Uses StorageAccessFramework for native file picker
- Fallback: Cache directory + expo-sharing for cross-platform compatibility
- Progress indicators for imports > 5,000 features
- Batch processing prevents UI blocking

---

**Created**: [Date]
**Last Updated**: [Date]
**Status**: ✅ Completed
**Assignee**: [Developer Name]

