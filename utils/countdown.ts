/** Cuenta atras de "Reenviar código en 0:45" (Figma H4). */
export function countdownLabel(seconds: number): string {
  const left = Math.max(0, Math.floor(seconds));
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}
