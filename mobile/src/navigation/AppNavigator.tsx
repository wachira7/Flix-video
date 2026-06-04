import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Search, User, Heart } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import HomeScreen from '../screens/home/HomeScreen';
import AuthScreen from '../screens/auth/AuthScreen';
import SearchScreen from '../screens/home/SearchScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import LibraryScreen from '../screens/library/LibraryScreen';
import MovieDetailScreen from '../screens/movie/MovieDetailScreen';
import TVDetailScreen from '../screens/tv/TVDetailScreen';
import OnboardingScreen, { ONBOARDING_KEY } from '../screens/onboarding/OnboardingScreen';

import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';
import { RootStackParamList, MainTabParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingTop: 4,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarIcon: ({ color, size }) => <Search color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ tabBarIcon: ({ color, size }) => <Heart color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => setOnboardingDone(val === 'true'));
  }, []);

  if (loading || onboardingDone === null) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="MovieDetail"
              component={MovieDetailScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
            <Stack.Screen
              name="TVDetail"
              component={TVDetailScreen}
              options={{ animation: 'slide_from_bottom' }}
            />
          </>
        ) : onboardingDone ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
