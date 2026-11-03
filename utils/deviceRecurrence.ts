/**
 * [sync-calendario] RF-22 - La repeticion de un evento de Nexus (RRULE como la arma Crear evento:
 * "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE;UNTIL=20261215") en el formato del calendario del telefono.
 */
import type * as Calendar from 'expo-calendar';

const FREQ: Record<string, Calendar.Frequency> = {
  DAILY: 'daily' as Calendar.Frequency,
  WEEKLY: 'weekly' as Calendar.Frequency,
  MONTHLY: 'monthly' as Calendar.Frequency,
  YEARLY: 'yearly' as Calendar.Frequency,
};
/** expo-calendar cuenta del domingo (1) al sabado (7). */
const DAY: Record<string, number> = { SU: 1, MO: 2, TU: 3, WE: 4, TH: 5, FR: 6, SA: 7 };

/** `null` si no se repite o la regla no se entiende. */
export function toDeviceRecurrence(rrule?: string | null): Calendar.RecurrenceRule | null {
  if (!rrule) return null;
  const frequency = FREQ[rrule.match(/FREQ=([A-Z]+)/)?.[1] ?? ''];
  if (!frequency) return null;

  const rule: Calendar.RecurrenceRule = { frequency, interval: Number(rrule.match(/INTERVAL=(\d+)/)?.[1] ?? 1) };
  const days = (rrule.match(/BYDAY=([A-Z,]+)/)?.[1] ?? '')
    .split(',')
    .map((d) => DAY[d])
    .filter(Boolean);
  if (frequency === FREQ.WEEKLY && days.length > 0) {
    rule.daysOfTheWeek = days.map((dayOfTheWeek) => ({ dayOfTheWeek }));
  }
  const until = rrule.match(/UNTIL=(\d{4})(\d{2})(\d{2})/);
  if (until) rule.endDate = new Date(Number(until[1]), Number(until[2]) - 1, Number(until[3]), 23, 59, 59);
  return rule;
}

/**
 * El calendario de Android (expo-calendar) cierra la app si recibe `recurrenceRule: null`: lee la
 * llave y luego usa el valor sin revisar. Sin repetición, la llave no se manda.
 */
export function withoutEmptyRecurrence<T extends { recurrenceRule?: Calendar.RecurrenceRule | null }>(
  details: T,
): Omit<T, 'recurrenceRule'> & { recurrenceRule?: Calendar.RecurrenceRule } {
  const { recurrenceRule, ...rest } = details;
  return recurrenceRule ? { ...rest, recurrenceRule } : rest;
}
