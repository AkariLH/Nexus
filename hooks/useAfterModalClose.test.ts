/**
 * [modales-un-clic] M-02: un modal que abre otro espera a que el primero termine de desvanecerse
 * (si se abren en el mismo instante, en iOS el segundo no sale y en Android parpadea).
 */
import { renderHook } from '@testing-library/react-native';
import { MODAL_FADE_MS, useAfterModalClose } from './useAfterModalClose';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it('corre la acción cuando el modal ya se cerró, no antes', () => {
  const { result } = renderHook(() => useAfterModalClose());
  const open = jest.fn();

  result.current(open);
  jest.advanceTimersByTime(MODAL_FADE_MS - 1);
  expect(open).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(open).toHaveBeenCalledTimes(1);
});

it('si la pantalla se cierra antes, la acción ya no corre', () => {
  const { result, unmount } = renderHook(() => useAfterModalClose());
  const open = jest.fn();

  result.current(open);
  unmount();
  jest.advanceTimersByTime(MODAL_FADE_MS);
  expect(open).not.toHaveBeenCalled();
});
