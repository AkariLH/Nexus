jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../services/onboarding.service', () => ({
  __esModule: true,
  default: { getProgress: jest.fn() },
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';
import onboardingService from '../services/onboarding.service';
import { saveCelebrated } from '../utils/onboarding';
import { markSeen, wasSeen } from '../utils/guideStore';
import { restartTutorial, showFirstStepsAgain, useFirstSteps } from './useFirstSteps';

const getProgress = onboardingService.getProgress as jest.Mock;
const withCalendar = (calendar: boolean) => ({
  me: { questionnaire: true, linked: true, calendar, schedule: false },
  partner: null,
  couple: { firstRecommendation: false, firstRatedDate: false },
});

describe('useFirstSteps ([primeros-pasos] U3/U4)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    getProgress.mockReset();
  });

  it('la primera vez en el teléfono no festeja lo que ya estaba hecho (R1)', async () => {
    getProgress.mockResolvedValue(withCalendar(true));
    const { result } = renderHook(() => useFirstSteps(4));
    await act(() => result.current.refresh());
    expect(result.current.pending).toBeNull();
    expect(result.current.hidden).toBe(false);
  });

  it('festeja el calendario recién conectado con la barra de 2/6 a 3/6', async () => {
    await saveCelebrated(4, ['questionnaire', 'link']);
    getProgress.mockResolvedValue(withCalendar(true));
    const { result } = renderHook(() => useFirstSteps(4));
    await act(() => result.current.refresh());
    expect(result.current.pending?.celebration.title).toBe('¡Calendario conectado!');
    expect(result.current.pending?.from).toBeCloseTo(2 / 6);
    expect(result.current.pending?.to).toBeCloseTo(3 / 6);
  });

  it('con la tarjeta oculta no festeja; «Ver tutorial» la vuelve a mostrar', async () => {
    await saveCelebrated(4, ['questionnaire', 'link']);
    getProgress.mockResolvedValue(withCalendar(true));
    const { result } = renderHook(() => useFirstSteps(4));
    await act(() => result.current.hide());
    await act(() => result.current.refresh());
    expect(result.current.hidden).toBe(true);
    expect(result.current.pending).toBeNull();

    await showFirstStepsAgain(4);
    await act(() => result.current.refresh());
    expect(result.current.hidden).toBe(false);
  });

  it('F-21 «Ver tutorial» muestra otra vez la tarjeta y las guías', async () => {
    getProgress.mockResolvedValue(withCalendar(false));
    const { result } = renderHook(() => useFirstSteps(4));
    await act(() => result.current.hide());
    await markSeen(4, 'calendars');

    await restartTutorial(4);
    await act(() => result.current.refresh());

    expect(result.current.hidden).toBe(false);
    await expect(wasSeen(4, 'calendars')).resolves.toBe(false);
  });

  it('sin red no hay tarjeta (R5)', async () => {
    getProgress.mockRejectedValue(new Error('sin red'));
    const { result } = renderHook(() => useFirstSteps(4));
    await act(() => result.current.refresh());
    expect(result.current.progress).toBeNull();
  });
});
