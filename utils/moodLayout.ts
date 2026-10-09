/**
 * RF-31 - Reparto de las opciones de ánimo para que todas quepan en una sola pantalla, sin
 * desplazamiento: filas de dos que se reparten el alto disponible, y un tamaño de carita que se
 * ajusta a ese alto.
 */
export const MOOD_COLUMNS = 2;
export const MOOD_ROW_GAP = 12;

const EMOJI_MIN = 24;
const EMOJI_MAX = 52;
/** Antes de medir la cuadrícula no se conoce el alto: tamaño intermedio para el primer pintado. */
const UNMEASURED = { emojiSize: 40, labelSize: 14 };

export interface MoodSizing {
  emojiSize: number;
  labelSize: number;
}

export function moodRows<T>(moods: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < moods.length; i += MOOD_COLUMNS) {
    rows.push(moods.slice(i, i + MOOD_COLUMNS));
  }
  return rows;
}

export function moodSizing(gridHeight: number, rowCount: number): MoodSizing {
  if (gridHeight <= 0 || rowCount <= 0) return UNMEASURED;
  const rowHeight = (gridHeight - MOOD_ROW_GAP * (rowCount - 1)) / rowCount;
  return {
    emojiSize: Math.max(EMOJI_MIN, Math.min(EMOJI_MAX, Math.floor(rowHeight * 0.4))),
    labelSize: rowHeight >= 110 ? 15 : 13,
  };
}
