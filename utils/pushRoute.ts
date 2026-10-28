/** [push-avisos] Pantalla que abre una push al tocarla. */
export type PushTarget = { pathname: string; params?: Record<string, string> };

/** Las únicas rutas que manda el backend (PushRoute.java); cualquier otra se ignora (R9). */
const KNOWN_ROUTES = new Set(['/(planning)/session', '/(events)/notifications', '/(tabs)', '/(tabs)/link']);

/** `null` si la push no trae una ruta conocida: entonces no se navega a ningún lado. */
export function routeForPush(data: Record<string, unknown> | undefined): PushTarget | null {
  const route = data?.route;
  if (typeof route !== 'string' || !KNOWN_ROUTES.has(route)) return null;
  const partnerName = data?.partnerName;
  if (data?.type === 'LINK_ESTABLISHED' && typeof partnerName === 'string' && partnerName) {
    return { pathname: route, params: { linked: partnerName } };
  }
  return { pathname: route };
}
