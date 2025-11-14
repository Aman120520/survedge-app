/**
 * Measurement Interface
 * Bottom sheet for configuring survey settings before measuring a point
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

interface MeasurementInterfaceProps {
  sheetRef: React.RefObject<any>;
  onMeasure: () => void;
  onCancel: () => void;
}

export default function MeasurementInterface({ sheetRef, onMeasure, onCancel }: MeasurementInterfaceProps) {
  const [fixOnly, setFixOnly] = useState(true);
  const [averagingMinutes, setAveragingMinutes] = useState(0);
  const [averagingSeconds, setAveragingSeconds] = useState(5);

  const formatTime = (minutes: number, seconds: number) => {
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const adjustTime = (type: 'minutes' | 'seconds', delta: number) => {
    if (type === 'minutes') {
      setAveragingMinutes(Math.max(0, Math.min(59, averagingMinutes + delta)));
    } else {
      let newSeconds = averagingSeconds + delta;
      if (newSeconds < 0) {
        if (averagingMinutes > 0) {
          setAveragingMinutes(averagingMinutes - 1);
          setAveragingSeconds(59);
        } else {
          setAveragingSeconds(0);
        }
      } else if (newSeconds > 59) {
        if (averagingMinutes < 59) {
          setAveragingMinutes(averagingMinutes + 1);
          setAveragingSeconds(0);
        } else {
          setAveragingSeconds(59);
        }
      } else {
        setAveragingSeconds(newSeconds);
      }
    }
  };

  return (
    <BottomSheet ref={sheetRef} index={-1} snapPoints={['50%']} enablePanDownToClose>
      <BottomSheetView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Survey Settings</Text>
          <TouchableOpacity onPress={onCancel}>
            <Ionicons name="close" size={24} color="#111" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>FIX only</Text>
                <Text style={styles.settingDescription}>
                  Only measure when GPS fix is available
                </Text>
              </View>
              <Switch
                value={fixOnly}
                onValueChange={setFixOnly}
                trackColor={{ false: '#ddd', true: '#007bff' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Averaging time</Text>
            <View style={styles.timeSelector}>
              <View style={styles.timeControl}>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => adjustTime('minutes', -1)}
                >
                  <Ionicons name="chevron-up" size={20} color="#007bff" />
                </TouchableOpacity>
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeValue}>
                    {String(averagingMinutes).padStart(2, '0')}
                  </Text>
                  <Text style={styles.timeLabel}>min</Text>
                </View>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => adjustTime('minutes', 1)}
                >
                  <Ionicons name="chevron-down" size={20} color="#007bff" />
                </TouchableOpacity>
              </View>

              <Text style={styles.timeSeparator}>:</Text>

              <View style={styles.timeControl}>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => adjustTime('seconds', -1)}
                >
                  <Ionicons name="chevron-up" size={20} color="#007bff" />
                </TouchableOpacity>
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeValue}>
                    {String(averagingSeconds).padStart(2, '0')}
                  </Text>
                  <Text style={styles.timeLabel}>sec</Text>
                </View>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => adjustTime('seconds', 1)}
                >
                  <Ionicons name="chevron-down" size={20} color="#007bff" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.timeDisplayText}>
              {formatTime(averagingMinutes, averagingSeconds)}
            </Text>
          </View>

          <TouchableOpacity style={styles.measureButton} onPress={onMeasure}>
            <Ionicons name="radio-button-on" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.measureButtonText}>Measure</Text>
          </TouchableOpacity>
        </ScrollView>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  timeControl: {
    alignItems: 'center',
  },
  timeButton: {
    padding: 8,
  },
  timeDisplay: {
    alignItems: 'center',
    marginVertical: 8,
    minWidth: 60,
  },
  timeValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111',
    marginHorizontal: 16,
  },
  timeDisplayText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007bff',
    textAlign: 'center',
    marginTop: 8,
  },
  measureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  measureButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

