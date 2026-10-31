/** [sync-calendario] RF-21 - Al volver a la app no se sincroniza otra vez si fue hace muy poco. */
export function shouldSync(last: Date | null, now: Date, minGapMs: number): boolean {
  return last === null || now.getTime() - last.getTime() >= minGapMs;
}
