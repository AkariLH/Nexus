/**
 * [ux-ajustes] Logica de la campanita (Figma L1): invitaciones que ya pasaron, avisos iguales
 * juntos con "×N" y el numero del icono. Funciones puras; la pantalla solo dibuja.
 */
import type { AppNotification } from '../services/appNotification.service';
import type { EventResponse } from '../services/event.service';

/** D1 - La invitacion ya termino: sale como "Ya pasó", sin Aceptar/Rechazar. */
export function isPastInvite(event: Pick<EventResponse, 'endDateTime'>, now: Date): boolean {
  return new Date(event.endDateTime).getTime() < now.getTime();
}

export interface NoticeGroup {
  notice: AppNotification;
  count: number;
}

/** [pulido-critica] D2 - Tipos en los que el aviso nuevo reemplaza al anterior aunque cambie el texto. */
const REPLACEABLE = ['FREE_TIME', 'REMINDER'];

const sameNotice = (a: AppNotification, b: AppNotification) =>
  a.type === b.type && (REPLACEABLE.includes(a.type) || (a.title === b.title && a.body === b.body));

/**
 * D2 - Avisos seguidos en uno con su cuenta: iguales (tipo, titulo y texto) o del mismo tipo si ese
 * tipo se reemplaza. La lista viene del mas reciente al mas viejo, asi que se queda el primero.
 *
 * @complexity T: O(n), S: O(n), n = avisos
 */
export function groupNotices(list: AppNotification[]): NoticeGroup[] {
  const out: NoticeGroup[] = [];
  for (const notice of list) {
    const last = out[out.length - 1];
    if (last && sameNotice(last.notice, notice)) last.count++;
    else out.push({ notice, count: 1 });
  }
  return out;
}

/** [pulido-critica] D2 - Invitaciones que todavia se pueden contestar y las que ya pasaron ("Anteriores"). */
export function splitInvites<T extends Pick<EventResponse, 'endDateTime'>>(pending: T[], now: Date): { open: T[]; past: T[] } {
  return {
    open: pending.filter((e) => !isPastInvite(e, now)),
    past: pending.filter((e) => isPastInvite(e, now)),
  };
}

/** D1 - Numero de la campanita: invitaciones que todavia se pueden contestar mas avisos sin leer. */
export function bellCount(pending: Pick<EventResponse, 'endDateTime'>[], unread: number, now: Date): number {
  return pending.filter((e) => !isPastInvite(e, now)).length + unread;
}
