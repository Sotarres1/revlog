import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Switch, StyleSheet,
} from 'react-native';
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
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
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

      <Field label="Title *" placeholder="e.g. Oil change — 5W-30 full synthetic" value={title} onChange={setTitle} />
      <Field label="Mileage" placeholder="e.g. 142500" value={mileage} onChange={setMileage} keyboardType="number-pad" />
      <Field label="Cost ($)" placeholder="e.g. 64.99" value={cost} onChange={setCost} keyboardType="decimal-pad" />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>I did it myself (DIY) 🔧</Text>
        <Switch value={isDiy} onValueChange={setIsDiy} trackColor={{ true: colors.accent }} />
      </View>

      {!isDiy && (
        <Field label="Shop name" placeholder="e.g. Joe's Garage" value={shopName} onChange={setShopName} />
      )}

      <Field label="Notes" placeholder="Parts used, torque specs, observations…" value={notes} onChange={setNotes} multiline />

      <TouchableOpacity style={styles.button} onPress={save} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? 'Saving…' : 'Save Log'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field(props: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad'; multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={[styles.input, props.multiline && { height: 90, textAlignVertical: 'top' }]}
        placeholder={props.placeholder}
        placeholderTextColor={colors.textMuted}
        value={props.value}
        onChangeText={props.onChange}
        keyboardType={props.keyboardType ?? 'default'}
        multiline={props.multiline}
      />
    </View>
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
