import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { C } from '../config/colors';

import LoginScreen          from '../screens/LoginScreen';
import DashboardScreen      from '../screens/DashboardScreen';
import BeneficiaryListScreen   from '../screens/beneficiaries/BeneficiaryListScreen';
import BeneficiaryDetailScreen from '../screens/beneficiaries/BeneficiaryDetailScreen';
import BeneficiaryCreateScreen from '../screens/beneficiaries/BeneficiaryCreateScreen';
import BeneficiaryEditScreen   from '../screens/beneficiaries/BeneficiaryEditScreen';
import QuickCheckScreen     from '../screens/QuickCheckScreen';
import BlogScreen           from '../screens/blog/BlogScreen';
import BlogDetailScreen     from '../screens/blog/BlogDetailScreen';
import ProfileScreen        from '../screens/ProfileScreen';
import NoticesScreen        from '../screens/notices/NoticesScreen';
import NoticeDetailScreen   from '../screens/notices/NoticeDetailScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const headerStyle = {
  headerStyle: { backgroundColor: '#fff' },
  headerTintColor: C.text,
  headerTitleStyle: { fontWeight: '700', fontSize: 16 },
  headerShadowVisible: false,
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Башкы бет' }} />
    </Stack.Navigator>
  );
}

function BeneficiaryStack() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="BeneficiaryList"   component={BeneficiaryListScreen}   options={{ title: 'Муктаждар' }} />
      <Stack.Screen name="BeneficiaryDetail" component={BeneficiaryDetailScreen} options={{ title: 'Маалымат' }} />
      <Stack.Screen name="BeneficiaryCreate" component={BeneficiaryCreateScreen} options={{ title: 'Жаңы муктаждар' }} />
      <Stack.Screen name="BeneficiaryEdit"   component={BeneficiaryEditScreen}   options={{ title: 'Өзгөртүү' }} />
      <Stack.Screen name="QuickCheck"        component={QuickCheckScreen}        options={{ title: 'Тез текшерүү' }} />
    </Stack.Navigator>
  );
}

function BlogStack() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="BlogList"   component={BlogScreen}       options={{ title: 'Блог' }} />
      <Stack.Screen name="BlogDetail" component={BlogDetailScreen} options={{ title: 'Пост' }} />
    </Stack.Navigator>
  );
}

function NoticesStack() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="NoticesList"   component={NoticesScreen}       options={{ title: 'Маалымат тактасы' }} />
      <Stack.Screen name="NoticeDetail"  component={NoticeDetailScreen}  options={{ title: 'Маалымат' }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={headerStyle}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Профиль' }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#34d399',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#0d0d18',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom || 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            HomeTab:          focused ? 'home'          : 'home-outline',
            BeneficiaryTab:   focused ? 'people'        : 'people-outline',
            NoticesTab:       focused ? 'megaphone'     : 'megaphone-outline',
            BlogTab:          focused ? 'newspaper'     : 'newspaper-outline',
            ProfileTab:       focused ? 'person'        : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab"        component={HomeStack}        options={{ title: 'Башкы' }} />
      <Tab.Screen name="BeneficiaryTab" component={BeneficiaryStack} options={{ title: 'Муктаждар' }} />
      <Tab.Screen name="NoticesTab"     component={NoticesStack}     options={{ title: 'Маалымат' }} />
      <Tab.Screen name="BlogTab"        component={BlogStack}        options={{ title: 'Блог' }} />
      <Tab.Screen name="ProfileTab"     component={ProfileStack}     options={{ title: 'Профиль' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
