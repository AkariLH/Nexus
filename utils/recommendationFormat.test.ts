import { costLabel, dayPhrase, placeDetail, placeLabel, slotLabel, slotOptionLabel } from './recommendationFormat';

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

describe('placeDetail ([kb-lugares] U8)', () => {
  const cineteca = {
    scope: 'CITY' as const,
    placeName: 'Cineteca Nacional',
    boroughName: 'Coyoacán',
    placeAddress: 'Av. México Coyoacán 389',
    placeNeighborhood: 'Xoco',
    placeWebsite: 'https://www.cinetecanacional.net',
    placePhone: '55 4155-1200',
  };

  it('arma nombre, direccion y los tres enlaces', () => {
    const detail = placeDetail(cineteca);

    expect(detail).not.toBeNull();
    expect(detail?.name).toBe('Cineteca Nacional · Coyoacán');
    expect(detail?.address).toBe('Av. México Coyoacán 389, Xoco');
    expect(detail?.websiteUrl).toBe('https://www.cinetecanacional.net');
    expect(detail?.phoneUrl).toBe('tel:5541551200');
    expect(detail?.mapsUrl).toBe(
      'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent('Cineteca Nacional, Av. México Coyoacán 389, Xoco, Coyoacán'),
    );
  });

  it('solo acepta sitios http o https (P8.4)', () => {
    expect(placeDetail({ ...cineteca, placeWebsite: 'javascript:alert(1)' })?.websiteUrl).toBeUndefined();
    expect(placeDetail({ ...cineteca, placeWebsite: 'www.sitio.com' })?.websiteUrl).toBeUndefined();
    expect(placeDetail({ ...cineteca, placeWebsite: ' HTTP://sitio.mx ' })?.websiteUrl).toBe('HTTP://sitio.mx');
  });

  it('deja solo digitos en el telefono y conserva el + inicial (P8.5)', () => {
    expect(placeDetail({ ...cineteca, placePhone: '+52 55 5257 6969' })?.phoneUrl).toBe('tel:+525552576969');
    expect(placeDetail({ ...cineteca, placePhone: 'sin teléfono' })?.phoneUrl).toBeUndefined();
    expect(placeDetail({ ...cineteca, placePhone: '123' })?.phoneUrl).toBeUndefined();
  });

  it('sin direccion ni colonia omite esa parte y el mapa busca nombre y alcaldia', () => {
    const detail = placeDetail({ scope: 'CITY', placeName: 'La Michoacana', boroughName: 'Iztacalco' });

    expect(detail?.address).toBeUndefined();
    expect(detail?.websiteUrl).toBeUndefined();
    expect(detail?.phoneUrl).toBeUndefined();
    expect(detail?.mapsUrl).toContain(encodeURIComponent('La Michoacana, Iztacalco'));
  });

  it('en casa no hay bloque de lugar (P8.6)', () => {
    expect(placeDetail({ scope: 'HOME', placeName: null, boroughName: null })).toBeNull();
  });
});
