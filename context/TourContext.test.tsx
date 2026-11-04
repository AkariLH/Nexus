let mockPath = '/';
jest.mock('expo-router', () => ({ usePathname: () => mockPath }));

import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { TourProvider, useTour } from './TourContext';

const wrapper = ({ children }: { children: React.ReactNode }) => <TourProvider>{children}</TourProvider>;

describe('TourContext ([primeros-pasos] T2)', () => {
  beforeEach(() => { mockPath = '/'; });

  it('empieza en el primer paso', () => {
    const { result } = renderHook(() => useTour(), { wrapper });
    act(() => result.current.start('calendar'));
    expect(result.current.active?.tour).toBe('calendar');
    expect(result.current.active?.index).toBe(0);
    expect(result.current.active?.step.target).toBe('tab.perfil');
  });

  it('avanza al llegar a la pantalla esperada y se cierra en otra', () => {
    const { result, rerender } = renderHook(() => useTour(), { wrapper });
    act(() => result.current.start('calendar'));

    mockPath = '/perfil';
    rerender({});
    expect(result.current.active?.index).toBe(1);

    mockPath = '/calendario';
    rerender({});
    expect(result.current.active).toBeNull();
  });

  it('«Siguiente» avanza y en el último paso termina', () => {
    const { result, rerender } = renderHook(() => useTour(), { wrapper });
    act(() => result.current.start('schedule'));
    mockPath = '/perfil';
    rerender({});
    mockPath = '/configuraciones';
    rerender({});
    mockPath = '/availability-schedule';
    rerender({});
    expect(result.current.active?.index).toBe(3);

    act(() => result.current.next());
    expect(result.current.active?.index).toBe(4);
    act(() => result.current.next());
    expect(result.current.active).toBeNull();
  });

  it('«Salir» lo cierra', () => {
    const { result } = renderHook(() => useTour(), { wrapper });
    act(() => result.current.start('link'));
    act(() => result.current.stop());
    expect(result.current.active).toBeNull();
  });

  it('pausa mientras alguien lo pide (R13)', () => {
    const { result } = renderHook(() => useTour(), { wrapper });
    act(() => result.current.setPaused('celebration', true));
    expect(result.current.paused).toBe(true);
    act(() => result.current.setPaused('celebration', false));
    expect(result.current.paused).toBe(false);
  });
});
