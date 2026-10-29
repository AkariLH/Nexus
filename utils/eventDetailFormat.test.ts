import { detailWhen, recurrenceLabel } from './eventDetailFormat';

describe('detailWhen ([avisos-calendario] Figma J5)', () => {
  it('dice el dia de la ocurrencia y sus horas', () => {
    expect(detailWhen(new Date(2026, 9, 28, 9, 0), new Date(2026, 9, 28, 9, 5), false)).toBe(
      'Miércoles 28 de octubre · 09:00 – 09:05',
    );
  });

  it('si cruza la medianoche dice los dos dias', () => {
    expect(detailWhen(new Date(2026, 9, 28, 23, 0), new Date(2026, 9, 29, 5, 0), false)).toBe(
      'Miércoles 28 de octubre, 23:00 – jueves 29 de octubre, 05:00',
    );
  });

  it('todo el dia', () => {
    expect(detailWhen(new Date(2026, 9, 31), new Date(2026, 9, 31), true)).toBe('Sábado 31 de octubre · Todo el día');
  });
});

describe('recurrenceLabel', () => {
  it('semanal con dias', () => {
    expect(recurrenceLabel('FREQ=WEEKLY;BYDAY=MO,WE')).toBe('Cada semana los lunes y miércoles');
    expect(recurrenceLabel('FREQ=WEEKLY;INTERVAL=2;BYDAY=SA')).toBe('Cada 2 semanas los sábados');
  });

  it('diaria, mensual y anual', () => {
    expect(recurrenceLabel('FREQ=DAILY')).toBe('Todos los días');
    expect(recurrenceLabel('FREQ=DAILY;INTERVAL=3')).toBe('Cada 3 días');
    expect(recurrenceLabel('FREQ=MONTHLY')).toBe('Cada mes');
    expect(recurrenceLabel('FREQ=YEARLY')).toBe('Cada año');
  });

  it('con fecha de fin', () => {
    expect(recurrenceLabel('FREQ=WEEKLY;BYDAY=FR;UNTIL=20261215T000000Z')).toBe('Cada semana los viernes hasta el 15/12/2026');
  });

  it('sin repeticion o desconocida', () => {
    expect(recurrenceLabel(undefined)).toBeNull();
    expect(recurrenceLabel('FREQ=HOURLY')).toBeNull();
  });
});
