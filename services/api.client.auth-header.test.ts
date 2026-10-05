/**
 * Verifica que el interceptor de requests adjunte el header Authorization cuando hay un token
 * guardado (utils/authToken.ts) y que lo omita cuando no lo hay. Cierra el hueco documentado en
 * .annie.md §10: "No auth token attached to API requests... This must be addressed as a
 * cross-cutting concern in api.client.ts, not per-service."
 *
 * Mismo patron que console-leak.test.ts: sustituye el adapter de axios en vez de anadir
 * axios-mock-adapter (.localsettings exige aprobacion para dependencias nuevas).
 */
process.env.EXPO_PUBLIC_API_URL = 'http://127.0.0.1:8080/api';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AxiosInstance } from 'axios';

const apiClient: AxiosInstance = require('./api.client').default;
const { setAuthToken, clearAuthToken } = require('../utils/authToken');

let lastConfig: any;
const realAdapter = apiClient.defaults.adapter;

function instalarAdapter() {
  apiClient.defaults.adapter = ((config: any) => {
    lastConfig = config;
    return Promise.resolve({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: {},
    });
  }) as any;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  lastConfig = undefined;
  instalarAdapter();
});

afterEach(() => {
  apiClient.defaults.adapter = realAdapter;
});

describe('api.client — header Authorization', () => {
  it('no adjunta Authorization cuando no hay token guardado', async () => {
    await apiClient.get('/profile/4');
    expect(lastConfig.headers.Authorization).toBeUndefined();
  });

  it('adjunta "Bearer <token>" cuando hay un token guardado', async () => {
    await setAuthToken('abc.def.ghi');
    await apiClient.get('/profile/4');
    expect(lastConfig.headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  it('deja de adjuntarlo despues de limpiar el token', async () => {
    await setAuthToken('abc.def.ghi');
    await clearAuthToken();
    await apiClient.get('/profile/4');
    expect(lastConfig.headers.Authorization).toBeUndefined();
  });
});
