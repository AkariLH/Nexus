import { gradients, palette } from './colors';

/** Contraste WCAG 2.x entre dos colores #RRGGBB. */
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('[ux-ajustes] D5 · rosa fuerte detrás de texto blanco', () => {
  it('blanco sobre primaryStrong pasa 4.5:1', () => {
    expect(contrast(palette.onPrimary, palette.primaryStrong)).toBeGreaterThanOrEqual(4.5);
  });

  it('los degradados para texto van del rosa fuerte al morado (y al revés)', () => {
    expect(gradients.onText).toEqual([palette.primaryStrong, palette.secondary]);
    expect(gradients.onTextReversed).toEqual([palette.secondary, palette.primaryStrong]);
    for (const stop of gradients.onText) expect(contrast(palette.onPrimary, stop)).toBeGreaterThanOrEqual(4.5);
  });
});
