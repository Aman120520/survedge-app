/**
 * Edit Point Screen
 * Allows editing point metadata (ID, Code, etc.)
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Point } from '../geospatial/GeospatialProcessor';
import { Code } from '../data/DataImporterExporter';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

interface EditPointScreenProps {
  point: Point | null;
  codes: Code[];
  onSave: (pointId: string, updates: { id?: string; codeId?: string }) => void;
  onClose: () => void;
}

export default function EditPointScreen({ point, codes, onSave, onClose }: EditPointScreenProps) {
  const insets = useSafeAreaInsets();
  const [pointId, setPointId] = useState('');
  const [selectedCodeId, setSelectedCodeId] = useState('NO-CODE');
  const [codeMenuVisible, setCodeMenuVisible] = useState(false);

  useEffect(() => {
    if (point) {
      setPointId(point.id);
      setSelectedCodeId(point.codeId);
    }
  }, [point]);

  const handleSave = () => {
    if (!point) return;
    
    if (!pointId.trim()) {
      Alert.alert('Error', 'Point ID cannot be empty');
      return;
    }

    onSave(point.id, {
      id: pointId.trim() !== point.id ? pointId.trim() : undefined,
      codeId: selectedCodeId !== point.codeId ? selectedCodeId : undefined,
    });
    onClose();
  };

  if (!point) return null;

  const selectedCode = codes.find(c => c.id === selectedCodeId);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Point</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Point ID</Text>
          <TextInput
            style={styles.input}
            value={pointId}
            onChangeText={setPointId}
            placeholder="Enter point ID"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Code</Text>
          <TouchableOpacity
            style={styles.codeSelector}
            onPress={() => setCodeMenuVisible(true)}
          >
            <Text style={styles.codeSelectorText}>
              {selectedCode?.name || 'NO CODE'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Coordinates</Text>
          <Text style={styles.readOnlyText}>
            Latitude: {point.coords[1].toFixed(7)}
          </Text>
          <Text style={styles.readOnlyText}>
            Longitude: {point.coords[0].toFixed(7)}
          </Text>
          {point.elevation !== null && (
            <Text style={styles.readOnlyText}>
              Elevation: {point.elevation.toFixed(2)} m
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Timestamp</Text>
          <Text style={styles.readOnlyText}>
            {new Date(point.ts).toLocaleString()}
          </Text>
        </View>
      </ScrollView>

      {/* Code Selection Modal */}
      {codeMenuVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Code</Text>
              <TouchableOpacity onPress={() => setCodeMenuVisible(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {codes.map((code) => (
                <TouchableOpacity
                  key={code.id}
                  style={[
                    styles.codeOption,
                    selectedCodeId === code.id && styles.codeOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedCodeId(code.id);
                    setCodeMenuVisible(false);
                  }}
                >
                  <Text style={styles.codeOptionText}>{code.name}</Text>
                  {selectedCodeId === code.id && (
                    <Ionicons name="checkmark" size={20} color="#007bff" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007bff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  codeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  codeSelectorText: {
    fontSize: 16,
    color: '#111',
  },
  readOnlyText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    paddingVertical: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  codeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  codeOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  codeOptionText: {
    fontSize: 16,
    color: '#111',
  },
});

