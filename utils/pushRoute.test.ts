import { routeForNotice, routeForPush } from './pushRoute';

describe('routeForNotice ([avisos-calendario] tocar el aviso en la campanita)', () => {
  it('el aviso de libres juntos abre "Libres juntos" en el calendario', () => {
    expect(routeForNotice('FREE_TIME')).toEqual({ pathname: '/(tabs)/calendario', params: { freeTogether: '1' } });
  });

  it('los demas avisos no llevan a ningun lado', () => {
    expect(routeForNotice('SYNC_CONFLICT')).toBeNull();
    expect(routeForNotice('EVENT_CONFIRMED')).toBeNull();
  });
});

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

  it('al vincularse reemplaza el inicio (no apila otro) con el nombre de la pareja', () => {
    // Apilar un segundo Inicio dejaba el modal "¡Ya están vinculados!" del de abajo sin cerrar.
    expect(routeForPush({ type: 'LINK_ESTABLISHED', route: '/(tabs)', partnerName: 'Andrea' })).toEqual({
      pathname: '/(tabs)',
      params: { linked: 'Andrea' },
      replace: true,
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

  it('[avisos-calendario] los libres juntos abren el calendario en Libres juntos', () => {
    expect(routeForPush({ type: 'FREE_TIME', route: '/(tabs)/calendario', freeTogether: '1' })).toEqual({
      pathname: '/(tabs)/calendario',
      params: { freeTogether: '1' },
    });
  });

  it('[avisos-calendario] un conflicto abre el evento de Nexus; sin id, la campanita', () => {
    expect(routeForPush({ type: 'SYNC_CONFLICT', route: '/(events)/edit-event', eventId: '21' })).toEqual({
      pathname: '/(events)/edit-event',
      params: { eventId: '21' },
    });
    expect(routeForPush({ type: 'SYNC_CONFLICT', route: '/(events)/edit-event' })).toEqual({
      pathname: '/(events)/notifications',
    });
  });

  it('ignora rutas desconocidas, vacías o sin datos', () => {
    expect(routeForPush({ type: 'X', route: '/(auth)/login' })).toBeNull();
    expect(routeForPush({ type: 'X', route: 42 })).toBeNull();
    expect(routeForPush({})).toBeNull();
    expect(routeForPush(undefined)).toBeNull();
  });
});
