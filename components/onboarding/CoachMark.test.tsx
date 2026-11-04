jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ user: { userId: 4 } }) }));

import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { markSeen, wasSeen } from '../../utils/guideStore';
import { CoachMark, Measurable } from './CoachMark';

const target = (x: number, y: number, w: number, h: number) =>
  ({ current: { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => cb(x, y, w, h) } }) as React.RefObject<Measurable>;

const steps = () => [
  { target: target(16, 200, 328, 120), title: 'Así compartes tu calendario', text: 'Tu pareja ve tus bloques ocupados.' },
  { target: target(16, 340, 328, 60), title: 'Tu pareja ve', text: 'Aquí eliges si ve los detalles.' },
];

describe('CoachMark ([primeros-pasos] U5 · Figma N3)', () => {
  beforeEach(() => AsyncStorage.clear());

  it('F-17 avanza con «Siguiente» y al terminar queda vista', async () => {
    render(<CoachMark screen="calendars" steps={steps()} />);
    expect(await screen.findByText('Así compartes tu calendario')).toBeTruthy();
    expect(screen.getByText('1 de 2')).toBeTruthy();

    fireEvent.press(screen.getByText('Siguiente'));
    expect(await screen.findByText('Tu pareja ve')).toBeTruthy();

    fireEvent.press(screen.getByText('Entendido'));
    await waitFor(() => expect(screen.queryByText('Tu pareja ve')).toBeNull());
    await expect(wasSeen(4, 'calendars')).resolves.toBe(true);
  });

  it('F-18 «Saltar» la cierra y queda vista', async () => {
    render(<CoachMark screen="calendars" steps={steps()} />);
    fireEvent.press(await screen.findByText('Saltar'));
    await waitFor(() => expect(screen.queryByText('Así compartes tu calendario')).toBeNull());
    await expect(wasSeen(4, 'calendars')).resolves.toBe(true);
  });

  it('F-19 sin una medida válida no aparece (R3)', async () => {
    render(<CoachMark screen="calendars" steps={[{ target: target(0, 0, 0, 0), title: 'Nada', text: '' }]} />);
    await new Promise(r => setTimeout(r, 50));
    expect(screen.queryByText('Nada')).toBeNull();
  });

  it('F-20 ya vista no vuelve a salir', async () => {
    await markSeen(4, 'calendars');
    render(<CoachMark screen="calendars" steps={steps()} />);
    await new Promise(r => setTimeout(r, 50));
    expect(screen.queryByText('Así compartes tu calendario')).toBeNull();
  });

  it('espera mientras otro modal está abierto (R4)', async () => {
    const { rerender } = render(<CoachMark screen="calendars" steps={steps()} enabled={false} />);
    await new Promise(r => setTimeout(r, 50));
    expect(screen.queryByText('Así compartes tu calendario')).toBeNull();

    rerender(<CoachMark screen="calendars" steps={steps()} enabled />);
    expect(await screen.findByText('Así compartes tu calendario')).toBeTruthy();
  });
});
