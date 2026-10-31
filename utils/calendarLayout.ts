import type { EventResponse } from '../services/event.service';
import type { ExternalEventDTO } from '../services/externalCalendar.integration.service';
import type { MutualAvailabilityResponse } from '../services/availabilityService';
import { expandRecurringEvent } from './recurrenceUtils';
import { cleanWindows } from './freeProposals';

/**
 * Datos del calendario (Figma E): eventos de Nexus (de los dos), del calendario del telefono propio
 * y del de la pareja (solo lectura), mas los huecos libres de los dos. Funciones puras para que
 * las vistas Mes / Semana / Dia solo dibujen.
 */

export type CalendarSource = 'couple' | 'mine' | 'partner';

export interface CalendarItem {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  source: CalendarSource;
  /** Lugar (de los dos) o de que calendario viene. */
  subtitle: string;
  color: string;
  readOnly: boolean;
  /** Id del evento de Nexus para abrir el detalle (null en externos). */
  eventId: number | null;
  /** Id del evento externo para su detalle (null si es de Nexus o es "Ocupado"). */
  externalId: number | null;
}

export const SOURCE_ORDER: CalendarSource[] = ['couple', 'mine', 'partner'];

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const WEEKDAY_INITIALS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pad = (n: number) => String(n).padStart(2, '0');

export const monthTitle = (d: Date) => `${capitalize(MONTHS[d.getMonth()])} ${d.getFullYear()}`;
export const dayTitle = (d: Date) => `${capitalize(WEEKDAYS[d.getDay()])} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
export const shortDay = (d: Date) => `${capitalize(WEEKDAYS[d.getDay()]).slice(0, 3)} ${d.getDate()}`;
export const hm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** "2026-10-14T00:00:00Z" -> 14 de octubre local, sin correr de dia por la zona horaria. */
function localDateOf(iso: string, endOfDay: boolean): Date {
  const [y, m, d] = iso.substring(0, 10).split('-').map(Number);
  return endOfDay ? new Date(y, m - 1, d, 23, 59, 59, 999) : new Date(y, m - 1, d);
}

/** Todo el dia: de 00:00 a 23:59 UTC, o 24 h exactas (eventos viejos creados en hora local). */
function isAllDayEvent(startIso: string, endIso: string): boolean {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const midnight = start.getUTCHours() === 0 && start.getUTCMinutes() === 0;
  const lastMinute = end.getUTCHours() === 23 && end.getUTCMinutes() === 59;
  const hours = (end.getTime() - start.getTime()) / 3_600_000;
  return (midnight && lastMinute) || Math.abs(hours - 24) < 0.1;
}

/** Medianoche UTC del dia local, para comparar con `exceptionDates`. */
const utcDayKey = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

/** Externo repetido de Nexus: mismo titulo, inicio a 5 min y duracion a 10 min. */
function duplicatesNexus(ext: ExternalEventDTO, events: EventResponse[]): boolean {
  const extStart = new Date(ext.startDatetime).getTime();
  const extDuration = new Date(ext.endDatetime).getTime() - extStart;
  return events.some((e) => {
    if (e.title.trim().toLowerCase() !== ext.title.trim().toLowerCase()) return false;
    const start = new Date(e.startDateTime).getTime();
    const duration = new Date(e.endDateTime).getTime() - start;
    return Math.abs(start - extStart) <= 5 * 60_000 && Math.abs(duration - extDuration) <= 10 * 60_000;
  });
}

/** Lleva un ISO UTC a "la misma hora pero local", como espera `expandRecurringEvent`. */
const asLocalIso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString();

interface BuildInput {
  events: EventResponse[];
  external: ExternalEventDTO[];
  userId: number;
  partnerName: string;
  range: { start: Date; end: Date };
}

export function buildCalendarItems({ events, external, userId, partnerName, range }: BuildInput): CalendarItem[] {
  const items: CalendarItem[] = [];
  // Solo cuentan los aprobados por los dos.
  const approved = events.filter((e) => e.fullyApproved === true);

  approved.forEach((e) => {
    const allDay = isAllDayEvent(e.startDateTime, e.endDateTime);
    const start = allDay ? localDateOf(e.startDateTime, false) : new Date(e.startDateTime);
    const end = allDay ? localDateOf(e.endDateTime, true) : new Date(e.endDateTime);
    const base = {
      title: e.title,
      allDay,
      source: 'couple' as const,
      subtitle: e.location ?? '',
      color: e.color || '',
      readOnly: false,
      eventId: e.id,
      externalId: null,
    };

    if (!(e.isRecurring && e.recurrencePattern)) {
      items.push({ ...base, id: String(e.id), start, end });
      return;
    }
    const skipped = new Set(
      (e.exceptionDates ?? []).map((iso) => {
        const d = new Date(iso);
        return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      }),
    );
    const duration = end.getTime() - start.getTime();
    expandRecurringEvent(
      {
        // expandRecurringEvent lee la hora como local; la API manda UTC (los de todo el dia ya
        // vienen como fecha local a medianoche y se dejan tal cual).
        startDateTime: allDay ? e.startDateTime : asLocalIso(new Date(e.startDateTime)),
        endDateTime: allDay ? e.endDateTime : asLocalIso(new Date(e.endDateTime)),
        isRecurring: true,
        recurrencePattern: e.recurrencePattern,
        rruleDtstartUtc: e.rruleDtstartUtc,
      },
      range.start,
      range.end,
    )
      .filter((occurrence) => !skipped.has(utcDayKey(occurrence)))
      .forEach((occurrence) =>
        items.push({
          ...base,
          id: `${e.id}-${occurrence.getTime()}`,
          start: occurrence,
          end: new Date(occurrence.getTime() + duration),
        }),
      );
  });

  external
    .filter((ext) => !duplicatesNexus(ext, approved))
    .forEach((ext) => {
      const mine = ext.ownerId === userId;
      const busyOnly = ext.visibility === 'BUSY_ONLY';
      const start = ext.isAllDay ? localDateOf(ext.startDatetime, false) : new Date(ext.startDatetime);
      const end = ext.isAllDay ? localDateOf(ext.endDatetime, true) : new Date(ext.endDatetime);
      const base = {
        title: busyOnly ? 'Ocupado' : ext.title,
        allDay: ext.isAllDay,
        source: (mine ? 'mine' : 'partner') as CalendarSource,
        subtitle: mine ? 'Tu calendario' : `Calendario de ${partnerName}`,
        color: '',
        readOnly: true,
        eventId: null,
        externalId: busyOnly ? null : ext.id,
      };

      if (!ext.recurrenceRule) {
        items.push({ ...base, id: `external-${ext.id}`, start, end });
        return;
      }
      const duration = end.getTime() - start.getTime();
      expandRecurringEvent(
        {
          startDateTime: asLocalIso(start),
          endDateTime: asLocalIso(end),
          isRecurring: true,
          recurrencePattern: ext.recurrenceRule,
          rruleDtstartUtc: ext.rruleDtstartUtc ? asLocalIso(new Date(ext.rruleDtstartUtc)) : undefined,
        },
        range.start,
        range.end,
      ).forEach((occurrence) =>
        items.push({
          ...base,
          id: `external-${ext.id}-${occurrence.getTime()}`,
          start: occurrence,
          end: new Date(occurrence.getTime() + duration),
        }),
      );
    });

  return items;
}

/** Semanas del mes (domingo a sabado), con null en los huecos antes del 1 y despues del ultimo. */
export function monthGrid(date: Date): (Date | null)[][] {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array(first.getDay()).fill(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(date.getFullYear(), date.getMonth(), d));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Domingo a sabado de la semana del dia. */
export function weekOf(date: Date): Date[] {
  const sunday = addDays(startOfDay(date), -date.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(sunday, i));
}

/** Eventos que tocan el dia, los de todo el dia primero y luego por hora de inicio. */
export function itemsOnDay(items: CalendarItem[], day: Date): CalendarItem[] {
  const from = startOfDay(day).getTime();
  const to = addDays(startOfDay(day), 1).getTime();
  return items
    .filter((i) => i.start.getTime() < to && i.end.getTime() > from)
    .sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start.getTime() - b.start.getTime());
}

/** Tipos de evento del dia, en el orden de la leyenda (para los puntos del mes). */
export function sourcesOn(items: CalendarItem[], day: Date): CalendarSource[] {
  const present = new Set(itemsOnDay(items, day).map((i) => i.source));
  return SOURCE_ORDER.filter((s) => present.has(s));
}

export interface Laned<T> {
  item: T;
  lane: number;
  /** Columnas del grupo de eventos que se enciman. */
  lanes: number;
}

/** Reparte en columnas los eventos que se enciman (cada grupo encimado usa su propio ancho). */
export function layoutLanes<T extends { start: Date; end: Date }>(items: T[]): Laned<T>[] {
  const sorted = [...items].sort((a, b) => a.start.getTime() - b.start.getTime());
  const result: Laned<T>[] = [];
  let cluster: Laned<T>[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -Infinity;

  const close = () => {
    cluster.forEach((l) => (l.lanes = laneEnds.length));
    result.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  sorted.forEach((item) => {
    const start = item.start.getTime();
    if (start >= clusterEnd && cluster.length > 0) close();
    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = item.end.getTime();
    clusterEnd = Math.max(cluster.length ? clusterEnd : -Infinity, item.end.getTime());
    cluster.push({ item, lane, lanes: 0 });
  });
  if (cluster.length) close();
  return result;
}

/** Vista Dia: los eventos de todo el dia se muestran de dos en dos para no empujar el horario. */
export function collapseAllDay<T>(list: T[], expanded: boolean, max = 2): { visible: T[]; hidden: number } {
  if (expanded || list.length <= max) return { visible: list, hidden: 0 };
  return { visible: list.slice(0, max), hidden: list.length - max };
}

/**
 * Un evento corto se dibuja con altura minima y tapa el inicio del hueco libre que sigue; el hueco
 * empieza debajo del bloque para que "Libres los dos" no se encime (posiciones en pixeles).
 */
export function belowBusy(
  free: { top: number; height: number },
  busy: { top: number; height: number }[],
): { top: number; height: number } {
  const bottom = free.top + free.height;
  const top = busy
    .filter((b) => b.top <= free.top && b.top + b.height > free.top)
    .reduce((t, b) => Math.max(t, b.top + b.height), free.top);
  return { top, height: Math.max(0, bottom - top) };
}

export interface FreeSlot {
  date: string;
  startTime: string;
  endTime: string;
  start: Date;
  end: Date;
  label: string;
}

/**
 * [libres-juntos] Los huecos ya limpios (desde ahora, a :00/:30, de 1 h o mas; ver freeProposals):
 * partidos en manana / tarde / noche para la lista, enteros (`split = false`) para la vista Dia.
 */
function slotsOfDay(day: MutualAvailabilityResponse['mutualAvailability'][number], now: Date, split = true): FreeSlot[] {
  const [y, m, d] = day.date.split('-').map(Number);
  const at = (time: string) => {
    const [h, min] = time.split(':').map(Number);
    return new Date(y, m - 1, d, h, min);
  };
  return cleanWindows([day], now, split).map((w) => ({
    date: w.date,
    startTime: w.start,
    endTime: w.end,
    start: at(w.start),
    end: at(w.end),
    label: `${w.start} – ${w.end}`,
  }));
}

/** Huecos libres de los dos en un dia (para los bloques punteados de la vista Dia). */
export function freeSlotsOn(mutual: MutualAvailabilityResponse | null, day: Date, now: Date): FreeSlot[] {
  const found = mutual?.mutualAvailability.find((d) => d.date === isoDate(day));
  return found ? slotsOfDay(found, now, false) : [];
}

/** Dias con huecos libres de los dos (modal E4): "Hoy, viernes 16", "Sábado 17". */
export function freeTogetherDays(mutual: MutualAvailabilityResponse | null, now: Date) {
  return (mutual?.mutualAvailability ?? [])
    .map((day) => {
      const [y, m, d] = day.date.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const name = `${WEEKDAYS[date.getDay()]} ${date.getDate()}`;
      const title = sameDay(date, now) ? `Hoy, ${name}` : capitalize(name);
      return { date: day.date, title, slots: slotsOfDay(day, now) };
    })
    .filter((day) => day.slots.length > 0);
}

/** Cuantos huecos libres tienen los dos (Figma H7: "Esta semana tienen 6 horarios libres juntos"). */
export function freeSlotCount(mutual: MutualAvailabilityResponse | null, now: Date): number {
  return freeTogetherDays(mutual, now).reduce((total, day) => total + day.slots.length, 0);
}

/**
 * Parametros de Crear evento al llegar desde el calendario ("2026-10-17", "11:00", "14:00"):
 * el dia y, si vienen, las horas como fechas locales.
 */
export function parseSuggestion(date?: string, start?: string, end?: string) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [y, m, d] = date.split('-').map(Number);
  const at = (time?: string) => {
    if (!time || !/^\d{2}:\d{2}$/.test(time)) return null;
    const [h, min] = time.split(':').map(Number);
    return new Date(y, m - 1, d, h, min);
  };
  return { day: new Date(y, m - 1, d), start: at(start), end: at(end) };
}
