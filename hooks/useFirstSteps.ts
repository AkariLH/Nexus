import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import onboardingService, { OnboardingProgress } from '../services/onboarding.service';
import { resetAll } from '../utils/guideStore';
import {
  Celebration,
  SILENT_MILESTONES,
  celebrationFor,
  loadCelebrated,
  milestonesFrom,
  newlyDone,
  saveCelebrated,
} from '../utils/onboarding';

const hiddenKey = (userId: number) => `@nexus_onboarding_hidden_${userId}`;

export interface PendingCelebration {
  celebration: Celebration;
  /** Avance antes y después (0..1) para la barra animada. */
  from: number;
  to: number;
}

/**
 * [primeros-pasos] U3/U4: estado de la tarjeta «Primeros pasos» de Inicio. `refresh` se llama al
 * enfocar Inicio; si falla la red, no hay tarjeta y el resto de Inicio no espera (R5).
 */
export function useFirstSteps(userId: number | undefined) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [hidden, setHidden] = useState(true);
  const [pending, setPending] = useState<PendingCelebration | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const [next, hiddenFlag, celebrated] = await Promise.all([
        onboardingService.getProgress(userId),
        AsyncStorage.getItem(hiddenKey(userId)).catch(() => null),
        loadCelebrated(userId),
      ]);
      const isHidden = hiddenFlag === '1';
      setProgress(next);
      setHidden(isHidden);

      const summary = milestonesFrom(next, Platform.OS === 'web');
      const nowDone = summary.items.filter(m => m.done).map(m => m.id);
      const fresh = newlyDone(celebrated, nowDone).filter(id => !SILENT_MILESTONES.includes(id));
      await saveCelebrated(userId, nowDone);
      // Quien ocultó la tarjeta no quiere festejos; tampoco se festeja al estrenar teléfono (R1).
      if (fresh.length > 0 && !isHidden) {
        const last = fresh[fresh.length - 1];
        setPending({
          celebration: celebrationFor(last, summary),
          from: (summary.done - fresh.length) / summary.total,
          to: summary.done / summary.total,
        });
      }
    } catch {
      setProgress(null);
    }
  }, [userId]);

  const hide = useCallback(async () => {
    setHidden(true);
    if (!userId) return;
    try {
      await AsyncStorage.setItem(hiddenKey(userId), '1');
    } catch {
      // Sin almacenamiento la tarjeta puede volver a salir la próxima vez; no es grave.
    }
  }, [userId]);

  const dismissCelebration = useCallback(() => setPending(null), []);

  return { progress, hidden, hide, pending, dismissCelebration, refresh };
}

/** Vuelve a mostrar la tarjeta. */
export async function showFirstStepsAgain(userId: number): Promise<void> {
  try {
    await AsyncStorage.removeItem(hiddenKey(userId));
  } catch {
    // Igual que arriba.
  }
}

/** U7 «Ver tutorial»: la tarjeta y todas las guías vuelven a salir. */
export async function restartTutorial(userId: number): Promise<void> {
  await Promise.all([showFirstStepsAgain(userId), resetAll(userId)]);
}
