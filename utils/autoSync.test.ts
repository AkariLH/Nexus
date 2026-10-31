import { shouldSync } from './autoSync';

describe('shouldSync ([sync-calendario] RF-21)', () => {
  const now = new Date('2026-10-31T18:00:00Z');

  it('nunca se ha sincronizado: si', () => {
    expect(shouldSync(null, now, 60_000)).toBe(true);
  });

  it('hace menos de 60 s: no', () => {
    expect(shouldSync(new Date(now.getTime() - 59_000), now, 60_000)).toBe(false);
  });

  it('hace 60 s o mas: si', () => {
    expect(shouldSync(new Date(now.getTime() - 60_000), now, 60_000)).toBe(true);
    expect(shouldSync(new Date(now.getTime() - 3_600_000), now, 60_000)).toBe(true);
  });
});
