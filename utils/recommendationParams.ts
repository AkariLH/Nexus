/**
 * CU36 / RN-27 / RN-32 - Logica del formulario "Detalles de la cita". Solo valores cerrados; las
 * franjas salen de los huecos libres de los dos que calcula el servidor (fecha y horas en CDMX).
 */
import type { MutualAvailableDay } from '../services/availabilityService';
import type { RecommendationParams, Scope, ZoneType } from '../services/recommendation.service';
import { formatMxn } from './recommendationFormat';

/** CDMX no cambia de horario desde 2022. */
const CDMX_OFFSET = '-06:00';
const CDMX_OFFSET_MS = -6 * 60 * 60_000;
const MIN_SLOT_MINUTES = 60;
const QUARTER_MS = 15 * 60_000;

export const MAX_COST_MXN = 15_000;

/** [rango-distancia] Distancias que se pueden elegir (ProximityFilter.RADIUS_OPTIONS_KM). */
export const RADIUS_OPTIONS_KM = [1, 3, 5, 10, 15] as const;
export const DEFAULT_RADIUS_KM = 15;
const RANGE_STEP_MINUTES = 30;

/** Un hueco libre de los dos; `start` puede venir recortado si es de hoy. */
export interface SlotOption {
  key: string;
  date: string;
  start: string;
  end: string;
}

export interface RequestForm {
  zoneType?: ZoneType;
  boroughCode?: string;
  coords?: { lat: number; lon: number };
  slot?: SlotOption;
  /** [rango-distancia] Parte del hueco que se quiere; sin ellos, el hueco completo. */
  rangeFrom?: string;
  rangeTo?: string;
  /** [rango-distancia] Distancia maxima; sin ella, {@link DEFAULT_RADIUS_KM}. */
  radiusKm?: number;
  scope: Scope;
  maxCostMxn: number;
  category?: string;
}

const toInstant = (date: string, time: string): Date => new Date(`${date}T${time}:00${CDMX_OFFSET}`);

const cdmxClock = (instant: Date): string => {
  const shifted = new Date(instant.getTime() + CDMX_OFFSET_MS);
  return `${String(shifted.getUTCHours()).padStart(2, '0')}:${String(shifted.getUTCMinutes()).padStart(2, '0')}`;
};

const nextQuarter = (now: Date): Date => new Date(Math.ceil(now.getTime() / QUARTER_MS) * QUARTER_MS);

/**
 * F1 - Huecos que sirven para pedir: futuros y de 60 minutos o mas. El de hoy empieza en el
 * siguiente cuarto de hora para que el servidor no lo rechace por estar en el pasado.
 *
 * @complexity T: O(n log n) por el orden, S: O(n), n = huecos
 */
export function eligibleSlots(days: MutualAvailableDay[], now: Date): SlotOption[] {
  const earliest = nextQuarter(now);

  return days
    .flatMap((day) =>
      day.mutualFreeSlots.map((slot) => {
        const freeFrom = toInstant(day.date, slot.start);
        const start = freeFrom < earliest ? earliest : freeFrom;
        return { date: day.date, start, end: toInstant(day.date, slot.end) };
      }),
    )
    .filter(({ start, end }) => end.getTime() - start.getTime() >= MIN_SLOT_MINUTES * 60_000)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .map(({ date, start, end }) => {
      const from = cdmxClock(start);
      return { key: `${date}T${from}`, date, start: from, end: cdmxClock(end) };
    });
}

export function slotToInstants(slot: SlotOption): { slotStart: string; slotEnd: string } {
  return {
    slotStart: toInstant(slot.date, slot.start).toISOString(),
    slotEnd: toInstant(slot.date, slot.end).toISOString(),
  };
}

const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const toClock = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** La siguiente hora en punto o y media despues de `minutes`. */
const nextHalfHour = (minutes: number): number => (Math.floor(minutes / RANGE_STEP_MINUTES) + 1) * RANGE_STEP_MINUTES;

/**
 * [rango-distancia] Horas en que puede empezar el rango: la hora real del hueco (puede ser 09:05) y
 * luego horas en punto y medias (09:30, 10:00...), dejando al menos una hora antes del fin.
 *
 * @complexity T: O(n), S: O(n), n = medias horas del hueco
 */
export function rangeStarts(slot: SlotOption): string[] {
  const first = toMinutes(slot.start);
  const latest = toMinutes(slot.end) - MIN_SLOT_MINUTES;
  if (first > latest) return [];
  const out = [toClock(first)];
  for (let t = nextHalfHour(first); t <= latest; t += RANGE_STEP_MINUTES) out.push(toClock(t));
  return out;
}

/**
 * [rango-distancia] Horas en que puede terminar el rango si empieza en `from`: una hora despues, luego
 * horas en punto y medias, y siempre el fin del hueco.
 *
 * @complexity T: O(n), S: O(n), n = medias horas del hueco
 */
export function rangeEnds(slot: SlotOption, from: string): string[] {
  const end = toMinutes(slot.end);
  const first = toMinutes(from) + MIN_SLOT_MINUTES;
  if (first > end) return [];
  const out = [toClock(first)];
  for (let t = nextHalfHour(first); t <= end; t += RANGE_STEP_MINUTES) out.push(toClock(t));
  if (out[out.length - 1] !== slot.end) out.push(slot.end);
  return out;
}

/** [rango-distancia] El hueco recortado al rango; la `key` no cambia para que siga marcado. */
export function withRange(slot: SlotOption, from: string, to: string): SlotOption {
  return { ...slot, start: from, end: to };
}

/**
 * [libres-juntos] Llegando desde una propuesta: el hueco que la contiene y su rango; `null` si ese
 * horario ya no esta libre (alguien agendo algo despues).
 */
export function slotForWindow(
  slots: SlotOption[],
  w: { date: string; start: string; end: string },
): { slot: SlotOption; from: string; to: string } | null {
  const slot = slots.find((s) => s.date === w.date && s.start <= w.start && s.end >= w.end);
  return slot ? { slot, from: w.start, to: w.end } : null;
}

/** [rango-distancia] Elegir otro hueco: el rango vuelve a ser el hueco completo. */
export function chooseSlot<T extends RequestForm>(form: T, slot: SlotOption): T {
  return { ...form, slot, rangeFrom: undefined, rangeTo: undefined };
}

/** El horario que se pide: el rango si se eligio, si no el hueco completo. */
export function requestedSlot(form: RequestForm): SlotOption | undefined {
  if (!form.slot) return undefined;
  return form.rangeFrom && form.rangeTo ? withRange(form.slot, form.rangeFrom, form.rangeTo) : form.slot;
}

/** F2 / F3 - Zona completa, horario elegido y presupuesto en rango. */
export function isValid(form: RequestForm): boolean {
  if (!form.slot || !form.zoneType) return false;
  if (form.maxCostMxn < 0 || form.maxCostMxn > MAX_COST_MXN) return false;
  if (form.zoneType === 'BOROUGH') return Boolean(form.boroughCode);
  if (form.zoneType === 'NEAR_US') return Boolean(form.coords);
  return true;
}

/** Cuerpo de la peticion. La ubicacion solo viaja con "Cerca de nosotros" (RN-30). */
export function toParams(form: RequestForm): RecommendationParams {
  if (!form.slot || !form.zoneType) {
    throw new Error('Formulario incompleto');
  }

  const params: RecommendationParams = {
    zoneType: form.zoneType,
    scope: form.scope,
    maxCostMxn: form.maxCostMxn,
    ...slotToInstants(requestedSlot(form) ?? form.slot),
  };
  // [rango-distancia] Sin zona no hay desde donde medir la distancia.
  if (form.zoneType !== 'NONE') params.radiusKm = form.radiusKm ?? DEFAULT_RADIUS_KM;
  if (form.zoneType === 'BOROUGH') params.boroughCode = form.boroughCode;
  if (form.zoneType === 'NEAR_US' && form.coords) {
    params.lat = form.coords.lat;
    params.lon = form.coords.lon;
  }
  if (form.category) params.category = form.category;
  return params;
}

export function budgetLabel(maxCostMxn: number): string {
  return maxCostMxn > 0 ? `Hasta $${formatMxn(maxCostMxn)}` : 'Solo gratis';
}

const RELAXED_MESSAGES: Record<string, string> = {
  BUDGET: 'Ampliamos un poco el presupuesto para darte más opciones.',
  CATEGORY: 'Incluimos otros tipos de plan para darte más opciones.',
  DAYPART: 'Incluimos planes de otros momentos del día para darte más opciones.',
  SCOPE: 'Incluimos planes en casa y fuera para darte más opciones.',
};

/** F5 - Aviso cuando el servidor amplio filtros para juntar opciones (R16). */
export function relaxedMessage(codes: string[] | undefined): string | null {
  if (!codes || codes.length === 0) return null;
  if (codes.length > 1) return 'Ampliamos un poco los filtros para darte más opciones.';
  return RELAXED_MESSAGES[codes[0]] ?? null;
}

export function zoneLabel(zoneType: ZoneType, boroughName?: string): string | null {
  if (zoneType === 'NEAR_US') return 'Cerca de ustedes';
  if (zoneType === 'BOROUGH') return boroughName ?? null;
  return null;
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DEFAULT_RANGE_MINUTES = 180;

/** [rango-distancia] Figma J1: "¿Usamos todo el sábado de 10:00 a 20:00?". */
export function hoursQuestion(slot: SlotOption): string {
  const weekday = WEEKDAYS[new Date(`${slot.date}T12:00:00${CDMX_OFFSET}`).getUTCDay()];
  return `¿Usamos todo el ${weekday} de ${slot.start} a ${slot.end}?`;
}

/** [rango-distancia] "Buscaremos planes de 16:00 a 19:00 (3 horas)." */
export function rangeSummary(from: string, to: string): string {
  const minutes = toMinutes(to) - toMinutes(from);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const length = m === 0 ? `${h} ${h === 1 ? 'hora' : 'horas'}` : `${h} h ${m} min`;
  return `Buscaremos planes de ${from} a ${to} (${length}).`;
}

/** [rango-distancia] Al elegir "Solo unas horas": desde el inicio, hasta unas 3 horas (o el hueco entero). */
export function defaultRange(slot: SlotOption): { from: string; to: string } {
  const ends = rangeEnds(slot, slot.start);
  const target = toMinutes(slot.start) + DEFAULT_RANGE_MINUTES;
  const upToTarget = ends.filter((e) => toMinutes(e) <= target);
  const to = upToTarget[upToTarget.length - 1] ?? ends[0] ?? slot.end;
  return { from: slot.start, to };
}

/** [rango-distancia] Al cambiar el inicio, el fin se queda si sigue dejando una hora; si no, el primero valido. */
export function keepEnd(slot: SlotOption, from: string, to: string): string {
  const ends = rangeEnds(slot, from);
  return ends.includes(to) ? to : ends[0] ?? slot.end;
}

/** [rango-distancia] La siguiente distancia de la lista, o null si ya es la mayor. */
export function nextRadius(km: number): number | null {
  return RADIUS_OPTIONS_KM.find((option) => option > km) ?? null;
}

/** [rango-distancia] Figma J1: texto bajo "Distancia maxima". */
export function radiusHint(km: number, zoneType?: ZoneType): string {
  return zoneType === 'BOROUGH'
    ? `Lugares a ${km} km o menos del centro de la alcaldía.`
    : `Lugares a ${km} km o menos de ustedes.`;
}

/** [rango-distancia] Elegir "En casa" quita la zona: los planes en casa no necesitan ubicacion. */
export function chooseScope<T extends RequestForm>(form: T, scope: Scope): T {
  if (scope !== 'HOME') return { ...form, scope };
  return { ...form, scope, zoneType: 'NONE', boroughCode: undefined, coords: undefined };
}
