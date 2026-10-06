/**
 * RF-31 - Opciones de estado de ánimo.
 *
 * Internamente cada carita es una coordenada del modelo circunflejo del afecto (2.7.1,
 * Russell 1980): 2 por cuadrante de valencia/activación. Eso es solo para los datos — la
 * persona nunca ve el modelo, solo la carita y su nombre.
 */
export interface MoodOption {
  label: string;
  emoji: string;
  valence: number;
  activation: number;
}

export const MOODS: MoodOption[] = [
  { label: 'Feliz', emoji: '😄', valence: 0.8, activation: 0.5 },
  { label: 'Emocionado/a', emoji: '🤩', valence: 0.7, activation: 0.9 },
  { label: 'Tranquilo/a', emoji: '😌', valence: 0.6, activation: -0.5 },
  { label: 'En calma', emoji: '😊', valence: 0.5, activation: -0.7 },
  { label: 'Cansado/a', emoji: '😴', valence: -0.4, activation: -0.7 },
  { label: 'Triste', emoji: '😢', valence: -0.7, activation: -0.4 },
  { label: 'Estresado/a', emoji: '😫', valence: -0.5, activation: 0.8 },
  { label: 'Enojado/a', emoji: '😠', valence: -0.7, activation: 0.7 },
];

const FALLBACK_EMOJI = '🙂';

/** Carita de un registro guardado, buscada por su etiqueta. */
export function moodEmoji(label?: string | null): string {
  return MOODS.find((m) => m.label === label)?.emoji ?? FALLBACK_EMOJI;
}
