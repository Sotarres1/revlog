import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { FuelLog } from '@/lib/types';
import { colors, spacing, radius } from '@/constants/theme';

// MPG for a full-tank fill = miles since the previous full tank ÷ gallons added now
export function computeMpg(logs: FuelLog[]): Map<string, number> {
  const asc = [...logs].sort((a, b) => a.mileage - b.mileage);
  const mpg = new Map<string, number>();
  let lastFullMileage: number | null = null;
  for (const log of asc) {
    if (!log.is_full_tank) continue;
    if (lastFullMileage !== null && log.mileage > lastFullMileage && log.gallons > 0) {
      mpg.set(log.id, (log.mileage - lastFullMileage) / log.gallons);
    }
    lastFullMileage = log.mileage;
  }
  return mpg;
}

export default function FuelHistory() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const router = useRouter();
  const [logs, setLogs] = useState<FuelLog[]>([]);

  async function load() {
    const { data } = await supabase
      .from('fuel_logs')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('mileage', { ascending: false });
    setLogs(data ?? []);
  }

  useFocusEffect(useCallback(() => { load(); }, [vehicleId]));

  function deleteLog(logId: string) {
    Alert.alert('Delete this fill-up?', 'It will be removed permanently.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('fuel_logs').delete().eq('id', logId);
          load();
        },
      },
    ]);
  }

  const mpgById = computeMpg(logs);
  const mpgValues = [...mpgById.values()];
  const avgMpg = mpgValues.length
    ? mpgValues.reduce((a, b) => a + b, 0) / mpgValues.length
    : null;
  const totalSpent = logs.reduce((sum, l) => sum + (Number(l.total_cost) || 0), 0);

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <Stat label="Avg MPG" value={avgMpg ? avgMpg.toFixed(1) : '—'} />
        <Stat label="Fill-ups" value={String(logs.length)} />
        <Stat label="Fuel spend" value={`$${totalSpent.toFixed(0)}`} />
      </View>

      <FlatList
        data={logs}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        renderItem={({ item }) => {
          const mpg = mpgById.get(item.id);
          return (
            <TouchableOpacity
              style={styles.card}
              onLongPress={() => deleteLog(item.id)}
              delayLongPress={500}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  {Number(item.gallons).toFixed(2)} gal
                  {!item.is_full_tank ? ' · partial' : ''}
                </Text>
                <Text style={styles.cardSub}>
                  {item.logged_at} · {item.mileage.toLocaleString()} mi
                  {item.total_cost ? ` · $${Number(item.total_cost).toFixed(2)}` : ''}
                </Text>
              </View>
              {mpg && <Text style={styles.mpg}>{mpg.toFixed(1)} mpg</Text>}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>⛽</Text>
            <Text style={styles.emptyTitle}>No fill-ups yet</Text>
            <Text style={styles.emptySub}>
              Log two full tanks and MPG appears automatically.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push({ pathname: '/fuel/add', params: { vehicleId } })}
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
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  cardTitle: { color: colors.text, fontWeight: '600', fontSize: 15 },
  cardSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  mpg: { color: colors.success, fontWeight: '700', marginLeft: spacing.sm },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: spacing.md },
  emptySub: { color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  fab: {
    position: 'absolute', right: spacing.lg, bottom: spacing.lg,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
