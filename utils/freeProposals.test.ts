import fixture from './__fixtures__/free-proposals.json';
import { cleanWindows, proposalLabel, proposalsOf, toWindow } from './freeProposals';
import type { MutualAvailableDay } from '../services/availabilityService';

/** "2026-10-30T18:00" como hora local (la de la CDMX en el telefono). */
const at = (text: string) => {
  const [d, t] = text.split('T');
  const [y, m, day] = d.split('-').map(Number);
  const [h, min] = t.split(':').map(Number);
  return new Date(y, m - 1, day, h, min);
};
const days = (raw: { date: string; mutualFreeSlots: { start: string; end: string }[] }[]): MutualAvailableDay[] =>
  raw.map((d) => ({ date: d.date, dayOfWeek: '', mutualFreeSlots: d.mutualFreeSlots as any, totalMutualMinutes: 0 }));

describe('freeProposals ([libres-juntos] casos compartidos con el backend)', () => {
  for (const c of fixture.cases as any[]) {
    it(c.name, () => {
      const now = at(c.now);
      const windows = cleanWindows(days(c.days), now);
      if (c.windows) expect(windows).toEqual(c.windows);
      if (c.unsplit) expect(cleanWindows(days(c.days), now, false)).toEqual(c.unsplit);

      const proposals = proposalsOf(windows).map((w) => ({
        date: w.date,
        start: w.start,
        end: w.end,
        ...proposalLabel(w, now),
      }));
      expect(proposals).toEqual(c.proposals);
    });
  }

  it('toWindow arma la ventana de un horario de la lista o de la vista Dia', () => {
    expect(toWindow('2026-10-31', '17:30', '22:00')).toEqual({
      date: '2026-10-31',
      start: '17:30',
      end: '22:00',
      part: 'AFTERNOON',
      minutes: 270,
    });
  });

  it('como mucho las que se piden', () => {
    const c = (fixture.cases as any[]).find((x) => x.name.startsWith('7'));
    expect(proposalsOf(cleanWindows(days(c.days), at(c.now)), 1)).toHaveLength(1);
  });
});
