import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import onboardingService, { OnboardingProgress } from '../services/onboarding.service';
import {
  Celebration,
  SILENT_MILESTONES,
  celebrationFor,
  loadCelebrated,
  milestonesFrom,
  newlyDone,
  saveCelebrated,
} from '../utils/onboarding';
import { TourId, tourForMilestone } from '../utils/tours';

const hiddenKey = (userId: number) => `@nexus_onboarding_hidden_${userId}`;
const offeredKey = (userId: number) => `@nexus_tour_offered_${userId}`;

export interface PendingCelebration {
  celebration: Celebration;
  /** Avance antes y después (0..1) para la barra animada. */
  from: number;
  to: number;
}

const readFlag = (key: string) => AsyncStorage.getItem(key).then(v => v === '1').catch(() => false);
const writeFlag = (key: string) => AsyncStorage.setItem(key, '1').catch(() => undefined);

/**
 * [primeros-pasos] U3/U4/T5: estado de la tarjeta «Primeros pasos» de Inicio, el festejo y la
 * oferta del recorrido (Figma N6). `refresh` se llama al enfocar Inicio; si falla la red, no hay
 * tarjeta y el resto de Inicio no espera (R5).
 */
export function useFirstSteps(userId: number | undefined) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [hidden, setHidden] = useState(true);
  const [pending, setPending] = useState<PendingCelebration | null>(null);
  const [offer, setOffer] = useState<TourId | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const [next, isHidden, offered, celebrated] = await Promise.all([
        onboardingService.getProgress(userId),
        readFlag(hiddenKey(userId)),
        readFlag(offeredKey(userId)),
        loadCelebrated(userId),
      ]);
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
      // N6: una sola vez por cuenta, con la tarjeta visible y un paso que tenga recorrido.
      const tour = summary.next && !summary.next.phoneOnly ? tourForMilestone(summary.next.id) : null;
      setOffer(!offered && !isHidden && tour ? tour : null);
    } catch {
      setProgress(null);
    }
  }, [userId]);

  const hide = useCallback(async () => {
    setHidden(true);
    setOffer(null);
    if (userId) await writeFlag(hiddenKey(userId));
  }, [userId]);

  /** «Sí, enséñame» o «Ahora no»: la oferta no vuelve a salir. */
  const answerOffer = useCallback(async () => {
    setOffer(null);
    if (userId) await writeFlag(offeredKey(userId));
  }, [userId]);

  const dismissCelebration = useCallback(() => setPending(null), []);

  return { progress, hidden, hide, pending, dismissCelebration, offer, answerOffer, refresh };
}

/** U7 «Ver tutorial»: vuelve la tarjeta y la oferta del recorrido. */
export async function restartTutorial(userId: number): Promise<void> {
  try {
    await AsyncStorage.multiRemove([hiddenKey(userId), offeredKey(userId)]);
  } catch {
    // Sin almacenamiento no hay nada que borrar.
  }
}
