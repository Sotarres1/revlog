import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius } from '@/constants/theme';

export default function Settings() {
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Error', error.message);
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.appName}>RevLog</Text>
        <Text style={styles.version}>v1.0.0 — Every mile. Every wrench. Logged.</Text>
      </View>

      <TouchableOpacity style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center',
  },
  appName: { color: colors.text, fontSize: 24, fontWeight: '800' },
  version: { color: colors.textMuted, marginTop: spacing.xs, fontSize: 13 },
  signOut: {
    marginTop: spacing.lg, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: colors.danger,
  },
  signOutText: { color: colors.danger, fontWeight: '700' },
});
