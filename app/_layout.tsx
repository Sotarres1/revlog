import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { setupNotifications } from '@/lib/notifications';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { colors } from '@/constants/theme';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    setupNotifications();
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Redirect: signed out -> login, signed in -> garage
  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) router.replace('/(auth)/login');
    if (session && inAuthGroup) router.replace('/(tabs)');
  }, [session, segments, loading]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/reset" options={{ headerShown: false }} />
        {/* title feeds the back-button label on pushed screens */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Garage' }} />
        <Stack.Screen name="vehicle/add" options={{ title: 'Add Vehicle', presentation: 'modal' }} />
        <Stack.Screen name="vehicle/[id]" options={{ title: 'Vehicle' }} />
        <Stack.Screen name="log/add" options={{ title: 'Log Service', presentation: 'modal' }} />
        <Stack.Screen name="reminder/add" options={{ title: 'Set Reminder', presentation: 'modal' }} />
        <Stack.Screen name="fuel/add" options={{ title: 'Log Fill-Up', presentation: 'modal' }} />
        <Stack.Screen name="fuel/[vehicleId]" options={{ title: 'Fuel Log' }} />
        <Stack.Screen name="mods/add" options={{ title: 'Add Mod', presentation: 'modal' }} />
        <Stack.Screen name="mods/[vehicleId]" options={{ title: 'Build Sheet' }} />
        <Stack.Screen name="stats/[vehicleId]" options={{ title: 'Stats' }} />
        <Stack.Screen name="archived" options={{ title: 'Archived Vehicles' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
