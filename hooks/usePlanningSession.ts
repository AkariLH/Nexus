import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import planningService, { PlanningView } from '../services/planning.service';

/** Cada cuanto se pregunta por cambios de la pareja mientras la pantalla esta abierta. */
const POLL_MS = 4000;

/**
 * RF-38 - Estado de la planeacion en pareja. Sin notificaciones push, la pantalla consulta cada
 * pocos segundos mientras esta enfocada; las acciones propias reemplazan la vista al instante.
 */
export function usePlanningSession() {
  const { user } = useAuth();
  const [view, setView] = useState<PlanningView | null>(null);
  const [loading, setLoading] = useState(true);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (!user?.userId || busy.current) return;
    try {
      setView(await planningService.current(user.userId));
    } catch {
      // Sin red se reintenta en la siguiente vuelta.
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
      const timer = setInterval(refresh, POLL_MS);
      return () => clearInterval(timer);
    }, [refresh]),
  );

  /** Corre una accion propia y muestra su resultado; mientras, no se pisa con la consulta. */
  const act = useCallback(async (action: (userId: number, sessionId: number) => Promise<PlanningView>) => {
    if (!user?.userId || !view) return null;
    busy.current = true;
    try {
      const next = await action(user.userId, view.id);
      setView(next);
      return next;
    } finally {
      busy.current = false;
    }
  }, [user?.userId, view]);

  return { view, loading, refresh, act, setView };
}
