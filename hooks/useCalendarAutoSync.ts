import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { externalCalendarIntegration } from '../services/externalCalendar.integration.service';
import { shouldSync } from '../utils/autoSync';

/** Al volver a la app no se repite si fue hace menos de esto. */
const MIN_GAP_MS = 60_000;
/** Con la app al frente, cada cuanto. */
const EVERY_MS = 15 * 60_000;

/**
 * [sync-calendario] RF-21 - Sincroniza los calendarios (y copia los eventos de Nexus, RF-22) al
 * abrir la app, al volver a ella y cada 15 min mientras esta al frente. En web no hay calendario
 * del telefono.
 */
export function useCalendarAutoSync(userId?: number): void {
  const last = useRef<Date | null>(null);

  useEffect(() => {
    if (!userId || Platform.OS === 'web') return;

    const run = (force: boolean) => {
      const now = new Date();
      if (!force && !shouldSync(last.current, now, MIN_GAP_MS)) return;
      last.current = now;
      externalCalendarIntegration.performPeriodicSync(userId).catch((error) => {
        // Es en segundo plano: no se le muestra a la persona.
        console.error('❌ Error en la sincronización automática:', error);
      });
    };

    // Un momento despues de abrir, para no frenar la carga inicial.
    const first = setTimeout(() => run(true), 2000);
    const every = setInterval(() => {
      if (AppState.currentState === 'active') run(true);
    }, EVERY_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') run(false);
    });

    return () => {
      clearTimeout(first);
      clearInterval(every);
      subscription.remove();
    };
  }, [userId]);
}
