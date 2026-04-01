import React from 'react';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import Login from './src/screens/Login';
import { ActivityIndicator, View } from 'react-native';

function RootNavigation() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#ff4b2b" />
      </View>
    );
  }

  return isLoggedIn ? <AppNavigator /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigation />
    </AuthProvider>
  );
}