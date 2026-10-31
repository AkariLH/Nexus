/**
 * [libres-juntos] Figma K3 - A donde lleva una propuesta: «Buscar un plan para este horario» (Pedir
 * recomendacion con el horario ya elegido) o «Solo apartar el horario» (Crear evento con las horas).
 */
type Window = { date: string; start: string; end: string };

export function planParams(w: Window): { slotDate: string; slotStart: string; slotEnd: string } {
  return { slotDate: w.date, slotStart: w.start, slotEnd: w.end };
}

export function reserveParams(w: Window): { suggestedDate: string; suggestedStart: string; suggestedEnd: string } {
  return { suggestedDate: w.date, suggestedStart: w.start, suggestedEnd: w.end };
}
