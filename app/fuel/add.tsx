import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Switch, StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius } from '@/constants/theme';

export default function AddFuel() {
  const router = useRouter();
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();

  const [mileage, setMileage] = useState('');
  const [gallons, setGallons] = useState('');
  const [pricePerGallon, setPricePerGallon] = useState('');
  const [isFullTank, setIsFullTank] = useState(true);
  const [busy, setBusy] = useState(false);

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
    const { error } = await supabase.from('fuel_logs').insert({
      vehicle_id: vehicleId,
      mileage: parseInt(mileage, 10),
      gallons: parseFloat(gallons),
      price_per_gallon: pricePerGallon ? parseFloat(pricePerGallon) : null,
      total_cost: totalCost ? parseFloat(totalCost) : null,
      is_full_tank: isFullTank,
    });

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
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Field label="Odometer reading *" placeholder="e.g. 142850" value={mileage} onChange={setMileage} />
      <Field label="Gallons *" placeholder="e.g. 11.42" value={gallons} onChange={setGallons} />
      <Field label="Price per gallon ($)" placeholder="e.g. 3.89" value={pricePerGallon} onChange={setPricePerGallon} />

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
        <Text style={styles.buttonText}>{busy ? 'Saving…' : 'Log Fill-Up'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field(props: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
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
        keyboardType="decimal-pad"
      />
    </View>
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
