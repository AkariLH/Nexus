/**
 * Cuando el servidor responde 401 (sesion ausente, vencida o alterada), el cliente HTTP debe
 * avisar para que la app cierre la sesion y lleve al inicio de sesion, en vez de quedarse
 * reintentando con un token que ya no sirve. Un 403 es otra cosa (recurso ajeno) y no cierra nada.
 */
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:8080/api';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import type { AxiosInstance } from 'axios';

// require y no import: los import se elevan por encima de la asignacion de la variable de arriba.
const apiClient: AxiosInstance = require('./api.client').default;
const { onSessionExpired } = require('../utils/session');

/** El manejador de errores que api.client registra en axios. */
function rejectResponse(error: unknown): Promise<unknown> {
  const handlers = (apiClient.interceptors.response as any).handlers;
  return handlers[handlers.length - 1].rejected(error);
}

function serverError(status: number) {
  return { message: `Request failed with status code ${status}`, response: { status, data: null }, config: { url: '/x' } };
}

describe('api.client — sesion rechazada por el servidor', () => {
  it('avisa de sesion vencida cuando el servidor responde 401', async () => {
    const listener = jest.fn();
    const off = onSessionExpired(listener);

    await expect(rejectResponse(serverError(401))).rejects.toMatchObject({ status: 401 });

    expect(listener).toHaveBeenCalledTimes(1);
    off();
  });

  it('no cierra la sesion por un 403 de un recurso ajeno', async () => {
    const listener = jest.fn();
    const off = onSessionExpired(listener);

    await expect(rejectResponse(serverError(403))).rejects.toMatchObject({ status: 403 });

    expect(listener).not.toHaveBeenCalled();
    off();
  });
});
