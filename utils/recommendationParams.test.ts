import {
  budgetLabel,
  chooseSlot,
  DEFAULT_RADIUS_KM,
  eligibleSlots,
  isValid,
  relaxedMessage,
  rangeEnds,
  rangeStarts,
  RADIUS_OPTIONS_KM,
  RequestForm,
  slotToInstants,
  toParams,
  withRange,
  zoneLabel,
} from './recommendationParams';

// Viernes 16 de octubre de 2026, 17:07 en CDMX (UTC-6).
const NOW = new Date('2026-10-16T23:07:00.000Z');

const day = (date: string, slots: Array<[string, string]>) => ({
  date,
  dayOfWeek: 'X',
  mutualFreeSlots: slots.map(([start, end]) => ({ start, end })),
  totalMutualMinutes: 0,
});

describe('eligibleSlots (F1)', () => {
  it('deja solo huecos de 60 minutos o mas', () => {
    const slots = eligibleSlots([day('2026-10-17', [['10:00', '10:45'], ['17:00', '22:00']])], NOW);

    expect(slots.map((s) => [s.date, s.start, s.end])).toEqual([['2026-10-17', '17:00', '22:00']]);
  });

  it('recorta el hueco de hoy al siguiente cuarto de hora y descarta los que ya pasaron', () => {
    const slots = eligibleSlots(
      [day('2026-10-16', [['09:00', '12:00'], ['15:00', '21:00'], ['17:00', '18:00']])],
      NOW,
    );

    expect(slots.map((s) => [s.start, s.end])).toEqual([['17:15', '21:00']]);
  });

  it('ordena por fecha y hora y da una clave unica', () => {
    const slots = eligibleSlots(
      [day('2026-10-18', [['12:00', '15:00']]), day('2026-10-17', [['17:00', '22:00'], ['10:00', '14:00']])],
      NOW,
    );

    expect(slots.map((s) => s.key)).toEqual([
      '2026-10-17T10:00',
      '2026-10-17T17:00',
      '2026-10-18T12:00',
    ]);
  });
});

describe('slotToInstants', () => {
  it('convierte la hora de CDMX a UTC', () => {
    expect(slotToInstants({ key: 'k', date: '2026-10-17', start: '18:00', end: '21:00' })).toEqual({
      slotStart: '2026-10-18T00:00:00.000Z',
      slotEnd: '2026-10-18T03:00:00.000Z',
    });
  });
});

const slot = { key: 'k', date: '2026-10-17', start: '18:00', end: '21:00' };
const base: RequestForm = { zoneType: 'NONE', slot, scope: 'ANY', maxCostMxn: 1500 };

describe('isValid (F2, F3)', () => {
  it('acepta un formulario completo', () => {
    expect(isValid(base)).toBe(true);
  });

  it('exige zona y horario', () => {
    expect(isValid({ ...base, zoneType: undefined })).toBe(false);
    expect(isValid({ ...base, slot: undefined })).toBe(false);
  });

  it('la alcaldia exige elegir una', () => {
    expect(isValid({ ...base, zoneType: 'BOROUGH' })).toBe(false);
    expect(isValid({ ...base, zoneType: 'BOROUGH', boroughCode: 'COY' })).toBe(true);
  });

  it('cerca de nosotros exige la ubicacion', () => {
    expect(isValid({ ...base, zoneType: 'NEAR_US' })).toBe(false);
    expect(isValid({ ...base, zoneType: 'NEAR_US', coords: { lat: 19.3, lon: -99.1 } })).toBe(true);
  });

  it('el presupuesto va de 0 a 15 000', () => {
    expect(isValid({ ...base, maxCostMxn: -1 })).toBe(false);
    expect(isValid({ ...base, maxCostMxn: 15001 })).toBe(false);
    expect(isValid({ ...base, maxCostMxn: 0 })).toBe(true);
  });
});

describe('toParams', () => {
  it('solo manda la ubicacion con cerca de nosotros (RN-30)', () => {
    const params = toParams({
      ...base,
      zoneType: 'BOROUGH',
      boroughCode: 'COY',
      coords: { lat: 19.3, lon: -99.1 },
      category: 'SOCIAL',
    });

    expect(params).toEqual({
      zoneType: 'BOROUGH',
      boroughCode: 'COY',
      scope: 'ANY',
      maxCostMxn: 1500,
      category: 'SOCIAL',
      slotStart: '2026-10-18T00:00:00.000Z',
      slotEnd: '2026-10-18T03:00:00.000Z',
      radiusKm: 15,
    });
  });

  it('con cerca de nosotros manda lat y lon y no la alcaldia', () => {
    const params = toParams({ ...base, zoneType: 'NEAR_US', boroughCode: 'COY', coords: { lat: 19.3, lon: -99.1 } });

    expect(params.lat).toBe(19.3);
    expect(params.lon).toBe(-99.1);
    expect(params.boroughCode).toBeUndefined();
  });
});

describe('budgetLabel', () => {
  it('muestra el tope con separador de miles', () => {
    expect(budgetLabel(1500)).toBe('Hasta $1,500');
    expect(budgetLabel(15000)).toBe('Hasta $15,000');
    expect(budgetLabel(300)).toBe('Hasta $300');
  });

  it('0 es solo gratis', () => {
    expect(budgetLabel(0)).toBe('Solo gratis');
  });
});

describe('relaxedMessage (F5)', () => {
  it('no dice nada si no se amplio ningun filtro', () => {
    expect(relaxedMessage([])).toBeNull();
    expect(relaxedMessage(undefined)).toBeNull();
  });

  it('explica el filtro ampliado', () => {
    expect(relaxedMessage(['BUDGET'])).toBe('Ampliamos un poco el presupuesto para darte más opciones.');
    expect(relaxedMessage(['CATEGORY'])).toBe('Incluimos otros tipos de plan para darte más opciones.');
    expect(relaxedMessage(['DAYPART'])).toBe('Incluimos planes de otros momentos del día para darte más opciones.');
    expect(relaxedMessage(['SCOPE'])).toBe('Incluimos planes en casa y fuera para darte más opciones.');
  });

  it('con varios usa un mensaje general', () => {
    expect(relaxedMessage(['CATEGORY', 'BUDGET'])).toBe('Ampliamos un poco los filtros para darte más opciones.');
  });
});

describe('zoneLabel', () => {
  it('nombra la zona elegida', () => {
    expect(zoneLabel('NEAR_US')).toBe('Cerca de ustedes');
    expect(zoneLabel('BOROUGH', 'Coyoacán')).toBe('Coyoacán');
    expect(zoneLabel('NONE')).toBeNull();
  });
});

describe('rango del horario ([rango-distancia])', () => {
  const long = { key: 'largo', date: '2026-10-17', start: '10:00', end: '20:00' };

  it('empieza cada 30 minutos dejando al menos una hora', () => {
    const starts = rangeStarts(long);
    expect(starts[0]).toBe('10:00');
    expect(starts[1]).toBe('10:30');
    expect(starts[starts.length - 1]).toBe('19:00');
    expect(starts).toHaveLength(19);
  });

  it('el hueco de hoy empieza en su hora real y sigue cada 30 minutos', () => {
    expect(rangeStarts({ ...long, start: '10:15', end: '12:00' })).toEqual(['10:15', '10:45']);
    expect(rangeEnds({ ...long, start: '10:15', end: '12:00' }, '10:15')).toEqual(['11:15', '11:45', '12:00']);
  });

  it('termina desde una hora despues hasta el fin del hueco', () => {
    expect(rangeEnds(long, '16:00')).toEqual(['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00']);
  });

  it('un hueco de una hora justa solo deja ese horario', () => {
    const hour = { ...long, start: '18:00', end: '19:00' };
    expect(rangeStarts(hour)).toEqual(['18:00']);
    expect(rangeEnds(hour, '18:00')).toEqual(['19:00']);
  });

  it('recorta el hueco sin cambiar su key', () => {
    expect(withRange(long, '16:00', '19:00')).toEqual({ ...long, start: '16:00', end: '19:00' });
  });

  it('pide solo el rango elegido', () => {
    const params = toParams({ ...base, slot: long, rangeFrom: '16:00', rangeTo: '19:00' });
    expect(params.slotStart).toBe('2026-10-17T22:00:00.000Z');
    expect(params.slotEnd).toBe('2026-10-18T01:00:00.000Z');
  });

  it('al elegir otro hueco vuelve al hueco completo', () => {
    const form = chooseSlot({ ...base, slot: long, rangeFrom: '16:00', rangeTo: '19:00' }, slot);
    expect(form.slot).toBe(slot);
    expect(form.rangeFrom).toBeUndefined();
    expect(form.rangeTo).toBeUndefined();
  });
});

describe('distancia maxima ([rango-distancia])', () => {
  it('ofrece 1, 3, 5, 10 y 15 km y por defecto 15', () => {
    expect(RADIUS_OPTIONS_KM).toEqual([1, 3, 5, 10, 15]);
    expect(DEFAULT_RADIUS_KM).toBe(15);
  });

  it('manda la distancia elegida con una zona', () => {
    expect(toParams({ ...base, zoneType: 'BOROUGH', boroughCode: 'COY', radiusKm: 3 }).radiusKm).toBe(3);
    expect(toParams({ ...base, zoneType: 'NEAR_US', coords: { lat: 19.3, lon: -99.1 } }).radiusKm).toBe(15);
  });

  it('sin zona no manda distancia', () => {
    expect(toParams({ ...base, radiusKm: 3 }).radiusKm).toBeUndefined();
  });
});
