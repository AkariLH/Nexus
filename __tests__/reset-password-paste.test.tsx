/**
 * [codigo-pegar] Prueba con usuarios del 5-nov: en «Cambiar contraseña», al pegar el código del
 * correo solo entraba el primer dígito (cada casilla tenía maxLength=1). Ahora usa CodeDigits, como
 * «Verifica tu correo», que reparte el código pegado en las seis casillas.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), push: jest.fn() }),
  useLocalSearchParams: () => ({ email: 'ana@gmail.com' }),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../services/auth.service', () => ({
  authService: { verifyResetCode: jest.fn(() => Promise.resolve({ data: { valid: true } })), resendResetCode: jest.fn(), resetPassword: jest.fn() },
}));

import ResetPasswordScreen from '../app/(auth)/reset-password';

jest.setTimeout(20_000);

it('pegar el código completo en la primera casilla llena las seis', async () => {
  render(<ResetPasswordScreen />);
  await act(async () => {});

  fireEvent.changeText(screen.getByLabelText('Dígito 1 de 6'), '482915');

  ['4', '8', '2', '9', '1', '5'].forEach((d, i) => {
    expect(screen.getByLabelText(`Dígito ${i + 1} de 6`).props.value).toBe(d);
  });
});
