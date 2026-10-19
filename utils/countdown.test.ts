import { countdownLabel } from './countdown';

describe('countdownLabel', () => {
  it('escribe minutos y segundos como en Figma H4', () => {
    expect(countdownLabel(45)).toBe('0:45');
    expect(countdownLabel(60)).toBe('1:00');
    expect(countdownLabel(5)).toBe('0:05');
  });

  it('nunca baja de cero', () => {
    expect(countdownLabel(-3)).toBe('0:00');
  });
});
