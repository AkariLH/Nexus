import { palette } from '../../constants/colors';
import type { CalendarItem, CalendarSource } from '../../utils/calendarLayout';

/** Punto de la leyenda por tipo: de los dos (rosa), tu calendario (azul), de la pareja (gris). */
export const SOURCE_COLORS: Record<CalendarSource, string> = {
  couple: palette.primary,
  mine: palette.info,
  partner: palette.icon,
};

/**
 * Color de la barra del evento: el elegido al crearlo, o el de su tipo. [reaprobar-edicion] Figma P:
 * un plan pendiente va en ámbar.
 */
export const barColor = (item: CalendarItem) =>
  item.waiting ? palette.warning : item.source === 'couple' && item.color ? item.color : SOURCE_COLORS[item.source];

/** Fondo claro del bloque: el color de la barra al 15 %. */
export function tint(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? `${color}26` : palette.surfaceMuted;
}

/** [reaprobar-edicion] Fondo del bloque: ámbar claro si está pendiente; si no, su color al 15 %. */
export const blockTint = (item: CalendarItem) => (item.waiting ? palette.warningSoft : tint(barColor(item)));
