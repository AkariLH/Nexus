/**
 * [avisos-calendario] Figma J5 - Textos del detalle de un evento del calendario: la fecha y hora de
 * la ocurrencia que se toco (no la de la serie) y la repeticion en palabras.
 */
import { listLabel } from './linkFormat';

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const BYDAY: Record<string, string> = { MO: 'lunes', TU: 'martes', WE: 'miércoles', TH: 'jueves', FR: 'viernes', SA: 'sábados', SU: 'domingos' };

const two = (n: number) => String(n).padStart(2, '0');
const clock = (d: Date) => `${two(d.getHours())}:${two(d.getMinutes())}`;
const dayOf = (d: Date) => `${WEEKDAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "Miércoles 28 de octubre · 09:00 – 09:05"; si cruza la medianoche, con los dos dias. */
export function detailWhen(start: Date, end: Date, allDay: boolean): string {
  if (allDay) return `${capital(dayOf(start))} · Todo el día`;
  if (sameDay(start, end)) return `${capital(dayOf(start))} · ${clock(start)} – ${clock(end)}`;
  return `${capital(dayOf(start))}, ${clock(start)} – ${dayOf(end)}, ${clock(end)}`;
}

/** El evento con las horas de la ocurrencia que se toco; en una serie, el back solo trae la primera. */
export function atOccurrence<T extends { startDateTime: string; endDateTime: string }>(event: T, start: Date, end: Date): T {
  return { ...event, startDateTime: start.toISOString(), endDateTime: end.toISOString() };
}

/** "Cada semana los lunes y miércoles", "Todos los días"... ; null si no se repite o no se entiende. */
export function recurrenceLabel(rrule?: string | null): string | null {
  if (!rrule) return null;
  const freq = rrule.match(/FREQ=([A-Z]+)/)?.[1];
  if (!freq) return null;
  const interval = Number(rrule.match(/INTERVAL=(\d+)/)?.[1] ?? 1);
  const days = (rrule.match(/BYDAY=([A-Z,0-9-]+)/)?.[1] ?? '')
    .split(',')
    .map((d) => BYDAY[d.replace(/^[-0-9]+/, '')])
    .filter(Boolean);
  const until = rrule.match(/UNTIL=(\d{4})(\d{2})(\d{2})/);

  let text: string;
  if (freq === 'DAILY') text = interval === 1 ? 'Todos los días' : `Cada ${interval} días`;
  else if (freq === 'WEEKLY') {
    text = interval === 1 ? 'Cada semana' : `Cada ${interval} semanas`;
    if (days.length > 0) text += ` los ${listLabel(days)}`;
  } else if (freq === 'MONTHLY') text = interval === 1 ? 'Cada mes' : `Cada ${interval} meses`;
  else if (freq === 'YEARLY') text = interval === 1 ? 'Cada año' : `Cada ${interval} años`;
  else return null;

  if (until) text += ` hasta el ${Number(until[3])}/${until[2]}/${until[1]}`;
  return text;
}
