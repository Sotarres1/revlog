import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius } from '@/constants/theme';

const CATEGORIES = [
  'Suspension', 'Wheels/Tires', 'Exhaust', 'Intake', 'Tune', 'Brakes',
  'Exterior', 'Interior', 'Audio', 'Lighting', 'Drivetrain', 'Other',
];

export default function AddMod() {
  const router = useRouter();
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [brand, setBrand] = useState('');
  const [cost, setCost] = useState('');
  const [mileage, setMileage] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name) {
      Alert.alert('Missing info', 'Give the mod a name.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('mods').insert({
      vehicle_id: vehicleId,
      name,
      category,
      brand: brand || null,
      cost: cost ? parseFloat(cost) : null,
      mileage: mileage ? parseInt(mileage, 10) : null,
      installed_at: new Date().toISOString().slice(0, 10),
      notes: notes || null,
    });
    setBusy(false);
    if (error) Alert.alert('Error', error.message);
    else router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Field label="Mod name *" placeholder="e.g. Coilovers" value={name} onChange={setName} />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, category === c && styles.chipActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Field label="Brand" placeholder="e.g. Öhlins" value={brand} onChange={setBrand} />
      <Field label="Cost ($)" placeholder="e.g. 2200" value={cost} onChange={setCost} keyboardType="decimal-pad" />
      <Field label="Install mileage" placeholder="e.g. 141200" value={mileage} onChange={setMileage} keyboardType="number-pad" />
      <Field label="Notes" placeholder="Settings, part numbers, impressions…" value={notes} onChange={setNotes} multiline />

      <TouchableOpacity style={styles.button} onPress={save} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? 'Saving…' : 'Add to Build Sheet'}</Text>
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
  button: {
    backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
