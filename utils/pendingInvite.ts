import type { EventResponse } from '../services/event.service';

/**
 * [reaprobar-edicion] Quién mandó el plan que me falta aprobar. Si yo lo creé y aun así me toca
 * aprobarlo, es porque mi pareja lo cambió (RN-17): se muestra su nombre, no el mío.
 */
export function inviteHeadline(event: EventResponse, myUserId: number | undefined): { name: string; text: string } {
  if (myUserId != null && event.creatorUserId === myUserId) {
    const name = event.partnerName || event.partnerNickname || 'Tu pareja';
    return { name, text: `${name} cambió un plan` };
  }
  const name = event.creatorName || event.creatorNickname || 'Tu pareja';
  return { name, text: `${name} te invita a una cita` };
}
