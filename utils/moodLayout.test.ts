import { MOOD_COLUMNS, moodRows, moodSizing } from './moodLayout';
import { MOODS } from '../constants/moods';

describe('moodLayout', () => {
  it('arranges every mood in rows of two so the grid needs no scrolling', () => {
    const rows = moodRows(MOODS);

    expect(MOOD_COLUMNS).toBe(2);
    expect(rows).toHaveLength(Math.ceil(MOODS.length / 2));
    expect(rows.flat()).toEqual(MOODS);
    rows.forEach((row) => expect(row.length).toBeLessThanOrEqual(2));
  });

  it('uses the full-size emoji when the grid is tall', () => {
    expect(moodSizing(640, 4)).toEqual({ emojiSize: 52, labelSize: 15 });
  });

  it('shrinks the emoji and the label on a short grid instead of overflowing', () => {
    const { emojiSize, labelSize } = moodSizing(300, 4);

    expect(emojiSize).toBeLessThan(40);
    expect(emojiSize).toBeGreaterThanOrEqual(24);
    expect(labelSize).toBe(13);
  });

  it('never goes below a legible emoji size', () => {
    expect(moodSizing(120, 4).emojiSize).toBe(24);
  });

  it('falls back to a medium size before the grid has been measured', () => {
    expect(moodSizing(0, 4)).toEqual({ emojiSize: 40, labelSize: 14 });
  });
});
