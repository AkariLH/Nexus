import type { Ionicons } from '@expo/vector-icons';
import type {
  PreferenceCategory,
  UserPreference,
  UserPreferenceRequest,
} from '../types/preferences.api.types';

/**
 * Cuestionario de preferencias paso a paso (Figma D): una dimension por paso, chips agrupados
 * como en el catalogo (`seed_preferences_final.sql`) y "Nada de esto me interesa" en lugar de la
 * tarjeta "Ninguna de estas". Sin niveles ni notas.
 */

export interface StepDefinition {
  /** Nombre de `pref_categories`. */
  categoryName: string;
  title: string;
  question: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Grupos con los nombres del catalogo que van en cada uno; vacio = un solo grupo. */
  groups: { label: string; names: string[] }[];
}

const DEFAULT_GROUP = 'Elige las que te gusten';

export const QUESTIONNAIRE_STEPS: StepDefinition[] = [
  {
    categoryName: 'Bienestar Físico',
    title: 'Físico',
    question: '¿Qué te gusta hacer?',
    icon: 'barbell-outline',
    groups: [],
  },
  {
    categoryName: 'Bienestar Emocional',
    title: 'Emocional',
    question: '¿Qué te hace sentir bien?',
    icon: 'heart-outline',
    groups: [
      {
        label: 'Cómo demuestras cariño',
        names: ['Palabras de Afirmación', 'Tiempo de Calidad', 'Regalos', 'Actos de Servicio', 'Contacto Físico'],
      },
      { label: 'Qué te ayuda con el estrés', names: [] },
    ],
  },
  {
    categoryName: 'Bienestar Social',
    title: 'Social',
    question: '¿Qué planes disfrutas?',
    icon: 'people-outline',
    groups: [
      {
        label: 'Planes para salir',
        names: [
          'Ir al Cine',
          'Cena Romántica',
          'Conciertos',
          'Visitar Museos',
          'Paseos en Parques',
          'Quedarse en Casa',
          'Parques de Diversiones',
          'Juegos',
        ],
      },
      { label: 'Lugares favoritos', names: [] },
    ],
  },
  {
    categoryName: 'Bienestar Intelectual',
    title: 'Intelectual',
    question: '¿Qué te da curiosidad?',
    icon: 'bulb-outline',
    groups: [
      {
        label: 'Temas que te interesan',
        names: [
          'Tecnología',
          'Ciencia',
          'Arte y Diseño',
          'Historia',
          'Política y Actualidad',
          'Música',
          'Literatura',
          'Filosofía',
        ],
      },
      { label: 'Pasatiempos', names: [] },
    ],
  },
  {
    categoryName: 'Bienestar Profesional',
    title: 'Profesional',
    question: '¿Cómo te gusta que te apoyen?',
    icon: 'briefcase-outline',
    groups: [],
  },
  {
    categoryName: 'Bienestar Ambiental',
    title: 'Ambiental',
    question: '¿Cómo te gusta estar al aire libre?',
    icon: 'leaf-outline',
    groups: [],
  },
  {
    categoryName: 'Bienestar Espiritual',
    title: 'Espiritual',
    question: '¿Qué le da sentido a tu tiempo?',
    icon: 'sparkles-outline',
    groups: [],
  },
];

/** Nombres del catalogo que en Figma se leen distinto. */
const LABELS: Record<string, string> = {
  'Practicar Meditación': 'Meditación',
  'Practicar Yoga': 'Yoga',
  'Escribir Diario': 'Escribir un diario',
  'Tiempo en Naturaleza': 'Tiempo en la naturaleza',
  'Hacer Voluntariado': 'Voluntariado',
};

const isNone = (name: string) => name.toLowerCase().includes('ninguna');

/** "Tiempo de Calidad" -> "Tiempo de calidad". */
function toLabel(name: string): string {
  const label = LABELS[name] ?? name;
  return label.charAt(0) + label.slice(1).toLowerCase();
}

export interface StepOption {
  id: number;
  label: string;
}

export interface BuiltStep {
  groups: { label: string; options: StepOption[] }[];
  /** Id de "Ninguna de estas" en la dimension, o null si el catalogo no la trae. */
  noneId: number | null;
}

export function buildStep(step: StepDefinition, category: PreferenceCategory): BuiltStep {
  const none = category.preferences.find((p) => isNone(p.name));
  const options = category.preferences.filter((p) => !isNone(p.name));

  if (step.groups.length === 0) {
    return {
      groups: [{ label: DEFAULT_GROUP, options: options.map((p) => ({ id: p.id, label: toLabel(p.name) })) }],
      noneId: none?.id ?? null,
    };
  }

  const named = new Set(step.groups.flatMap((g) => g.names));
  const last = step.groups.length - 1;
  const groups = step.groups.map((group, index) => ({
    label: group.label,
    options: options
      .filter((p) => (index === last ? group.names.includes(p.name) || !named.has(p.name) : group.names.includes(p.name)))
      .map((p) => ({ id: p.id, label: toLabel(p.name) })),
  }));

  return { groups: groups.filter((g) => g.options.length > 0), noneId: none?.id ?? null };
}

/** Elegir "Ninguna" deja solo esa; elegir otra quita "Ninguna"; tocar una elegida la quita. */
export function toggleChoice(chosen: Set<number>, id: number, noneId: number | null): Set<number> {
  const next = new Set(chosen);
  if (next.has(id)) {
    next.delete(id);
    return next;
  }
  if (id === noneId) return new Set([id]);
  if (noneId !== null) next.delete(noneId);
  next.add(id);
  return next;
}

export function savedChoices(saved: UserPreference[], categoryName: string): Set<number> {
  return new Set(saved.filter((p) => p.categoryName === categoryName).map((p) => p.preferenceId));
}

/** Indice del primer paso sin respuesta guardada, o -1 si ya estan todos. */
export function firstPendingStep(answeredCategories: string[]): number {
  const answered = new Set(answeredCategories);
  return QUESTIONNAIRE_STEPS.findIndex((s) => !answered.has(s.categoryName));
}

export function toRequest(chosen: Set<number>): UserPreferenceRequest[] {
  return [...chosen].map((preferenceId) => ({ preferenceId, level: null }));
}
