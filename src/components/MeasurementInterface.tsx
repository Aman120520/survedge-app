/**
 * Measurement Interface
 * Bottom sheet for configuring survey settings before measuring a point
 */
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export interface MeasurementSettings {
  pointId: string;
  codeId: string;
  fixOnly: boolean;
  averagingMinutes: number;
  averagingSeconds: number;
}

interface MeasurementInterfaceProps {
  sheetRef: React.RefObject<any>;
  onMeasure: (settings: MeasurementSettings) => void;
  onCancel: () => void;
  codes: Array<{ id: string; name: string; type: 'point' | 'line' }>;
  selectedCodeId: string;
  onCodeSelect: (codeId: string) => void;
  onCodeSheetOpen: () => void;
  isMeasuring?: boolean;
  measurementProgress?: number; // 0-100
  measurementStatus?: string;
}

export default function MeasurementInterface({
  sheetRef,
  onMeasure,
  onCancel,
  codes,
  selectedCodeId,
  onCodeSelect,
  onCodeSheetOpen,
  isMeasuring = false,
  measurementProgress = 0,
  measurementStatus
}: MeasurementInterfaceProps) {
  const [fixOnly, setFixOnly] = useState(true);
  const [averagingMinutes, setAveragingMinutes] = useState(0);
  const [averagingSeconds, setAveragingSeconds] = useState(5);
  const [pointId, setPointId] = useState('');

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

  const handleMeasure = () => {
    const settings: MeasurementSettings = {
      pointId: pointId.trim(),
      codeId: selectedCodeId,
      fixOnly,
      averagingMinutes,
      averagingSeconds,
    };
    onMeasure(settings);
  };

  const selectedCode = codes.find((c) => c.id === selectedCodeId) || { name: 'NO-CODE', id: 'NO-CODE' };
  const totalAveragingSeconds = averagingMinutes * 60 + averagingSeconds;

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
          {/* Point ID Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Point ID</Text>
            <TextInput
              value={pointId}
              onChangeText={setPointId}
              placeholder="Optional (auto-generated if empty)"
              style={styles.input}
              editable={!isMeasuring}
            />
          </View>

          {/* Code Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Code</Text>
            <TouchableOpacity
              style={[styles.selectCode, isMeasuring && styles.disabled]}
              onPress={onCodeSheetOpen}
              disabled={isMeasuring}
            >
              <Text style={styles.codeText}>{selectedCode.name}</Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* FIX Only Toggle */}
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
                disabled={isMeasuring}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Averaging time</Text>
            <View style={styles.timeSelector}>
              <View style={styles.timeControl}>
                <TouchableOpacity
                  style={[styles.timeButton, isMeasuring && styles.disabledButton]}
                  onPress={() => adjustTime('minutes', -1)}
                  disabled={isMeasuring}
                >
                  <Ionicons name="chevron-up" size={20} color={isMeasuring ? "#ccc" : "#007bff"} />
                </TouchableOpacity>
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeValue}>
                    {String(averagingMinutes).padStart(2, '0')}
                  </Text>
                  <Text style={styles.timeLabel}>min</Text>
                </View>
                <TouchableOpacity
                  style={[styles.timeButton, isMeasuring && styles.disabledButton]}
                  onPress={() => adjustTime('minutes', 1)}
                  disabled={isMeasuring}
                >
                  <Ionicons name="chevron-down" size={20} color={isMeasuring ? "#ccc" : "#007bff"} />
                </TouchableOpacity>
              </View>

              <Text style={styles.timeSeparator}>:</Text>

              <View style={styles.timeControl}>
                <TouchableOpacity
                  style={[styles.timeButton, isMeasuring && styles.disabledButton]}
                  onPress={() => adjustTime('seconds', -1)}
                  disabled={isMeasuring}
                >
                  <Ionicons name="chevron-up" size={20} color={isMeasuring ? "#ccc" : "#007bff"} />
                </TouchableOpacity>
                <View style={styles.timeDisplay}>
                  <Text style={styles.timeValue}>
                    {String(averagingSeconds).padStart(2, '0')}
                  </Text>
                  <Text style={styles.timeLabel}>sec</Text>
                </View>
                <TouchableOpacity
                  style={[styles.timeButton, isMeasuring && styles.disabledButton]}
                  onPress={() => adjustTime('seconds', 1)}
                  disabled={isMeasuring}
                >
                  <Ionicons name="chevron-down" size={20} color={isMeasuring ? "#ccc" : "#007bff"} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.timeDisplayText}>
              {formatTime(averagingMinutes, averagingSeconds)}
            </Text>
          </View>

          {/* Measurement Progress */}
          {isMeasuring && (
            <View style={styles.progressSection}>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${measurementProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {measurementStatus || `Measuring... ${measurementProgress.toFixed(0)}%`}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.measureButton, isMeasuring && styles.measureButtonDisabled]}
            onPress={handleMeasure}
            disabled={isMeasuring}
          >
            {isMeasuring ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.measureButtonText}>Measuring...</Text>
              </>
            ) : (
              <>
                <Ionicons name="radio-button-on" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.measureButtonText}>Measure</Text>
              </>
            )}
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
  measureButtonDisabled: {
    opacity: 0.6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  selectCode: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  codeText: {
    fontSize: 16,
    color: '#111',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  progressSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007bff',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

