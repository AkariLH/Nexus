import type { MilestoneId } from './onboarding';
import type { OnboardingProgress } from '../services/onboarding.service';

/** [primeros-pasos] T1 · Figma N5: un recorrido corto por cada paso de «Primeros pasos». */
export type TourId = 'calendar' | 'schedule' | 'link' | 'recommendation' | 'rating';

/** Lo que se puede resaltar (cada pantalla lo marca con <TourTarget id>). */
export type TargetId =
  | 'tab.perfil'
  | 'tab.link'
  | 'home.firstSteps'
  | 'home.recommend'
  | 'perfil.settings'
  | 'settings.calendars'
  | 'settings.schedule'
  | 'calendars.phoneList'
  | 'schedule.quick'
  | 'schedule.days'
  | 'link.invite'
  | 'link.join'
  | 'recommend.options';

export interface TourStep {
  target: TargetId;
  title: string;
  text: string;
  /** Ruta (usePathname) donde se muestra el paso. */
  screen: string;
  /** `tap`: tú tocas lo resaltado y la app cambia de pantalla; `next`: botón Siguiente / Entendido. */
  advance: 'tap' | 'next';
}

const TO_PROFILE: TourStep = {
  target: 'tab.perfil', screen: '/', advance: 'tap',
  title: 'Abre tu Perfil', text: 'Toca «Perfil» en la barra de abajo.',
};
const TO_SETTINGS: TourStep = {
  target: 'perfil.settings', screen: '/perfil', advance: 'tap',
  title: 'Entra a Configuraciones', text: 'Ahí guardas tus horarios y tus calendarios.',
};

export const TOURS: Record<TourId, TourStep[]> = {
  calendar: [
    TO_PROFILE,
    TO_SETTINGS,
    {
      target: 'settings.calendars', screen: '/configuraciones', advance: 'tap',
      title: 'Toca «Calendarios externos»', text: 'Ahí compartes el calendario de tu teléfono.',
    },
    {
      target: 'calendars.phoneList', screen: '/link-external-calendars', advance: 'next',
      title: 'Elige qué calendario compartir',
      text: 'Toca «Compartir» en el que quieras. Tu pareja solo ve tus bloques de tiempo ocupado.',
    },
  ],
  schedule: [
    TO_PROFILE,
    TO_SETTINGS,
    {
      target: 'settings.schedule', screen: '/configuraciones', advance: 'tap',
      title: 'Toca «Horarios permitidos»', text: 'Ahí eliges cuándo puede Nexus sugerirles planes.',
    },
    {
      target: 'schedule.quick', screen: '/availability-schedule', advance: 'next',
      title: 'Elige tus días', text: 'Marca todos los días, entre semana o fines de semana.',
    },
    {
      target: 'schedule.days', screen: '/availability-schedule', advance: 'next',
      title: 'Ajusta cada día',
      text: 'Toca una hora para cambiarla o apaga el día. Al terminar, toca «Guardar».',
    },
  ],
  link: [
    {
      target: 'tab.link', screen: '/', advance: 'tap',
      title: 'Abre Vínculo', text: 'Toca «Vínculo» en la barra de abajo.',
    },
    {
      target: 'link.invite', screen: '/link', advance: 'next',
      title: 'Invita a tu pareja', text: 'Te damos un QR y tu pareja lo escanea con su teléfono.',
    },
    {
      target: 'link.join', screen: '/link', advance: 'next',
      title: '¿Tu pareja ya te invitó?', text: 'Escanea su QR o escribe el código que te compartió.',
    },
  ],
  recommendation: [
    {
      target: 'home.recommend', screen: '/', advance: 'tap',
      title: 'Pidan un plan', text: 'Nexus les sugiere citas según sus gustos y sus horarios libres.',
    },
    {
      target: 'recommend.options', screen: '/mode', advance: 'next',
      title: 'Elige cómo planear',
      text: 'Individual: tú eliges y le mandas la invitación. En pareja: eligen juntos y se escriben en el chat.',
    },
  ],
  rating: [
    {
      target: 'home.firstSteps', screen: '/', advance: 'next',
      title: 'Califiquen su cita',
      text: 'Cuando termine una cita, Nexus les avisa aquí en Inicio para que la califiquen.',
    },
  ],
};

/** El cuestionario no lleva recorrido: la app lo pide sola antes de entrar. */
export function tourForMilestone(id: MilestoneId): TourId | null {
  return id === 'questionnaire' ? null : id;
}

/**
 * Recorrido de un paso elegido de la lista (en orden o no, hecho o no). Sin recorrido posible,
 * `reason` dice por qué, en vez de arrancar uno que se detendría solo (R11).
 */
export function tourAvailability(
  id: MilestoneId,
  progress: OnboardingProgress,
  onWeb: boolean,
): { tour: TourId | null; reason?: string } {
  const linked = progress.me.linked;
  if (id === 'questionnaire') return { tour: null };
  if (id === 'link') return { tour: linked ? null : 'link' };
  if (id === 'calendar' && onWeb) return { tour: null, reason: 'Hazlo desde tu teléfono' };
  if ((id === 'recommendation' || id === 'rating') && !linked) {
    return { tour: null, reason: 'Primero vincúlate con tu pareja' };
  }
  return { tour: tourForMilestone(id) };
}

/**
 * Paso que toca según la pantalla actual: el mismo si sigues ahí; el siguiente si tocaste lo
 * resaltado y llegaste a donde llevaba; null si te fuiste a otra parte (R12).
 */
export function reconcile(steps: TourStep[], index: number, pathname: string): number | null {
  const step = steps[index];
  if (!step) return null;
  if (pathname === step.screen) return index;
  const next = steps[index + 1];
  if (step.advance === 'tap' && next && pathname === next.screen) return index + 1;
  return null;
}
