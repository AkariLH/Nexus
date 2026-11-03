/**
 * Perfil muestra la fecha de nacimiento real de la cuenta y, al guardar sin tocarla, envía esa
 * misma fecha. Antes arrancaba en 2000-01-01 y la pisaba en cada guardado.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

const mockUser: Record<string, unknown> = {
  userId: 7,
  email: 'ana@correo.com',
  displayName: 'Ana',
  nickname: 'ana',
  linkCode: 'X',
  emailConfirmed: true,
  birthDate: '1998-05-14',
};
const mockUpdateUser = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, updateUser: mockUpdateUser, logout: jest.fn() }),
}));
jest.mock('../hooks/useQuestionnaireGuard', () => ({ useQuestionnaireGuard: jest.fn() }));
jest.mock('@react-native-community/datetimepicker', () => () => null);
jest.mock('expo-image-picker', () => ({}));
jest.mock('../utils/imageProcessor', () => ({ processProfilePhoto: jest.fn() }));
jest.mock('../services/profile.service', () => ({
  profileService: { fetchAvatar: jest.fn(() => Promise.resolve(null)), updateProfile: jest.fn() },
}));

import { profileService } from '../services/profile.service';
import PerfilScreen from '../app/(tabs)/perfil';

const service = profileService as jest.Mocked<typeof profileService>;

it('muestra la fecha guardada y la conserva al guardar otros cambios', async () => {
  service.updateProfile.mockResolvedValue({
    data: { userId: 7, email: 'ana@correo.com', displayName: 'Ana', nickname: 'ana', emailConfirmed: true, emailChanged: false, birthDate: '1998-05-14' },
  } as never);
  render(<PerfilScreen />);
  await act(async () => {});

  expect(screen.getByText('14 de mayo de 1998')).toBeTruthy();

  fireEvent.press(screen.getByText('Editar'));
  await act(async () => {
    fireEvent.press(screen.getByText('Guardar cambios'));
  });

  expect(service.updateProfile).toHaveBeenCalledWith(7, expect.objectContaining({ birthDate: '1998-05-14' }));
  expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({ birthDate: '1998-05-14' }));
});
