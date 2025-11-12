# Map Testing and Configuration Guide

## Overview
This guide explains the map configuration settings and testing procedures to ensure consistent behavior across devices.

## MapLibre Version
- **Current Version**: `10.4.0` (pinned, stable)
- **Location**: `package.json`
- **Note**: Version is pinned (not using `^`) to ensure consistent behavior across all devices

## Configuration File
All map settings are controlled in: `src/config/mapConfig.ts`

## Current Settings (Testing Phase)

### Animations: DISABLED
```typescript
ENABLE_ANIMATIONS: false
```
**Why**: Animations can cause inconsistent camera and zoom behavior across different devices, making debugging difficult.

**Impact**: All camera movements are instant (no animation). This ensures:
- Consistent behavior across devices
- Easier debugging
- Predictable zoom levels
- No animation-related conflicts

### Follow User Location: DISABLED
```typescript
FOLLOW_USER_LOCATION: false
```
**Why**: `followUserLocation` can cause inconsistent `zoomLevel` behavior across devices and conflicts with manual camera control.

**Impact**: Map does not automatically follow GPS location. Location updates are handled manually through camera updates.

## Testing Checklist

### Before Enabling Animations
- [ ] Test on at least 3 different Android devices
- [ ] Test on at least 2 different iOS devices
- [ ] Verify consistent zoom behavior
- [ ] Verify consistent camera positioning
- [ ] Test with different screen sizes
- [ ] Test with different Android versions (if applicable)
- [ ] Verify no crashes or freezes
- [ ] Test stakeout feature stability
- [ ] Test with large datasets (20K+ features)

### Before Enabling Follow User Location
- [ ] Verify manual camera control works correctly
- [ ] Test zoom level consistency
- [ ] Test on multiple devices
- [ ] Verify no conflicts with stakeout feature
- [ ] Test with external GNSS devices

## How to Enable Features After Testing

### Step 1: Enable Animations
1. Open `src/config/mapConfig.ts`
2. Change:
   ```typescript
   ENABLE_ANIMATIONS: false, // Change to true
   ```
3. Test thoroughly on multiple devices
4. Verify smooth animations without lag

### Step 2: Enable Follow User Location
1. Open `src/config/mapConfig.ts`
2. Change:
   ```typescript
   FOLLOW_USER_LOCATION: false, // Change to true
   ```
3. Test on multiple devices
4. Verify zoom level remains consistent
5. Verify no conflicts with manual camera control

## Configuration Options

### Animation Settings
```typescript
ENABLE_ANIMATIONS: boolean          // Master switch for all animations
DEFAULT_ANIMATION_DURATION: number  // Default duration in ms (only if enabled)
```

### Camera Settings
```typescript
FOLLOW_USER_LOCATION: boolean       // Auto-follow GPS location
DEFAULT_ZOOM_LEVEL: number          // Initial zoom level
MIN_ZOOM_LEVEL: number              // Minimum allowed zoom
MAX_ZOOM_LEVEL: number              // Maximum allowed zoom
```

### Performance Settings
```typescript
THROTTLE_CAMERA_UPDATES: boolean   // Throttle camera updates
CAMERA_UPDATE_THROTTLE_MS: number   // Throttle interval in ms
```

## Troubleshooting

### Issue: Inconsistent zoom levels across devices
**Solution**: Keep `FOLLOW_USER_LOCATION: false` and `ENABLE_ANIMATIONS: false` during testing

### Issue: Camera jumps or unexpected movements
**Solution**: Disable animations and test manual camera control first

### Issue: Map not updating with GPS
**Solution**: Check that manual camera updates are working (followUserLocation is disabled by design)

### Issue: Animations causing lag
**Solution**: Keep animations disabled until all other features are stable

## Best Practices

1. **Test First, Animate Later**: Always test core functionality with animations disabled
2. **Device Testing**: Test on multiple devices before enabling features
3. **Incremental Enablement**: Enable one feature at a time and test thoroughly
4. **Version Pinning**: Keep MapLibre version pinned to avoid unexpected changes
5. **Configuration Centralization**: All settings in one place (`mapConfig.ts`)

## Notes

- All animation durations are controlled by `mapConfig.ts`
- Setting `animationDuration: 0` is equivalent to disabling animations
- The `getAnimationDuration()` helper automatically returns 0 if animations are disabled
- Camera component respects the configuration automatically

## Related Files
- `src/config/mapConfig.ts` - Configuration file
- `src/map/MapEngine.tsx` - Map engine implementation
- `src/components/SurveyScreen.tsx` - Main map component

