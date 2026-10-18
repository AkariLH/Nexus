import { birthDateLabel } from './profileFormat';

describe('birthDateLabel', () => {
  it('la fecha guardada se lee como se dice', () => {
    expect(birthDateLabel('2000-01-01')).toBe('1 de enero de 2000');
    expect(birthDateLabel('1998-12-25')).toBe('25 de diciembre de 1998');
  });

  it('sin fecha o con un formato raro no inventa nada', () => {
    expect(birthDateLabel('')).toBe('Sin fecha');
    expect(birthDateLabel('ayer')).toBe('ayer');
  });
});
