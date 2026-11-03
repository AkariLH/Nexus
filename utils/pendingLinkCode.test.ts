jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { codeFromLink, linkCodeUrl, savePendingLinkCode, takePendingLinkCode } from './pendingLinkCode';

const AT = new Date('2026-11-03T12:00:00Z');
const minutesLater = (m: number) => new Date(AT.getTime() + m * 60_000);

describe('linkCodeUrl / codeFromLink', () => {
  it('el QR abre "Escribir el código" de Nexus con el código puesto', () => {
    expect(linkCodeUrl('AB12CD')).toBe('nexus://enter-link-code?code=AB12CD');
  });

  it('limpia el código que llega en el enlace', () => {
    expect(codeFromLink(' ab12cd ')).toBe('AB12CD');
    expect(codeFromLink('NEXUS-ab12cd')).toBe('AB12CD');
    expect(codeFromLink(['AB12CD'])).toBe('AB12CD');
    expect(codeFromLink(undefined)).toBe('');
  });
});

describe('código pendiente (escaneado sin sesión)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('se entrega una sola vez si no pasaron 15 minutos (RN-09)', async () => {
    await savePendingLinkCode('AB12CD', AT);

    expect(await takePendingLinkCode(minutesLater(14))).toEqual({ code: 'AB12CD', expired: false });
    expect(await takePendingLinkCode(minutesLater(14))).toBeNull();
  });

  it('pasados 15 minutos avisa que venció', async () => {
    await savePendingLinkCode('AB12CD', AT);

    expect(await takePendingLinkCode(minutesLater(16))).toEqual({ code: 'AB12CD', expired: true });
  });

  it('sin código guardado, o guardado mal, no hay nada pendiente', async () => {
    expect(await takePendingLinkCode(AT)).toBeNull();
    await AsyncStorage.setItem('@nexus_pending_link_code', 'esto-no-es-json');
    expect(await takePendingLinkCode(AT)).toBeNull();
  });
});
