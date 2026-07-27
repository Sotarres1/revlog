import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, Switch, StyleSheet,
} from 'react-native';
import FormScroll, { FormInput } from '@/components/FormScroll';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { scheduleReminderAlert } from '@/lib/notifications';
import { ServiceType } from '@/lib/types';
import { monthsFromNow, parseDate } from '@/lib/date';
import { colors, spacing, radius } from '@/constants/theme';

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
  const [currentMileage, setCurrentMileage] = useState<number | null>(null);
  // Remembers what we last auto-filled, so we never overwrite your own edits
  const [autoMileage, setAutoMileage] = useState('');
  const [autoDate, setAutoDate] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from('service_types').select('*').order('id')
      .then(({ data }) => setServiceTypes(data ?? []));
  }, []);

  // The car's odometer lets us suggest a due mileage
  useEffect(() => {
    supabase.from('vehicles').select('current_mileage').eq('id', vehicleId).single()
      .then(({ data }) => setCurrentMileage(data?.current_mileage ?? null));
  }, [vehicleId]);

  // Picking a type prefills the title, due mileage, and intervals.
  // Anything you typed yourself is left alone.
  function pickType(t: ServiceType) {
    if (!title || title === selectedType?.name) setTitle(t.name);
    setSelectedType(t);
    setIntervalMiles(t.default_interval_miles ? String(t.default_interval_miles) : '');
    setIntervalMonths(t.default_interval_months ? String(t.default_interval_months) : '');

    // Suggest "due at" mileage = current odometer + the service's interval
    if (t.default_interval_miles && currentMileage != null) {
      const suggested = String(currentMileage + t.default_interval_miles);
      if (!dueMileage || dueMileage === autoMileage) {
        setDueMileage(suggested);
        setAutoMileage(suggested);
      }
    }

    // Suggest a date too, but only if you haven't set one yourself
    if (t.default_interval_months) {
      const suggested = monthsFromNow(t.default_interval_months);
      if (!dueDate || dueDate === autoDate) {
        setDueDate(suggested);
        setAutoDate(suggested);
      }
    }
  }

  async function save() {
    if (!title) {
      Alert.alert('Missing info', 'Give this reminder a title.');
      return;
    }
    if (!dueMileage && !dueDate) {
      Alert.alert(
        'Missing info',
        'Set a due mileage, a due date, or both — whichever you go by.'
      );
      return;
    }
    // Convert the typed MM/DD/YYYY into the format the database stores
    const isoDueDate = dueDate ? parseDate(dueDate) : null;
    if (dueDate && !isoDueDate) {
      Alert.alert('Check the date', 'Enter the due date as MM/DD/YYYY — for example 03/15/2027.');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.from('reminders').insert({
      vehicle_id: vehicleId,
      service_type_id: selectedType?.id ?? null,
      title,
      due_mileage: dueMileage ? parseInt(dueMileage, 10) : null,
      due_date: isoDueDate,
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
      <Text style={styles.hint}>
        Set a mileage, a date, or both — RevLog alerts you on whichever comes first.
      </Text>

      <FormInput
        label="Due at mileage"
        placeholder={currentMileage != null ? `e.g. ${(currentMileage + 5000).toLocaleString()}` : 'e.g. 147500'}
        value={dueMileage}
        onChange={setDueMileage}
        keyboardType="number-pad"
        thousands
      />

      <Text style={styles.label}>Due date — optional</Text>
      <View style={styles.chips}>
        {[1, 3, 6, 12].map((m) => (
          <TouchableOpacity key={m} style={styles.chip} onPress={() => setDueDate(monthsFromNow(m))}>
            <Text style={styles.chipText}>+{m} mo</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.chip, dueDate ? styles.chipClear : null]}
          onPress={() => { setDueDate(''); setAutoDate(''); }}
        >
          <Text style={[styles.chipText, dueDate ? styles.chipClearText : null]}>No date</Text>
        </TouchableOpacity>
      </View>
      <FormInput
        label=""
        placeholder="MM/DD/YYYY"
        value={dueDate}
        onChange={setDueDate}
        keyboardType="number-pad"
      />

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
  chipClear: { borderColor: colors.warning },
  chipClearText: { color: colors.warning, fontWeight: '600' },
  hint: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.md },
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
