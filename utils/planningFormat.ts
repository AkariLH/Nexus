/** RF-38 / RF-39 - Textos de la planeacion en pareja (Figma B1-B9). */
import type { LeftoverKind, VoteValue } from '../services/planning.service';
import type { SlotOption } from './recommendationParams';

const CDMX_OFFSET_MS = -6 * 60 * 60_000;
const two = (n: number): string => String(n).padStart(2, '0');

/** "23 h 41 min", "45 min", "2 h"; nunca negativo. */
export function remainingLabel(untilIso: string | null | undefined, now: Date): string {
  if (!untilIso) return '';
  const totalMinutes = Math.max(0, Math.floor((new Date(untilIso).getTime() - now.getTime()) / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

export function timeLeftToDecide(untilIso: string | null | undefined, now: Date): string {
  return `Quedan ${remainingLabel(untilIso, now)} para decidir`;
}

const mine: Record<VoteValue, string> = { LIKE: 'te gusta', DISLIKE: 'no te convence' };
const theirs: Record<VoteValue, string> = { LIKE: 'le gusta', DISLIKE: 'no le convence' };

/** "Tú: te gusta · Sam: aún no" */
export function voteLine(myVote: VoteValue | null, partnerVote: VoteValue | null, partnerName: string): string {
  const me = myVote ? mine[myVote] : 'aún no';
  const them = partnerVote ? theirs[partnerVote] : 'aún no';
  return `Tú: ${me} · ${partnerName}: ${them}`;
}

/** "match" = ¡Coinciden!; "mismatch" = a uno le gusta y al otro no (platíquenlo en el chat). */
export function agreementOf(myVote: VoteValue | null, partnerVote: VoteValue | null): 'match' | 'mismatch' | null {
  if (myVote === 'LIKE' && partnerVote === 'LIKE') return 'match';
  if (myVote && partnerVote && myVote !== partnerVote) return 'mismatch';
  return null;
}

export interface ClosedNotice {
  subtitle: string;
  /** La opcion que quedo aun se puede mandar como invitacion (su horario no ha pasado). */
  canInvite: boolean;
  note: string | undefined;
}

/**
 * B8b: por que se acabo el tiempo, dicho a quien lo lee, y si la opcion que quedo (propuesta sin
 * responder o coincidencia) todavia se puede mandar. Sin opcion queda el texto de siempre.
 */
export function closedNotice(
  leftover: { kind: LeftoverKind; startsAt: string } | null,
  partnerName: string,
  now: Date,
): ClosedNotice {
  if (!leftover) return { subtitle: 'No llegaron a un acuerdo a tiempo.', canInvite: false, note: undefined };
  const subtitle = {
    MY_PROPOSAL: `${partnerName} no alcanzó a responder tu propuesta.`,
    THEIR_PROPOSAL: `No alcanzaste a responder la propuesta de ${partnerName}.`,
    MATCH: 'Coincidieron en una opción, pero nadie la propuso.',
  }[leftover.kind];
  // El aviso de "ya paso" va en el subtitulo: la nota del modal se pinta como confirmacion (palomita).
  const upcoming = new Date(leftover.startsAt).getTime() > now.getTime();
  return {
    subtitle: upcoming ? subtitle : `${subtitle} El horario de esa opción ya pasó.`,
    canInvite: upcoming,
    note: undefined,
  };
}

/** El hueco elegido en los filtros, en el formato de los chips de horario. */
export function filtersToSlot(startIso?: string | null, endIso?: string | null): SlotOption | undefined {
  if (!startIso || !endIso) return undefined;
  const start = new Date(new Date(startIso).getTime() + CDMX_OFFSET_MS);
  const end = new Date(new Date(endIso).getTime() + CDMX_OFFSET_MS);
  const date = start.toISOString().slice(0, 10);
  const from = `${two(start.getUTCHours())}:${two(start.getUTCMinutes())}`;
  return { key: `${date}T${from}`, date, start: from, end: `${two(end.getUTCHours())}:${two(end.getUTCMinutes())}` };
}
