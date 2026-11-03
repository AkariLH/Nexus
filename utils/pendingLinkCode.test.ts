jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { codeFromLink, inviteMessage, linkCodeUrl, savePendingLinkCode, takePendingLinkCode } from './pendingLinkCode';

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

describe('inviteMessage (botón Compartir)', () => {
  it('sin dirección web explica dónde escribir el código', () => {
    expect(inviteMessage('AB12CD', 15)).toBe(
      '¡Únete a mí en Nexus! Abre la app → Pareja → Unirme a mi pareja y escribe AB12CD. Vence en 15 minutos.',
    );
  });

  it('con dirección https agrega un link tocable que abre Nexus con el código', () => {
    expect(inviteMessage('AB12CD', 15, 'https://nexus.app/')).toBe(
      '¡Únete a mí en Nexus! Toca para unirte: https://nexus.app/unirme?code=AB12CD\n\n' +
        'O abre la app → Pareja → Unirme a mi pareja y escribe AB12CD. Vence en 15 minutos.',
    );
  });

  it('ignora una dirección que no es https (WhatsApp no la vuelve tocable)', () => {
    expect(inviteMessage('AB12CD', 15, 'http://192.168.0.197:8081')).toBe(inviteMessage('AB12CD', 15));
    expect(inviteMessage('AB12CD', 15, '  ')).toBe(inviteMessage('AB12CD', 15));
  });
});
