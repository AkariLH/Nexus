/** Mis eventos: como se dice la fecha de un evento y en que orden se listan. */

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const clock = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function dayLabel(d: Date, now: Date): string {
  const year = d.getFullYear() === now.getFullYear() ? '' : ` ${d.getFullYear()}`;
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}${year}`;
}

/**
 * "Mié 21 oct · 09:05 – 11:05"; si dura varios dias dice el dia en que termina
 * ("Mié 9 dic 18:00 – Vie 11 dic 18:00"); si es de otro año, lo agrega.
 */
export function eventRange(startIso: string, endIso: string, now: Date): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (sameDay(start, end)) return `${dayLabel(start, now)} · ${clock(start)} – ${clock(end)}`;
  return `${dayLabel(start, now)} ${clock(start)} – ${dayLabel(end, now)} ${clock(end)}`;
}

interface Sortable {
  startDateTime: string;
  isRecurring?: boolean;
  recurrencePattern?: string | null;
}

/** Se repite sin fin, o su UNTIL todavia no llega. */
function stillRepeating(e: Sortable, now: Date): boolean {
  if (!e.isRecurring || !e.recurrencePattern) return false;
  const until = /UNTIL=(\d{4})(\d{2})(\d{2})/.exec(e.recurrencePattern);
  if (!until) return true;
  return new Date(Number(until[1]), Number(until[2]) - 1, Number(until[3]), 23, 59) >= now;
}

/** Primero lo que viene (lo mas cercano arriba) y al final lo que ya paso (lo mas reciente arriba). */
export function sortForList<T extends Sortable>(events: T[], now: Date): T[] {
  const time = (e: T) => new Date(e.startDateTime).getTime();
  const upcoming = events.filter((e) => time(e) >= now.getTime() || stillRepeating(e, now));
  const past = events.filter((e) => !upcoming.includes(e));
  return [...upcoming.sort((a, b) => time(a) - time(b)), ...past.sort((a, b) => time(b) - time(a))];
}

/** Hora de un aviso: "04:02" (hoy), "Ayer 21:49", "Mié 08:00" (esta semana) o "2 oct". */
export function noticeTime(iso: string, now: Date): string {
  const d = new Date(iso);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.ceil((startOfToday - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / 86_400_000);
  if (days <= 0) return clock(d);
  if (days === 1) return `Ayer ${clock(d)}`;
  if (days < 7) return `${DAYS[d.getDay()]} ${clock(d)}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
