import { dateLine, SATISFACTION_LABELS, timeLeftLabel } from './ratingFormat';

describe('timeLeftLabel (Figma C12a)', () => {
  const now = new Date('2026-10-19T18:00:00Z');

  it('dice las horas que quedan para calificar', () => {
    expect(timeLeftLabel('2026-10-21T01:00:00Z', now)).toBe('Quedan 31 h para calificar');
    expect(timeLeftLabel('2026-10-19T19:00:00Z', now)).toBe('Queda 1 h para calificar');
  });

  it('con menos de una hora dice los minutos', () => {
    expect(timeLeftLabel('2026-10-19T18:40:00Z', now)).toBe('Quedan 40 min para calificar');
    expect(timeLeftLabel('2026-10-19T18:00:30Z', now)).toBe('Queda 1 min para calificar');
  });
});

describe('dateLine', () => {
  // 19-oct-2026 12:00 en la CDMX
  const now = new Date(2026, 9, 19, 12, 0);

  it('ayer con hora y lugar, como en Figma', () => {
    expect(dateLine(new Date(2026, 9, 18, 18, 0).toISOString(), 'Coyoacán', now)).toBe('Ayer · 18:00 · Coyoacán');
  });

  it('otro día con su nombre corto; sin lugar no agrega nada', () => {
    expect(dateLine(new Date(2026, 9, 17, 20, 0).toISOString(), null, now)).toBe('Sáb 17 · 20:00');
    expect(dateLine(new Date(2026, 9, 19, 9, 5).toISOString(), '  ', now)).toBe('Hoy · 09:05');
  });
});

describe('SATISFACTION_LABELS', () => {
  it('va de 1 (muy mal) a 5 (muy bien)', () => {
    expect(SATISFACTION_LABELS).toEqual(['Muy mal', 'Mal', 'Regular', 'Bien', 'Muy bien']);
  });
});
