import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Href } from 'expo-router';
import type { OnboardingProgress } from '../services/onboarding.service';

/** [primeros-pasos] Los 6 hitos de la tarjeta "Primeros pasos", en orden. */
export type MilestoneId = 'questionnaire' | 'link' | 'calendar' | 'schedule' | 'recommendation' | 'rating';

export interface Milestone {
  id: MilestoneId;
  title: string;
  /** Una línea de por qué sirve, para el botón del siguiente paso. */
  hint: string;
  done: boolean;
  /** Cuenta para los dos (Figma N4: «Juntos»). */
  shared: boolean;
  /** Pantalla que abre; null si en esta plataforma no se puede hacer (R7). */
  route: Href | null;
  /** Aquí no se puede: hay que hacerlo desde el teléfono (solo en la web). */
  phoneOnly: boolean;
}

export interface MilestoneSummary {
  items: Milestone[];
  done: number;
  total: 6;
  next: Milestone | null;
}

type Spec = Omit<Milestone, 'done' | 'route' | 'phoneOnly'> & {
  route: Href;
  phoneOnly?: boolean;
  isDone: (p: OnboardingProgress) => boolean;
};

const SPECS: Spec[] = [
  { id: 'questionnaire', title: 'Contesta el cuestionario', hint: 'Así Nexus conoce sus gustos', shared: false,
    route: '/(tabs)/initial-questionnaire', isDone: p => p.me.questionnaire },
  { id: 'link', title: 'Vincúlate con tu pareja', hint: 'Comparte tu código o escribe el suyo', shared: false,
    route: '/(tabs)/link', isDone: p => p.me.linked },
  { id: 'calendar', title: 'Conecta tu calendario', hint: 'Así Nexus sabe cuándo están libres', shared: false,
    route: '/(tabs)/link-external-calendars', phoneOnly: true, isDone: p => p.me.calendar },
  { id: 'schedule', title: 'Ajusta tus horarios', hint: 'Cuándo puede Nexus sugerirles planes', shared: false,
    route: '/(settings)/availability-schedule', isDone: p => p.me.schedule },
  { id: 'recommendation', title: 'Pidan su primera recomendación', hint: 'Nexus les sugiere un plan para los dos', shared: true,
    route: '/(recommend)/mode', isDone: p => p.couple.firstRecommendation },
  { id: 'rating', title: 'Califiquen su primera cita', hint: 'Así las próximas sugerencias les quedan mejor', shared: true,
    route: '/(rating)/pending-ratings', isDone: p => p.couple.firstRatedDate },
];

/** Lista ordenada, cuántos van y cuál sigue (el primer pendiente). */
export function milestonesFrom(progress: OnboardingProgress, onWeb: boolean): MilestoneSummary {
  const items: Milestone[] = SPECS.map(({ isDone, phoneOnly = false, route, ...rest }) => {
    const blockedHere = phoneOnly && onWeb;
    return { ...rest, done: isDone(progress), phoneOnly: blockedHere, route: blockedHere ? null : route };
  });
  const done = items.filter(m => m.done).length;
  return { items, done, total: 6, next: items.find(m => !m.done) ?? null };
}

/**
 * Hitos por festejar: los cumplidos que no se habían festejado. Sin nada guardado (teléfono nuevo,
 * reinstalación) no se festeja nada (R1); lo ya festejado no se repite aunque se haya perdido (R2).
 */
export function newlyDone(celebrated: MilestoneId[] | null, nowDone: MilestoneId[]): MilestoneId[] {
  if (celebrated === null) return [];
  return nowDone.filter(id => !celebrated.includes(id));
}

const celebratedKey = (userId: number) => `@nexus_onboarding_done_${userId}`;

/** null si nunca se guardó nada en este teléfono para esta cuenta. */
export async function loadCelebrated(userId: number): Promise<MilestoneId[] | null> {
  try {
    const raw = await AsyncStorage.getItem(celebratedKey(userId));
    return raw ? (JSON.parse(raw) as MilestoneId[]) : null;
  } catch {
    return null;
  }
}

/** Guarda la unión con lo ya festejado: un hito nunca sale de la lista. */
export async function saveCelebrated(userId: number, ids: MilestoneId[]): Promise<void> {
  try {
    const before = (await loadCelebrated(userId)) ?? [];
    const union = [...before, ...ids.filter(id => !before.includes(id))];
    await AsyncStorage.setItem(celebratedKey(userId), JSON.stringify(union));
  } catch {
    // Sin almacenamiento solo se pierde el festejo; la tarjeta sigue con el avance real.
  }
}
