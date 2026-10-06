import { MOODS, moodEmoji } from './moods';

describe('MOODS (RF-31)', () => {
  it('ofrece 8 opciones, 2 por cuadrante del modelo circunflejo', () => {
    expect(MOODS).toHaveLength(8);
    const quadrant = (m: { valence: number; activation: number }) =>
      `${m.valence > 0 ? '+' : '-'}${m.activation > 0 ? '+' : '-'}`;
    const counts = MOODS.reduce<Record<string, number>>((acc, m) => {
      acc[quadrant(m)] = (acc[quadrant(m)] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ '++': 2, '+-': 2, '--': 2, '-+': 2 });
  });

  it('mantiene valencia y activacion dentro de [-1, 1] (lo que valida el backend)', () => {
    for (const m of MOODS) {
      expect(Math.abs(m.valence)).toBeLessThanOrEqual(1);
      expect(Math.abs(m.activation)).toBeLessThanOrEqual(1);
    }
  });

  it('cada opcion tiene carita y etiqueta unicas', () => {
    expect(new Set(MOODS.map((m) => m.emoji)).size).toBe(8);
    expect(new Set(MOODS.map((m) => m.label)).size).toBe(8);
  });

  it('moodEmoji encuentra la carita por etiqueta y tiene respaldo', () => {
    expect(moodEmoji('Feliz')).toBe(MOODS.find((m) => m.label === 'Feliz')!.emoji);
    expect(moodEmoji('Algo que ya no existe')).toBe('🙂');
    expect(moodEmoji(undefined)).toBe('🙂');
  });
});
