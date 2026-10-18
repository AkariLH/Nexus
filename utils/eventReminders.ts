/**
 * RF-18 - Recordatorios de eventos. Se guardan en el backend con el evento; aqui se calculan los
 * avisos de los proximos 14 dias para programarlos como notificaciones locales del telefono.
 */
import type { EventResponse } from '../services/event.service';
import { buildCalendarItems } from './calendarLayout';

export const REMINDER_HORIZON_DAYS = 14;

export interface ScheduledReminder {
  /** Unico por ocurrencia y recordatorio, para no programar dos veces lo mismo. */
  key: string;
  at: Date;
  title: string;
  body: string;
}

function beforePhrase(minutes: number): string {
  if (minutes % 1440 === 0) return minutes === 1440 ? '1 día' : `${minutes / 1440} días`;
  if (minutes % 60 === 0) return minutes === 60 ? '1 hora' : `${minutes / 60} horas`;
  return minutes === 1 ? '1 minuto' : `${minutes} minutos`;
}

/** Avisos futuros de los eventos aprobados por los dos, incluidas las repeticiones. */
export function reminderSchedule(events: EventResponse[], now: Date): ScheduledReminder[] {
  const range = { start: now, end: new Date(now.getTime() + REMINDER_HORIZON_DAYS * 86_400_000) };
  const byId = new Map(events.map((e) => [e.id, e]));
  const items = buildCalendarItems({ events, external: [], userId: 0, partnerName: '', range });

  return items
    .flatMap((item) => {
      const event = item.eventId === null ? undefined : byId.get(item.eventId);
      return (event?.reminders ?? []).map((r) => ({
        key: `${event!.id}-${item.start.getTime()}-${r.minutesBefore}`,
        at: new Date(item.start.getTime() - r.minutesBefore * 60_000),
        title: event!.title,
        body: [`Empieza en ${beforePhrase(r.minutesBefore)}`, event!.location].filter(Boolean).join(' · '),
      }));
    })
    .filter((r) => r.at.getTime() > now.getTime() && r.at.getTime() <= range.end.getTime())
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}
