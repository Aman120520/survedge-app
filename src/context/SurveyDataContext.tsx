/**
 * Survey Data Context Provider
 * Manages survey points, lines, codes, and projects
 */
import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { Alert, Platform } from 'react-native';
import { Point, Line } from '../geospatial/GeospatialProcessor';
import {
  Code,
  SurveyData,
  exportToJSON,
  exportToGeoJSON,
  exportToCSV,
  importFromJSON,
  importFromGeoJSON,
  importFromCSV,
} from '../data/DataImporterExporter';
import { processBatch } from '../utils/batchProcessor';

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  points: Point[];
  lines: Line[];
  codes: Code[];
}

interface SurveyContextType {
  projects: Project[];
  currentProject: Project | null;
  points: Point[];
  lines: Line[];
  codes: Code[];
  isLoading: boolean;
  importProgress: number;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setCurrentProject: (project: Project | null) => void;
  setPoints: React.Dispatch<React.SetStateAction<Point[]>>;
  setLines: React.Dispatch<React.SetStateAction<Line[]>>;
  setCodes: React.Dispatch<React.SetStateAction<Code[]>>;
  exportData: (format: 'JSON' | 'GeoJSON' | 'CSV', columnFormat?: string) => Promise<void>;
  importData: (format: 'JSON' | 'GeoJSON' | 'CSV') => Promise<void>;
  createProject: (name: string) => Project;
  deleteProject: (projectId: string) => void;
}

const SurveyDataContext = createContext<SurveyContextType | undefined>(undefined);

// Mock data for initial project
const getInitialProject = (): Project => {
  return {
    id: 'demo-project-1',
    name: 'Demo project',
    createdAt: new Date().toISOString(),
    points: [],
    lines: [],
    codes: [
      { id: 'NO-CODE', name: 'NO CODE', type: 'point' },
    ],
  };
};

export const SurveyDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([getInitialProject()]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(getInitialProject());
  const [isLoading, setIsLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const setCurrentProject = useCallback((project: Project | null) => {
    setCurrentProjectState(project);
  }, []);

  const points = currentProject?.points || [];
  const lines = currentProject?.lines || [];
  const codes = currentProject?.codes || [];

  const setPoints = useCallback((updater: React.SetStateAction<Point[]>) => {
    if (!currentProject) return;
    setProjects(prev => prev.map(p => {
      if (p.id === currentProject.id) {
        const newPoints = typeof updater === 'function' ? updater(p.points) : updater;
        return { ...p, points: newPoints };
      }
      return p;
    }));
    setCurrentProjectState(prev => {
      if (!prev) return null;
      const newPoints = typeof updater === 'function' ? updater(prev.points) : updater;
      return { ...prev, points: newPoints };
    });
  }, [currentProject]);

  const setLines = useCallback((updater: React.SetStateAction<Line[]>) => {
    if (!currentProject) return;
    setProjects(prev => prev.map(p => {
      if (p.id === currentProject.id) {
        const newLines = typeof updater === 'function' ? updater(p.lines) : updater;
        return { ...p, lines: newLines };
      }
      return p;
    }));
    setCurrentProjectState(prev => {
      if (!prev) return null;
      const newLines = typeof updater === 'function' ? updater(prev.lines) : updater;
      return { ...prev, lines: newLines };
    });
  }, [currentProject]);

  const setCodes = useCallback((updater: React.SetStateAction<Code[]>) => {
    if (!currentProject) return;
    setProjects(prev => prev.map(p => {
      if (p.id === currentProject.id) {
        const newCodes = typeof updater === 'function' ? updater(p.codes) : updater;
        return { ...p, codes: newCodes };
      }
      return p;
    }));
    setCurrentProjectState(prev => {
      if (!prev) return null;
      const newCodes = typeof updater === 'function' ? updater(prev.codes) : updater;
      return { ...prev, codes: newCodes };
    });
  }, [currentProject]);

  const createProject = useCallback((name: string): Project => {
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      points: [],
      lines: [],
      codes: [{ id: 'NO-CODE', name: 'NO CODE', type: 'point' }],
    };
    setProjects(prev => [...prev, newProject]);
    return newProject;
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (currentProject?.id === projectId) {
      const remaining = projects.filter(p => p.id !== projectId);
      setCurrentProjectState(remaining.length > 0 ? remaining[0] : null);
    }
  }, [currentProject, projects]);

  const exportData = useCallback(async (format: 'JSON' | 'GeoJSON' | 'CSV' = 'JSON', columnFormat?: string): Promise<void> => {
    try {
      if (!currentProject) {
        Alert.alert('No Project', 'Please select a project first.');
        return;
      }

      const data: SurveyData = { points, lines, codes };
      let fileUri: string;

      switch (format) {
        case 'JSON':
          fileUri = await exportToJSON(data);
          break;
        case 'GeoJSON':
          fileUri = await exportToGeoJSON(data);
          break;
        case 'CSV':
          fileUri = await exportToCSV(data, columnFormat);
          break;
        default:
          fileUri = await exportToJSON(data);
      }

      Alert.alert('Exported', `File exported successfully as ${format}!`);
    } catch (e: any) {
      console.error('Export Failed:', e);
      Alert.alert('Export Failed', e.message);
    }
  }, [points, lines, codes, currentProject]);

  const importData = useCallback(async (format: 'JSON' | 'GeoJSON' | 'CSV' = 'JSON'): Promise<void> => {
    try {
      if (!currentProject) {
        Alert.alert('No Project', 'Please select a project first.');
        return;
      }

      setIsLoading(true);
      setImportProgress(0);

      let data: SurveyData;

      switch (format) {
        case 'JSON':
          data = await importFromJSON();
          break;
        case 'GeoJSON':
          data = await importFromGeoJSON();
          break;
        case 'CSV':
          data = await importFromCSV();
          break;
        default:
          data = await importFromJSON();
      }

      const totalFeatures = (data.points?.length || 0) + (data.lines?.length || 0);

      if (totalFeatures > 5000) {
        setImportProgress(50);

        if (data.points && data.points.length > 0) {
          await processBatch(data.points, (point) => point, 1000, (processed, total) => {
            setImportProgress(50 + (processed / total) * 25);
          });
        }

        setImportProgress(75);

        if (data.lines && data.lines.length > 0) {
          await processBatch(data.lines, (line) => line, 1000, (processed, total) => {
            setImportProgress(75 + (processed / total) * 25);
          });
        }
      }

      setImportProgress(100);

      setPoints(data.points || []);
      setLines(data.lines || []);
      setCodes(data.codes || [{ id: 'NO-CODE', name: 'NO CODE', type: 'point' }]);

      setIsLoading(false);
      setImportProgress(0);

      Alert.alert(
        'Import Successful',
        `Imported ${data.points?.length || 0} points and ${data.lines?.length || 0} lines!`
      );
    } catch (e: any) {
      console.error('Import Failed:', e);
      setIsLoading(false);
      setImportProgress(0);
      Alert.alert('Import Failed', e.message);
    }
  }, [currentProject, setPoints, setLines, setCodes]);

  const contextValue = useMemo(() => ({
    projects,
    currentProject,
    points,
    lines,
    codes,
    isLoading,
    importProgress,
    setProjects,
    setCurrentProject,
    setPoints,
    setLines,
    setCodes,
    exportData,
    importData,
    createProject,
    deleteProject,
  }), [projects, currentProject, points, lines, codes, isLoading, importProgress, exportData, importData, createProject, deleteProject, setPoints, setLines, setCodes]);

  return (
    <SurveyDataContext.Provider value={contextValue}>
      {children}
    </SurveyDataContext.Provider>
  );
};

export const useSurveyData = (): SurveyContextType => {
  const context = useContext(SurveyDataContext);
  if (!context) {
    throw new Error('useSurveyData must be used within a SurveyDataProvider');
  }
  return context;
};

