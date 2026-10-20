/** Textos de "Calificar citas" (Figma C12a / C12b). */

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

/** Escala de satisfaccion: posicion 0 = puntaje 1. */
export const SATISFACTION_LABELS = ['Muy mal', 'Mal', 'Regular', 'Bien', 'Muy bien'] as const;

/** "Quedan 31 h para calificar"; con menos de una hora, en minutos (RN-36). */
export function timeLeftLabel(expiresAtIso: string, now: Date): string {
  const left = Math.max(0, new Date(expiresAtIso).getTime() - now.getTime());
  if (left >= HOUR_MS) {
    const hours = Math.floor(left / HOUR_MS);
    return hours === 1 ? 'Queda 1 h para calificar' : `Quedan ${hours} h para calificar`;
  }
  const minutes = Math.max(1, Math.ceil(left / MINUTE_MS));
  return minutes === 1 ? 'Queda 1 min para calificar' : `Quedan ${minutes} min para calificar`;
}

/** "Ayer · 18:00 · Coyoacán": dia, hora de inicio y lugar si lo hay. */
export function dateLine(startIso: string, location: string | null | undefined, now: Date): string {
  const start = new Date(startIso);
  const parts = [dayLabel(start, now), clock(start)];
  if (location && location.trim()) parts.push(location.trim());
  return parts.join(' · ');
}

function dayLabel(d: Date, now: Date): string {
  const days = Math.round((startOfDay(now) - startOfDay(d)) / (24 * HOUR_MS));
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  return `${DAYS[d.getDay()]} ${d.getDate()}`;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function clock(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
