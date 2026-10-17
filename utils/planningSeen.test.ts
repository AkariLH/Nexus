jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { markSeen, wasSeen } from './planningSeen';

describe('planningSeen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('recuerda por usuario, sesion y aviso', async () => {
    expect(await wasSeen(4, 50, 'AGREED')).toBe(false);

    await markSeen(4, 50, 'AGREED');

    expect(await wasSeen(4, 50, 'AGREED')).toBe(true);
    expect(await wasSeen(4, 50, 'INVITE')).toBe(false);
    expect(await wasSeen(13, 50, 'AGREED')).toBe(false);
  });

  it('un valor danado se trata como no visto', async () => {
    await AsyncStorage.setItem('@nexus_planning_seen:4', '{roto');
    expect(await wasSeen(4, 50, 'AGREED')).toBe(false);
  });
});
