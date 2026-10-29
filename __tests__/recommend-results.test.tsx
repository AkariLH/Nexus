/**
 * Figma A5 / A6 - Pantalla de resultados con el servicio simulado: 5 tarjetas, aviso de filtros
 * ampliados, descartar (entra la siguiente), "Buscar más opciones" y, al agotarse, solo "Ajustar
 * filtros" (F5, F6). Vive fuera de app/ para que expo-router no la tome como ruta.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockBaseForm = {
  zoneType: 'BOROUGH',
  boroughCode: 'COY',
  scope: 'ANY',
  maxCostMxn: 1500,
  slot: { key: 'k', date: '2026-10-17', start: '18:00', end: '21:00' },
};
let mockForm: Record<string, unknown> = mockBaseForm;
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, dismissAll: jest.fn(), navigate: jest.fn() }),
  useLocalSearchParams: () => ({ form: JSON.stringify(mockForm), boroughName: 'Coyoacán' }),
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { userId: 4 } }) }));
jest.mock('../utils/inviteTracker', () => ({ trackInvite: jest.fn() }));
jest.mock('../services/recommendation.service', () => ({
  __esModule: true,
  default: { request: jest.fn(), more: jest.fn(), discard: jest.fn(), invite: jest.fn() },
}));

import recommendationService from '../services/recommendation.service';
import RecommendationResultsScreen from '../app/(recommend)/results';

const service = recommendationService as jest.Mocked<typeof recommendationService>;

const item = (id: number, title: string) => ({
  id,
  activityId: id,
  title,
  category: 'SOCIAL',
  categoryLabel: 'Social',
  scope: 'CITY' as const,
  placeName: 'Cineteca Nacional',
  boroughName: 'Coyoacán',
  durationMinutes: 120,
  costPerPersonMxn: 150,
  reason: 'Un plan tranquilo.',
  reasonSource: 'CATALOG',
  startsAt: '2026-10-18T00:00:00Z',
  endsAt: '2026-10-18T02:00:00Z',
});

const firstFive = [1, 2, 3, 4, 5].map((id) => item(id, `Plan ${id}`));

async function renderLoaded() {
  render(<RecommendationResultsScreen />);
  await act(async () => {
    jest.advanceTimersByTime(3000);
  });
  await screen.findAllByText(/^Plan \d$/);
}

// El primer render carga en frio la pantalla completa (iconos, degradados, animaciones).
jest.setTimeout(20000);

describe('Resultados de recomendaciones', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    service.request.mockResolvedValue({
      requestId: 9,
      items: firstFive,
      relaxedFilters: ['BUDGET'],
      hasMore: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    mockForm = mockBaseForm;
  });

  it('[rango-distancia] sin opciones a 1 km ofrece buscar con 3 km (Figma J3)', async () => {
    mockForm = { ...mockBaseForm, radiusKm: 1 };
    service.request.mockResolvedValue({ requestId: 9, items: [], relaxedFilters: [], hasMore: false });
    render(<RecommendationResultsScreen />);
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(await screen.findByText('No encontramos planes a 1 km')).toBeTruthy();
    fireEvent.press(screen.getByText('Prueba con 3 km'));

    const target = mockReplace.mock.calls[0][0];
    expect(JSON.parse(target.params.form).radiusKm).toBe(3);
    expect(service.request.mock.calls[0][1].radiusKm).toBe(1);
  });

  it('muestra las 5 opciones, los filtros y el aviso de presupuesto ampliado', async () => {
    await renderLoaded();

    expect(screen.getAllByText(/^Plan \d$/)).toHaveLength(5);
    expect(screen.getByText('Coyoacán · 15 km')).toBeTruthy();
    expect(screen.getByText('Hasta $1,500')).toBeTruthy();
    expect(screen.getByText('Ampliamos un poco el presupuesto para darte más opciones.')).toBeTruthy();
    expect(screen.getByText('Buscar más opciones')).toBeTruthy();
    expect(service.request).toHaveBeenCalledWith(
      4,
      expect.objectContaining({ zoneType: 'BOROUGH', boroughCode: 'COY', maxCostMxn: 1500 }),
    );
  });

  it('al descartar entra la siguiente en el mismo lugar', async () => {
    service.discard.mockResolvedValue({ replacement: item(6, 'Plan 6'), hasMore: true });
    await renderLoaded();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Descartar Plan 2'));
    });

    expect(screen.queryByText('Plan 2')).toBeNull();
    expect(screen.getByText('Plan 6')).toBeTruthy();
    expect(service.discard).toHaveBeenCalledWith(4, 2);
  });

  it('sin mas opciones guardadas solo invita a ajustar filtros (F6)', async () => {
    service.more.mockResolvedValue({ requestId: 9, items: [item(7, 'Plan 7')], relaxedFilters: [], hasMore: false });
    await renderLoaded();

    fireEvent.press(screen.getByText('Buscar más opciones'));
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(service.more).toHaveBeenCalledWith(4, 9);
    expect(screen.getByText('Plan 7')).toBeTruthy();
    expect(screen.queryByText('Buscar más opciones')).toBeNull();
    expect(screen.getByText('Ajusta los filtros para ver más opciones.')).toBeTruthy();
  });

  it('invitar abre la confirmacion con el resumen del plan (A6)', async () => {
    await renderLoaded();

    fireEvent.press(screen.getByLabelText('Invitar a Plan 1'));

    expect(screen.getAllByText('Enviar invitación').length).toBeGreaterThan(0);
    expect(screen.getByText('Tu pareja podrá aceptarla o rechazarla.')).toBeTruthy();
  });
});
