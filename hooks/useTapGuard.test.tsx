/**
 * [modales-un-clic] M-03: en los modales compartidos, el primer toque cuenta y los que llegan
 * mientras el modal se cierra se ignoran (antes repetían la acción). Pasado un momento, se puede
 * volver a tocar (p. ej. reintentar una contraseña equivocada sin cerrar el modal).
 */
import React from 'react';
import { fireEvent, render, renderHook, screen } from '@testing-library/react-native';
import { TAP_GUARD_MS, useTapGuard } from './useTapGuard';
import { ConfirmModal } from '../app/components/ConfirmModal';

jest.mock('expo-blur', () => ({ BlurView: ({ children }: { children: React.ReactNode }) => children }));

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('el segundo toque seguido se ignora; después de un momento vuelve a contar', () => {
  const { result } = renderHook(() => useTapGuard());
  const action = jest.fn();
  const guarded = result.current(action);

  guarded();
  guarded();
  expect(action).toHaveBeenCalledTimes(1);

  jest.advanceTimersByTime(TAP_GUARD_MS);
  guarded();
  expect(action).toHaveBeenCalledTimes(2);
});

it('sin acción no truena', () => {
  const { result } = renderHook(() => useTapGuard());
  expect(() => result.current(undefined)()).not.toThrow();
});

it('ConfirmModal: dos toques rápidos a «Confirmar» llaman una sola vez', () => {
  const onConfirm = jest.fn();
  render(<ConfirmModal visible title="¿Seguro?" message="" onConfirm={onConfirm} onCancel={jest.fn()} />);

  fireEvent.press(screen.getByText('Confirmar'));
  fireEvent.press(screen.getByText('Confirmar'));
  expect(onConfirm).toHaveBeenCalledTimes(1);
});
