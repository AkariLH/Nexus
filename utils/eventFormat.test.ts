import { eventRange, noticeTime, sortForList } from './eventFormat';

const NOW = new Date(2026, 9, 18, 9, 0);

describe('eventRange', () => {
  it('el mismo dia: dia, fecha y horas', () => {
    expect(eventRange(new Date(2026, 9, 21, 9, 5).toISOString(), new Date(2026, 9, 21, 11, 5).toISOString(), NOW))
      .toBe('Mié 21 oct · 09:05 – 11:05');
  });

  it('varios dias: dice tambien el dia en que termina', () => {
    expect(eventRange(new Date(2026, 11, 9, 18, 0).toISOString(), new Date(2026, 11, 11, 18, 0).toISOString(), NOW))
      .toBe('Mié 9 dic 18:00 – Vie 11 dic 18:00');
  });

  it('de otro año: agrega el año', () => {
    expect(eventRange(new Date(2025, 11, 2, 7, 0).toISOString(), new Date(2025, 11, 2, 9, 0).toISOString(), NOW))
      .toBe('Mar 2 dic 2025 · 07:00 – 09:00');
  });
});

describe('sortForList', () => {
  const at = (id: number, d: Date, extra: object = {}) => ({ id, startDateTime: d.toISOString(), ...extra });

  it('primero los que vienen (del mas cercano al mas lejano), al final los que ya pasaron', () => {
    const list = [
      at(1, new Date(2025, 11, 2)),
      at(2, new Date(2026, 9, 25)),
      at(3, new Date(2026, 9, 21)),
      at(4, new Date(2026, 0, 5)),
    ];
    expect(sortForList(list, NOW).map((e) => e.id)).toEqual([3, 2, 4, 1]);
  });

  it('un evento que se sigue repitiendo cuenta como proximo', () => {
    const list = [
      at(1, new Date(2026, 9, 25)),
      at(2, new Date(2025, 11, 9), { isRecurring: true, recurrencePattern: 'FREQ=WEEKLY;INTERVAL=2' }),
      at(3, new Date(2025, 11, 2), { isRecurring: true, recurrencePattern: 'FREQ=WEEKLY;UNTIL=20260321' }),
    ];
    expect(sortForList(list, NOW).map((e) => e.id)).toEqual([2, 1, 3]);
  });
});

describe('noticeTime', () => {
  it('hoy solo la hora; ayer y esta semana con el dia; antes, la fecha', () => {
    expect(noticeTime(new Date(2026, 9, 18, 4, 2).toISOString(), NOW)).toBe('04:02');
    expect(noticeTime(new Date(2026, 9, 17, 21, 49).toISOString(), NOW)).toBe('Ayer 21:49');
    expect(noticeTime(new Date(2026, 9, 14, 8, 0).toISOString(), NOW)).toBe('Mié 08:00');
    expect(noticeTime(new Date(2026, 9, 2, 8, 0).toISOString(), NOW)).toBe('2 oct');
  });
});
