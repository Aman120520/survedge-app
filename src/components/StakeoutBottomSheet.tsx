/**
 * Stakeout Bottom Sheet Component
 * Displays stakeout guidance with directional arrows and values
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useStakeout } from '../context/StakeoutContext';

interface StakeoutBottomSheetProps {
  sheetRef: React.RefObject<BottomSheet>;
  featureName: string;
}

export default function StakeoutBottomSheet({
  sheetRef,
  featureName,
}: StakeoutBottomSheetProps) {
  const { guidance, stopStakeout, isActive } = useStakeout();

  if (!isActive || !guidance) return null;

  const formatDistance = (distance: number): string => {
    if (distance < 0.01) return `${(distance * 100).toFixed(2)}cm`;
    if (distance < 1) return `${(distance * 100).toFixed(0)}cm`;
    return `${distance.toFixed(2)}m`;
  };

  const formatAzimuth = (azimuth: number): string => {
    return `${azimuth.toFixed(2)}°`;
  };

  const getDirectionText = (): { text: string; distance: number } => {
    const { direction } = guidance;
    if (direction.north > 0.1) {
      return { text: 'To North', distance: direction.north };
    }
    if (direction.south > 0.1) {
      return { text: 'To South', distance: direction.south };
    }
    if (direction.east > 0.1) {
      return { text: 'To East', distance: direction.east };
    }
    if (direction.west > 0.1) {
      return { text: 'To West', distance: direction.west };
    }
    return { text: 'On Target', distance: 0 };
  };

  const directionInfo = getDirectionText();
  const isCut = guidance.deltaU < 0;
  const cutFillValue = Math.abs(guidance.deltaU);

  return (
    <BottomSheet ref={sheetRef} index={0} snapPoints={['40%']} enablePanDownToClose={false}>
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{featureName}</Text>
          <TouchableOpacity onPress={stopStakeout} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {guidance.isVeryClose ? (
          // Very close view (green indicator)
          <View style={styles.veryCloseContainer}>
            <View style={[styles.statusCircle, styles.veryCloseCircle]}>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            </View>
            <Text style={styles.veryCloseText}>On Target!</Text>
            <Text style={styles.veryCloseDistance}>
              {formatDistance(guidance.distance)}
            </Text>
          </View>
        ) : (
          // Normal guidance view
          <View style={styles.guidanceContainer}>
            {/* Distance */}
            <View style={styles.guidanceItem}>
              <View style={styles.guidanceIcon}>
                <Ionicons name="resize" size={24} color="#FF6B35" />
              </View>
              <Text style={styles.guidanceLabel}>Distance</Text>
              <Text style={styles.guidanceValue}>{formatDistance(guidance.distance)}</Text>
            </View>

            {/* Direction */}
            <View style={styles.guidanceItem}>
              <View style={styles.guidanceIcon}>
                <Ionicons
                  name={
                    directionInfo.text.includes('North')
                      ? 'arrow-up'
                      : directionInfo.text.includes('South')
                      ? 'arrow-down'
                      : directionInfo.text.includes('East')
                      ? 'arrow-forward'
                      : directionInfo.text.includes('West')
                      ? 'arrow-back'
                      : 'checkmark-circle'
                  }
                  size={24}
                  color="#FF6B35"
                />
              </View>
              <Text style={styles.guidanceLabel}>{directionInfo.text}</Text>
              <Text style={styles.guidanceValue}>
                {directionInfo.distance > 0 ? formatDistance(directionInfo.distance) : '—'}
              </Text>
            </View>

            {/* Azimuth */}
            <View style={styles.guidanceItem}>
              <View style={styles.guidanceIcon}>
                <Ionicons name="compass" size={24} color="#FF6B35" />
              </View>
              <Text style={styles.guidanceLabel}>Azimuth</Text>
              <Text style={styles.guidanceValue}>{formatAzimuth(guidance.azimuth)}</Text>
            </View>

            {/* Cut/Fill */}
            {guidance.deltaU !== 0 && (
              <View style={styles.guidanceItem}>
                <View style={styles.guidanceIcon}>
                  <Ionicons
                    name={isCut ? 'remove-circle' : 'add-circle'}
                    size={24}
                    color={isCut ? '#F44336' : '#4CAF50'}
                  />
                </View>
                <Text style={styles.guidanceLabel}>{isCut ? 'Cut' : 'Fill'}</Text>
                <Text
                  style={[
                    styles.guidanceValue,
                    { color: isCut ? '#F44336' : '#4CAF50' },
                  ]}
                >
                  {formatDistance(cutFillValue)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Coordinate deltas */}
        <View style={styles.deltaContainer}>
          <View style={styles.deltaItem}>
            <Text style={styles.deltaLabel}>ΔE</Text>
            <Text style={styles.deltaValue}>
              {guidance.deltaE >= 0 ? '+' : ''}
              {formatDistance(Math.abs(guidance.deltaE))}
            </Text>
          </View>
          <View style={styles.deltaItem}>
            <Text style={styles.deltaLabel}>ΔN</Text>
            <Text style={styles.deltaValue}>
              {guidance.deltaN >= 0 ? '+' : ''}
              {formatDistance(Math.abs(guidance.deltaN))}
            </Text>
          </View>
          <View style={styles.deltaItem}>
            <Text style={styles.deltaLabel}>ΔU</Text>
            <Text style={styles.deltaValue}>
              {guidance.deltaU >= 0 ? '+' : ''}
              {formatDistance(Math.abs(guidance.deltaU))}
            </Text>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  closeButton: {
    padding: 4,
  },
  veryCloseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  statusCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  veryCloseCircle: {
    backgroundColor: '#E8F5E9',
  },
  veryCloseText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 8,
  },
  veryCloseDistance: {
    fontSize: 18,
    color: '#666',
  },
  guidanceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  guidanceItem: {
    alignItems: 'center',
    width: '45%',
    marginBottom: 20,
  },
  guidanceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  guidanceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  guidanceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  deltaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  deltaItem: {
    alignItems: 'center',
  },
  deltaLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  deltaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
});

