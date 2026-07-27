import { View, Text, TouchableOpacity, Alert, Linking, StyleSheet } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import * as Updates from 'expo-updates';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius } from '@/constants/theme';

const SUPPORT_EMAIL = 'sserratos589@gmail.com';

export default function Settings() {
  const router = useRouter();

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Error', error.message);
  }

  function contactSupport() {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=RevLog Support`);
  }

  function deleteAccount() {
    Alert.alert(
      'Delete your account?',
      'This permanently erases your account and ALL data — every vehicle, service log, photo, and reminder. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            // Second confirmation — this is truly irreversible
            Alert.alert('Are you absolutely sure?', 'Last chance to keep your data.', [
              { text: 'Keep My Account', style: 'cancel' },
              {
                text: 'Delete Everything',
                style: 'destructive',
                onPress: async () => {
                  try {
                    // Clean up stored photos first
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                      const { data: files } = await supabase.storage.from('photos').list(user.id);
                      if (files?.length) {
                        await supabase.storage
                          .from('photos')
                          .remove(files.map((f) => `${user.id}/${f.name}`));
                      }
                    }
                    // Delete the account (database rows cascade automatically)
                    const { error } = await supabase.rpc('delete_own_account');
                    if (error) throw error;
                    await supabase.auth.signOut();
                  } catch (e: unknown) {
                    const message = e instanceof Error ? e.message : 'Please try again.';
                    Alert.alert('Could not delete account', message);
                  }
                },
              },
            ]);
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.appName}>RevLog</Text>
        <Text style={styles.version}>v1.0.0 — Every mile. Every wrench. Logged.</Text>
        <Text style={styles.buildId}>
          {Updates.updateId
            ? `update ${Updates.updateId.slice(0, 8)}`
            : 'original build'}
        </Text>
      </View>

      <Row label="📦  Archived Vehicles" onPress={() => router.push('/archived' as Href)} />
      <Row label="✉️  Contact Support" onPress={contactSupport} />
      <Row label="Sign Out" onPress={signOut} />

      <TouchableOpacity style={styles.deleteRow} onPress={deleteAccount}>
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>
    </View>
  );
}

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Text style={styles.rowText}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center',
    marginBottom: spacing.lg,
  },
  appName: { color: colors.text, fontSize: 24, fontWeight: '800' },
  version: { color: colors.textMuted, marginTop: spacing.xs, fontSize: 13 },
  buildId: { color: colors.cardBorder, marginTop: 2, fontSize: 11 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder,
  },
  rowText: { color: colors.text, fontSize: 15, fontWeight: '500' },
  chevron: { color: colors.textMuted, fontSize: 20 },
  deleteRow: {
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center',
    marginTop: spacing.lg, borderWidth: 1, borderColor: colors.danger,
  },
  deleteText: { color: colors.danger, fontWeight: '700' },
});
