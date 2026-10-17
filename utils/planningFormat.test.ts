import { agreementOf, filtersToSlot, remainingLabel, timeLeftToDecide, voteLine } from './planningFormat';

const NOW = new Date('2026-10-17T18:00:00.000Z');

describe('remainingLabel', () => {
  it('horas y minutos que faltan, sin segundos', () => {
    expect(remainingLabel('2026-10-18T17:41:30.000Z', NOW)).toBe('23 h 41 min');
    expect(remainingLabel('2026-10-17T18:45:00.000Z', NOW)).toBe('45 min');
    expect(remainingLabel('2026-10-17T20:00:00.000Z', NOW)).toBe('2 h');
  });

  it('vencido o sin fecha no muestra tiempo negativo', () => {
    expect(remainingLabel('2026-10-17T17:00:00.000Z', NOW)).toBe('0 min');
    expect(remainingLabel(null, NOW)).toBe('');
  });
});

describe('timeLeftToDecide', () => {
  it('frase del encabezado de la sesion', () => {
    expect(timeLeftToDecide('2026-10-18T05:52:00.000Z', NOW)).toBe('Quedan 11 h 52 min para decidir');
  });
});

describe('voteLine', () => {
  it('describe los dos votos con el nombre de la pareja', () => {
    expect(voteLine('LIKE', 'LIKE', 'Sam')).toBe('Tú: te gusta · Sam: le gusta');
    expect(voteLine('LIKE', null, 'Sam')).toBe('Tú: te gusta · Sam: aún no');
    expect(voteLine(null, 'DISLIKE', 'Ana')).toBe('Tú: aún no · Ana: no le convence');
    expect(voteLine('DISLIKE', null, 'Ana')).toBe('Tú: no te convence · Ana: aún no');
  });
});

describe('agreementOf', () => {
  it('coinciden si a los dos les gusta; no coinciden si uno si y otro no', () => {
    expect(agreementOf('LIKE', 'LIKE')).toBe('match');
    expect(agreementOf('LIKE', 'DISLIKE')).toBe('mismatch');
    expect(agreementOf('DISLIKE', 'LIKE')).toBe('mismatch');
    expect(agreementOf('LIKE', null)).toBeNull();
    expect(agreementOf('DISLIKE', 'DISLIKE')).toBeNull();
  });
});

describe('filtersToSlot', () => {
  it('reconstruye el hueco elegido desde los instantes guardados (hora de CDMX)', () => {
    expect(filtersToSlot('2026-10-18T00:00:00.000Z', '2026-10-18T03:00:00.000Z')).toEqual({
      key: '2026-10-17T18:00',
      date: '2026-10-17',
      start: '18:00',
      end: '21:00',
    });
    expect(filtersToSlot(null, null)).toBeUndefined();
  });
});
