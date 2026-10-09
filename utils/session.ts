/**
 * Vigencia de la sesion. El JWT dura 24 h y el servidor no guarda sesiones, asi que la app debe
 * darse cuenta sola de que ya vencio: al abrir (isSessionExpired) y cuando el servidor responde
 * 401 (notifySessionExpired, que escucha AuthContext para cerrar la sesion).
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/** @returns la funcion para dejar de escuchar. */
export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifySessionExpired(): void {
  listeners.forEach((listener) => listener());
}

/**
 * Lee el `exp` del cuerpo del JWT. No verifica la firma (eso lo hace el servidor): solo evita
 * arrancar con una sesion que el servidor va a rechazar. Lo que no se pueda leer cuenta como
 * vencido.
 */
export function isSessionExpired(jwt: string, nowMs: number = Date.now()): boolean {
  try {
    const body = jwt.split('.')[1];
    const base64 = body.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const { exp } = JSON.parse(atob(padded));
    return typeof exp !== 'number' || exp * 1000 <= nowMs;
  } catch {
    return true;
  }
}
