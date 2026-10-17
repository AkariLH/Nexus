/**
 * Figma E1-E4 - Calendario: eventos del dia elegido en Mes, burbuja "Libres juntos" con su modal
 * (crear evento con esa hora) y los huecos libres punteados en Dia.
 * Vive fuera de app/ para que expo-router no la tome como ruta.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, setParams: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: (cb: () => void) => {
    const { useEffect } = require('react');
    useEffect(cb, [cb]);
  },
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { userId: 4 } }) }));
jest.mock('../hooks/useQuestionnaireGuard', () => ({ useQuestionnaireGuard: jest.fn() }));
jest.mock('../services/link.service', () => ({
  __esModule: true,
  default: {
    getLinkStatus: jest.fn().mockResolvedValue({
      hasActiveLink: true,
      partner: { userId: 13, displayName: 'Sam', nickname: 'Sam', linkedAt: '' },
    }),
  },
}));
jest.mock('../services/event.service', () => ({
  __esModule: true,
  default: { getUserEvents: jest.fn(), deleteEvent: jest.fn() },
}));
jest.mock('../services/externalCalendar.integration.service', () => ({
  externalCalendarIntegration: { getExternalEvents: jest.fn() },
}));
jest.mock('../services/availabilityService', () => ({ findMutualAvailability: jest.fn() }));
jest.mock('../app/components/EventDetailsModal', () => ({ EventDetailsModal: () => null }));
jest.mock('../app/components/ExternalEventDetailModal', () => ({ ExternalEventDetailModal: () => null }));

import eventService from '../services/event.service';
import { externalCalendarIntegration } from '../services/externalCalendar.integration.service';
import { findMutualAvailability } from '../services/availabilityService';
import CalendarioScreen from '../app/(tabs)/calendario';

jest.setTimeout(20000);

const today = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const at = (h: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate(), h).toISOString();

beforeEach(() => {
  jest.clearAllMocks();
  (eventService.getUserEvents as jest.Mock).mockResolvedValue([
    {
      id: 1,
      title: 'Cine al aire libre',
      startDateTime: at(22),
      endDateTime: at(23),
      location: 'Coyoacán',
      fullyApproved: true,
    },
  ]);
  (externalCalendarIntegration.getExternalEvents as jest.Mock).mockResolvedValue([
    {
      id: 8,
      ownerId: 13,
      title: 'Junta',
      startDatetime: at(21),
      endDatetime: at(22),
      isAllDay: false,
      visibility: 'BUSY_ONLY',
    },
  ]);
  (findMutualAvailability as jest.Mock).mockResolvedValue({
    mutualAvailability: [
      { date: iso(today), dayOfWeek: 'X', totalMutualMinutes: 60, mutualFreeSlots: [{ start: '23:00', end: '23:59' }] },
      {
        date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)),
        dayOfWeek: 'X',
        totalMutualMinutes: 180,
        mutualFreeSlots: [{ start: '11:00', end: '14:00' }],
      },
    ],
  });
});

async function renderScreen() {
  render(<CalendarioScreen />);
  await act(async () => {});
}

describe('CalendarioScreen', () => {
  it('muestra en Mes los eventos del día con su origen y la leyenda', async () => {
    await renderScreen();

    expect(screen.getByText('De Sam')).toBeTruthy();
    expect(screen.getByText('Cine al aire libre')).toBeTruthy();
    expect(screen.getByText('Ocupado')).toBeTruthy();
    expect(screen.getByText('Calendario de Sam')).toBeTruthy();
  });

  it('la burbuja abre los horarios libres y tocar uno crea un evento con esa hora', async () => {
    await renderScreen();

    // El hueco de hoy dura menos de 1 h, asi que solo cuenta el de mañana.
    fireEvent.press(screen.getByText('1 horario libre juntos'));
    expect(screen.getByText('Libres juntos')).toBeTruthy();

    fireEvent.press(screen.getByText('11:00 – 14:00'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(events)/create-event',
      params: {
        suggestedDate: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)),
        suggestedStart: '11:00',
        suggestedEnd: '14:00',
      },
    });
  });

  it('en Día muestra los huecos libres de los dos', async () => {
    await renderScreen();

    fireEvent.press(screen.getByText('Día'));
    fireEvent.press(screen.getByRole('button', { name: 'Siguiente' }));

    expect(screen.getByText('Libres los dos')).toBeTruthy();
    fireEvent.press(screen.getByText('Libres los dos'));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ suggestedStart: '11:00' }) }),
    );
  });
});
