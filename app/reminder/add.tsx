import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, Switch, StyleSheet,
} from 'react-native';
import FormScroll, { FormInput } from '@/components/FormScroll';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { scheduleReminderAlert } from '@/lib/notifications';
import { ServiceType } from '@/lib/types';
import { colors, spacing, radius } from '@/constants/theme';

function addMonths(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export default function AddReminder() {
  const router = useRouter();
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();

  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [selectedType, setSelectedType] = useState<ServiceType | null>(null);
  const [title, setTitle] = useState('');
  const [dueMileage, setDueMileage] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [intervalMiles, setIntervalMiles] = useState('');
  const [intervalMonths, setIntervalMonths] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from('service_types').select('*').order('id')
      .then(({ data }) => setServiceTypes(data ?? []));
  }, []);

  // Picking a type prefills the title and sensible intervals
  function pickType(t: ServiceType) {
    setSelectedType(t);
    if (!title) setTitle(t.name);
    if (t.default_interval_miles) setIntervalMiles(String(t.default_interval_miles));
    if (t.default_interval_months) {
      setIntervalMonths(String(t.default_interval_months));
      setDueDate(addMonths(t.default_interval_months));
    }
  }

  async function save() {
    if (!title) {
      Alert.alert('Missing info', 'Give this reminder a title.');
      return;
    }
    if (!dueMileage && !dueDate) {
      Alert.alert('Missing info', 'Set a due date, a due mileage, or both.');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.from('reminders').insert({
      vehicle_id: vehicleId,
      service_type_id: selectedType?.id ?? null,
      title,
      due_mileage: dueMileage ? parseInt(dueMileage, 10) : null,
      due_date: dueDate || null,
      is_recurring: isRecurring,
      interval_miles: isRecurring && intervalMiles ? parseInt(intervalMiles, 10) : null,
      interval_months: isRecurring && intervalMonths ? parseInt(intervalMonths, 10) : null,
    }).select().single();

    // Date-based reminders also ping your phone at 9 AM on the due date
    if (!error && data?.due_date) {
      await scheduleReminderAlert(data.id, title, data.due_date);
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

      <FormInput label="Title *" placeholder="e.g. Oil change" value={title} onChange={setTitle} />
      <FormInput label="Due at mileage" placeholder="e.g. 147500" value={dueMileage} onChange={setDueMileage} keyboardType="number-pad" />

      <Text style={styles.label}>Due date (tap a preset or type YYYY-MM-DD)</Text>
      <View style={styles.chips}>
        {[1, 3, 6, 12].map((m) => (
          <TouchableOpacity key={m} style={styles.chip} onPress={() => setDueDate(addMonths(m))}>
            <Text style={styles.chipText}>+{m} mo</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FormInput label="" placeholder="YYYY-MM-DD" value={dueDate} onChange={setDueDate} />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Repeat automatically 🔁</Text>
        <Switch value={isRecurring} onValueChange={setIsRecurring} trackColor={{ true: colors.accent }} />
      </View>

      {isRecurring && (
        <>
          <FormInput label="Repeat every X miles" placeholder="e.g. 5000" value={intervalMiles} onChange={setIntervalMiles} keyboardType="number-pad" />
          <FormInput label="Repeat every X months" placeholder="e.g. 6" value={intervalMonths} onChange={setIntervalMonths} keyboardType="number-pad" />
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={save} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? 'Saving…' : 'Set Reminder'}</Text>
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
