import { useCallback, useEffect, useRef } from 'react';

/** Lo que tarda en desvanecerse un Modal con animationType="fade", con un margen. */
export const MODAL_FADE_MS = 350;

/**
 * [modales-un-clic] M-02: para abrir un modal justo después de cerrar otro. Si se abren en el mismo
 * instante, en iOS el segundo no aparece y en Android parpadea y hay que tocar otra vez. Si la
 * pantalla se cierra antes, la acción ya no corre.
 */
export function useAfterModalClose(): (action: () => void) => void {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    [],
  );
  return useCallback((action: () => void) => {
    timers.current.push(setTimeout(action, MODAL_FADE_MS));
  }, []);
}
