/**
 * [terminos-en-app] Figma O4: Configuraciones tiene la sección «Legal» con los términos y el aviso.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), navigate: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('@react-native-async-storage/async-storage', () => ({}));
jest.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { userId: 7, email: 'ana@correo.com' }, logout: jest.fn() }) }));
jest.mock('../hooks/useQuestionnaireGuard', () => ({ useQuestionnaireGuard: jest.fn() }));
jest.mock('../hooks/useFirstSteps', () => ({ restartTutorial: jest.fn() }));
jest.mock('../components/onboarding/TourTarget', () => ({ TourTarget: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('../services/profile.service', () => ({ profileService: { deleteAccount: jest.fn() } }));
jest.mock('../services/link.service', () => ({
  __esModule: true,
  default: { getLinkStatus: jest.fn(() => Promise.resolve({ hasActiveLink: false })), deleteLink: jest.fn() },
}));

import ConfiguracionesScreen from '../app/(tabs)/configuraciones';

beforeEach(() => mockPush.mockClear());

it('muestra la sección Legal con sus dos filas', async () => {
  render(<ConfiguracionesScreen />);
  await act(async () => {});
  expect(screen.getByText('Legal')).toBeTruthy();
  expect(screen.getByText('Términos y condiciones')).toBeTruthy();
  expect(screen.getByText('Aviso de privacidad')).toBeTruthy();
});

it('cada fila abre su pantalla', async () => {
  render(<ConfiguracionesScreen />);
  await act(async () => {});
  fireEvent.press(screen.getByText('Términos y condiciones'));
  expect(mockPush).toHaveBeenLastCalledWith('/(legal)/terms');
  fireEvent.press(screen.getByText('Aviso de privacidad'));
  expect(mockPush).toHaveBeenLastCalledWith('/(legal)/privacy');
});
