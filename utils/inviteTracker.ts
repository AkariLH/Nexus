/**
 * CU39 / RF-30 - Invitaciones que esta persona envio desde una recomendacion. Inicio las usa para
 * mostrar, una sola vez, "Invitacion enviada" (A7), "aceptó" (A8) o "rechazó" (A9). Vive en el
 * telefono: no hay notificaciones push todavia y el evento no dice que salio de una recomendacion.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EventResponse } from '../services/event.service';

export interface TrackedInvite {
  eventId: number;
  title: string;
  startsAt: string;
  endsAt: string;
  place: string;
  costPerPersonMxn: number;
  /** `sent`: falta mostrar "Invitación enviada"; `waiting`: esperando la respuesta. */
  stage: 'sent' | 'waiting';
}

export type NoticeKind = 'sent' | 'accepted' | 'rejected' | 'gone';

export interface Notice {
  kind: NoticeKind;
  invite: TrackedInvite;
}

type EventState = Pick<EventResponse, 'id' | 'status' | 'fullyApproved'>;

const storageKey = (userId: number): string => `@nexus_sent_invites:${userId}`;

export async function loadTracked(userId: number): Promise<TrackedInvite[]> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const save = (userId: number, tracked: TrackedInvite[]): Promise<void> =>
  AsyncStorage.setItem(storageKey(userId), JSON.stringify(tracked));

export async function trackInvite(userId: number, invite: Omit<TrackedInvite, 'stage'>): Promise<void> {
  const tracked = (await loadTracked(userId)).filter((t) => t.eventId !== invite.eventId);
  await save(userId, [...tracked, { ...invite, stage: 'sent' }]);
}

/**
 * Siguiente aviso que toca mostrar. `gone` = el evento ya no existe: se olvida sin modal.
 *
 * @complexity T: O(t + e), S: O(e)
 */
export function nextNotice(tracked: TrackedInvite[], events: EventState[]): Notice | null {
  const justSent = tracked.find((t) => t.stage === 'sent');
  if (justSent) return { kind: 'sent', invite: justSent };

  const byId = new Map(events.map((e) => [e.id, e]));
  for (const invite of tracked) {
    const event = byId.get(invite.eventId);
    if (!event) return { kind: 'gone', invite };
    if (event.status === 'REJECTED') return { kind: 'rejected', invite };
    if (event.fullyApproved) return { kind: 'accepted', invite };
  }
  return null;
}

/** Tras mostrar un aviso: "enviada" pasa a esperar; los demas cierran el seguimiento. */
export async function settle(userId: number, eventId: number, kind: NoticeKind): Promise<void> {
  const tracked = await loadTracked(userId);
  const next =
    kind === 'sent'
      ? tracked.map((t) => (t.eventId === eventId ? { ...t, stage: 'waiting' as const } : t))
      : tracked.filter((t) => t.eventId !== eventId);
  await save(userId, next);
}
