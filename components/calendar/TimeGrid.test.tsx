import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { TimeGrid } from './TimeGrid';
import type { CalendarItem, FreeSlot } from '../../utils/calendarLayout';

/** [ux-ajustes] D6 (Figma L3): Semana con barras sin texto, "ahora" y libres solo en su dia. */
describe('TimeGrid', () => {
  // Domingo 25 al sabado 31 de octubre de 2026; hoy es el sabado 31 a las 10:20.
  const week = Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 25 + i));
  const NOW = new Date(2026, 9, 31, 10, 20);

  const cena: CalendarItem = {
    id: 'e1',
    title: 'Cena',
    start: new Date(2026, 9, 29, 19, 0),
    end: new Date(2026, 9, 29, 21, 0),
    allDay: false,
    source: 'couple',
    subtitle: 'Coyoacán',
    color: '#10B981',
    readOnly: false,
    eventId: 1,
    externalId: null,
  };

  const free: FreeSlot = {
    date: '2026-10-29',
    startTime: '16:00',
    endTime: '18:00',
    start: new Date(2026, 9, 29, 16, 0),
    end: new Date(2026, 9, 29, 18, 0),
    label: '16:00 – 18:00',
  };

  it('en Semana los bloques van sin texto, pero el lector de pantalla sigue leyendo título y horas', () => {
    render(<TimeGrid days={week} items={[cena]} compact onPressItem={() => {}} />);

    expect(screen.queryByText('Cena')).toBeNull();
    expect(screen.getByLabelText('Cena, 19:00 a 21:00')).toBeTruthy();
  });

  it('los «Libres los dos» salen solo en la columna de su día y sin texto en Semana', () => {
    render(<TimeGrid days={week} items={[]} freeSlots={[free]} compact onPressItem={() => {}} />);

    expect(screen.getAllByLabelText('Libres los dos de 16:00 – 18:00. Toca para planear')).toHaveLength(1);
    expect(screen.queryByText('Libres los dos')).toBeNull();
  });

  it('la línea de «ahora» sale solo si hoy está en la vista', () => {
    const { rerender } = render(<TimeGrid days={week} items={[]} now={NOW} compact onPressItem={() => {}} />);
    expect(screen.getAllByTestId('now-line')).toHaveLength(1);

    rerender(<TimeGrid days={[new Date(2026, 10, 1)]} items={[]} now={NOW} onPressItem={() => {}} />);
    expect(screen.queryByTestId('now-line')).toBeNull();
  });

  it('en Día los bloques conservan su título', () => {
    render(<TimeGrid days={[new Date(2026, 9, 29)]} items={[cena]} onPressItem={() => {}} />);

    expect(screen.getByText('Cena')).toBeTruthy();
  });
});
