/** [push-avisos] Pantalla que abre una push al tocarla. */
/** `replace`: sustituye la pantalla actual en vez de apilar otra (p. ej. un segundo Inicio). */
export type PushTarget = { pathname: string; params?: Record<string, string>; replace?: boolean };

/** Las únicas rutas que manda el backend (PushRoute.java); cualquier otra se ignora (R9). */
const KNOWN_ROUTES = new Set([
  '/(planning)/session',
  '/(events)/notifications',
  '/(tabs)',
  '/(tabs)/link',
  '/(tabs)/calendario',
  '/(events)/edit-event',
]);

/** `null` si la push no trae una ruta conocida: entonces no se navega a ningún lado. */
export function routeForPush(data: Record<string, unknown> | undefined): PushTarget | null {
  const route = data?.route;
  if (typeof route !== 'string' || !KNOWN_ROUTES.has(route)) return null;
  const partnerName = data?.partnerName;
  if (data?.type === 'LINK_ESTABLISHED' && typeof partnerName === 'string' && partnerName) {
    // Se reemplaza: un segundo Inicio apilado dejaba el modal H7 del de abajo abierto sin fin.
    return { pathname: route, params: { linked: partnerName }, replace: true };
  }
  // [avisos-calendario] RF-29: abre "Libres juntos" en el calendario.
  if (route === '/(tabs)/calendario') return { pathname: route, params: { freeTogether: '1' } };
  // [avisos-calendario] RF-24: abre el evento de Nexus; sin su id, la campanita.
  if (route === '/(events)/edit-event') {
    const eventId = data?.eventId;
    if (typeof eventId !== 'string' || !eventId) return { pathname: '/(events)/notifications' };
    return { pathname: route, params: { eventId } };
  }
  return { pathname: route };
}

/**
 * [avisos-calendario] Pantalla al tocar un aviso en la campanita (no trae ruta como la push).
 * Solo "libres juntos"; el de un evento cambiado necesita su id, que la lista no trae.
 */
export function routeForNotice(type: string): PushTarget | null {
  if (type === 'FREE_TIME') return routeForPush({ route: '/(tabs)/calendario' });
  return null;
}

/** Evento de la app cuando llega una push con la app abierta: Inicio recarga la campanita. */
export const NOTICES_EVENT = 'nexus:notices';
