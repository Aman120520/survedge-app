/**
 * Map Configuration
 * 
 * IMPORTANT: During initial testing and development phases:
 * - Keep animations DISABLED to ensure consistent behavior across devices
 * - Keep followUserLocation DISABLED to prevent camera conflicts
 * - Test on multiple devices to confirm consistent map behavior
 * - Only enable animations and dynamic camera after stability is verified
 */

// MapLibre Configuration
export const MAP_CONFIG = {
    // Stable version: 10.4.0 (pinned, not using ^ to ensure consistency)
    // This version has been tested and shows consistent behavior across devices

    // Animation Settings
    // Set to false during testing/development to avoid inconsistent behavior
    // Enable only after stability is verified on multiple devices
    ENABLE_ANIMATIONS: true, // Enabled for smooth real-time tracking

    // Default animation duration (ms) - shorter for smoother real-time updates
    DEFAULT_ANIMATION_DURATION: 150, // Reduced for smoother real-time tracking

    // Camera Settings
    // Disable followUserLocation during testing to prevent camera conflicts
    // This can cause inconsistent zoomLevel behavior across devices
    FOLLOW_USER_LOCATION: true, // TODO: Set to true after stability verification

    // Map Settings
    DEFAULT_ZOOM_LEVEL: 14,
    MIN_ZOOM_LEVEL: 0,
    MAX_ZOOM_LEVEL: 18, // Reduced from 24 - most tile providers support up to zoom 18-19
    // Higher zoom levels (19+) may show blank tiles as tiles are not available

    // Location Update Settings
    LOCATION_UPDATE_INTERVAL: 0, // 0 = update on every movement (real-time)
    // Note: Location.Accuracy is an enum, use Location.Accuracy.BestForNavigation directly

    // Performance Settings
    THROTTLE_CAMERA_UPDATES: true,
    CAMERA_UPDATE_THROTTLE_MS: 50, // Reduced to 50ms for ultra-smooth real-time tracking

    // Debug Settings
    SUPPRESS_WARNINGS: true,
} as const;

/**
 * Helper function to get animation duration
 * Returns 0 if animations are disabled, otherwise returns configured duration
 */
export const getAnimationDuration = (customDuration?: number): number => {
    if (!MAP_CONFIG.ENABLE_ANIMATIONS) {
        return 0; // No animation
    }
    return customDuration ?? MAP_CONFIG.DEFAULT_ANIMATION_DURATION;
};

/**
 * Helper to check if animations should be used
 */
export const shouldAnimate = (): boolean => {
    return MAP_CONFIG.ENABLE_ANIMATIONS;
};

