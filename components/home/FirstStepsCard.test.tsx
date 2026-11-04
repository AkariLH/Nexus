jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { OnboardingProgress } from '../../services/onboarding.service';
import { FirstStepsCard } from './FirstStepsCard';

const progress = (done: number, partner: OnboardingProgress['partner'] = null): OnboardingProgress => ({
  me: { questionnaire: done > 0, linked: done > 1, calendar: done > 2, schedule: done > 3 },
  partner,
  couple: { firstRecommendation: done > 4, firstRatedDate: done > 5 },
});

describe('FirstStepsCard ([primeros-pasos] Figma N1/N4)', () => {
  it('F-09 muestra cuántos van y el siguiente paso', () => {
    render(<FirstStepsCard progress={progress(3)} onOpen={jest.fn()} onHide={jest.fn()} />);
    expect(screen.getByText('3 de 6')).toBeTruthy();
    expect(screen.getByText('Ajusta tus horarios')).toBeTruthy();
  });

  it('F-10 tocar el siguiente paso abre su pantalla', () => {
    const onOpen = jest.fn();
    render(<FirstStepsCard progress={progress(2)} onOpen={onOpen} onHide={jest.fn()} />);
    fireEvent.press(screen.getByLabelText('Siguiente paso: Conecta tu calendario'));
    expect(onOpen).toHaveBeenCalledWith('/(tabs)/link-external-calendars');
  });

  it('F-11 la línea de la pareja solo sale si hay pareja', () => {
    const partner = { name: 'Sam', questionnaire: true, calendar: true, schedule: false };
    const { rerender } = render(<FirstStepsCard progress={progress(2, partner)} onOpen={jest.fn()} onHide={jest.fn()} />);
    expect(screen.getByText('Sam ya conectó su calendario')).toBeTruthy();

    rerender(<FirstStepsCard progress={progress(2)} onOpen={jest.fn()} onHide={jest.fn()} />);
    expect(screen.queryByText(/Sam/)).toBeNull();
  });

  it('«Enséñame dónde» empieza el recorrido del siguiente paso', () => {
    const onShowMe = jest.fn();
    render(<FirstStepsCard progress={progress(2)} onOpen={jest.fn()} onHide={jest.fn()} onShowMe={onShowMe} />);
    fireEvent.press(screen.getByText('Enséñame dónde'));
    expect(onShowMe).toHaveBeenCalledWith('calendar');
  });

  it('F-12 «Ocultar» avisa a Inicio', () => {
    const onHide = jest.fn();
    render(<FirstStepsCard progress={progress(1)} onOpen={jest.fn()} onHide={onHide} />);
    fireEvent.press(screen.getByText('Ocultar'));
    expect(onHide).toHaveBeenCalled();
  });

  it('F-13 con 6 de 6 no dibuja nada', () => {
    render(<FirstStepsCard progress={progress(6)} onOpen={jest.fn()} onHide={jest.fn()} />);
    expect(screen.queryByText('Primeros pasos')).toBeNull();
  });

  it('N4 al tocar el encabezado se ven los 6 hitos con «Juntos» en los de pareja', () => {
    const partner = { name: 'Sam', questionnaire: true, calendar: false, schedule: false };
    render(<FirstStepsCard progress={progress(2, partner)} onOpen={jest.fn()} onHide={jest.fn()} />);
    fireEvent.press(screen.getByLabelText('Primeros pasos, 2 de 6. Ver todos'));
    expect(screen.getByText('Califiquen su primera cita')).toBeTruthy();
    expect(screen.getAllByText('Juntos').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Sam ✓')).toBeTruthy();
  });
});
