import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/lib/types';
import MakeLogo from '@/components/MakeLogo';
import { colors, spacing, radius } from '@/constants/theme';

export default function ArchivedVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  async function load() {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .eq('is_archived', true)
      .order('created_at');
    setVehicles(data ?? []);
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function restore(id: string) {
    await supabase.from('vehicles').update({ is_archived: false }).eq('id', id);
    load();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <MakeLogo make={item.make} size={40} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.name}>
                {item.nickname || `${item.year} ${item.make} ${item.model}`}
              </Text>
              <Text style={styles.sub}>
                {item.year} {item.make} {item.model} · {item.current_mileage.toLocaleString()} mi
              </Text>
            </View>
            <TouchableOpacity style={styles.restoreBtn} onPress={() => restore(item.id)}>
              <Text style={styles.restoreText}>Restore</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📦</Text>
            <Text style={styles.emptyTitle}>No archived vehicles</Text>
            <Text style={styles.emptySub}>Cars you archive will wait here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  name: { color: colors.text, fontWeight: '600', fontSize: 15 },
  sub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  restoreBtn: {
    backgroundColor: colors.success, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  restoreText: { color: '#000', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 120 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: spacing.md },
  emptySub: { color: colors.textMuted, marginTop: spacing.xs },
});
