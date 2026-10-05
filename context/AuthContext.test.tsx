/**
 * Cubre la persistencia del token JWT en AuthContext: login() debe guardarlo (via
 * utils/authToken.ts) junto con los datos del usuario, logout() debe limpiarlo. Cierra el hueco
 * documentado en .annie.md §10.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import React from 'react';
import { Text, Button } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './AuthContext';
import { getAuthToken } from '../utils/authToken';

function Probe() {
  const { login, logout, user } = useAuth();
  return (
    <>
      <Text testID="user">{user ? String(user.userId) : 'none'}</Text>
      <Button
        testID="login-btn"
        title="login"
        onPress={() =>
          login(
            {
              userId: 4,
              email: 'a@test.com',
              displayName: 'A',
              linkCode: 'ABC',
              emailConfirmed: true,
            },
            'abc.def.ghi',
            '2026-10-10T00:00:00Z'
          )
        }
      />
      <Button testID="logout-btn" title="logout" onPress={() => logout()} />
    </>
  );
}

describe('AuthContext — persistencia del token', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('guarda el token al iniciar sesion', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId('login-btn'));
    await waitFor(() => expect(screen.getByTestId('user').props.children).toBe('4'));
    await expect(getAuthToken()).resolves.toBe('abc.def.ghi');
  });

  it('limpia el token al cerrar sesion', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    fireEvent.press(screen.getByTestId('login-btn'));
    await waitFor(() => expect(screen.getByTestId('user').props.children).toBe('4'));

    fireEvent.press(screen.getByTestId('logout-btn'));
    await waitFor(() => expect(screen.getByTestId('user').props.children).toBe('none'));
    await expect(getAuthToken()).resolves.toBeNull();
  });
});
