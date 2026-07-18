import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Mod } from '@/lib/types';
import { colors, spacing, radius } from '@/constants/theme';

export default function BuildSheet() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const router = useRouter();
  const [mods, setMods] = useState<Mod[]>([]);

  async function load() {
    const { data } = await supabase
      .from('mods')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('installed_at', { ascending: false });
    setMods(data ?? []);
  }

  useFocusEffect(useCallback(() => { load(); }, [vehicleId]));

  function deleteMod(modId: string, modName: string) {
    Alert.alert('Delete this mod?', `"${modName}" will be removed permanently.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('mods').delete().eq('id', modId);
          load();
        },
      },
    ]);
  }

  const totalInvested = mods.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <Stat label="Mods" value={String(mods.length)} />
        <Stat label="Invested" value={`$${totalInvested.toLocaleString()}`} />
      </View>

      <FlatList
        data={mods}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onLongPress={() => deleteMod(item.id, item.name)}
            delayLongPress={500}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {item.brand ? `${item.brand} ` : ''}{item.name}
              </Text>
              <Text style={styles.cardSub}>
                {item.category ?? 'Uncategorized'}
                {item.installed_at ? ` · ${item.installed_at}` : ''}
                {item.mileage ? ` · ${item.mileage.toLocaleString()} mi` : ''}
              </Text>
              {item.notes ? <Text style={styles.cardNotes}>{item.notes}</Text> : null}
            </View>
            {item.cost != null && (
              <Text style={styles.cost}>${Number(item.cost).toLocaleString()}</Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🏎️</Text>
            <Text style={styles.emptyTitle}>Stock… for now</Text>
            <Text style={styles.emptySub}>Add your first mod to start the build sheet.</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push({ pathname: '/mods/add', params: { vehicleId } })}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  statsRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  stat: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder,
  },
  statValue: { color: colors.text, fontWeight: '700', fontSize: 16 },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  card: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder,
  },
  cardTitle: { color: colors.text, fontWeight: '600', fontSize: 15 },
  cardSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  cardNotes: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  cost: { color: colors.success, fontWeight: '700', marginLeft: spacing.sm },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: spacing.md },
  emptySub: { color: colors.textMuted, marginTop: spacing.xs },
  fab: {
    position: 'absolute', right: spacing.lg, bottom: spacing.lg,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
