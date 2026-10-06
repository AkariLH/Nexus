/** RF-34/RF-35 - Formato de las ideas del banco y paso de una idea a "Crear evento". */

export function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return '';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}

const PRICE_LABELS: Record<string, string> = {
  FREE: 'Gratis',
  LOW: '$',
  MID: '$$',
  HIGH: '$$$',
  PREMIUM: '$$$$',
};

export function priceLabel(band?: string): string {
  return (band && PRICE_LABELS[band]) || '';
}

export interface ProposalSource {
  title: string;
  description?: string;
  durationMinutes?: number;
}

/** Parametros de ruta (siempre texto) con los que "Crear evento" se prellena. */
export function proposalParams(idea: ProposalSource): Record<string, string> {
  const params: Record<string, string> = { ideaTitle: idea.title };
  if (idea.description) params.ideaDescription = idea.description;
  if (idea.durationMinutes) params.ideaDuration = String(idea.durationMinutes);
  return params;
}

/** Fin del evento: inicio + duracion de la idea; sin duracion valida, igual al inicio. */
export function endFromDuration(start: Date, durationParam?: string): Date {
  const minutes = Number(durationParam);
  if (!durationParam || !Number.isFinite(minutes) || minutes <= 0) return new Date(start);
  return new Date(start.getTime() + minutes * 60_000);
}
