/**
 * Avisos de la planeacion en pareja que ya se mostraron en este telefono (invitacion recibida,
 * cita confirmada, vencida, cerrada), para que Inicio no los repita en cada visita.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PlanningNotice = 'INVITE' | 'AGREED' | 'EXPIRED' | 'CLOSED' | 'ADJUSTING';

const key = (userId: number) => `@nexus_planning_seen:${userId}`;

async function load(userId: number): Promise<Record<string, true>> {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function wasSeen(userId: number, sessionId: number, notice: PlanningNotice): Promise<boolean> {
  return Boolean((await load(userId))[`${sessionId}:${notice}`]);
}

export async function markSeen(userId: number, sessionId: number, notice: PlanningNotice): Promise<void> {
  const seen = await load(userId);
  seen[`${sessionId}:${notice}`] = true;
  await AsyncStorage.setItem(key(userId), JSON.stringify(seen));
}
