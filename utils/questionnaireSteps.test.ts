import {
  QUESTIONNAIRE_STEPS,
  buildStep,
  firstPendingStep,
  savedChoices,
  toggleChoice,
  toRequest,
} from './questionnaireSteps';
import type { PreferenceCategory, UserPreference } from '../types/preferences.api.types';

const pref = (id: number, name: string, categoryName: string) => ({
  id,
  name,
  description: '',
  categoryId: 2,
  categoryName,
});

const emotional: PreferenceCategory = {
  id: 2,
  name: 'Bienestar Emocional',
  description: '',
  preferences: [
    pref(20, 'Palabras de Afirmación', 'Bienestar Emocional'),
    pref(21, 'Tiempo de Calidad', 'Bienestar Emocional'),
    pref(25, 'Hablar del Tema', 'Bienestar Emocional'),
    pref(26, 'Meditación', 'Bienestar Emocional'),
    pref(27, 'Algo Nuevo del Catálogo', 'Bienestar Emocional'),
    pref(29, 'Ninguna de estas', 'Bienestar Emocional'),
  ],
};

describe('questionnaireSteps', () => {
  it('tiene las 7 dimensiones en orden, de Físico a Espiritual', () => {
    expect(QUESTIONNAIRE_STEPS.map((s) => s.title)).toEqual([
      'Físico',
      'Emocional',
      'Social',
      'Intelectual',
      'Profesional',
      'Ambiental',
      'Espiritual',
    ]);
  });

  it('agrupa las opciones según el catálogo, con nombres en minúsculas y sin "Ninguna"', () => {
    const step = buildStep(QUESTIONNAIRE_STEPS[1], emotional);

    expect(step.groups.map((g) => g.label)).toEqual([
      'Cómo demuestras cariño',
      'Qué te ayuda con el estrés',
    ]);
    expect(step.groups[0].options).toEqual([
      { id: 20, label: 'Palabras de afirmación' },
      { id: 21, label: 'Tiempo de calidad' },
    ]);
    // Lo que el catalogo agregue despues cae en el ultimo grupo para no perderse.
    expect(step.groups[1].options.map((o) => o.id)).toEqual([25, 26, 27]);
    expect(step.noneId).toBe(29);
  });

  it('usa un solo grupo "Elige las que te gusten" cuando la dimensión no tiene grupos', () => {
    const physical: PreferenceCategory = {
      id: 1,
      name: 'Bienestar Físico',
      description: '',
      preferences: [pref(10, 'Artes Marciales', 'Bienestar Físico')],
    };

    const step = buildStep(QUESTIONNAIRE_STEPS[0], physical);

    expect(step.groups).toEqual([{ label: 'Elige las que te gusten', options: [{ id: 10, label: 'Artes marciales' }] }]);
    expect(step.noneId).toBeNull();
  });

  it('"Nada de esto me interesa" deja solo esa opción y elegir otra la quita', () => {
    let chosen = toggleChoice(new Set([20, 21]), 29, 29);
    expect([...chosen]).toEqual([29]);

    chosen = toggleChoice(chosen, 25, 29);
    expect([...chosen]).toEqual([25]);

    chosen = toggleChoice(chosen, 25, 29);
    expect(chosen.size).toBe(0);
  });

  it('marca lo ya guardado de la dimensión', () => {
    const saved: UserPreference[] = [
      { preferenceId: 20, preferenceName: 'x', categoryName: 'Bienestar Emocional', level: 50 },
      { preferenceId: 10, preferenceName: 'y', categoryName: 'Bienestar Físico', level: 50 },
    ];

    expect([...savedChoices(saved, 'Bienestar Emocional')]).toEqual([20]);
  });

  it('retoma en la primera dimensión sin respuesta', () => {
    expect(firstPendingStep([])).toBe(0);
    expect(firstPendingStep(['Bienestar Físico', 'Bienestar Emocional'])).toBe(2);
    expect(firstPendingStep(QUESTIONNAIRE_STEPS.map((s) => s.categoryName))).toBe(-1);
  });

  it('manda las elegidas sin nivel ni notas', () => {
    expect(toRequest(new Set([20, 21]))).toEqual([
      { preferenceId: 20, level: null },
      { preferenceId: 21, level: null },
    ]);
  });
});
