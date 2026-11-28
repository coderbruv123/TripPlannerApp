import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthContext';
import HummingbirdLoader from '../components/HummingbirdLoader';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { SavedTripsScreen } from '../screens/SavedTripsScreen';
import { StaysScreen } from '../screens/StaysScreen';
import { TripResultsScreen } from '../screens/TripResultsScreen';
import { typography, useAppTheme } from '../theme';
import type { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleStyle: { ...typography.bodyStrong, color: colors.ink },
        tabBarActiveTintColor: colors.brandStrong,
        tabBarInactiveTintColor: colors.muted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.lineSoft,
          borderTopWidth: 1,
          height: 58 + bottomInset,
          paddingTop: 6,
          paddingBottom: bottomInset,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
        tabBarItemStyle: { paddingVertical: 2 },
        tabBarIcon: ({ color, focused, size }) => {
          const iconSize = size ?? 22;
          let iconName: keyof typeof Ionicons.glyphMap;
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'compass' : 'compass-outline';
              break;
            case 'SavedTrips':
              iconName = focused ? 'bookmark' : 'bookmark-outline';
              break;
            case 'Stays':
              iconName = focused ? 'bed' : 'bed-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }
          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
        sceneStyle: { backgroundColor: colors.canvas },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Trip Planner' }} />
      <Tab.Screen name="SavedTrips" component={SavedTripsScreen} options={{ title: 'Saved Trips' }} />
      <Tab.Screen name="Stays" component={StaysScreen} options={{ title: 'Stays' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function BootstrappingScreen() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.loading, { backgroundColor: colors.canvas }]}>
      <HummingbirdLoader size={56} color={colors.brand} />
    </View>
  );
}

export function RootNavigator() {
  const { colors } = useAppTheme();
  const { isLoggedIn, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <BootstrappingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleStyle: { ...typography.bodyStrong, color: colors.ink },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      {isLoggedIn ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="TripResults" component={TripResultsScreen} options={{ title: 'Trip Results' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
