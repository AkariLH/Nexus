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
 * Figma N1: una línea de cómo va la pareja. Primero lo que ya hizo y tú todavía no (anima a
 * seguir); si no, cuántos de sus 3 pasos lleva. Nunca dice qué calendario ni qué horarios (R6).
 */
export function partnerLine(progress: OnboardingProgress): string | null {
  const partner = progress.partner;
  if (!partner) return null;
  const { name } = partner;
  if (partner.calendar && !progress.me.calendar) return `${name} ya conectó su calendario`;
  if (partner.schedule && !progress.me.schedule) return `${name} ya ajustó sus horarios`;
  if (partner.questionnaire && !progress.me.questionnaire) return `${name} ya contestó el cuestionario`;
  const steps = [partner.questionnaire, partner.calendar, partner.schedule].filter(Boolean).length;
  return steps === 3 ? `${name} ya terminó sus pasos` : `${name} lleva ${steps} de 3 de sus pasos`;
}

/** Si la pareja ya hizo su parte de un hito individual (Figma N4); null si no aplica. */
export function partnerDid(progress: OnboardingProgress, id: MilestoneId): boolean | null {
  const partner = progress.partner;
  if (!partner) return null;
  if (id === 'questionnaire') return partner.questionnaire;
  if (id === 'calendar') return partner.calendar;
  if (id === 'schedule') return partner.schedule;
  return null;
}

/**
 * Hitos que ya tienen su propio modal al cumplirse: «¡Listo!» del cuestionario (Figma D5) y
 * «¡Ya están vinculados!» (H7). Se guardan como festejados sin otro modal (R4: uno a la vez).
 */
export const SILENT_MILESTONES: MilestoneId[] = ['questionnaire', 'link'];

const DONE_TITLES: Record<MilestoneId, string> = {
  questionnaire: '¡Cuestionario listo!',
  link: '¡Ya están vinculados!',
  calendar: '¡Calendario conectado!',
  schedule: '¡Horarios listos!',
  recommendation: '¡Primera recomendación!',
  rating: '¡Primera cita calificada!',
};

const NEXT_LABELS: Record<MilestoneId, string> = {
  questionnaire: 'el cuestionario',
  link: 'vincularte',
  calendar: 'tu calendario',
  schedule: 'tus horarios',
  recommendation: 'su primera recomendación',
  rating: 'calificar su cita',
};

export interface Celebration {
  title: string;
  subtitle: string;
  nextLabel: string | null;
  nextRoute: Href | null;
  /** 6 de 6: el festejo grande (brote doble). */
  finished: boolean;
}

/** Figma N2: textos del festejo de `id` con el avance actual. */
export function celebrationFor(id: MilestoneId, summary: MilestoneSummary): Celebration {
  const finished = summary.next === null;
  const next = summary.next;
  return {
    title: finished ? '¡Listos!' : DONE_TITLES[id],
    subtitle: finished ? 'Completaron los 6 primeros pasos.' : `Van ${summary.done} de ${summary.total}.`,
    nextLabel: next && next.route ? `Siguiente: ${NEXT_LABELS[next.id]}` : null,
    nextRoute: next?.route ?? null,
    finished,
  };
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
