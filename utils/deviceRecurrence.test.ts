import { toDeviceRecurrence, withoutEmptyRecurrence } from './deviceRecurrence';

describe('toDeviceRecurrence ([sync-calendario] RF-22)', () => {
  it('diaria', () => {
    expect(toDeviceRecurrence('FREQ=DAILY;INTERVAL=1')).toEqual({ frequency: 'daily', interval: 1 });
  });

  it('semanal con dias: domingo = 1 ... sabado = 7', () => {
    expect(toDeviceRecurrence('FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,SU')).toEqual({
      frequency: 'weekly',
      interval: 1,
      daysOfTheWeek: [{ dayOfTheWeek: 2 }, { dayOfTheWeek: 4 }, { dayOfTheWeek: 1 }],
    });
  });

  it('cada N semanas', () => {
    expect(toDeviceRecurrence('FREQ=WEEKLY;INTERVAL=2;BYDAY=SA')).toEqual({
      frequency: 'weekly',
      interval: 2,
      daysOfTheWeek: [{ dayOfTheWeek: 7 }],
    });
  });

  it('mensual y anual', () => {
    expect(toDeviceRecurrence('FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=15')).toEqual({ frequency: 'monthly', interval: 1 });
    expect(toDeviceRecurrence('FREQ=YEARLY;INTERVAL=1;BYMONTH=2;BYMONTHDAY=14')).toEqual({ frequency: 'yearly', interval: 1 });
  });

  it('con fecha de fin: hasta el final de ese dia', () => {
    const rule = toDeviceRecurrence('FREQ=WEEKLY;INTERVAL=1;BYDAY=SU;UNTIL=20261122');
    expect(rule?.endDate).toEqual(new Date(2026, 10, 22, 23, 59, 59));
  });

  it('sin repeticion o desconocida', () => {
    expect(toDeviceRecurrence(null)).toBeNull();
    expect(toDeviceRecurrence(undefined)).toBeNull();
    expect(toDeviceRecurrence('')).toBeNull();
    expect(toDeviceRecurrence('FREQ=HOURLY')).toBeNull();
    expect(toDeviceRecurrence('esto no es una regla')).toBeNull();
  });
});

describe('withoutEmptyRecurrence (Android cierra la app con recurrenceRule: null)', () => {
  it('quita la repetición vacía para no mandarle null al calendario', () => {
    expect(withoutEmptyRecurrence({ title: 'Cena', recurrenceRule: null })).toEqual({ title: 'Cena' });
    expect('recurrenceRule' in withoutEmptyRecurrence({ title: 'Cena', recurrenceRule: undefined })).toBe(false);
  });

  it('deja la repetición cuando sí hay', () => {
    const rule = { frequency: 'weekly', interval: 1 } as never;
    expect(withoutEmptyRecurrence({ title: 'Clase', recurrenceRule: rule })).toEqual({ title: 'Clase', recurrenceRule: rule });
  });
});
