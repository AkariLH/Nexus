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
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './AuthContext';
import { getAuthToken, setAuthToken } from '../utils/authToken';
import { notifySessionExpired } from '../utils/session';

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

/** JWT de prueba (sin firma real): solo importa el `exp` del cuerpo. */
function jwtExpiringIn(seconds: number): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + seconds;
  return `${encode({ alg: 'HS256' })}.${encode({ sub: '4', exp })}.firma`;
}

const STORED_USER = JSON.stringify({
  userId: 4,
  email: 'a@test.com',
  displayName: 'A',
  linkCode: 'ABC',
  emailConfirmed: true,
});

describe('AuthContext — sesion vencida', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('restaura la sesion guardada cuando el token sigue vigente', async () => {
    await AsyncStorage.setItem('@nexus_user', STORED_USER);
    await setAuthToken(jwtExpiringIn(3600));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user').props.children).toBe('4'));
  });

  it('no restaura la sesion guardada si el token ya vencio, y la borra', async () => {
    await AsyncStorage.setItem('@nexus_user', STORED_USER);
    await setAuthToken(jwtExpiringIn(-60));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(async () =>
      expect(await AsyncStorage.getItem('@nexus_user')).toBeNull()
    );
    expect(screen.getByTestId('user').props.children).toBe('none');
    await expect(getAuthToken()).resolves.toBeNull();
  });

  it('cierra la sesion cuando el servidor avisa que ya no es valida', async () => {
    await AsyncStorage.setItem('@nexus_user', STORED_USER);
    await setAuthToken(jwtExpiringIn(3600));
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );
    await waitFor(() => expect(screen.getByTestId('user').props.children).toBe('4'));

    act(() => notifySessionExpired());

    await waitFor(() => expect(screen.getByTestId('user').props.children).toBe('none'));
    expect(await AsyncStorage.getItem('@nexus_user')).toBeNull();
  });
});
