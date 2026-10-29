/**
 * [avisos-calendario] RF-24 - Lo que dice "Sincronizar ahora": si algun evento creado en Nexus cambio
 * en el telefono, se dice cual (o cuantos) y que quedo un aviso en la campanita.
 */
export function syncDoneMessage(conflicts: string[]): string {
  if (conflicts.length === 0) return 'Calendarios al día';
  if (conflicts.length === 1) return `Calendarios al día. «${conflicts[0]}» cambió en tu teléfono; te dejamos un aviso.`;
  return `Calendarios al día. ${conflicts.length} eventos cambiaron en tu teléfono; te dejamos un aviso.`;
}
