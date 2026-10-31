import type { EventResponse } from '../../services/event.service';
import type { FreeWindow } from '../../utils/freeProposals';

export type HomeHighlight =
  | { kind: 'date'; event: EventResponse }
  | { kind: 'proposal'; window: FreeWindow }
  | { kind: 'none' };

/**
 * [libres-juntos] Figma K1 - Lo primero en Inicio: su proxima cita confirmada de los dos (que no ha
 * terminado); si no hay, la mejor propuesta; si no coinciden esta semana, el aviso. `null` si no se
 * pudo saber su tiempo libre (sin vinculo o fallo la consulta).
 */
export function homeHighlight(events: EventResponse[], proposals: FreeWindow[] | null, now: Date): HomeHighlight | null {
  if (proposals === null) return null;
  const next = events
    .filter((e) => e.status === 'CONFIRMED' && e.fullyApproved && e.linkId != null && new Date(e.endDateTime) > now)
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())[0];
  if (next) return { kind: 'date', event: next };
  return proposals.length > 0 ? { kind: 'proposal', window: proposals[0] } : { kind: 'none' };
}
