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
    ENABLE_ANIMATIONS: false, // TODO: Set to true after stability verification

    // Default animation duration (ms) - only used if ENABLE_ANIMATIONS is true
    DEFAULT_ANIMATION_DURATION: 300,

    // Camera Settings
    // Disable followUserLocation during testing to prevent camera conflicts
    // This can cause inconsistent zoomLevel behavior across devices
    FOLLOW_USER_LOCATION: false, // TODO: Set to true after stability verification

    // Map Settings
    DEFAULT_ZOOM_LEVEL: 17,
    MIN_ZOOM_LEVEL: 3,
    MAX_ZOOM_LEVEL: 24,

    // Location Update Settings
    LOCATION_UPDATE_INTERVAL: 1000, // ms
    // Note: Location.Accuracy is an enum, use Location.Accuracy.BestForNavigation directly

    // Performance Settings
    THROTTLE_CAMERA_UPDATES: true,
    CAMERA_UPDATE_THROTTLE_MS: 300,

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

