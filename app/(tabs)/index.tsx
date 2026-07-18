import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Vehicle } from '@/lib/types';
import VehicleCard from '@/components/VehicleCard';
import { colors, spacing, radius } from '@/constants/theme';

export default function Garage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  async function load() {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .eq('is_archived', false)
      .order('created_at');
    setVehicles(data ?? []);
  }

  // Reload whenever this screen comes into focus (e.g. after adding a vehicle)
  useFocusEffect(useCallback(() => { load(); }, []));

  function archiveVehicle(v: Vehicle) {
    Alert.alert('Archive this vehicle?', 'Hidden from your garage, but all history is kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        onPress: async () => {
          await supabase.from('vehicles').update({ is_archived: true }).eq('id', v.id);
          load();
        },
      },
    ]);
  }

  function deleteVehicle(v: Vehicle) {
    const name = v.nickname || `${v.year} ${v.make} ${v.model}`;
    Alert.alert(
      'Delete this vehicle?',
      `"${name}" and ALL its history — services, fuel, mods, reminders — will be gone forever. Archiving is safer.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('vehicles').delete().eq('id', v.id);
            load();
          },
        },
      ]
    );
  }

  function renderRightActions(v: Vehicle) {
    return (
      <View style={styles.swipeActions}>
        <TouchableOpacity
          style={[styles.swipeButton, { backgroundColor: colors.warning }]}
          onPress={() => archiveVehicle(v)}
        >
          <Text style={styles.swipeButtonText}>Archive</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeButton, { backgroundColor: colors.danger }]}
          onPress={() => deleteVehicle(v)}
        >
          <Text style={styles.swipeButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        keyExtractor={(v) => v.id}
        renderItem={({ item }) => (
          <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
            <VehicleCard vehicle={item} />
          </Swipeable>
        )}
        contentContainerStyle={{ padding: spacing.md }}
        refreshControl={
          <RefreshControl refreshing={refreshing} tintColor={colors.text}
            onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🔧</Text>
            <Text style={styles.emptyTitle}>Your garage is empty</Text>
            <Text style={styles.emptySub}>Add your first ride to start logging.</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/vehicle/add')}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  empty: { alignItems: 'center', marginTop: 120 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: spacing.md },
  emptySub: { color: colors.textMuted, marginTop: spacing.xs },
  fab: {
    position: 'absolute', right: spacing.lg, bottom: spacing.lg,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
  swipeActions: { flexDirection: 'row', marginBottom: spacing.md, marginLeft: spacing.sm },
  swipeButton: {
    width: 80, alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.md, marginLeft: spacing.xs,
  },
  swipeButtonText: { color: '#000', fontWeight: '700', fontSize: 13 },
});
