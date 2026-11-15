/** Crear / Editar evento: categorias y lo que falta para poder guardar. */

/** Las 7 dimensiones del bienestar (las mismas del banco de ideas y las recomendaciones). */
export const EVENT_CATEGORIES = ['Físico', 'Emocional', 'Social', 'Intelectual', 'Profesional', 'Ambiental', 'Espiritual'];

export interface EventFormState {
  title: string;
  startDateSelected: boolean;
  endDateSelected: boolean;
  startTimeSelected: boolean;
  endTimeSelected: boolean;
  isAllDay: boolean;
}

/** Lo primero que falta, dicho bajo el boton gris; null si ya se puede guardar. */
export function missingForEvent(form: EventFormState): string | null {
  if (!form.title.trim()) return 'Falta el título.';
  if (!form.startDateSelected) return 'Falta la fecha de inicio.';
  if (!form.isAllDay && !form.startTimeSelected) return 'Falta la hora de inicio.';
  if (!form.endDateSelected) return 'Falta la fecha de fin.';
  if (!form.isAllDay && !form.endTimeSelected) return 'Falta la hora de fin.';
  return null;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** [fecha-web] Fecha local como la usa <input type="date">: "2026-11-20". */
export function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** [fecha-web] Hora local como la usa <input type="time">: "18:30". */
export function toTimeInput(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** [fecha-web] La fecha elegida en el navegador, conservando la hora de {@code base}; null si no sirve. */
export function withDateInput(base: Date, iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const next = new Date(base);
  next.setFullYear(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return next;
}

/** [fecha-web] La hora elegida en el navegador, conservando la fecha de {@code base}; null si no sirve. */
export function withTimeInput(base: Date, hhmm: string): Date | null {
  const m = /^(\d{2}):(\d{2})/.exec(hhmm);
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
  const next = new Date(base);
  next.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return next;
}

/**
 * [eventos-sin-choques] Título del modal de error al guardar. El backend responde 409 cuando alguno
 * de los dos ya tiene algo a esa hora; el mensaje (quién está ocupado) lo pone el backend.
 */
export function errorTitleFor(error: { status?: number; message?: string } | null | undefined): string {
  return error?.status === 409 ? 'Ese horario está ocupado' : 'Algo salió mal';
}
