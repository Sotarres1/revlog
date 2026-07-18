import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Show notifications even while the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Call once at app startup
export async function setupNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Maintenance Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
}

// Schedule an alert for 9 AM on the reminder's due date.
// Uses the reminder's own DB id, so we can cancel it later.
export async function scheduleReminderAlert(
  reminderId: string,
  title: string,
  dueDate: string // YYYY-MM-DD
) {
  const date = new Date(`${dueDate}T09:00:00`);
  if (date.getTime() <= Date.now()) return; // never schedule in the past
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: reminderId,
      content: { title: '🔧 Maintenance due', body: title, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: 'reminders',
      },
    });
  } catch {
    // Notifications unavailable (e.g. permission denied) — reminder still shows in-app
  }
}

export async function cancelReminderAlert(reminderId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(reminderId);
  } catch {}
}
