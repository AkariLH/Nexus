jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { markSeen, resetAll, wasSeen } from './guideStore';

describe('guideStore ([primeros-pasos] U5)', () => {
  beforeEach(() => AsyncStorage.clear());

  it('F-14 una guía marcada queda vista y resetAll las borra todas', async () => {
    await expect(wasSeen(4, 'calendars')).resolves.toBe(false);
    await markSeen(4, 'calendars');
    await markSeen(4, 'home');
    await expect(wasSeen(4, 'calendars')).resolves.toBe(true);

    await resetAll(4);

    await expect(wasSeen(4, 'calendars')).resolves.toBe(false);
    await expect(wasSeen(4, 'home')).resolves.toBe(false);
  });

  it('F-15 lo visto es de cada usuario', async () => {
    await markSeen(4, 'calendars');
    await expect(wasSeen(9, 'calendars')).resolves.toBe(false);
  });

  it('F-16 si el almacenamiento falla, cuenta como vista (no se muestra) y no truena', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disco lleno'));
    await expect(wasSeen(4, 'calendars')).resolves.toBe(true);

    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disco lleno'));
    await expect(markSeen(4, 'calendars')).resolves.toBeUndefined();
  });

  it('resetAll no toca lo de otro usuario', async () => {
    await markSeen(4, 'calendars');
    await markSeen(9, 'calendars');
    await resetAll(4);
    await expect(wasSeen(9, 'calendars')).resolves.toBe(true);
  });
});
