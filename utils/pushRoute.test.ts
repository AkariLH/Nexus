import { routeForPush } from './pushRoute';

describe('routeForPush ([push-avisos] U8)', () => {
  it('abre la sesión de planeación', () => {
    expect(routeForPush({ type: 'INVITE', route: '/(planning)/session', sessionId: '7' })).toEqual({
      pathname: '/(planning)/session',
    });
  });

  it('abre la campanita en los avisos de eventos', () => {
    expect(routeForPush({ type: 'EVENT_CONFIRMED', route: '/(events)/notifications' })).toEqual({
      pathname: '/(events)/notifications',
    });
  });

  it('al vincularse abre el inicio con el nombre de la pareja', () => {
    expect(routeForPush({ type: 'LINK_ESTABLISHED', route: '/(tabs)', partnerName: 'Andrea' })).toEqual({
      pathname: '/(tabs)',
      params: { linked: 'Andrea' },
    });
  });

  it('al vincularse sin nombre abre el inicio sin parámetros', () => {
    expect(routeForPush({ type: 'LINK_ESTABLISHED', route: '/(tabs)' })).toEqual({ pathname: '/(tabs)' });
  });

  it('al desvincularse abre la pantalla de vínculo', () => {
    expect(routeForPush({ type: 'LINK_DELETED', route: '/(tabs)/link', partnerName: 'Andrea' })).toEqual({
      pathname: '/(tabs)/link',
    });
  });

  it('ignora rutas desconocidas, vacías o sin datos', () => {
    expect(routeForPush({ type: 'X', route: '/(auth)/login' })).toBeNull();
    expect(routeForPush({ type: 'X', route: 42 })).toBeNull();
    expect(routeForPush({})).toBeNull();
    expect(routeForPush(undefined)).toBeNull();
  });
});
