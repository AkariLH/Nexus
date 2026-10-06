import { moodEmoji } from '../constants/moods';
import type { EmotionLogResponse } from '../services/emotion.service';

/** RF-32 - Utilidades de presentacion del historial emocional (todo en hora local). */

const WEEKDAY_INITIALS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const daysBetween = (a: Date, b: Date) =>
  Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);

function dayTitle(date: Date, now: Date): string {
  const diff = daysBetween(date, now);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  const text = date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const newestFirst = (entries: EmotionLogResponse[]) =>
  [...entries].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());

export interface DaySection {
  key: string;
  title: string;
  data: EmotionLogResponse[];
}

/** Agrupa los registros por dia, del dia mas reciente al mas antiguo. */
export function groupByDay(entries: EmotionLogResponse[], now: Date = new Date()): DaySection[] {
  const sections: DaySection[] = [];
  for (const entry of newestFirst(entries)) {
    const date = new Date(entry.loggedAt);
    const key = dayKey(date);
    const last = sections[sections.length - 1];
    if (last?.key === key) {
      last.data.push(entry);
    } else {
      sections.push({ key, title: dayTitle(date, now), data: [entry] });
    }
  }
  return sections;
}

export interface WeekDay {
  key: string;
  initial: string;
  isToday: boolean;
  emoji: string | null;
}

/** Los ultimos 7 dias (del mas antiguo a hoy) con la carita del registro mas reciente de cada uno. */
export function lastSevenDays(entries: EmotionLogResponse[], now: Date = new Date()): WeekDay[] {
  const latestByDay = new Map<string, string>();
  for (const entry of newestFirst(entries)) {
    const key = dayKey(new Date(entry.loggedAt));
    if (!latestByDay.has(key)) latestByDay.set(key, moodEmoji(entry.label));
  }

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    const key = dayKey(date);
    return {
      key,
      initial: WEEKDAY_INITIALS[date.getDay()],
      isToday: i === 6,
      emoji: latestByDay.get(key) ?? null,
    };
  });
}
