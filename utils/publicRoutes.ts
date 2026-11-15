/** Grupos de rutas que se abren sin sesión: la entrada y [terminos-en-app] el texto legal. */
const PUBLIC_GROUPS = ['(auth)', '(legal)'];

export function opensWithoutSession(segments: readonly string[]): boolean {
  return PUBLIC_GROUPS.includes(segments[0]);
}
