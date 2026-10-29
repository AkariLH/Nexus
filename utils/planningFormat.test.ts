import { agreementOf, closedNotice, filtersToSlot, remainingLabel, timeLeftToDecide, voteLine, slotContaining } from './planningFormat';

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

describe('closedNotice', () => {
  const later = '2026-10-18T02:00:00.000Z';
  const earlier = '2026-10-17T17:00:00.000Z';

  it('sin opcion que conservar: el texto de siempre y solo planear de nuevo', () => {
    expect(closedNotice(null, 'Suzu', NOW)).toEqual({
      subtitle: 'No llegaron a un acuerdo a tiempo.',
      canInvite: false,
      note: undefined,
    });
  });

  it('mi propuesta sin respuesta, aun a tiempo: se puede mandar como invitacion', () => {
    expect(closedNotice({ kind: 'MY_PROPOSAL', startsAt: later }, 'Suzu', NOW)).toEqual({
      subtitle: 'Suzu no alcanzó a responder tu propuesta.',
      canInvite: true,
      note: undefined,
    });
  });

  it('propuesta de la pareja y coincidencia sin proponer', () => {
    expect(closedNotice({ kind: 'THEIR_PROPOSAL', startsAt: later }, 'Suzu', NOW).subtitle)
      .toBe('No alcanzaste a responder la propuesta de Suzu.');
    expect(closedNotice({ kind: 'MATCH', startsAt: later }, 'Suzu', NOW).subtitle)
      .toBe('Coincidieron en una opción, pero nadie la propuso.');
  });

  it('si el horario ya paso, no se ofrece mandarla y se dice por que', () => {
    expect(closedNotice({ kind: 'MY_PROPOSAL', startsAt: earlier }, 'Suzu', NOW)).toEqual({
      subtitle: 'Suzu no alcanzó a responder tu propuesta. El horario de esa opción ya pasó.',
      canInvite: false,
      note: undefined,
    });
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

describe('slotContaining ([rango-distancia])', () => {
  const slots = [
    { key: 'a', date: '2026-10-17', start: '10:00', end: '20:00' },
    { key: 'b', date: '2026-10-18', start: '12:00', end: '15:00' },
  ];

  it('encuentra el hueco que contiene un rango mas chico', () => {
    // 16:00-19:00 del sabado 17 en CDMX = 22:00-01:00 UTC
    expect(slotContaining(slots, '2026-10-17T22:00:00.000Z', '2026-10-18T01:00:00.000Z')?.key).toBe('a');
  });

  it('no marca ninguno si el rango no cabe en un hueco', () => {
    expect(slotContaining(slots, '2026-10-18T20:00:00.000Z', '2026-10-18T23:00:00.000Z')).toBeUndefined();
    expect(slotContaining(slots, null, null)).toBeUndefined();
  });
});
