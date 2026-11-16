/**
 * [animo-historial] Figma R1/R1b. En la prueba con usuarios del 5-nov fueron a Mi historial a
 * registrar su ánimo y el botón no hacía nada (regresaba a Perfil). Ahora se registra ahí mismo.
 */
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('expo-haptics', () => ({ selectionAsync: jest.fn(() => Promise.resolve()) }));
jest.mock('../../services/emotion.service', () => ({ emotionService: { logEmotion: jest.fn(() => Promise.resolve({})) } }));

import { emotionService } from '../../services/emotion.service';
import { TodayMoodCard } from './TodayMoodCard';

const log = emotionService.logEmotion as jest.Mock;
beforeEach(() => log.mockClear());

it('R1: sin registro de hoy, se elige una carita y se guarda ahí mismo', async () => {
  const onSaved = jest.fn();
  render(<TodayMoodCard userId={7} today={null} onSaved={onSaved} />);

  expect(screen.getByText('¿Cómo estuvo tu día?')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();

  fireEvent.press(screen.getByRole('button', { name: 'Tranquilo/a' }));
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
  });

  expect(log).toHaveBeenCalledWith(7, { valence: 0.6, activation: -0.5, label: 'Tranquilo/a' });
  expect(onSaved).toHaveBeenCalledTimes(1);
});

it('R1b: con registro de hoy, lo dice y deja registrar otra vez', () => {
  render(<TodayMoodCard userId={7} today={{ label: 'Tranquilo/a', loggedAt: new Date(2026, 10, 16, 21, 30).toISOString() }} onSaved={jest.fn()} />);

  expect(screen.getByText('Hoy te sentiste Tranquilo/a')).toBeTruthy();
  expect(screen.getByText('A las 21:30')).toBeTruthy();
  expect(screen.queryByText('¿Cómo estuvo tu día?')).toBeNull();

  fireEvent.press(screen.getByRole('button', { name: 'Registrar otra vez' }));
  expect(screen.getByText('¿Cómo estuvo tu día?')).toBeTruthy();
});

it('si no se puede guardar, lo dice sin salir de la tarjeta', async () => {
  log.mockRejectedValueOnce(new Error('sin red'));
  render(<TodayMoodCard userId={7} today={null} onSaved={jest.fn()} />);

  fireEvent.press(screen.getByRole('button', { name: 'Feliz' }));
  await act(async () => {
    fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
  });

  expect(screen.getByText('No se pudo guardar. Inténtalo de nuevo.')).toBeTruthy();
});
