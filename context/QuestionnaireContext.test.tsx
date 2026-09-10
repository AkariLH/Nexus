/**
 * nexus-PERF-07 (parche minimo) — el bucle infinito que deja la app en la pantalla inicial.
 *
 * Dos defectos, ambos en este fichero:
 *  R3 — el `value` del Provider es un literal nuevo en cada render, asi que cada escritura de
 *       estado privado re-renderiza a TODOS los consumidores (el layout de tabs y las 6
 *       pantallas), que vuelven a disparar sus efectos de foco -> checkStatus ->
 *       setCacheTimestamp -> render -> ...
 *  R6 — `revalidate` hace `setCacheTimestamp(0)` y llama a `checkStatus` en el mismo tick; la
 *       instancia invocada cerro sobre el `cacheTimestamp` anterior, asi que la guarda de 10 s
 *       sigue viendo el valor viejo y la revalidacion forzada no consulta al servidor.
 */
import React, { useState } from 'react';
import { Text } from 'react-native';
import { render, screen, act, waitFor } from '@testing-library/react-native';

jest.mock('./AuthContext', () => ({
  useAuth: () => ({ user: { userId: 4 } }),
}));

const mockGetQuestionnaireStatus = jest.fn();
jest.mock('../services/preference.service', () => ({
  __esModule: true,
  default: {
    getQuestionnaireStatus: (...args: unknown[]) => mockGetQuestionnaireStatus(...args),
  },
}));
const getQuestionnaireStatus = mockGetQuestionnaireStatus;

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuestionnaireProvider, useQuestionnaire } from './QuestionnaireContext';

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  getQuestionnaireStatus.mockResolvedValue({ data: { completed: false } });
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('QuestionnaireContext', () => {
  it('R6: revalidate consulta al servidor dentro de la ventana de 10 s', async () => {
    let revalidate: () => Promise<void> = async () => {};

    function Probe() {
      const ctx = useQuestionnaire();
      revalidate = ctx.revalidate;
      return <Text testID="loading">{String(ctx.isLoading)}</Text>;
    }

    render(
      <QuestionnaireProvider>
        <Probe />
      </QuestionnaireProvider>,
    );

    // Arranque sin cache persistente -> checkStatus consulta y saveToCache marca la hora.
    await waitFor(() => expect(getQuestionnaireStatus).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    // Revalidacion forzada inmediata: dentro de los 10 s de la marca recien escrita.
    await act(async () => {
      await revalidate();
    });

    expect(getQuestionnaireStatus).toHaveBeenCalledTimes(2);
  });

  it('R3: el valor del contexto conserva su identidad si los datos publicos no cambian', async () => {
    const values: unknown[] = [];
    let forceParentRender: () => void = () => {};

    function ValueProbe() {
      values.push(useQuestionnaire());
      return null;
    }

    function Parent() {
      const [n, setN] = useState(0);
      forceParentRender = () => setN((v) => v + 1);
      return (
        <QuestionnaireProvider>
          <Text testID="n">{String(n)}</Text>
          <ValueProbe />
        </QuestionnaireProvider>
      );
    }

    render(<Parent />);
    await waitFor(() => expect(getQuestionnaireStatus).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(values.length).toBeGreaterThan(1));

    const before = values[values.length - 1];

    // Un render del padre que no toca ni isCompleted ni isLoading.
    await act(async () => {
      forceParentRender();
    });

    await waitFor(() => expect(screen.getByTestId('n')).toHaveTextContent('1'));
    expect(values[values.length - 1]).toBe(before);
  });

  it('R1: el arranque consulta al servidor una sola vez', async () => {
    function Probe() {
      const ctx = useQuestionnaire();
      return <Text testID="loading">{String(ctx.isLoading)}</Text>;
    }

    render(
      <QuestionnaireProvider>
        <Probe />
      </QuestionnaireProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    // Margen para que cualquier efecto encadenado por un cambio de identidad llegue a correr:
    // si `checkStatus` o `loadFromCache` cambiaran de identidad al asentarse `isCompleted`,
    // el efecto de montaje se volveria a disparar y aqui habria una segunda peticion.
    await act(async () => {
      await Promise.resolve();
    });

    expect(getQuestionnaireStatus).toHaveBeenCalledTimes(1);
  });
});
