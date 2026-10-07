import { groupByDay, lastSevenDays, todayEntry } from './moodHistory';
import { moodEmoji } from '../constants/moods';

// Mediodia local para que ningun caso caiga en la frontera de medianoche.
const NOW = new Date(2026, 9, 5, 12, 0, 0); // 5 oct 2026
const at = (daysAgo: number, hour: number) =>
  new Date(2026, 9, 5 - daysAgo, hour, 0, 0).toISOString();

const entry = (id: number, label: string, loggedAt: string) => ({
  id,
  label,
  loggedAt,
  valence: 0,
  activation: 0,
});

describe('groupByDay (RF-32)', () => {
  it('agrupa por dia local, del mas reciente al mas antiguo, con Hoy/Ayer', () => {
    const sections = groupByDay(
      [
        entry(1, 'Triste', at(3, 9)),
        entry(2, 'Feliz', at(0, 8)),
        entry(3, 'Cansado/a', at(1, 22)),
        entry(4, 'En calma', at(0, 11)),
      ],
      NOW
    );

    expect(sections.map((s) => s.title.slice(0, 4))).toEqual(['Hoy', 'Ayer', expect.any(String)]);
    expect(sections[0].title).toBe('Hoy');
    expect(sections[1].title).toBe('Ayer');
    // Dentro del dia, lo mas reciente primero.
    expect(sections[0].data.map((e) => e.id)).toEqual([4, 2]);
    expect(sections[2].data.map((e) => e.id)).toEqual([1]);
  });

  it('pone en mayuscula inicial los dias anteriores a ayer', () => {
    const [section] = groupByDay([entry(1, 'Feliz', at(4, 10))], NOW);
    expect(section.title[0]).toBe(section.title[0].toUpperCase());
    expect(section.title).not.toBe('Hoy');
  });

  it('regresa una lista vacia sin registros', () => {
    expect(groupByDay([], NOW)).toEqual([]);
  });
});

describe('lastSevenDays (RF-32)', () => {
  it('regresa 7 dias, del mas antiguo a hoy, marcando hoy', () => {
    const days = lastSevenDays([], NOW);
    expect(days).toHaveLength(7);
    expect(days[6].isToday).toBe(true);
    expect(days.filter((d) => d.isToday)).toHaveLength(1);
    expect(days.every((d) => d.emoji === null)).toBe(true);
  });

  it('usa la carita del registro mas reciente de cada dia', () => {
    const days = lastSevenDays(
      [
        entry(1, 'Triste', at(0, 8)),
        entry(2, 'Feliz', at(0, 11)),
        entry(3, 'Cansado/a', at(2, 20)),
      ],
      NOW
    );
    expect(days[6].emoji).toBe(moodEmoji('Feliz'));
    expect(days[4].emoji).toBe(moodEmoji('Cansado/a'));
    expect(days[5].emoji).toBeNull();
  });

  it('ignora registros de hace mas de 7 dias', () => {
    const days = lastSevenDays([entry(1, 'Feliz', at(9, 10))], NOW);
    expect(days.every((d) => d.emoji === null)).toBe(true);
  });

  it('da la inicial del dia de la semana', () => {
    // 5 oct 2026 es lunes.
    expect(lastSevenDays([], NOW)[6].initial).toBe('L');
  });
});

describe('todayEntry (RN-38)', () => {
  it('encuentra el registro de hoy (el mas reciente si hubiera varios)', () => {
    const found = todayEntry(
      [entry(1, 'Triste', at(0, 8)), entry(2, 'Feliz', at(0, 11)), entry(3, 'Cansado/a', at(1, 22))],
      NOW
    );
    expect(found?.id).toBe(2);
  });

  it('regresa undefined si hoy no hay registro', () => {
    expect(todayEntry([entry(3, 'Cansado/a', at(1, 22))], NOW)).toBeUndefined();
    expect(todayEntry([], NOW)).toBeUndefined();
  });
});
