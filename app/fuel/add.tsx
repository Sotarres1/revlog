import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, Switch, StyleSheet,
} from 'react-native';
import FormScroll, { FormInput } from '@/components/FormScroll';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius } from '@/constants/theme';

export default function AddFuel() {
  const router = useRouter();
  const { vehicleId, editId } = useLocalSearchParams<{ vehicleId: string; editId?: string }>();
  const isEditing = !!editId;

  const [mileage, setMileage] = useState('');
  const [gallons, setGallons] = useState('');
  const [pricePerGallon, setPricePerGallon] = useState('');
  const [isFullTank, setIsFullTank] = useState(true);
  const [busy, setBusy] = useState(false);

  // Edit mode: load the existing fill-up into the form
  useEffect(() => {
    if (!editId) return;
    supabase.from('fuel_logs').select('*').eq('id', editId).single().then(({ data }) => {
      if (!data) return;
      setMileage(String(data.mileage));
      setGallons(String(data.gallons));
      setPricePerGallon(data.price_per_gallon ? String(data.price_per_gallon) : '');
      setIsFullTank(data.is_full_tank);
    });
  }, [editId]);

  const totalCost =
    gallons && pricePerGallon
      ? (parseFloat(gallons) * parseFloat(pricePerGallon)).toFixed(2)
      : null;

  async function save() {
    if (!mileage || !gallons) {
      Alert.alert('Missing info', 'Mileage and gallons are required.');
      return;
    }
    setBusy(true);
    const values = {
      mileage: parseInt(mileage, 10),
      gallons: parseFloat(gallons),
      price_per_gallon: pricePerGallon ? parseFloat(pricePerGallon) : null,
      total_cost: totalCost ? parseFloat(totalCost) : null,
      is_full_tank: isFullTank,
    };
    const { error } = isEditing
      ? await supabase.from('fuel_logs').update(values).eq('id', editId)
      : await supabase.from('fuel_logs').insert({ vehicle_id: vehicleId, ...values });

    // Keep the vehicle's odometer up to date
    if (!error) {
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
      <Stack.Screen options={{ title: isEditing ? 'Edit Fill-Up' : 'Log Fill-Up' }} />
      <FormInput keyboardType="number-pad" thousands label="Odometer reading *" placeholder="e.g. 142,850" value={mileage} onChange={setMileage} />
      <FormInput keyboardType="decimal-pad" label="Gallons *" placeholder="e.g. 11.42" value={gallons} onChange={setGallons} />
      <FormInput keyboardType="decimal-pad" label="Price per gallon ($)" placeholder="e.g. 3.89" value={pricePerGallon} onChange={setPricePerGallon} />

      {totalCost && (
        <Text style={styles.total}>Total: ${totalCost}</Text>
      )}

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Filled the tank completely</Text>
        <Switch value={isFullTank} onValueChange={setIsFullTank} trackColor={{ true: colors.accent }} />
      </View>
      <Text style={styles.hint}>
        MPG is only calculated between full tanks — partial fills are logged but skipped in the math.
      </Text>

      <TouchableOpacity style={styles.button} onPress={save} disabled={busy}>
        <Text style={styles.buttonText}>
          {busy ? 'Saving…' : isEditing ? 'Save Changes' : 'Log Fill-Up'}
        </Text>
      </TouchableOpacity>
    </FormScroll>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { color: colors.textMuted, marginBottom: spacing.xs, fontSize: 13 },
  input: {
    backgroundColor: colors.card, color: colors.text, borderRadius: radius.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.cardBorder,
  },
  total: { color: colors.success, fontWeight: '700', fontSize: 16, marginBottom: spacing.md },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.xs,
  },
  switchLabel: { color: colors.text, fontSize: 15 },
  hint: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.md },
  button: {
    backgroundColor: colors.accent, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', marginTop: spacing.sm,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
