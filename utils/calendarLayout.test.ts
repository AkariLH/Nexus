import {
  belowBusy,
  buildCalendarItems,
  collapseAllDay,
  freeSlotCount,
  freeSlotsOn,
  freeTogetherDays,
  itemsOnDay,
  layoutLanes,
  monthGrid,
  monthTitle,
  openingHour,
  parseSuggestion,
  suggestedText,
  dayTitle,
  sourcesOn,
  weekOf,
} from './calendarLayout';
import type { CalendarItem } from './calendarLayout';
import type { EventResponse } from '../services/event.service';
import type { ExternalEventDTO } from '../services/externalCalendar.integration.service';

const event = (over: Partial<EventResponse>): EventResponse =>
  ({
    id: 1,
    title: 'Cine al aire libre',
    startDateTime: new Date(2026, 9, 17, 17, 0).toISOString(),
    endDateTime: new Date(2026, 9, 17, 19, 0).toISOString(),
    location: 'Coyoacán',
    status: 'CONFIRMED',
    creatorUserId: 4,
    linkId: 1,
    creatorApproved: true,
    partnerApproved: true,
    fullyApproved: true,
    createdAt: '',
    updatedAt: '',
    ...over,
  }) as EventResponse;

const external = (over: Partial<ExternalEventDTO>): ExternalEventDTO => ({
  id: 7,
  externalCalendarId: 1,
  ownerId: 4,
  deviceEventId: 'x',
  title: 'Comida con mi familia',
  startDatetime: new Date(2026, 9, 17, 14, 0).toISOString(),
  endDatetime: new Date(2026, 9, 17, 16, 0).toISOString(),
  isAllDay: false,
  visibility: 'FULL_DETAILS',
  ...over,
});

const range = { start: new Date(2026, 8, 1), end: new Date(2026, 11, 31) };

describe('calendarLayout', () => {
  it('separa eventos de los dos, de mi calendario y de la pareja', () => {
    const items = buildCalendarItems({
      events: [event({}), event({ id: 2, fullyApproved: false })],
      external: [external({}), external({ id: 8, ownerId: 13, visibility: 'BUSY_ONLY', title: 'Junta' })],
      userId: 4,
      partnerName: 'Sam',
      range,
    });

    expect(items.map((i) => [i.title, i.source, i.subtitle, i.readOnly])).toEqual([
      ['Cine al aire libre', 'couple', 'Coyoacán', false],
      ['Comida con mi familia', 'mine', 'Tu calendario', true],
      ['Ocupado', 'partner', 'Calendario de Sam', true],
    ]);
  });

  it('reconoce los eventos de todo el día y los deja en su fecha', () => {
    const [item] = buildCalendarItems({
      events: [event({ startDateTime: '2026-10-14T00:00:00Z', endDateTime: '2026-10-14T23:59:00Z' })],
      external: [],
      userId: 4,
      partnerName: 'Sam',
      range,
    });

    expect(item.allDay).toBe(true);
    expect(item.start.getDate()).toBe(14);
  });

  it('cada repeticion conserva la hora real del evento (la API manda UTC)', () => {
    const items = buildCalendarItems({
      events: [
        event({
          startDateTime: '2026-10-05T13:00:00.000Z',
          endDateTime: '2026-10-05T15:00:00.000Z',
          isRecurring: true,
          recurrencePattern: 'FREQ=WEEKLY',
        }),
      ],
      external: [],
      userId: 4,
      partnerName: 'Sam',
      range: { start: new Date(2026, 9, 1), end: new Date(2026, 9, 15) },
    });

    expect(items.map((i) => i.start.toISOString())).toEqual(['2026-10-05T13:00:00.000Z', '2026-10-12T13:00:00.000Z']);
    expect(items[0].end.toISOString()).toBe('2026-10-05T15:00:00.000Z');
  });

  it('expande los eventos repetidos y salta las excepciones', () => {
    const items = buildCalendarItems({
      events: [
        event({
          startDateTime: '2026-10-05T16:00:00Z',
          endDateTime: '2026-10-05T17:00:00Z',
          isRecurring: true,
          recurrencePattern: 'FREQ=WEEKLY',
          exceptionDates: ['2026-10-12T16:00:00Z'],
        }),
      ],
      external: [],
      userId: 4,
      partnerName: 'Sam',
      range: { start: new Date(2026, 9, 1), end: new Date(2026, 9, 25) },
    });

    expect(items.map((i) => i.start.getUTCDate())).toEqual([5, 19]);
  });

  it('arma el mes empezando en domingo y la semana del día', () => {
    const grid = monthGrid(new Date(2026, 9, 17));
    expect(grid[0].slice(0, 4)).toEqual([null, null, null, null]);
    expect(grid[0][4]?.getDate()).toBe(1);
    expect(grid[grid.length - 1].filter(Boolean).pop()?.getDate()).toBe(31);

    expect(weekOf(new Date(2026, 9, 16)).map((d) => d.getDate())).toEqual([11, 12, 13, 14, 15, 16, 17]);
  });

  it('da los eventos del día ordenados y qué tipos tiene (para los puntos)', () => {
    const items = buildCalendarItems({
      events: [event({})],
      external: [external({})],
      userId: 4,
      partnerName: 'Sam',
      range,
    });
    const day = new Date(2026, 9, 17);

    expect(itemsOnDay(items, day).map((i) => i.title)).toEqual(['Comida con mi familia', 'Cine al aire libre']);
    expect(sourcesOn(items, day)).toEqual(['couple', 'mine']);
    expect(itemsOnDay(items, new Date(2026, 9, 18))).toEqual([]);
  });

  it('pone en columnas los eventos que se enciman', () => {
    const at = (h: number, h2: number, id: string) => ({
      id,
      start: new Date(2026, 9, 17, h),
      end: new Date(2026, 9, 17, h2),
    });

    const lanes = layoutLanes([at(9, 11, 'a'), at(10, 12, 'b'), at(12, 13, 'c')] as any);

    expect(lanes.map((l: any) => [l.item.id, l.lane, l.lanes])).toEqual([
      ['a', 0, 2],
      ['b', 1, 2],
      ['c', 0, 1],
    ]);
  });

  it('da los huecos libres de los dos de 1 h o más y sin los que ya pasaron', () => {
    const mutual = {
      user1Id: 4,
      user2Id: 13,
      totalDaysWithMutualAvailability: 2,
      totalMutualMinutes: 0,
      mutualAvailability: [
        {
          date: '2026-10-16',
          dayOfWeek: 'FRIDAY',
          totalMutualMinutes: 0,
          mutualFreeSlots: [
            { start: '09:00', end: '12:00' },
            { start: '18:00', end: '21:00' },
            { start: '21:00', end: '21:30' },
          ],
        },
        { date: '2026-10-17', dayOfWeek: 'SATURDAY', totalMutualMinutes: 0, mutualFreeSlots: [{ start: '11:00', end: '14:00' }] },
      ],
    };
    const now = new Date(2026, 9, 16, 13, 0);

    // La vista Dia: cada hueco entero.
    // [pulido-critica] D1: Dia parte el hueco igual que Inicio y la lista.
    expect(freeSlotsOn(mutual, new Date(2026, 9, 16), now).map((s) => s.label)).toEqual(['18:00 – 19:00', '19:00 – 21:00']);
    // [libres-juntos] La lista: partidos en manana / tarde / noche.
    const days = freeTogetherDays(mutual, now);
    expect(days.map((d) => [d.title, d.slots.map((s) => s.label)])).toEqual([
      ['Hoy, viernes 16', ['18:00 – 19:00', '19:00 – 21:00']],
      ['Sábado 17', ['11:00 – 13:00', '13:00 – 14:00']],
    ]);
    expect(days[1].slots[0]).toMatchObject({ date: '2026-10-17', startTime: '11:00', endTime: '13:00' });
    // Figma H7: "Esta semana tienen N horarios libres juntos".
    expect(freeSlotCount(mutual, now)).toBe(4);
    expect(freeSlotCount(null, now)).toBe(0);
  });

  it('[libres-juntos] sin horas que ya pasaron ni minutos sueltos', () => {
    const mutual = {
      user1Id: 4,
      user2Id: 13,
      totalDaysWithMutualAvailability: 1,
      totalMutualMinutes: 0,
      mutualAvailability: [
        { date: '2026-10-31', dayOfWeek: 'SATURDAY', totalMutualMinutes: 0, mutualFreeSlots: [{ start: '09:05', end: '22:00' }] },
      ],
    };
    const now = new Date(2026, 9, 31, 17, 10);

    expect(freeSlotsOn(mutual, new Date(2026, 9, 31), now).map((s) => s.label)).toEqual(['17:30 – 19:00', '19:00 – 22:00']);
    expect(freeTogetherDays(mutual, now)[0].slots.map((s) => s.label)).toEqual(['17:30 – 19:00', '19:00 – 22:00']);
  });

  it('escribe los títulos como en Figma', () => {
    expect(monthTitle(new Date(2026, 9, 17))).toBe('Octubre 2026');
    expect(dayTitle(new Date(2026, 9, 17))).toBe('Sábado 17 de octubre');
  });

  it('lee la fecha y las horas sugeridas para Crear evento', () => {
    const s = parseSuggestion('2026-10-17', '11:00', '14:00');
    expect(s?.day).toEqual(new Date(2026, 9, 17));
    expect(s?.start).toEqual(new Date(2026, 9, 17, 11, 0));
    expect(s?.end).toEqual(new Date(2026, 9, 17, 14, 0));
    expect(parseSuggestion('2026-10-17')?.start).toBeNull();
    expect(parseSuggestion(undefined)).toBeNull();
    expect(parseSuggestion('ayer')).toBeNull();
  });
});

describe('collapseAllDay', () => {
  const list = ['a', 'b', 'c', 'd'];

  it('muestra dos y cuenta el resto mientras no se expande', () => {
    expect(collapseAllDay(list, false)).toEqual({ visible: ['a', 'b'], hidden: 2 });
  });

  it('expandido o con pocos, muestra todos', () => {
    expect(collapseAllDay(list, true)).toEqual({ visible: list, hidden: 0 });
    expect(collapseAllDay(['a'], false)).toEqual({ visible: ['a'], hidden: 0 });
  });
});

describe('belowBusy', () => {
  it('el hueco libre empieza debajo del bloque ocupado que lo tapa', () => {
    expect(belowBusy({ top: 100, height: 200 }, [{ top: 80, height: 28 }])).toEqual({ top: 108, height: 192 });
  });

  it('sin bloques encima, no se mueve', () => {
    expect(belowBusy({ top: 100, height: 200 }, [{ top: 400, height: 28 }])).toEqual({ top: 100, height: 200 });
  });
});

describe('suggestedText ([ux-ajustes] D1)', () => {
  it('lee el título y el lugar de «Proponer otra fecha», sin espacios de más', () => {
    expect(suggestedText(' Noche de boliche ', 'Bol Polanco')).toEqual({ title: 'Noche de boliche', location: 'Bol Polanco' });
  });

  it('sin datos, vacíos', () => {
    expect(suggestedText(undefined, undefined)).toEqual({ title: '', location: '' });
  });
});

describe('openingHour ([ux-ajustes] D6)', () => {
  const item = (start: Date, end: Date, allDay = false) =>
    ({ id: String(start.getTime()), title: 'x', start, end, allDay }) as CalendarItem;
  // Semana del domingo 25 al sábado 31 de octubre de 2026.
  const week = Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 25 + i));
  const nextWeek = Array.from({ length: 7 }, (_, i) => new Date(2026, 10, 1 + i));

  it('si hoy está en la vista, abre una hora antes de ahora', () => {
    expect(openingHour([item(new Date(2026, 9, 27, 6, 0), new Date(2026, 9, 27, 7, 0))], week, new Date(2026, 9, 31, 15, 20))).toBe(14);
    expect(openingHour([], week, new Date(2026, 9, 31, 0, 10))).toBe(0);
  });

  it('otro día: la primera hora de lo que empieza ese día, 8 como máximo', () => {
    const now = new Date(2026, 9, 31, 15, 20);
    expect(openingHour([item(new Date(2026, 10, 3, 10, 0), new Date(2026, 10, 3, 11, 0))], nextWeek, now)).toBe(8);
    expect(openingHour([item(new Date(2026, 10, 4, 6, 30), new Date(2026, 10, 4, 7, 30))], nextWeek, now)).toBe(6);
  });

  it('lo que viene del día anterior («Dormir» 23:00–05:00) no cuenta', () => {
    const now = new Date(2026, 9, 31, 15, 20);
    const sleep = item(new Date(2026, 9, 31, 23, 0), new Date(2026, 10, 1, 5, 0));
    expect(openingHour([sleep], nextWeek, now)).toBe(8);
    expect(openingHour([sleep], [new Date(2026, 10, 1)], now)).toBe(8);
  });

  it('los de todo el día no cuentan; sin eventos, 8', () => {
    const now = new Date(2026, 9, 31, 15, 20);
    expect(openingHour([item(new Date(2026, 10, 2), new Date(2026, 10, 2, 23, 59), true)], nextWeek, now)).toBe(8);
    expect(openingHour([], nextWeek, now)).toBe(8);
  });
});
