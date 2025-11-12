# JIRA Subtasks - Quick Reference

## Parent Task: Survey Mapping Application with Stakeout Feature

---

### ST-1: Project Setup and Core Architecture (3 SP)
Set up React Native Expo CLI project with TypeScript and establish core folder structure
- Initialize Expo project with TypeScript
- Create src/ folder structure
- Set up navigation and context providers
- Configure MapLibre SDK

### ST-2: Map Engine Integration (5 SP)
Integrate MapLibre GL Native and implement map rendering
- Initialize MapLibre with custom style
- Implement map view with camera controls
- Add zoom, pan, smooth animations
- Suppress warnings

### ST-3: GPS Location Tracking (5 SP)
Implement real-time GPS tracking with internal/external GNSS support
- Location permissions and watcher
- Internal GPS tracking
- GNSS context for external devices
- Location display on map

### ST-4: Geospatial Data Processing Module (5 SP)
Implement geospatial calculations using Turf.js
- Distance, area, bearing calculations
- Point and line data structures
- Mobile-optimized performance

### ST-5: Coordinate System Transformations (3 SP)
Implement coordinate transformations (WGS84, Web Mercator)
- WGS84 to Web Mercator
- Coordinate formatting utilities
- Custom coordinate system framework

### ST-6: Survey Data Capture (8 SP)
Implement point and line capture with code management
- Point capture at GPS location
- Line creation connecting points
- Code management (create, select, categorize)
- Feature editing and deletion

### ST-7: Data Import Functionality (8 SP)
Implement import from JSON, GeoJSON, CSV formats
- JSON/GeoJSON/CSV import
- File picker integration
- Batch processing for large datasets
- Progress indicators

### ST-8: Data Export Functionality (5 SP)
Implement export to JSON, GeoJSON, CSV formats
- JSON/GeoJSON/CSV export
- Android StorageAccessFramework
- Fallback file sharing
- Data precision maintenance

### ST-9: Map Rendering and Clustering (8 SP)
Implement efficient map rendering with clustering
- Point and line rendering
- Clustering at low zoom levels
- Viewport culling
- Feature selection highlighting

### ST-10: Stakeout Context and Calculations (8 SP)
Create stakeout context and implement guidance calculations
- StakeoutContext state management
- Point and line stakeout calculations
- Distance, azimuth, delta E/N/U
- Directional guidance

### ST-11: Stakeout Bottom Sheet UI (5 SP)
Create stakeout guidance bottom sheet
- Distance, direction, azimuth display
- Cut/fill elevation differences
- Delta E, N, U values
- Green indicator at < 10cm

### ST-12: Stakeout Circular View (5 SP)
Implement circular crosshair view for close-range (< 1m)
- Circular overlay component
- Crosshair grid and target point
- Rover position indicator
- Direction labels

### ST-13: Stakeout Map Integration (5 SP)
Integrate stakeout line rendering and feature selection
- Dashed line from rover to target
- Real-time line updates
- Stakeout button in feature details
- Point and line stakeout activation

### ST-14: Performance Optimizations (8 SP)
Optimize for smooth 60fps operation
- Throttled location/guidance updates
- Memoization and batch processing
- Viewport culling
- Map layer optimization

### ST-15: Testing and Test Data Generation (5 SP)
Create test data and perform comprehensive testing
- Test data generation script
- 20K+ feature test file
- All features tested
- Performance verification

### ST-16: Error Handling and User Feedback (3 SP)
Implement error handling and user feedback
- Error handling for all operations
- User-friendly error messages
- Loading indicators
- Success/error alerts

---

**Total Story Points**: 93

**Dependencies**:
- ST-1 → All
- ST-2 → ST-6, ST-9, ST-13
- ST-3 → ST-6, ST-10, ST-13
- ST-4 → ST-6, ST-10
- ST-10 → ST-11, ST-12, ST-13

