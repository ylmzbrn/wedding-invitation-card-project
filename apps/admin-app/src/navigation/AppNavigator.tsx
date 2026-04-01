import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import Dashboard from '../screens/Dashboard';
import PhotoApproval from '../screens/PhotoApproval'; // Birazdan oluşturacağız
import { Ionicons } from '@expo/vector-icons'; // Expo ile hazır gelir

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName: any;
            if (route.name === 'Özet') iconName = 'stats-chart';
            else if (route.name === 'Fotoğraflar') iconName = 'images';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#ff4b2b',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Özet" component={Dashboard} />
        <Tab.Screen name="Fotoğraflar" component={PhotoApproval} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}