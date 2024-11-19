import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NativeRouter, Route, Routes } from 'react-router-native';
import { Platform } from 'react-native';
import { NativeBaseProvider, extendTheme } from 'native-base';
import { FolderScreen } from './screens/FolderScreen';
import FolderDetailScreen from './screens/FolderDetailScreen';

const theme = extendTheme({
  config: {
    useSystemColorMode: false,
    initialColorMode: 'light',
  },
});

// Configure NativeBase for web
const config = {
  // Disable features not supported on web
  disableBackHandler: Platform.OS === 'web',
  backHandler: undefined,
  suppressColorAccessibilityWarning: true,
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NativeBaseProvider theme={theme} config={config}>
        <NativeRouter>
          <Routes>
            <Route path="/" element={<FolderScreen />} />
            <Route path="/folder/:id" element={<FolderDetailScreen />} />
          </Routes>
        </NativeRouter>
      </NativeBaseProvider>
    </SafeAreaProvider>
  );
}
