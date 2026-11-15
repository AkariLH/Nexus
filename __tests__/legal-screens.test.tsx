/**
 * [terminos-en-app] Figma O2/O3: los términos y el aviso se leen dentro de la app, una tarjeta por
 * párrafo, y la flecha regresa a donde estaba (registro o Configuraciones).
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

import TermsScreen from '../app/(legal)/terms';
import PrivacyScreen from '../app/(legal)/privacy';
import { PRIVACY, TERMS } from '../constants/legal';

beforeEach(() => mockBack.mockClear());

it('Términos: encabezado y todas las tarjetas con su párrafo', () => {
  render(<TermsScreen />);
  expect(screen.getByRole('header', { name: 'Términos y condiciones' })).toBeTruthy();
  for (const s of TERMS) {
    expect(screen.getByText(s.title)).toBeTruthy();
    expect(screen.getByText(s.text)).toBeTruthy();
  }
});

it('Aviso de privacidad: encabezado y todas las tarjetas con su párrafo', () => {
  render(<PrivacyScreen />);
  expect(screen.getByRole('header', { name: 'Aviso de privacidad' })).toBeTruthy();
  for (const s of PRIVACY) {
    expect(screen.getByText(s.title)).toBeTruthy();
    expect(screen.getByText(s.text)).toBeTruthy();
  }
});

it('el párrafo va justificado, como en Figma', () => {
  render(<TermsScreen />);
  expect(screen.getByText(TERMS[0].text)).toHaveStyle({ textAlign: 'justify' });
});

it('la flecha regresa a la pantalla anterior', () => {
  render(<PrivacyScreen />);
  fireEvent.press(screen.getByLabelText('Regresar'));
  expect(mockBack).toHaveBeenCalledTimes(1);
});
