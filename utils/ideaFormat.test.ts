import { formatDuration, priceLabel, proposalParams, endFromDuration } from './ideaFormat';

describe('formatDuration (RF-34)', () => {
  it('muestra minutos, horas exactas y combinaciones', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(120)).toBe('2 h');
    expect(formatDuration(90)).toBe('1 h 30 min');
  });

  it('no muestra nada si falta o es invalida', () => {
    expect(formatDuration(undefined)).toBe('');
    expect(formatDuration(0)).toBe('');
  });
});

describe('priceLabel (RF-34)', () => {
  it('traduce la banda de precio', () => {
    expect(priceLabel('FREE')).toBe('Gratis');
    expect(priceLabel('LOW')).toBe('$');
    expect(priceLabel('MID')).toBe('$$');
    expect(priceLabel('HIGH')).toBe('$$$');
    expect(priceLabel('PREMIUM')).toBe('$$$$');
  });

  it('no inventa precio para bandas desconocidas', () => {
    expect(priceLabel('RARA')).toBe('');
    expect(priceLabel(undefined)).toBe('');
  });
});

describe('proposalParams (RF-35)', () => {
  it('lleva titulo, descripcion y duracion como texto para la ruta de crear evento', () => {
    expect(
      proposalParams({ title: 'Picnic', description: 'En el parque', durationMinutes: 120 })
    ).toEqual({ ideaTitle: 'Picnic', ideaDescription: 'En el parque', ideaDuration: '120' });
  });

  it('omite lo que la idea no trae', () => {
    expect(proposalParams({ title: 'Picnic' })).toEqual({ ideaTitle: 'Picnic' });
  });
});

describe('endFromDuration (RF-35)', () => {
  const start = new Date(2026, 9, 6, 18, 0, 0);

  it('suma la duracion de la idea al inicio', () => {
    expect(endFromDuration(start, '90')).toEqual(new Date(2026, 9, 6, 19, 30, 0));
  });

  it('sin duracion valida, termina cuando empieza (comportamiento actual del formulario)', () => {
    expect(endFromDuration(start, undefined)).toEqual(start);
    expect(endFromDuration(start, 'abc')).toEqual(start);
  });
});
