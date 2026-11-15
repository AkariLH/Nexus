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

/**
 * [eventos-sin-choques] Título del modal de error al guardar. El backend responde 409 cuando alguno
 * de los dos ya tiene algo a esa hora; el mensaje (quién está ocupado) lo pone el backend.
 */
export function errorTitleFor(error: { status?: number; message?: string } | null | undefined): string {
  return error?.status === 409 ? 'Ese horario está ocupado' : 'Algo salió mal';
}
