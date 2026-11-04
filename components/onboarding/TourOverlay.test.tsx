let mockPath = '/';
jest.mock('expo-router', () => ({ usePathname: () => mockPath }));

import React, { useEffect } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Measurable, TourProvider, useTour } from '../../context/TourContext';
import type { TargetId } from '../../utils/tours';
import { TourOverlay, relativeTo } from './TourOverlay';

describe('relativeTo (la capa y lo resaltado se miden igual y se restan)', () => {
  const target = { x: 270, y: 740, width: 90, height: 60 };

  it('si la capa empieza más arriba que el origen de las medidas, baja el hueco', () => {
    // Android: la capa cubre la barra de estado (32 px) y las medidas empiezan debajo de ella.
    expect(relativeTo(target, { x: 0, y: -32 })).toEqual({ x: 270, y: 772, width: 90, height: 60 });
  });

  it('con el mismo origen no cambia nada', () => {
    expect(relativeTo(target, { x: 0, y: 0 })).toEqual(target);
  });
});

const fake = (x: number, y: number, w: number, h: number) =>
  ({ current: { measureInWindow: (cb: (a: number, b: number, c: number, d: number) => void) => cb(x, y, w, h) } }) as React.RefObject<Measurable>;

/** Arranca un recorrido y registra (o no) el elemento a resaltar. */
function Harness({ tour, target, paused }: { tour: 'calendar' | 'link'; target?: [TargetId, React.RefObject<Measurable>]; paused?: boolean }) {
  const ctx = useTour();
  useEffect(() => {
    if (target) ctx.register(target[0], target[1]);
    ctx.setPaused('test', !!paused);
    ctx.start(tour);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <Text testID="active">{ctx.active ? `${ctx.active.tour}:${ctx.active.index}` : 'none'}</Text>;
}
import { Text } from 'react-native';

const renderTour = (props: React.ComponentProps<typeof Harness>) =>
  render(
    <TourProvider>
      <Harness {...props} />
      <TourOverlay />
    </TourProvider>,
  );

describe('TourOverlay ([primeros-pasos] T4 · Figma N5)', () => {
  beforeEach(() => {
    mockPath = '/';
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  it('muestra la burbuja del paso cuando encuentra lo resaltado', () => {
    renderTour({ tour: 'calendar', target: ['tab.perfil', fake(270, 740, 90, 60)] });
    act(() => { jest.advanceTimersByTime(300); });
    expect(screen.getByText('Abre tu Perfil')).toBeTruthy();
    expect(screen.getByText('1 de 4')).toBeTruthy();
    // Paso de «tocar»: sin botón Siguiente.
    expect(screen.queryByText('Siguiente')).toBeNull();
  });

  it('«Salir» cierra el recorrido', () => {
    renderTour({ tour: 'calendar', target: ['tab.perfil', fake(270, 740, 90, 60)] });
    act(() => { jest.advanceTimersByTime(300); });
    fireEvent.press(screen.getByText('Salir'));
    expect(screen.getByTestId('active').props.children).toBe('none');
  });

  it('si lo resaltado no aparece en 3 s, se detiene (R11)', () => {
    renderTour({ tour: 'calendar' });
    act(() => { jest.advanceTimersByTime(3500); });
    expect(screen.getByTestId('active').props.children).toBe('none');
    expect(screen.queryByText('Abre tu Perfil')).toBeNull();
  });

  it('en pausa no se dibuja ni se rinde (R13)', () => {
    renderTour({ tour: 'calendar', target: ['tab.perfil', fake(270, 740, 90, 60)], paused: true });
    act(() => { jest.advanceTimersByTime(5000); });
    expect(screen.queryByText('Abre tu Perfil')).toBeNull();
    expect(screen.getByTestId('active').props.children).toBe('calendar:0');
  });

  it('si empieza ya en la pantalla del paso siguiente, salta ahí; los pasos de «Siguiente» llevan botón', () => {
    mockPath = '/link';
    renderTour({ tour: 'link', target: ['link.invite', fake(16, 300, 328, 70)] });
    act(() => { jest.advanceTimersByTime(300); });
    expect(screen.getByTestId('active').props.children).toBe('link:1');
    expect(screen.getByText('Invita a tu pareja')).toBeTruthy();
    expect(screen.getByText('Siguiente')).toBeTruthy();
  });
});
