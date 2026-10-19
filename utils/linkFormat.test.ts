import { linkedSubtitle, listLabel } from './linkFormat';

describe('listLabel', () => {
  it('une como se dice en español', () => {
    expect(listLabel(['Mis eventos'])).toBe('Mis eventos');
    expect(listLabel(['Mis eventos', 'Crear evento'])).toBe('Mis eventos y Crear evento');
    expect(listLabel(['Mis eventos', 'Crear evento', 'Banco de ideas'])).toBe('Mis eventos, Crear evento y Banco de ideas');
  });
});

describe('linkedSubtitle (Figma H7)', () => {
  it('dice cuántos horarios libres tienen esta semana', () => {
    expect(linkedSubtitle('Ana', 'Sam', 6)).toBe('Ana y Sam ya comparten calendario. Esta semana tienen 6 horarios libres juntos.');
    expect(linkedSubtitle('Ana', 'Sam', 1)).toBe('Ana y Sam ya comparten calendario. Esta semana tienen 1 horario libre juntos.');
  });

  it('sin horarios o sin saberlo, solo lo primero', () => {
    expect(linkedSubtitle('Ana', 'Sam', 0)).toBe('Ana y Sam ya comparten calendario.');
    expect(linkedSubtitle('Ana', 'Sam', null)).toBe('Ana y Sam ya comparten calendario.');
  });
});
