import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, Switch, StyleSheet,
} from 'react-native';
import FormScroll, { FormInput } from '@/components/FormScroll';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ServiceType } from '@/lib/types';
import { colors, spacing, radius } from '@/constants/theme';

export default function AddLog() {
  const router = useRouter();
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();

  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [selectedType, setSelectedType] = useState<ServiceType | null>(null);
  const [title, setTitle] = useState('');
  const [mileage, setMileage] = useState('');
  const [cost, setCost] = useState('');
  const [shopName, setShopName] = useState('');
  const [notes, setNotes] = useState('');
  const [isDiy, setIsDiy] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from('service_types').select('*').order('id')
      .then(({ data }) => setServiceTypes(data ?? []));
  }, []);

  function pickType(t: ServiceType) {
    setSelectedType(t);
    if (!title) setTitle(t.name);
  }

  async function save() {
    if (!title) {
      Alert.alert('Missing info', 'Give this service a title.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('maintenance_logs').insert({
      vehicle_id: vehicleId,
      service_type_id: selectedType?.id ?? null,
      title,
      mileage: mileage ? parseInt(mileage, 10) : null,
      cost: cost ? parseFloat(cost) : null,
      shop_name: isDiy ? null : shopName || null,
      notes: notes || null,
      is_diy: isDiy,
    });

    // Keep the vehicle's odometer up to date
    if (!error && mileage) {
      await supabase.from('vehicles')
        .update({ current_mileage: parseInt(mileage, 10) })
        .eq('id', vehicleId)
        .lt('current_mileage', parseInt(mileage, 10));
    }

    setBusy(false);
    if (error) Alert.alert('Error', error.message);
    else router.back();
  }

  return (
    <FormScroll>
      <Text style={styles.label}>Service type</Text>
      <View style={styles.chips}>
        {serviceTypes.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.chip, selectedType?.id === t.id && styles.chipActive]}
            onPress={() => pickType(t)}
          >
            <Text style={[styles.chipText, selectedType?.id === t.id && styles.chipTextActive]}>
              {t.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FormInput label="Title *" placeholder="e.g. Oil change — 5W-30 full synthetic" value={title} onChange={setTitle} />
      <FormInput label="Mileage" placeholder="e.g. 142500" value={mileage} onChange={setMileage} keyboardType="number-pad" />
      <FormInput label="Cost ($)" placeholder="e.g. 64.99" value={cost} onChange={setCost} keyboardType="decimal-pad" />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>I did it myself (DIY) 🔧</Text>
        <Switch value={isDiy} onValueChange={setIsDiy} trackColor={{ true: colors.accent }} />
      </View>

      {!isDiy && (
        <FormInput label="Shop name" placeholder="e.g. Joe's Garage" value={shopName} onChange={setShopName} />
      )}

      <FormInput label="Notes" placeholder="Parts used, torque specs, observations…" value={notes} onChange={setNotes} multiline />

      <TouchableOpacity style={styles.button} onPress={save} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? 'Saving…' : 'Save Log'}</Text>
      </TouchableOpacity>
    </FormScroll>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { color: colors.textMuted, marginBottom: spacing.xs, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: 999,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 13 },
  chipTextActive: { color: colors.accent, fontWeight: '600' },
  input: {
    backgroundColor: colors.card, color: colors.text, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder,
  },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.md,
  },
  switchLabel: { color: colors.text, fontSize: 15 },
  button: {
    backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
