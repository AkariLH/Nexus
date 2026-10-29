import { syncDoneMessage } from './syncFormat';

describe('syncDoneMessage ([avisos-calendario] RF-24)', () => {
  it('sin conflictos, como antes', () => {
    expect(syncDoneMessage([])).toBe('Calendarios al día');
  });

  it('con uno dice cual', () => {
    expect(syncDoneMessage(['Cena'])).toBe('Calendarios al día. «Cena» cambió en tu teléfono; te dejamos un aviso.');
  });

  it('con varios dice cuantos', () => {
    expect(syncDoneMessage(['Cena', 'Cine', 'Museo'])).toBe(
      'Calendarios al día. 3 eventos cambiaron en tu teléfono; te dejamos un aviso.',
    );
  });
});
