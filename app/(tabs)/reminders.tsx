import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { scheduleReminderAlert, cancelReminderAlert } from '@/lib/notifications';
import { colors, spacing, radius } from '@/constants/theme';

type ReminderRow = {
  id: string;
  vehicle_id: string;
  service_type_id: number | null;
  title: string;
  due_mileage: number | null;
  due_date: string | null;
  is_recurring: boolean;
  interval_miles: number | null;
  interval_months: number | null;
  is_completed: boolean;
  vehicles: { nickname: string | null; make: string; model: string; year: number; current_mileage: number };
};

export default function Reminders() {
  const [reminders, setReminders] = useState<ReminderRow[]>([]);

  async function load() {
    const { data } = await supabase
      .from('reminders')
      .select('*, vehicles(nickname, make, model, year, current_mileage)')
      .eq('is_completed', false)
      .order('due_date', { ascending: true, nullsFirst: false });
    setReminders((data as unknown as ReminderRow[]) ?? []);
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function complete(r: ReminderRow) {
    await supabase.from('reminders').update({ is_completed: true }).eq('id', r.id);
    await cancelReminderAlert(r.id);

    // Recurring reminders automatically schedule the next one
    if (r.is_recurring && (r.interval_miles || r.interval_months)) {
      let nextDate: string | null = null;
      if (r.interval_months) {
        const d = new Date();
        d.setMonth(d.getMonth() + r.interval_months);
        nextDate = d.toISOString().slice(0, 10);
      }
      const { data } = await supabase.from('reminders').insert({
        vehicle_id: r.vehicle_id,
        service_type_id: r.service_type_id,
        title: r.title,
        due_mileage: r.interval_miles
          ? r.vehicles.current_mileage + r.interval_miles
          : null,
        due_date: nextDate,
        is_recurring: true,
        interval_miles: r.interval_miles,
        interval_months: r.interval_months,
      }).select().single();

      if (data?.due_date) {
        await scheduleReminderAlert(data.id, data.title, data.due_date);
      }
    }
    load();
  }

  function dueStatus(r: ReminderRow): { text: string; overdue: boolean } {
    const today = new Date().toISOString().slice(0, 10);
    if (r.due_date && r.due_date <= today) return { text: `Was due ${r.due_date}`, overdue: true };
    if (r.due_mileage && r.vehicles.current_mileage >= r.due_mileage)
      return { text: `Due at ${r.due_mileage.toLocaleString()} mi — you're past it`, overdue: true };
    if (r.due_date) return { text: `Due ${r.due_date}`, overdue: false };
    if (r.due_mileage) return { text: `Due at ${r.due_mileage.toLocaleString()} mi`, overdue: false };
    return { text: 'No due date', overdue: false };
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reminders}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => {
          const status = dueStatus(item);
          const carName = item.vehicles.nickname ||
            `${item.vehicles.year} ${item.vehicles.make} ${item.vehicles.model}`;
          return (
            <View style={[styles.card, status.overdue && styles.cardOverdue]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.sub}>{carName}</Text>
                <Text style={[styles.due, status.overdue && { color: colors.danger }]}>
                  {status.text}
                </Text>
              </View>
              <TouchableOpacity style={styles.doneBtn} onPress={() => complete(item)}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>✅</Text>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptySub}>Add reminders from a vehicle's page.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  cardOverdue: { borderColor: colors.danger },
  title: { color: colors.text, fontWeight: '600', fontSize: 15 },
  sub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  due: { color: colors.warning, fontSize: 13, marginTop: spacing.xs },
  doneBtn: {
    backgroundColor: colors.success, borderRadius: radius.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginLeft: spacing.sm,
  },
  doneBtnText: { color: '#000', fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 120 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginTop: spacing.md },
  emptySub: { color: colors.textMuted, marginTop: spacing.xs },
});
