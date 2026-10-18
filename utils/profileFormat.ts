const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** "2000-01-01" -> "1 de enero de 2000" (sin pasar por Date, para no correr de dia por la zona). */
export function birthDateLabel(iso: string): string {
  if (!iso) return 'Sin fecha';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso;
  const [, year, month, day] = match;
  return `${Number(day)} de ${MONTHS[Number(month) - 1]} de ${year}`;
}
