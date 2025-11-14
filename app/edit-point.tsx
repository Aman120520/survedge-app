import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import EditPointScreen from '@/src/components/EditPointScreen';
import { useSurveyData } from '@/src/context/SurveyDataContext';

export default function EditPointRoute() {
  const router = useRouter();
  const { pointId } = useLocalSearchParams();
  const { points, codes, setPoints } = useSurveyData();

  const point = points.find(p => p.id === pointId as string) || null;

  const handleSave = (pointId: string, updates: { id?: string; codeId?: string }) => {
    setPoints(prev => prev.map(p => {
      if (p.id === pointId) {
        return {
          ...p,
          id: updates.id || p.id,
          codeId: updates.codeId || p.codeId,
        };
      }
      return p;
    }));
    router.back();
  };

  const handleClose = () => {
    router.back();
  };

  if (!point) {
    return null;
  }

  return (
    <EditPointScreen
      point={point}
      codes={codes}
      onSave={handleSave}
      onClose={handleClose}
    />
  );
}

