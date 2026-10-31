/**
 * [libres-juntos] Que Nexus proponga cuando verse en vez de listar huecos en crudo. Los huecos de
 * los dos se recortan a partir de ahora, se redondean a :00/:30 y se parten en manana, tarde y
 * noche; luego se propone uno por dia. La misma regla vive en el backend (FreeTimeProposals.java)
 * y las dos se prueban con __fixtures__/free-proposals.json.
 */
import type { MutualAvailableDay } from '../services/availabilityService';

export type DayPart = 'MORNING' | 'AFTERNOON' | 'EVENING';

/** Un pedazo de un hueco libre de los dos, ya limpio. */
export interface FreeWindow {
  date: string;
  start: string;
  end: string;
  part: DayPart;
  minutes: number;
}

const MIN_MINUTES = 60;
const STEP = 30;
const AFTERNOON_FROM = 13 * 60;
const EVENING_FROM = 19 * 60;
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const PART_TEXT: Record<DayPart, string> = { MORNING: 'por la mañana', AFTERNOON: 'en la tarde', EVENING: 'en la noche' };

const toMinutes = (clock: string) => {
  const [h, m] = clock.split(':').map(Number);
  return h * 60 + m;
};
const toClock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const partOf = (start: number): DayPart => (start < AFTERNOON_FROM ? 'MORNING' : start < EVENING_FROM ? 'AFTERNOON' : 'EVENING');

/**
 * Huecos limpios: desde ahora, con el inicio subido y el fin bajado a :00/:30, partidos en manana
 * (antes de 13), tarde (13-19) y noche (desde 19), y solo los de 1 h o mas. Con `split = false`
 * cada hueco queda entero (bloques de la vista Dia).
 */
export function cleanWindows(days: MutualAvailableDay[], now: Date, split = true): FreeWindow[] {
  const today = isoDate(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const out: FreeWindow[] = [];
  for (const day of days) {
    if (day.date < today) continue;
    for (const slot of day.mutualFreeSlots) {
      let start = toMinutes(slot.start);
      if (day.date === today) start = Math.max(start, nowMinutes);
      start = Math.ceil(start / STEP) * STEP;
      const end = Math.floor(toMinutes(slot.end) / STEP) * STEP;
      const cuts = split ? [start, AFTERNOON_FROM, EVENING_FROM, end].filter((t) => t >= start && t <= end) : [start, end];
      for (let i = 0; i < cuts.length - 1; i++) {
        const minutes = cuts[i + 1] - cuts[i];
        if (minutes >= MIN_MINUTES) {
          out.push({ date: day.date, start: toClock(cuts[i]), end: toClock(cuts[i + 1]), part: partOf(cuts[i]), minutes });
        }
      }
    }
  }
  return out.sort((a, b) => (a.date === b.date ? a.start.localeCompare(b.start) : a.date.localeCompare(b.date)));
}

/** Una por dia: la mas larga de tarde o noche (si no hay, la de la manana); los primeros `max` dias. */
export function proposalsOf(windows: FreeWindow[], max = 3): FreeWindow[] {
  const byDay = new Map<string, FreeWindow[]>();
  for (const w of windows) byDay.set(w.date, [...(byDay.get(w.date) ?? []), w]);
  const longest = (list: FreeWindow[]) => list.reduce<FreeWindow | null>((best, w) => (!best || w.minutes > best.minutes ? w : best), null);
  return [...byDay.keys()]
    .sort()
    .map((date) => {
      const list = byDay.get(date)!;
      return longest(list.filter((w) => w.part !== 'MORNING')) ?? longest(list);
    })
    .filter((w): w is FreeWindow => w !== null)
    .slice(0, max);
}

/** "Sábado en la tarde" y "4 h libres"; hoy y mañana por nombre, a una semana o más con el número. */
export function proposalLabel(window: FreeWindow, now: Date): { when: string; length: string } {
  const [y, m, d] = window.date.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysAway = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  const day =
    daysAway === 0 ? 'Hoy' : daysAway === 1 ? 'Mañana' : daysAway < 7 ? WEEKDAYS[date.getDay()] : `${WEEKDAYS[date.getDay()]} ${d}`;
  const hours = Math.floor(window.minutes / 60);
  const rest = window.minutes % 60;
  const length = [hours > 0 ? `${hours} h` : '', rest > 0 ? `${rest} min` : ''].filter(Boolean).join(' ');
  return { when: `${day} ${PART_TEXT[window.part]}`, length: `${length} libres` };
}
