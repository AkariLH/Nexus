/**
 * [terminos-en-app] El texto legal de la app es el del Anexo E de la tesis, párrafo por párrafo
 * (Figma O2 y O3): 10 tarjetas de términos y 8 del aviso de privacidad.
 */
import { PRIVACY, TERMS } from './legal';

describe('texto legal', () => {
  it('trae los 10 párrafos de los términos, del primero al último', () => {
    expect(TERMS).toHaveLength(10);
    expect(TERMS[0].text.startsWith('Al acceder y usar esta aplicación, usted (“Usuario”)')).toBe(true);
    expect(TERMS[9].text.endsWith('en la medida permitida por la ley.')).toBe(true);
  });

  it('trae los 8 párrafos del aviso de privacidad, del primero al último', () => {
    expect(PRIVACY).toHaveLength(8);
    expect(PRIVACY[0].text.startsWith('En esta aplicación estamos comprometidos')).toBe(true);
    expect(PRIVACY[7].text.endsWith('para continuar el uso del servicio.')).toBe(true);
  });

  it('cada tarjeta tiene título, ícono y párrafo, sin repetir títulos', () => {
    for (const doc of [TERMS, PRIVACY]) {
      for (const s of doc) {
        expect(s.title.trim()).not.toBe('');
        expect(s.icon).toMatch(/-outline$/);
        expect(s.text.length).toBeGreaterThan(80);
      }
      expect(new Set(doc.map((s) => s.title)).size).toBe(doc.length);
    }
  });
});
