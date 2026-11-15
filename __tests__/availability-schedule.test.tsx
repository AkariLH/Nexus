/**
 * [horarios-citas] Figma Q1. En la prueba con usuarios del 5-nov la mayoría creyó que aquí se ponían
 * las horas en que están ocupados. La pantalla dice para qué es y que lo ocupado sale del calendario.
 */
import React from 'react';
import { act, render, screen } from '@testing-library/react-native';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, []),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('@react-native-community/datetimepicker', () => () => null);
jest.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { userId: 7 } }) }));
jest.mock('../context/TourContext', () => ({ usePauseTour: jest.fn() }));
jest.mock('../components/onboarding/TourTarget', () => ({
  TourTarget: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('../services/availabilityService', () => ({
  getUserSchedule: jest.fn(() =>
    Promise.resolve([
      { day: 'MONDAY', startTime: '18:00', endTime: '22:00', enabled: true },
      { day: 'SATURDAY', startTime: '09:00', endTime: '22:00', enabled: false },
    ]),
  ),
  saveUserSchedule: jest.fn(),
}));

import AvailabilityScheduleScreen from '../app/(settings)/availability-schedule';

it('se llama «Horarios para citas» y aclara que no es el horario de trabajo', async () => {
  render(<AvailabilityScheduleScreen />);
  await act(async () => {});

  expect(screen.getByRole('header', { name: 'Horarios para citas' })).toBeTruthy();
  expect(
    screen.getByText(
      'No es tu horario de trabajo o escuela: lo que ya tienes ocupado, Nexus lo toma de tu calendario. Aquí eliges en qué horas quieres tener citas.',
    ),
  ).toBeTruthy();
});

it('los días apagados dicen «Sin citas»', async () => {
  render(<AvailabilityScheduleScreen />);
  await act(async () => {});

  expect(screen.getAllByText('Sin citas').length).toBeGreaterThan(0);
  expect(screen.queryByText('Sin planes')).toBeNull();
});
