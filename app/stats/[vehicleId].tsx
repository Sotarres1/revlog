import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Vehicle, MaintenanceLog, FuelLog, Mod } from '@/lib/types';
import { computeMpg } from '@/app/fuel/[vehicleId]';
import { colors, spacing, radius } from '@/constants/theme';

export default function Stats() {
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [fuel, setFuel] = useState<FuelLog[]>([]);
  const [mods, setMods] = useState<Mod[]>([]);

  async function load() {
    const [v, l, f, m] = await Promise.all([
      supabase.from('vehicles').select('*').eq('id', vehicleId).single(),
      supabase.from('maintenance_logs').select('*').eq('vehicle_id', vehicleId),
      supabase.from('fuel_logs').select('*').eq('vehicle_id', vehicleId),
      supabase.from('mods').select('*').eq('vehicle_id', vehicleId),
    ]);
    setVehicle(v.data);
    setLogs(l.data ?? []);
    setFuel(f.data ?? []);
    setMods(m.data ?? []);
  }

  useFocusEffect(useCallback(() => { load(); }, [vehicleId]));

  // ---- Totals ----
  const maintTotal = logs.reduce((s, l) => s + (Number(l.cost) || 0), 0);
  const fuelTotal = fuel.reduce((s, f) => s + (Number(f.total_cost) || 0), 0);
  const modsTotal = mods.reduce((s, m) => s + (Number(m.cost) || 0), 0);
  const grandTotal = maintTotal + fuelTotal + modsTotal;

  // Cost per mile: total spend across the mileage range we've tracked
  const mileages = [
    ...logs.map((l) => l.mileage),
    ...fuel.map((f) => f.mileage),
  ].filter((m): m is number => m != null && m > 0);
  const mileSpan = mileages.length >= 2 ? Math.max(...mileages) - Math.min(...mileages) : 0;
  const costPerMile = mileSpan > 0 ? grandTotal / mileSpan : null;

  // ---- Monthly spend, last 6 months (maintenance + fuel) ----
  const months: { label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7); // YYYY-MM
    const total =
      logs.filter((l) => l.performed_at?.startsWith(key))
        .reduce((s, l) => s + (Number(l.cost) || 0), 0) +
      fuel.filter((f) => f.logged_at?.startsWith(key))
        .reduce((s, f) => s + (Number(f.total_cost) || 0), 0);
    months.push({ label: d.toLocaleString('en', { month: 'short' }), total });
  }

  // ---- Recent MPG (last 8 calculated values) ----
  const mpgById = computeMpg(fuel);
  const mpgSeries = [...fuel]
    .sort((a, b) => a.mileage - b.mileage)
    .map((f) => mpgById.get(f.id))
    .filter((v): v is number => v != null)
    .slice(-8);

  if (!vehicle) return <View style={styles.container} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <View style={styles.statsRow}>
        <Stat label="Total spend" value={`$${grandTotal.toFixed(0)}`} />
        <Stat label="Cost / mile" value={costPerMile ? `$${costPerMile.toFixed(2)}` : '—'} />
      </View>
      <View style={styles.statsRow}>
        <Stat label="Maintenance" value={`$${maintTotal.toFixed(0)}`} />
        <Stat label="Fuel" value={`$${fuelTotal.toFixed(0)}`} />
        <Stat label="Mods" value={`$${modsTotal.toFixed(0)}`} />
      </View>

      <Card title="Spending — last 6 months">
        <BarChart
          data={months.map((m) => ({ label: m.label, value: m.total }))}
          format={(v) => `$${v.toFixed(0)}`}
        />
      </Card>

      <Card title="MPG — recent full tanks">
        {mpgSeries.length ? (
          <BarChart
            data={mpgSeries.map((v, i) => ({ label: `${i + 1}`, value: v }))}
            format={(v) => v.toFixed(1)}
            color={colors.success}
          />
        ) : (
          <Text style={styles.emptyText}>Log two full tanks to see MPG here.</Text>
        )}
      </Card>
    </ScrollView>
  );
}

// Simple bar chart built from plain Views — no chart library needed
function BarChart({
  data, format, color = colors.accent,
}: {
  data: { label: string; value: number }[];
  format: (v: number) => string;
  color?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={styles.chart}>
      {data.map((d, i) => (
        <View key={i} style={styles.barColumn}>
          <Text style={styles.barValue}>{d.value > 0 ? format(d.value) : ''}</Text>
          <View style={[styles.bar, { height: Math.max((d.value / max) * 120, 2), backgroundColor: color }]} />
          <Text style={styles.barLabel}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
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
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  stat: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder,
  },
  statValue: { color: colors.text, fontWeight: '700', fontSize: 16 },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  card: {
    backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder,
  },
  cardTitle: { color: colors.text, fontWeight: '700', fontSize: 15, marginBottom: spacing.md },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barColumn: { flex: 1, alignItems: 'center' },
  bar: { width: '55%', borderRadius: 4 },
  barValue: { color: colors.textMuted, fontSize: 10, marginBottom: 4 },
  barLabel: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
  emptyText: { color: colors.textMuted, fontSize: 13 },
});
