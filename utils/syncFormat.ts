/**
 * [avisos-calendario] RF-24 - Lo que dice "Sincronizar ahora": si algun evento creado en Nexus cambio
 * en el telefono, se dice cual (o cuantos) y que quedo un aviso en la campanita.
 * [sync-calendario] RF-22 - Tambien cuantos eventos de Nexus se copiaron al calendario destino.
 */
export function syncDoneMessage(conflicts: string[], copied = 0): string {
  let text = 'Calendarios al día';
  if (conflicts.length === 1) text += `. «${conflicts[0]}» cambió en tu teléfono; te dejamos un aviso.`;
  else if (conflicts.length > 1) text += `. ${conflicts.length} eventos cambiaron en tu teléfono; te dejamos un aviso.`;
  if (copied > 0) {
    text += `${conflicts.length === 0 ? '.' : ''} Copiamos ${copied} ${copied === 1 ? 'evento' : 'eventos'} de Nexus a tu calendario.`;
  }
  return text;
}
