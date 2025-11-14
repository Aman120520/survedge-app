/**
 * Export Format Selection Screen
 * Allows selecting export format and column format for CSV
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

interface ExportFormatScreenProps {
  sheetRef: React.RefObject<any>;
  onExport: (format: 'JSON' | 'GeoJSON' | 'CSV', columnFormat?: string) => void;
  onClose: () => void;
}

const COLUMN_FORMATS = [
  { id: 'PENZD', name: 'PENZD', description: 'Point, Easting, Northing, Zone, Description' },
  { id: 'PXYZ', name: 'PXYZ', description: 'Point, X, Y, Z' },
  { id: 'PNEZ', name: 'PNEZ', description: 'Point, Northing, Easting, Zone' },
  { id: 'STANDARD', name: 'Standard', description: 'Type, ID, Code, Longitude, Latitude, Elevation, Timestamp' },
];

export default function ExportFormatScreen({ sheetRef, onExport, onClose }: ExportFormatScreenProps) {
  const [selectedFormat, setSelectedFormat] = useState<'JSON' | 'GeoJSON' | 'CSV' | null>(null);
  const [selectedColumnFormat, setSelectedColumnFormat] = useState<string>('STANDARD');
  const [showColumnFormat, setShowColumnFormat] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleFormatSelect = (format: 'JSON' | 'GeoJSON' | 'CSV') => {
    setSelectedFormat(format);
    if (format === 'CSV') {
      setShowColumnFormat(true);
    } else {
      onExport(format);
      onClose();
    }
  };

  const handleColumnFormatSelect = (format: string) => {
    setSelectedColumnFormat(format);
    setShowColumnFormat(false);
    if (selectedFormat) {
      onExport(selectedFormat, format);
      onClose();
    }
  };

  const selectedFormatInfo = COLUMN_FORMATS.find(f => f.id === selectedColumnFormat);

  return (
    <>
      <BottomSheet ref={sheetRef} index={-1} snapPoints={['50%']} enablePanDownToClose>
        <BottomSheetView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Export Format</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#111" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <TouchableOpacity
              style={styles.formatOption}
              onPress={() => handleFormatSelect('JSON')}
            >
              <View style={styles.formatInfo}>
                <Text style={styles.formatName}>JSON</Text>
                <Text style={styles.formatDescription}>JavaScript Object Notation</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.formatOption}
              onPress={() => handleFormatSelect('GeoJSON')}
            >
              <View style={styles.formatInfo}>
                <Text style={styles.formatName}>GeoJSON</Text>
                <Text style={styles.formatDescription}>Geographic JSON format</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.formatOption}
              onPress={() => handleFormatSelect('CSV')}
            >
              <View style={styles.formatInfo}>
                <Text style={styles.formatName}>CSV</Text>
                <Text style={styles.formatDescription}>Comma-separated values</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
            </TouchableOpacity>
          </ScrollView>
        </BottomSheetView>
      </BottomSheet>

      {/* Column Format Selection Modal */}
      <Modal
        visible={showColumnFormat}
        transparent
        animationType="slide"
        onRequestClose={() => setShowColumnFormat(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Column Format</Text>
              <TouchableOpacity onPress={() => setShowColumnFormat(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {COLUMN_FORMATS.map((format) => (
                <TouchableOpacity
                  key={format.id}
                  style={[
                    styles.columnFormatOption,
                    selectedColumnFormat === format.id && styles.columnFormatOptionSelected,
                  ]}
                  onPress={() => handleColumnFormatSelect(format.id)}
                >
                  <View style={styles.columnFormatInfo}>
                    <Text style={styles.columnFormatName}>{format.name}</Text>
                    <Text style={styles.columnFormatDescription}>{format.description}</Text>
                  </View>
                  {selectedColumnFormat === format.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#007bff" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.infoButton}
                onPress={() => setShowInfo(true)}
              >
                <Ionicons name="information-circle-outline" size={20} color="#007bff" />
                <Text style={styles.infoButtonText}>Info</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Info Modal */}
      <Modal
        visible={showInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfo(false)}
      >
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModalContent}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>Format Information</Text>
              <TouchableOpacity onPress={() => setShowInfo(false)}>
                <Ionicons name="close" size={24} color="#111" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.infoModalScroll}>
              {selectedFormatInfo && (
                <>
                  <Text style={styles.infoModalLabel}>Format: {selectedFormatInfo.name}</Text>
                  <Text style={styles.infoModalDescription}>
                    {selectedFormatInfo.description}
                  </Text>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
  formatOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  formatInfo: {
    flex: 1,
  },
  formatName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  formatDescription: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
  },
  modalScroll: {
    flex: 1,
  },
  columnFormatOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  columnFormatOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  columnFormatInfo: {
    flex: 1,
  },
  columnFormatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  columnFormatDescription: {
    fontSize: 14,
    color: '#666',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  infoButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
  },
  infoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  infoModalScroll: {
    padding: 16,
  },
  infoModalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  infoModalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

