import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet,
} from 'react-native';
import FormScroll, { FormInput } from '@/components/FormScroll';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius } from '@/constants/theme';

const CATEGORIES = [
  'Suspension', 'Wheels/Tires', 'Exhaust', 'Intake', 'Tune', 'Brakes',
  'Exterior', 'Interior', 'Audio', 'Lighting', 'Drivetrain', 'Other',
];

export default function AddMod() {
  const router = useRouter();
  const { vehicleId, editId } = useLocalSearchParams<{ vehicleId: string; editId?: string }>();
  const isEditing = !!editId;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [brand, setBrand] = useState('');
  const [cost, setCost] = useState('');
  const [mileage, setMileage] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  // Edit mode: load the existing mod into the form
  useEffect(() => {
    if (!editId) return;
    supabase.from('mods').select('*').eq('id', editId).single().then(({ data }) => {
      if (!data) return;
      setName(data.name);
      setCategory(data.category);
      setBrand(data.brand ?? '');
      setCost(data.cost ? String(data.cost) : '');
      setMileage(data.mileage ? String(data.mileage) : '');
      setNotes(data.notes ?? '');
    });
  }, [editId]);

  async function save() {
    if (!name) {
      Alert.alert('Missing info', 'Give the mod a name.');
      return;
    }
    setBusy(true);
    const values = {
      name,
      category,
      brand: brand || null,
      cost: cost ? parseFloat(cost) : null,
      mileage: mileage ? parseInt(mileage, 10) : null,
      notes: notes || null,
    };
    const { error } = isEditing
      ? await supabase.from('mods').update(values).eq('id', editId)
      : await supabase.from('mods').insert({
          vehicle_id: vehicleId,
          installed_at: new Date().toISOString().slice(0, 10),
          ...values,
        });
    setBusy(false);
    if (error) Alert.alert('Error', error.message);
    else router.back();
  }

  return (
    <FormScroll>
      <Stack.Screen options={{ title: isEditing ? 'Edit Mod' : 'Add Mod' }} />
      <FormInput label="Mod name *" placeholder="e.g. Coilovers" value={name} onChange={setName} />

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

      <FormInput label="Brand" placeholder="e.g. Öhlins" value={brand} onChange={setBrand} />
      <FormInput label="Cost ($)" placeholder="e.g. 2200" value={cost} onChange={setCost} keyboardType="decimal-pad" />
      <FormInput label="Install mileage" placeholder="e.g. 141,200" value={mileage} onChange={setMileage} keyboardType="number-pad" thousands />
      <FormInput label="Notes" placeholder="Settings, part numbers, impressions…" value={notes} onChange={setNotes} multiline />

      <TouchableOpacity style={styles.button} onPress={save} disabled={busy}>
        <Text style={styles.buttonText}>
          {busy ? 'Saving…' : isEditing ? 'Save Changes' : 'Add to Build Sheet'}
        </Text>
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
  button: {
    backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.xl,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
