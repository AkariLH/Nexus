import { costLabel, dayPhrase, placeLabel, slotLabel, slotOptionLabel } from './recommendationFormat';

// Viernes 16 de octubre de 2026, 17:07 en CDMX (UTC-6).
const NOW = new Date('2026-10-16T23:07:00.000Z');

describe('slotLabel', () => {
  it('dice hoy, manana o el dia de la semana, en hora de CDMX', () => {
    expect(slotLabel('2026-10-17T00:00:00Z', '2026-10-17T02:00:00Z', NOW)).toBe('Hoy · 18:00 – 20:00');
    expect(slotLabel('2026-10-17T16:00:00Z', '2026-10-17T18:30:00Z', NOW)).toBe('Mañana · 10:00 – 12:30');
    expect(slotLabel('2026-10-18T18:00:00Z', '2026-10-18T21:00:00Z', NOW)).toBe('Dom 18 · 12:00 – 15:00');
  });

  it('en version compacta pega las horas', () => {
    expect(slotLabel('2026-10-17T00:00:00Z', '2026-10-17T03:00:00Z', NOW, true)).toBe('Hoy · 18:00–21:00');
  });
});

describe('slotOptionLabel', () => {
  it('etiqueta un hueco libre de los dos', () => {
    expect(slotOptionLabel({ key: 'k', date: '2026-10-16', start: '18:00', end: '21:00' }, NOW)).toBe(
      'Hoy · 18:00–21:00',
    );
    expect(slotOptionLabel({ key: 'k', date: '2026-10-17', start: '10:00', end: '14:00' }, NOW)).toBe(
      'Mañana · 10:00–14:00',
    );
    expect(slotOptionLabel({ key: 'k', date: '2026-10-19', start: '12:00', end: '15:00' }, NOW)).toBe(
      'Lun 19 · 12:00–15:00',
    );
  });
});

describe('dayPhrase', () => {
  it('completa "Ya tienen cita ..."', () => {
    expect(dayPhrase('2026-10-17T00:00:00Z', NOW)).toBe('para hoy');
    expect(dayPhrase('2026-10-17T16:00:00Z', NOW)).toBe('para mañana');
    expect(dayPhrase('2026-10-21T16:00:00Z', NOW)).toBe('para el miércoles 21');
  });
});

describe('costLabel', () => {
  it('muestra el costo por persona o gratis', () => {
    expect(costLabel(150)).toBe('$150 por persona');
    expect(costLabel(1200)).toBe('$1,200 por persona');
    expect(costLabel(0)).toBe('Gratis');
  });
});

describe('placeLabel', () => {
  it('en casa no lleva lugar', () => {
    expect(placeLabel({ scope: 'HOME', placeName: null, boroughName: null })).toBe('En casa');
  });

  it('en la ciudad junta alcaldia y lugar', () => {
    expect(placeLabel({ scope: 'CITY', placeName: 'Cineteca Nacional', boroughName: 'Coyoacán' })).toBe(
      'Coyoacán · Cineteca Nacional',
    );
    expect(placeLabel({ scope: 'CITY', placeName: 'Cineteca Nacional', boroughName: null })).toBe(
      'Cineteca Nacional',
    );
  });
});
