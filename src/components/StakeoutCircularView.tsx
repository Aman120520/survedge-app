/**
 * Stakeout Circular View Component
 * Shows circular crosshair view when stakeout target is < 1 meter
 */
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useStakeout } from '../context/StakeoutContext';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(width * 0.7, 300);

export default function StakeoutCircularView() {
  const { guidance, isActive } = useStakeout();

  if (!isActive || !guidance || !guidance.isClose) {
    return null;
  }

  // Calculate rover position relative to center
  // Scale deltas to fit in circle (1 meter = ~50% of circle radius)
  // The circle represents a 2-meter diameter view (1 meter radius)
  const scaleFactor = (CIRCLE_SIZE / 2) / 1.0; // Scale for 1 meter radius
  const roverX = Math.max(0, Math.min(CIRCLE_SIZE, CIRCLE_SIZE / 2 + (guidance.deltaE * scaleFactor)));
  const roverY = Math.max(0, Math.min(CIRCLE_SIZE, CIRCLE_SIZE / 2 - (guidance.deltaN * scaleFactor))); // Inverted Y axis (screen coordinates)

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.circle,
          guidance.isVeryClose && styles.circleGreen,
        ]}
      >
        {/* Crosshair lines */}
        <View style={styles.crosshairHorizontal} />
        <View style={styles.crosshairVertical} />

        {/* Center target point */}
        <View style={styles.centerPoint} />

        {/* Rover position indicator */}
        <View
          style={[
            styles.roverIndicator,
            {
              left: roverX - 15,
              top: roverY - 15,
            },
            guidance.isVeryClose && styles.roverIndicatorGreen,
          ]}
        >
          <View style={styles.roverCircle}>
            <Text style={styles.roverText}>R</Text>
          </View>
        </View>

        {/* Direction indicators */}
        <View style={styles.northIndicator}>
          <Text style={styles.directionLabel}>N</Text>
        </View>
        <View style={styles.southIndicator}>
          <Text style={styles.directionLabel}>S</Text>
        </View>
        <View style={styles.eastIndicator}>
          <Text style={styles.directionLabel}>E</Text>
        </View>
        <View style={styles.westIndicator}>
          <Text style={styles.directionLabel}>W</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1000,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  circleGreen: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  crosshairHorizontal: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: 1,
    backgroundColor: '#BDBDBD',
    top: CIRCLE_SIZE / 2 - 0.5,
    left: 0,
  },
  crosshairVertical: {
    position: 'absolute',
    width: 1,
    height: CIRCLE_SIZE,
    backgroundColor: '#BDBDBD',
    left: CIRCLE_SIZE / 2 - 0.5,
    top: 0,
  },
  centerPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000',
    left: CIRCLE_SIZE / 2 - 4,
    top: CIRCLE_SIZE / 2 - 4,
  },
  roverIndicator: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  roverIndicatorGreen: {
    // Additional styling when very close
  },
  roverCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  roverText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  northIndicator: {
    position: 'absolute',
    top: 10,
    left: CIRCLE_SIZE / 2 - 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  southIndicator: {
    position: 'absolute',
    bottom: 10,
    left: CIRCLE_SIZE / 2 - 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eastIndicator: {
    position: 'absolute',
    right: 10,
    top: CIRCLE_SIZE / 2 - 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  westIndicator: {
    position: 'absolute',
    left: 10,
    top: CIRCLE_SIZE / 2 - 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
});

