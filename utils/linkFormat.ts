/** "Mis eventos, Crear evento y Banco de ideas". */
export function listLabel(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

/** Figma H7: texto bajo "¡Ya están vinculados!". */
export function linkedSubtitle(me: string, partner: string, freeSlots: number | null): string {
  const shared = `${me} y ${partner} ya comparten calendario.`;
  if (!freeSlots) return shared;
  const slots = freeSlots === 1 ? '1 horario libre' : `${freeSlots} horarios libres`;
  return `${shared} Esta semana tienen ${slots} juntos.`;
}
