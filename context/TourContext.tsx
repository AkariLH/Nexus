import { usePathname } from 'expo-router';
import { createContext, ReactNode, RefObject, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { TOURS, TargetId, TourId, TourStep, reconcile } from '../utils/tours';

/** Lo único que el recorrido necesita de lo resaltado: medirse en la ventana. */
export interface Measurable {
  measureInWindow: (cb: (x: number, y: number, width: number, height: number) => void) => void;
}

interface ActiveTour {
  tour: TourId;
  index: number;
  total: number;
  step: TourStep;
}

interface TourContextValue {
  active: ActiveTour | null;
  /** true mientras una pantalla tiene un modal abierto: el recorrido espera (R13). */
  paused: boolean;
  start: (tour: TourId) => void;
  next: () => void;
  stop: () => void;
  setPaused: (key: string, value: boolean) => void;
  register: (id: TargetId, ref: RefObject<Measurable | null>) => void;
  unregister: (id: TargetId, ref: RefObject<Measurable | null>) => void;
  target: (id: TargetId) => RefObject<Measurable | null> | undefined;
}

const TourContext = createContext<TourContextValue | null>(null);

/**
 * [primeros-pasos] T2: qué recorrido va, en qué paso y qué se puede resaltar. La pantalla actual
 * manda: al llegar a la que esperaba el paso de «tocar», avanza; en otra, el recorrido se cierra.
 */
export function TourProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<{ tour: TourId; index: number } | null>(null);
  const [pauses, setPauses] = useState<Set<string>>(() => new Set());
  const targets = useRef(new Map<TargetId, RefObject<Measurable | null>>());

  const activeTour = state?.tour;
  useEffect(() => {
    setState(current => {
      if (!current) return current;
      const index = reconcile(TOURS[current.tour], current.index, pathname);
      if (index === null) return null;
      return index === current.index ? current : { ...current, index };
    });
    // También al empezar un recorrido: puede arrancar ya en la pantalla del paso siguiente.
  }, [pathname, activeTour]);

  const start = useCallback((tour: TourId) => setState({ tour, index: 0 }), []);
  const stop = useCallback(() => setState(null), []);
  const next = useCallback(() => {
    setState(current => {
      if (!current) return current;
      const index = current.index + 1;
      return index < TOURS[current.tour].length ? { ...current, index } : null;
    });
  }, []);
  const setPaused = useCallback((key: string, value: boolean) => {
    setPauses(prev => {
      if (prev.has(key) === value) return prev;
      const copy = new Set(prev);
      if (value) copy.add(key);
      else copy.delete(key);
      return copy;
    });
  }, []);
  const register = useCallback((id: TargetId, ref: RefObject<Measurable | null>) => {
    targets.current.set(id, ref);
  }, []);
  const unregister = useCallback((id: TargetId, ref: RefObject<Measurable | null>) => {
    if (targets.current.get(id) === ref) targets.current.delete(id);
  }, []);
  const target = useCallback((id: TargetId) => targets.current.get(id), []);

  const value = useMemo<TourContextValue>(() => {
    const steps = state ? TOURS[state.tour] : null;
    const active = state && steps
      ? { tour: state.tour, index: state.index, total: steps.length, step: steps[state.index] }
      : null;
    return { active, paused: pauses.size > 0, start, next, stop, setPaused, register, unregister, target };
  }, [state, pauses, start, next, stop, setPaused, register, unregister, target]);

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour fuera de TourProvider');
  return ctx;
}

/** Para piezas que también viven fuera del proveedor (pruebas de una pantalla sola): null sin él. */
export function useOptionalTour(): TourContextValue | null {
  return useContext(TourContext);
}

/** Pausa el recorrido mientras `paused` sea true (p. ej. un modal abierto en la pantalla). */
export function usePauseTour(key: string, paused: boolean) {
  const setPaused = useOptionalTour()?.setPaused;
  useEffect(() => {
    if (!setPaused) return;
    setPaused(key, paused);
    return () => setPaused(key, false);
  }, [key, paused, setPaused]);
}
