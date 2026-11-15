import { useCallback, useRef } from 'react';
import { MODAL_FADE_MS } from './useAfterModalClose';

/** Tiempo en que un segundo toque se ignora: lo que tarda el modal en cerrarse. */
export const TAP_GUARD_MS = MODAL_FADE_MS;

/**
 * [modales-un-clic] M-03: envuelve los botones de un modal para que el primer toque cuente y los
 * que llegan mientras se cierra se ignoren. Pasado ese momento se puede volver a tocar (p. ej.
 * reintentar la contraseña sin que el modal se cierre).
 */
export function useTapGuard(): <A extends unknown[]>(action?: (...args: A) => unknown) => (...args: A) => void {
  const last = useRef(-Infinity);
  return useCallback(
    <A extends unknown[]>(action?: (...args: A) => unknown) =>
      (...args: A) => {
        const now = Date.now();
        if (now - last.current < TAP_GUARD_MS) return;
        last.current = now;
        action?.(...args);
      },
    [],
  );
}
