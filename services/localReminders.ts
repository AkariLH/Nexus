import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { EventResponse } from './event.service';
import { reminderSchedule } from '../utils/eventReminders';

const KIND = 'event-reminder';
/** iOS guarda hasta 64 avisos programados por app; se deja espacio para otros. */
const MAX_SCHEDULED = 50;

/**
 * RF-18 - Programa en el telefono los recordatorios de los eventos (notificaciones locales, sin
 * depender de Firebase). Cada vez que se cargan los eventos se reemplazan los avisos de Nexus por
 * los que tocan en los proximos 14 dias. En web no hay notificaciones programadas: no hace nada.
 */
export async function syncEventReminders(events: EventResponse[]): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const planned = reminderSchedule(events, new Date()).slice(0, MAX_SCHEDULED);
    const permission = await Notifications.getPermissionsAsync();
    let granted = permission.granted;
    if (!granted && planned.length > 0 && permission.canAskAgain) {
      granted = (await Notifications.requestPermissionsAsync()).granted;
    }
    if (!granted) return;

    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.content.data?.kind === KIND)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
    for (const r of planned) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${KIND}-${r.key}`,
        content: { title: r.title, body: r.body, data: { kind: KIND } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at },
      });
    }
  } catch {
    // Sin permiso o sin soporte, los recordatorios simplemente no suenan; la app sigue igual.
  }
}
