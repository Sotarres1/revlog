import { useCallback, useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { Vehicle, MaintenanceLog } from '@/lib/types';
import MakeLogo from '@/components/MakeLogo';
import { colors, spacing, radius } from '@/constants/theme';

export default function VehicleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);

  async function load() {
    const [{ data: v }, { data: l }] = await Promise.all([
      supabase.from('vehicles').select('*').eq('id', id).single(),
      supabase.from('maintenance_logs').select('*').eq('vehicle_id', id)
        .order('performed_at', { ascending: false }),
    ]);
    setVehicle(v);
    setLogs(l ?? []);
  }

  useFocusEffect(useCallback(() => { load(); }, [id]));

  function deleteLog(logId: string, logTitle: string) {
    Alert.alert('Delete this log?', `"${logTitle}" will be removed permanently.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('maintenance_logs').delete().eq('id', logId);
          load();
        },
      },
    ]);
  }

  function photoMenu() {
    if (!vehicle?.photo_url) {
      pickAndUploadPhoto();
      return;
    }
    Alert.alert('Car photo', 'What would you like to do?', [
      { text: 'Replace Photo', onPress: pickAndUploadPhoto },
      {
        text: 'Remove Photo (show logo)',
        style: 'destructive',
        onPress: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.storage.from('photos').remove([`${user!.id}/${id}.jpg`]);
          await supabase.from('vehicles').update({ photo_url: null }).eq('id', id);
          load();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function pickAndUploadPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });
    if (res.canceled) return;

    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user!.id}/${id}.jpg`;

    // Read the picked image and upload it to Supabase Storage
    const arrayBuffer = await fetch(res.assets[0].uri).then((r) => r.arrayBuffer());
    const { error } = await supabase.storage
      .from('photos')
      .upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
    if (error) {
      Alert.alert('Upload failed', error.message);
      return;
    }

    // Save the public URL on the vehicle (?t= busts the image cache after a change)
    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    await supabase.from('vehicles')
      .update({ photo_url: `${data.publicUrl}?t=${Date.now()}` })
      .eq('id', id);
    load();
  }

  if (!vehicle) return <View style={styles.container} />;

  const totalSpent = logs.reduce((sum, l) => sum + (l.cost ?? 0), 0);
  const title = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/vehicle/add', params: { editId: id } })}
            >
              <Text style={{ color: colors.accent, fontWeight: '600' }}>Edit</Text>
            </TouchableOpacity>
          ),
        }}
      />

      <TouchableOpacity onPress={photoMenu}>
        {vehicle.photo_url ? (
          <Image source={{ uri: vehicle.photo_url }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <MakeLogo make={vehicle.make} size={96} />
            <Text style={styles.photoHint}>Tap to add your own photo</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.statsRow}>
        <Stat label="Mileage" value={`${vehicle.current_mileage.toLocaleString()} mi`} />
        <Stat label="Services" value={String(logs.length)} />
        <Stat label="Total spent" value={`$${totalSpent.toFixed(0)}`} />
      </View>

      {vehicle.specs && (
        <View style={styles.specsCard}>
          {Object.entries(vehicle.specs).map(([key, value]) => (
            <View key={key} style={styles.specRow}>
              <Text style={styles.specKey}>{key}</Text>
              <Text style={styles.specValue}>{value}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actionsRow}>
        <ActionButton emoji="📊" label="Stats"
          onPress={() => router.push({ pathname: '/stats/[vehicleId]', params: { vehicleId: id } })} />
        <ActionButton emoji="🏎️" label="Mods"
          onPress={() => router.push({ pathname: '/mods/[vehicleId]', params: { vehicleId: id } })} />
        <ActionButton emoji="⛽" label="Fuel"
          onPress={() => router.push({ pathname: '/fuel/[vehicleId]', params: { vehicleId: id } })} />
        <ActionButton emoji="🔔" label="Remind"
          onPress={() => router.push({ pathname: '/reminder/add', params: { vehicleId: id } })} />
      </View>

      <Text style={styles.sectionTitle}>Service History</Text>
      <FlatList
        data={logs}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.logCard}
            onLongPress={() => deleteLog(item.id, item.title)}
            delayLongPress={500}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.logTitle}>{item.title}</Text>
              <Text style={styles.logSub}>
                {item.performed_at}
                {item.mileage ? ` · ${item.mileage.toLocaleString()} mi` : ''}
                {item.is_diy ? ' · DIY 🔧' : item.shop_name ? ` · ${item.shop_name}` : ''}
              </Text>
              {item.notes ? <Text style={styles.logNotes}>{item.notes}</Text> : null}
            </View>
            {item.cost != null && <Text style={styles.logCost}>${Number(item.cost).toFixed(2)}</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No services logged yet. Tap ＋ to add the first one.</Text>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push({ pathname: '/log/add', params: { vehicleId: id } })}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

function ActionButton({ emoji, label, onPress }: {
  emoji: string; label: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
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
  photo: { width: '100%', height: 180 },
  photoPlaceholder: {
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
  },
  photoHint: { color: colors.textMuted, marginTop: spacing.xs, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  stat: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder,
  },
  statValue: { color: colors.text, fontWeight: '700', fontSize: 16 },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  specsCard: {
    backgroundColor: colors.card, borderRadius: radius.md, marginHorizontal: spacing.md,
    marginBottom: spacing.sm, padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder,
  },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  specKey: { color: colors.textMuted, fontSize: 13 },
  specValue: { color: colors.text, fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  actionsRow: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  actionButton: {
    flex: 1, alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  actionLabel: { color: colors.text, fontSize: 12, fontWeight: '600', marginTop: 2 },
  sectionTitle: {
    color: colors.text, fontWeight: '700', fontSize: 18,
    paddingHorizontal: spacing.md, marginVertical: spacing.sm,
  },
  logCard: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder,
  },
  logTitle: { color: colors.text, fontWeight: '600', fontSize: 15 },
  logSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  logNotes: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  logCost: { color: colors.success, fontWeight: '700', marginLeft: spacing.sm },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  fab: {
    position: 'absolute', right: spacing.lg, bottom: spacing.lg,
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center', elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },
});
