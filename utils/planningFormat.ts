/** RF-38 / RF-39 - Textos de la planeacion en pareja (Figma B1-B9). */
import type { VoteValue } from '../services/planning.service';
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

/** El hueco elegido en los filtros, en el formato de los chips de horario. */
export function filtersToSlot(startIso?: string | null, endIso?: string | null): SlotOption | undefined {
  if (!startIso || !endIso) return undefined;
  const start = new Date(new Date(startIso).getTime() + CDMX_OFFSET_MS);
  const end = new Date(new Date(endIso).getTime() + CDMX_OFFSET_MS);
  const date = start.toISOString().slice(0, 10);
  const from = `${two(start.getUTCHours())}:${two(start.getUTCMinutes())}`;
  return { key: `${date}T${from}`, date, start: from, end: `${two(end.getUTCHours())}:${two(end.getUTCMinutes())}` };
}
