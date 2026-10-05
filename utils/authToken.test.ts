/**
 * Cubre utils/authToken.ts — el almacenamiento del JWT de sesion que hoy no existe (hueco
 * documentado en .annie.md §10: "No auth token attached to API requests"). api.client.ts lee
 * de aqui en el interceptor de requests; AuthContext escribe aqui en login()/logout().
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthToken, setAuthToken, clearAuthToken } from './authToken';

describe('authToken', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('devuelve null cuando no se ha guardado ningun token', async () => {
    await expect(getAuthToken()).resolves.toBeNull();
  });

  it('devuelve el token despues de guardarlo', async () => {
    await setAuthToken('abc.def.ghi', '2026-10-10T00:00:00Z');
    await expect(getAuthToken()).resolves.toBe('abc.def.ghi');
  });

  it('guarda el token sin expiresAt (parametro opcional)', async () => {
    await setAuthToken('abc.def.ghi');
    await expect(getAuthToken()).resolves.toBe('abc.def.ghi');
  });

  it('devuelve null despues de limpiar el token', async () => {
    await setAuthToken('abc.def.ghi');
    await clearAuthToken();
    await expect(getAuthToken()).resolves.toBeNull();
  });

  it('devuelve null si el valor guardado es JSON corrupto, en vez de lanzar', async () => {
    await AsyncStorage.setItem('@nexus_auth_token', 'esto-no-es-json');
    await expect(getAuthToken()).resolves.toBeNull();
  });
});
