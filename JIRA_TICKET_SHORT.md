# Survey Mapping Application with Stakeout Feature

## Summary
Implement comprehensive survey mapping application with real-time GPS tracking, geospatial data management, and stakeout navigation functionality using React Native Expo CLI.

## Description

### Core Features
1. **Mapping Engine**: MapLibre GL Native with offline support, custom layers, smooth animations
2. **Geospatial Processing**: Turf.js for distance, area, bearing, offsets - mobile optimized
3. **Coordinate Systems**: WGS84 and Web Mercator transformations with custom system support
4. **Data Import/Export**: JSON, GeoJSON, CSV with 20,000+ feature support and progress indicators
5. **Stakeout Navigation**: Real-time guidance with distance, direction, azimuth, cut/fill for points and lines
6. **Performance**: Clustering, batch processing, throttled updates, memoization for 60fps smooth operation

### Stakeout Feature Details
- Point and line stakeout navigation
- Real-time guidance display (distance, direction, azimuth, elevation)
- Visual feedback: dashed line on map, circular view (< 1m), green indicator (< 10cm)
- Smooth performance with optimized calculations

## Acceptance Criteria

### Functional
- [x] Real-time GPS tracking (internal/external GNSS)
- [x] Capture points and lines with codes
- [x] Import/export JSON, GeoJSON, CSV
- [x] Handle 20,000+ features without lag
- [x] Stakeout for points and lines
- [x] Real-time guidance during stakeout
- [x] Circular view at < 1m, green at < 10cm
- [x] Smooth 60fps map interactions

### Performance
- [x] Smooth map rendering (60fps)
- [x] No lag during stakeout
- [x] Import 20K features in < 10s
- [x] Responsive UI (< 100ms)

## Technical Stack
- React Native Expo CLI
- MapLibre GL Native v10.4.0
- Turf.js v7.2.0
- TypeScript
- All code in `src/` folder

## File Structure
```
src/
├── components/     # SurveyScreen, StakeoutBottomSheet, StakeoutCircularView
├── context/        # GnssContext, StakeoutContext
├── map/            # MapEngine
├── geospatial/     # GeospatialProcessor
├── coordinate/     # CoordinateTransformer
├── data/           # DataImporterExporter
└── utils/          # Performance, clustering, batch processing
```

## Testing
- Test with 20,000 feature dataset
- Verify smooth stakeout navigation
- Test all import/export formats
- Performance testing with large datasets

## Labels
survey-mapping, react-native, geospatial, stakeout, performance, mobile

## Priority
High

## Story Points
13

