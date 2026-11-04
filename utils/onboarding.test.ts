jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OnboardingProgress } from '../services/onboarding.service';
import { loadCelebrated, milestonesFrom, newlyDone, saveCelebrated } from './onboarding';

const progress = (over: Partial<OnboardingProgress['me']> = {}, couple: Partial<OnboardingProgress['couple']> = {}): OnboardingProgress => ({
  me: { questionnaire: false, linked: false, calendar: false, schedule: false, ...over },
  partner: null,
  couple: { firstRecommendation: false, firstRatedDate: false, ...couple },
});

describe('milestonesFrom ([primeros-pasos] U2)', () => {
  it('F-01 respeta el orden de los 6 hitos', () => {
    expect(milestonesFrom(progress(), false).items.map(m => m.id)).toEqual([
      'questionnaire', 'link', 'calendar', 'schedule', 'recommendation', 'rating',
    ]);
  });

  it('F-02 cuenta los hechos y el siguiente es el primer pendiente', () => {
    const result = milestonesFrom(progress({ questionnaire: true, linked: true }), false);
    expect(result.done).toBe(2);
    expect(result.total).toBe(6);
    expect(result.next?.id).toBe('calendar');
    expect(result.next?.route).toBe('/(tabs)/link-external-calendars');
  });

  it('F-02b el siguiente puede saltarse uno ya hecho más adelante', () => {
    const result = milestonesFrom(progress({ questionnaire: true, schedule: true }), false);
    expect(result.next?.id).toBe('link');
    expect(result.done).toBe(2);
  });

  it('F-03 con todo hecho no hay siguiente', () => {
    const all = progress(
      { questionnaire: true, linked: true, calendar: true, schedule: true },
      { firstRecommendation: true, firstRatedDate: true },
    );
    const result = milestonesFrom(all, false);
    expect(result.done).toBe(6);
    expect(result.next).toBeNull();
  });

  it('F-04 en la web el calendario es solo del teléfono y no tiene ruta', () => {
    const calendar = milestonesFrom(progress(), true).items.find(m => m.id === 'calendar');
    expect(calendar?.phoneOnly).toBe(true);
    expect(calendar?.route).toBeNull();
    expect(milestonesFrom(progress(), false).items.find(m => m.id === 'calendar')?.phoneOnly).toBe(false);
  });

  it('F-05 recomendación y cita calificada cuentan para los dos', () => {
    const shared = milestonesFrom(progress(), false).items.filter(m => m.shared).map(m => m.id);
    expect(shared).toEqual(['recommendation', 'rating']);
  });
});

describe('newlyDone ([primeros-pasos] U4)', () => {
  it('F-06 devuelve solo los hitos nuevos', () => {
    expect(newlyDone(['questionnaire'], ['questionnaire', 'link'])).toEqual(['link']);
  });

  it('F-07 sin nada guardado no festeja nada (teléfono nuevo o reinstalación)', () => {
    expect(newlyDone(null, ['questionnaire', 'link'])).toEqual([]);
  });

  it('F-08 un hito ya festejado que se perdió y volvió no se repite', () => {
    // El calendario se festejó, luego se desconectó y ahora volvió: sigue en la lista guardada.
    expect(newlyDone(['questionnaire', 'calendar'], ['questionnaire', 'calendar'])).toEqual([]);
  });
});

describe('festejados guardados', () => {
  beforeEach(() => AsyncStorage.clear());

  it('sin nada guardado devuelve null', async () => {
    await expect(loadCelebrated(4)).resolves.toBeNull();
  });

  it('guarda la unión: un hito festejado nunca se quita', async () => {
    await saveCelebrated(4, ['questionnaire', 'calendar']);
    await saveCelebrated(4, ['questionnaire']);
    await expect(loadCelebrated(4)).resolves.toEqual(['questionnaire', 'calendar']);
  });

  it('es de cada usuario', async () => {
    await saveCelebrated(4, ['questionnaire']);
    await expect(loadCelebrated(9)).resolves.toBeNull();
  });
});
