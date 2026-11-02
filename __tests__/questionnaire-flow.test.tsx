/**
 * Figma D1-D4 - Cuestionario paso a paso: bienvenida, "Siguiente" activo solo con algo elegido,
 * guardado por paso, "Nada de esto me interesa", retomar donde se quedo y "Terminar"/"Guardar".
 * Vive fuera de app/ para que expo-router no la tome como ruta.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('../services/preference.service', () => ({
  __esModule: true,
  default: { getAllCategories: jest.fn(), getUserPreferences: jest.fn(), savePreferences: jest.fn() },
}));

import preferenceService from '../services/preference.service';
import { QuestionnaireFlow } from '../components/questionnaire/QuestionnaireFlow';
import { QUESTIONNAIRE_STEPS } from '../utils/questionnaireSteps';

jest.setTimeout(20000);

const service = preferenceService as jest.Mocked<typeof preferenceService>;

const categories = QUESTIONNAIRE_STEPS.map((step, index) => ({
  id: index + 1,
  name: step.categoryName,
  description: '',
  preferences: [
    { id: index * 10 + 1, name: `Opción ${index + 1}`, description: '', categoryId: index + 1, categoryName: step.categoryName },
    { id: index * 10 + 9, name: 'Ninguna de estas', description: '', categoryId: index + 1, categoryName: step.categoryName },
  ],
}));

const saved = (names: string[]) =>
  names.map((categoryName, i) => ({ preferenceId: i * 10 + 1, preferenceName: 'x', categoryName, level: null }));

async function renderFlow(props: Partial<React.ComponentProps<typeof QuestionnaireFlow>> = {}) {
  const onFinish = jest.fn();
  render(<QuestionnaireFlow userId={4} mode="initial" onFinish={onFinish} onExit={jest.fn()} {...props} />);
  await act(async () => {});
  return onFinish;
}

describe('QuestionnaireFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    service.getAllCategories.mockResolvedValue({ data: categories });
    service.getUserPreferences.mockResolvedValue({ data: [] });
    service.savePreferences.mockResolvedValue({ data: { success: true, message: 'ok' } });
  });

  it('empieza con la bienvenida y "Siguiente" se activa al elegir algo', async () => {
    await renderFlow();

    expect(screen.getByText('Bienestar en pareja')).toBeTruthy();
    expect(screen.getByText('Diseñemos citas que les hagan bien')).toBeTruthy();
    expect(screen.getByText(/7 preguntas breves sobre su bienestar/)).toBeTruthy();
    fireEvent.press(screen.getByText('Comenzar'));

    expect(screen.getByText('Paso 1 de 7')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();

    fireEvent.press(screen.getByText('Opción 1'));
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
  });

  it('guarda cada paso y "Nada de esto me interesa" cuenta como respuesta', async () => {
    await renderFlow();
    fireEvent.press(screen.getByText('Comenzar'));

    fireEvent.press(screen.getByText('Nada de esto me interesa'));
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Siguiente' }));
    });

    expect(service.savePreferences).toHaveBeenCalledWith(4, { preferences: [{ preferenceId: 9, level: null }] });
    expect(screen.getByText('Paso 2 de 7')).toBeTruthy();
  });

  it('retoma en el primer paso sin respuesta y termina en el último', async () => {
    service.getUserPreferences.mockResolvedValue({
      data: saved(QUESTIONNAIRE_STEPS.slice(0, 6).map((s) => s.categoryName)),
    });
    const onFinish = await renderFlow();

    expect(screen.getByText('Paso 7 de 7')).toBeTruthy();
    fireEvent.press(screen.getByText('Opción 7'));
    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Terminar' }));
    });

    expect(onFinish).toHaveBeenCalled();
  });

  it('desde Perfil abre con lo guardado marcado y el último botón dice "Guardar"', async () => {
    service.getUserPreferences.mockResolvedValue({ data: saved(QUESTIONNAIRE_STEPS.map((s) => s.categoryName)) });
    await renderFlow({ mode: 'edit' });

    expect(screen.queryByText('Comenzar')).toBeNull();
    expect(screen.getByText('Tus preferencias')).toBeTruthy();
    expect(screen.getByText('Paso 1 de 7')).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Opción 1' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
  });

  it('si no se puede guardar, se queda en el paso y avisa', async () => {
    service.savePreferences.mockResolvedValue({ error: { status: 500 } as any });
    await renderFlow();
    fireEvent.press(screen.getByText('Comenzar'));
    fireEvent.press(screen.getByText('Opción 1'));

    await act(async () => {
      fireEvent.press(screen.getByRole('button', { name: 'Siguiente' }));
    });

    expect(screen.getByText('Paso 1 de 7')).toBeTruthy();
    expect(screen.getByText('No se pudo guardar')).toBeTruthy();
  });
});
