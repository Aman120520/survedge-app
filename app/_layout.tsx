import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { GnssProvider } from '@/src/context/GnssContext';
import { StakeoutProvider } from '@/src/context/StakeoutContext';
import { SurveyDataProvider } from '@/src/context/SurveyDataContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GnssProvider>
      <StakeoutProvider>
        <SurveyDataProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              <Stack.Screen name="project-list" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="object-list" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="edit-point" options={{ presentation: 'modal', headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </SurveyDataProvider>
      </StakeoutProvider>
    </GnssProvider>
  );
}

