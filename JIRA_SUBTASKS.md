# JIRA Subtasks: Survey Mapping Application

## Parent Task
Survey Mapping Application with Stakeout Feature

---

## Subtask 1: Project Setup and Core Architecture
**Summary**: Set up React Native Expo CLI project with TypeScript and establish core folder structure

**Description**:
- Initialize Expo CLI project with TypeScript
- Create `src/` folder structure for all application code
- Set up navigation with React Navigation
- Configure MapLibre GL Native SDK
- Set up context providers (GNSS, Stakeout)
- Configure build settings and dependencies

**Acceptance Criteria**:
- [ ] Project initializes successfully
- [ ] All code organized in `src/` folder
- [ ] TypeScript compilation passes
- [ ] Navigation structure in place
- [ ] MapLibre SDK configured and accessible

**Story Points**: 3

**Labels**: setup, architecture, typescript

---

## Subtask 2: Map Engine Integration
**Summary**: Integrate MapLibre GL Native and implement map rendering with custom style

**Description**:
- Initialize MapLibre GL Native with custom style
- Implement map view component with camera controls
- Add zoom and pan functionality
- Implement smooth camera animations
- Suppress MapLibre warning messages
- Add map controls (zoom in/out, center, fullscreen)

**Acceptance Criteria**:
- [ ] Map displays with custom style
- [ ] Smooth zoom and pan operations
- [ ] Camera animations work correctly
- [ ] Map controls functional
- [ ] No console warnings

**Story Points**: 5

**Labels**: mapping, maplibre, ui

---

## Subtask 3: GPS Location Tracking
**Summary**: Implement real-time GPS location tracking with internal and external GNSS support

**Description**:
- Request location permissions
- Set up location watcher with high accuracy
- Implement internal GPS location tracking
- Create GNSS context for external device support
- Toggle between internal and external GNSS sources
- Display current location on map
- Add heading/compass support

**Acceptance Criteria**:
- [ ] Location permissions requested and handled
- [ ] Real-time location updates work
- [ ] Internal GPS tracking functional
- [ ] External GNSS device support ready
- [ ] Location displayed on map
- [ ] Heading arrow displays correctly

**Story Points**: 5

**Labels**: gps, location, gnss

---

## Subtask 4: Geospatial Data Processing Module
**Summary**: Implement geospatial calculations using Turf.js for survey operations

**Description**:
- Integrate Turf.js library
- Implement distance calculations
- Implement area calculations
- Implement bearing/azimuth calculations
- Implement offset calculations
- Create point and line data structures
- Optimize calculations for mobile performance

**Acceptance Criteria**:
- [ ] Distance calculations accurate
- [ ] Area calculations work correctly
- [ ] Bearing calculations accurate
- [ ] All calculations performant (< 100ms)
- [ ] Data structures properly defined

**Story Points**: 5

**Labels**: geospatial, turf.js, calculations

---

## Subtask 5: Coordinate System Transformations
**Summary**: Implement coordinate system transformations (WGS84, Web Mercator)

**Description**:
- Implement WGS84 to Web Mercator transformation
- Create coordinate formatting utilities
- Add support for local coordinate systems
- Implement coordinate display in multiple formats
- Create framework for custom coordinate systems

**Acceptance Criteria**:
- [ ] WGS84 to Web Mercator transformation accurate
- [ ] Coordinate formatting works correctly
- [ ] Multiple display formats supported
- [ ] Framework extensible for custom systems

**Story Points**: 3

**Labels**: coordinates, transformation, wgs84

---

## Subtask 6: Survey Data Capture (Points and Lines)
**Summary**: Implement point and line capture functionality with code management

**Description**:
- Create point capture at current location
- Implement line creation (connecting multiple points)
- Add code management (create, select, categorize)
- Implement feature editing (modify, delete)
- Add point ID management
- Implement line closure option
- Add feature selection and details display

**Acceptance Criteria**:
- [ ] Points can be captured at GPS location
- [ ] Lines can be created connecting points
- [ ] Codes can be created and assigned
- [ ] Features can be edited and deleted
- [ ] Feature details display correctly
- [ ] Point IDs are unique

**Story Points**: 8

**Labels**: capture, points, lines, codes

---

## Subtask 7: Data Import Functionality
**Summary**: Implement data import from JSON, GeoJSON, and CSV formats

**Description**:
- Implement JSON import with validation
- Implement GeoJSON import with feature conversion
- Implement CSV import with parsing
- Add file picker integration
- Implement batch processing for large datasets
- Add progress indicators for large imports
- Handle import errors gracefully

**Acceptance Criteria**:
- [ ] JSON import works correctly
- [ ] GeoJSON import converts features properly
- [ ] CSV import parses correctly
- [ ] Large files (20K+ features) import successfully
- [ ] Progress indicator shows during import
- [ ] Error handling works

**Story Points**: 8

**Labels**: import, data, json, geojson, csv

---

## Subtask 8: Data Export Functionality
**Summary**: Implement data export to JSON, GeoJSON, and CSV formats

**Description**:
- Implement JSON export with all attributes
- Implement GeoJSON export with proper format
- Implement CSV export with headers
- Add Android StorageAccessFramework support
- Implement fallback for file sharing
- Maintain data precision during export
- Handle export errors

**Acceptance Criteria**:
- [ ] JSON export includes all data
- [ ] GeoJSON export format correct
- [ ] CSV export includes headers
- [ ] Android file picker works
- [ ] Fallback sharing works
- [ ] Data precision maintained

**Story Points**: 5

**Labels**: export, data, file-system

---

## Subtask 9: Map Rendering and Clustering
**Summary**: Implement efficient map rendering with clustering for large datasets

**Description**:
- Render points on map with labels
- Render lines on map with styling
- Implement point clustering at low zoom levels
- Add cluster expansion on tap
- Implement viewport culling
- Optimize rendering performance
- Add feature selection highlighting

**Acceptance Criteria**:
- [ ] Points render correctly with labels
- [ ] Lines render with proper styling
- [ ] Clustering works at low zoom
- [ ] Clusters expand on tap
- [ ] Performance smooth with 20K+ features
- [ ] Selection highlighting works

**Story Points**: 8

**Labels**: rendering, clustering, performance

---

## Subtask 10: Stakeout Context and Calculations
**Summary**: Create stakeout context and implement guidance calculations

**Description**:
- Create StakeoutContext with state management
- Implement point stakeout calculations
- Implement line stakeout (closest point on line)
- Calculate distance, azimuth, delta E/N/U
- Calculate directional guidance (North/South/East/West)
- Implement cut/fill elevation calculations
- Optimize calculations for performance

**Acceptance Criteria**:
- [ ] Stakeout context manages state correctly
- [ ] Point stakeout calculations accurate
- [ ] Line stakeout finds closest point
- [ ] All guidance values calculated correctly
- [ ] Calculations performant (< 100ms)

**Story Points**: 8

**Labels**: stakeout, calculations, context

---

## Subtask 11: Stakeout Bottom Sheet UI
**Summary**: Create stakeout guidance bottom sheet with real-time updates

**Description**:
- Design and implement bottom sheet component
- Display distance to target
- Display directional arrows and values
- Display azimuth (compass bearing)
- Display cut/fill elevation differences
- Display delta E, N, U values
- Show green indicator when very close (< 10cm)
- Implement smooth real-time updates

**Acceptance Criteria**:
- [ ] Bottom sheet displays correctly
- [ ] All guidance values shown
- [ ] Updates in real-time smoothly
- [ ] Green indicator appears at < 10cm
- [ ] UI matches design specifications

**Story Points**: 5

**Labels**: stakeout, ui, bottom-sheet

---

## Subtask 12: Stakeout Circular View
**Summary**: Implement circular crosshair view for close-range stakeout (< 1m)

**Description**:
- Create circular view overlay component
- Implement crosshair grid
- Display target point at center
- Show rover position indicator
- Add direction labels (N, S, E, W)
- Implement green border when very close
- Scale rover position based on deltas

**Acceptance Criteria**:
- [ ] Circular view appears at < 1m
- [ ] Crosshair displays correctly
- [ ] Rover position accurate
- [ ] Direction labels visible
- [ ] Green border at < 10cm
- [ ] Smooth transitions

**Story Points**: 5

**Labels**: stakeout, ui, circular-view

---

## Subtask 13: Stakeout Map Integration
**Summary**: Integrate stakeout line rendering and feature selection

**Description**:
- Render dashed line from rover to target
- Update line in real-time as rover moves
- Add stakeout button to feature details
- Handle point stakeout activation
- Handle line stakeout activation
- Integrate with map camera updates
- Optimize line rendering performance

**Acceptance Criteria**:
- [ ] Dashed line renders correctly
- [ ] Line updates smoothly in real-time
- [ ] Stakeout button in feature details
- [ ] Point stakeout activates correctly
- [ ] Line stakeout activates correctly
- [ ] No performance lag

**Story Points**: 5

**Labels**: stakeout, mapping, integration

---

## Subtask 14: Performance Optimizations
**Summary**: Optimize application performance for smooth 60fps operation

**Description**:
- Implement throttling for location updates
- Implement throttling for guidance updates
- Add memoization for expensive calculations
- Optimize React component rendering
- Implement batch processing utilities
- Add viewport culling
- Suppress unnecessary warnings
- Optimize map layer updates

**Acceptance Criteria**:
- [ ] Smooth 60fps map rendering
- [ ] No lag during stakeout
- [ ] Large datasets handled efficiently
- [ ] Memory usage optimized
- [ ] No unnecessary re-renders

**Story Points**: 8

**Labels**: performance, optimization

---

## Subtask 15: Testing and Test Data Generation
**Summary**: Create test data and perform comprehensive testing

**Description**:
- Create test data generation script
- Generate 20,000+ feature test file
- Test all import/export formats
- Test stakeout functionality
- Test performance with large datasets
- Test edge cases and error handling
- Document test scenarios

**Acceptance Criteria**:
- [ ] Test data generation script works
- [ ] 20K feature test file created
- [ ] All features tested
- [ ] Performance verified
- [ ] Edge cases handled
- [ ] Test documentation complete

**Story Points**: 5

**Labels**: testing, test-data, quality-assurance

---

## Subtask 16: Error Handling and User Feedback
**Summary**: Implement comprehensive error handling and user feedback

**Description**:
- Add error handling for file operations
- Add error handling for GPS failures
- Add error handling for calculations
- Implement user-friendly error messages
- Add loading indicators
- Add success/error alerts
- Handle edge cases gracefully

**Acceptance Criteria**:
- [ ] All errors handled gracefully
- [ ] User-friendly error messages
- [ ] Loading indicators shown
- [ ] Success feedback provided
- [ ] No crashes on errors

**Story Points**: 3

**Labels**: error-handling, ux

---

## Summary

**Total Story Points**: 93

**Subtasks by Category**:
- Setup & Architecture: 1 subtask (3 SP)
- Core Mapping: 2 subtasks (10 SP)
- Data Management: 3 subtasks (21 SP)
- Stakeout Feature: 4 subtasks (23 SP)
- Performance: 1 subtask (8 SP)
- Testing & QA: 2 subtasks (8 SP)
- Other: 3 subtasks (20 SP)

**Estimated Timeline**: 3-4 sprints (depending on team size)

**Dependencies**:
- Subtask 1 → All other subtasks
- Subtask 2 → Subtasks 6, 9, 13
- Subtask 3 → Subtasks 6, 10, 13
- Subtask 4 → Subtasks 6, 10
- Subtask 5 → Subtasks 6, 10
- Subtask 10 → Subtasks 11, 12, 13
- Subtask 11 → Subtask 13
- Subtask 12 → Subtask 13

