import type { PlanningNotice } from './planningSeen';

/**
 * [modales-un-clic] M-01: Inicio muestra un solo aviso a la vez. Antes cada aviso tenía su propia
 * bandera y podían abrirse varios encimados; en Android cada «Cerrar» quitaba uno y aparecía el de
 * abajo, y parecía que el botón no respondía (prueba con usuarios del 5-nov).
 */
export type HomeModal =
  | 'questionnaire'
  | 'linked'
  | 'expiredScan'
  | 'invite-sent'
  | 'invite-accepted'
  | 'invite-rejected'
  | 'planning-INVITE'
  | 'planning-AGREED'
  | 'planning-EXPIRED'
  | 'planning-CLOSED'
  | 'milestone'
  | 'offer';

export interface HomeModalState {
  /** Inicio está al frente (un Modal se dibuja encima de todo aunque su pantalla esté tapada). */
  focused: boolean;
  questionnaireDone: boolean;
  linked: boolean;
  expiredScan: boolean;
  invite: 'sent' | 'accepted' | 'rejected' | null;
  planning: PlanningNotice | null;
  milestone: boolean;
  offer: boolean;
  tourActive: boolean;
}

/** Los avisos de planeación que tienen modal ('ADJUSTING' no tiene). */
const PLANNING_MODALS: PlanningNotice[] = ['INVITE', 'AGREED', 'EXPIRED', 'CLOSED'];

/** El aviso que toca mostrar, en orden de importancia; null si ninguno. */
export function homeModalToShow(s: HomeModalState): HomeModal | null {
  if (!s.focused) return null;
  if (s.questionnaireDone) return 'questionnaire';
  if (s.linked) return 'linked';
  if (s.expiredScan) return 'expiredScan';
  if (s.invite) return `invite-${s.invite}`;
  if (s.planning && PLANNING_MODALS.includes(s.planning)) return `planning-${s.planning}` as HomeModal;
  if (s.milestone) return 'milestone';
  if (s.offer && !s.tourActive) return 'offer';
  return null;
}
