import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { decodeVin } from '@/lib/vin';
import { colors, spacing, radius } from '@/constants/theme';

export default function AddVehicle() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditing = !!editId;
  const [form, setForm] = useState({
    nickname: '', make: '', model: '', year: '', trim: '', mileage: '',
  });
  const [vin, setVin] = useState('');
  const [specs, setSpecs] = useState<Record<string, string> | null>(null);
  const [decoding, setDecoding] = useState(false);
  const [busy, setBusy] = useState(false);

  // Edit mode: load the existing vehicle into the form
  useEffect(() => {
    if (!editId) return;
    supabase.from('vehicles').select('*').eq('id', editId).single().then(({ data }) => {
      if (!data) return;
      setForm({
        nickname: data.nickname ?? '',
        make: data.make,
        model: data.model,
        year: String(data.year),
        trim: data.trim ?? '',
        mileage: String(data.current_mileage),
      });
      setVin(data.vin ?? '');
      setSpecs(data.specs);
    });
  }, [editId]);

  function archive() {
    Alert.alert(
      'Archive this vehicle?',
      'It disappears from your garage but all its history is kept. You can un-archive it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('vehicles').update({ is_archived: true }).eq('id', editId);
            router.dismissAll();
          },
        },
      ]
    );
  }

  async function lookupVin() {
    if (vin.trim().length < 11) {
      Alert.alert('VIN too short', 'A full VIN is 17 characters.');
      return;
    }
    setDecoding(true);
    try {
      const result = await decodeVin(vin);
      if (result.error) {
        Alert.alert('VIN issue', result.error);
      } else {
        setForm((f) => ({
          ...f,
          make: result.make || f.make,
          model: result.model || f.model,
          year: result.year || f.year,
          trim: result.trim || f.trim,
        }));
        setSpecs(Object.keys(result.specs).length ? result.specs : null);
        const summary = Object.entries(result.specs)
          .map(([k, v]) => `${k}: ${v}`)
          .join('\n');
        Alert.alert(
          `${result.year} ${result.make} ${result.model}`,
          summary || 'Decoded — details filled in below.'
        );
      }
    } catch {
      Alert.alert('Lookup failed', 'Check your internet connection and try again.');
    }
    setDecoding(false);
  }

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function save() {
    if (!form.make || !form.model || !form.year) {
      Alert.alert('Missing info', 'Make, model, and year are required.');
      return;
    }
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const values = {
      nickname: form.nickname || null,
      make: form.make,
      model: form.model,
      year: parseInt(form.year, 10),
      trim: form.trim || null,
      vin: vin.trim() || null,
      specs,
      current_mileage: parseInt(form.mileage || '0', 10),
    };
    const { error } = isEditing
      ? await supabase.from('vehicles').update(values).eq('id', editId)
      : await supabase.from('vehicles').insert({ user_id: user!.id, ...values });
    setBusy(false);
    if (error) Alert.alert('Error', error.message);
    else router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Stack.Screen options={{ title: isEditing ? 'Edit Vehicle' : 'Add Vehicle' }} />
      <Text style={styles.label}>VIN — decode to auto-fill everything</Text>
      <View style={styles.vinRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="17-character VIN"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          value={vin}
          onChangeText={setVin}
        />
        <TouchableOpacity style={styles.vinButton} onPress={lookupVin} disabled={decoding}>
          <Text style={styles.vinButtonText}>{decoding ? '…' : '🔍 Decode'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.vinHint}>Find it on your dash (driver's side) or door jamb sticker.</Text>

      <Field label="Nickname (optional)" placeholder="e.g. The Track Rat" value={form.nickname} onChange={set('nickname')} />
      <Field label="Make *" placeholder="e.g. Mazda" value={form.make} onChange={set('make')} />
      <Field label="Model *" placeholder="e.g. MX-5 Miata" value={form.model} onChange={set('model')} />
      <Field label="Year *" placeholder="e.g. 1994" value={form.year} onChange={set('year')} keyboardType="number-pad" />
      <Field label="Trim" placeholder="e.g. R Package" value={form.trim} onChange={set('trim')} />
      <Field label="Current mileage" placeholder="e.g. 142000" value={form.mileage} onChange={set('mileage')} keyboardType="number-pad" />

      <TouchableOpacity style={styles.button} onPress={save} disabled={busy}>
        <Text style={styles.buttonText}>
          {busy ? 'Saving…' : isEditing ? 'Save Changes' : 'Add to Garage'}
        </Text>
      </TouchableOpacity>

      {isEditing && (
        <TouchableOpacity style={styles.archiveButton} onPress={archive}>
          <Text style={styles.archiveButtonText}>Archive Vehicle</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function Field(props: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        style={styles.input}
        placeholder={props.placeholder}
        placeholderTextColor={colors.textMuted}
        value={props.value}
        onChangeText={props.onChange}
        keyboardType={props.keyboardType ?? 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { color: colors.textMuted, marginBottom: spacing.xs, fontSize: 13 },
  vinRow: { flexDirection: 'row', gap: spacing.sm },
  vinButton: {
    backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: spacing.md,
    justifyContent: 'center', borderWidth: 1, borderColor: colors.accent,
  },
  vinButtonText: { color: colors.accent, fontWeight: '600' },
  vinHint: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs, marginBottom: spacing.md },
  input: {
    backgroundColor: colors.card, color: colors.text, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder,
  },
  button: {
    backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', marginTop: spacing.md,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  archiveButton: {
    borderRadius: radius.md, padding: spacing.md, alignItems: 'center',
    marginTop: spacing.md, marginBottom: spacing.xl, borderWidth: 1, borderColor: colors.danger,
  },
  archiveButtonText: { color: colors.danger, fontWeight: '700' },
});
