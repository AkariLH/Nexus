import { planParams, reserveParams } from './planFromWindow';
import { slotForWindow } from './recommendationParams';

const w = { date: '2026-10-31', start: '19:00', end: '22:00' };

describe('planFromWindow ([libres-juntos] hoja de la propuesta)', () => {
  it('«Buscar un plan» manda el dia y las horas a Pedir recomendacion', () => {
    expect(planParams(w)).toEqual({ slotDate: '2026-10-31', slotStart: '19:00', slotEnd: '22:00' });
  });

  it('«Solo apartar el horario» abre Crear evento con el dia y las horas', () => {
    expect(reserveParams(w)).toEqual({ suggestedDate: '2026-10-31', suggestedStart: '19:00', suggestedEnd: '22:00' });
  });
});

describe('slotForWindow ([libres-juntos] Pedir recomendacion con el horario ya elegido)', () => {
  const slots = [
    { key: 'a', date: '2026-10-31', start: '17:15', end: '22:00' },
    { key: 'b', date: '2026-11-01', start: '09:00', end: '22:00' },
  ];

  it('elige el hueco que contiene la propuesta y pone su rango', () => {
    expect(slotForWindow(slots, w)).toEqual({ slot: slots[0], from: '19:00', to: '22:00' });
  });

  it('si el horario ya no esta libre no elige nada', () => {
    expect(slotForWindow(slots, { date: '2026-10-31', start: '16:00', end: '18:00' })).toBeNull();
    expect(slotForWindow(slots, { date: '2026-11-02', start: '19:00', end: '22:00' })).toBeNull();
    expect(slotForWindow([], w)).toBeNull();
  });
});
