/**
 * Project List Screen
 * Displays list of projects and allows selection
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSurveyData } from '../context/SurveyDataContext';

export default function ProjectListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { projects, currentProject, setCurrentProject } = useSurveyData();

  const handleSelectProject = (project: any) => {
    setCurrentProject(project);
    router.push('/(tabs)/survey');
  };

  const renderProjectItem = ({ item }: { item: any }) => {
    const isSelected = currentProject?.id === item.id;
    const pointCount = item.points?.length || 0;
    const lineCount = item.lines?.length || 0;

    return (
      <TouchableOpacity
        style={[styles.projectItem, isSelected && styles.projectItemSelected]}
        onPress={() => handleSelectProject(item)}
        activeOpacity={0.7}
      >
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{item.name}</Text>
          <Text style={styles.projectMeta}>
            {pointCount} points • {lineCount} lines
          </Text>
          <Text style={styles.projectDate}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#007bff" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderProjectItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-outline" size={64} color="#BDBDBD" />
            <Text style={styles.emptyText}>No projects yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  listContent: {
    padding: 16,
  },
  projectItem: {
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
  projectItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007bff',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  projectMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  projectDate: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

