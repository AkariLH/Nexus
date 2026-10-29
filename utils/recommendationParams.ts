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

/**
 * [rango-distancia] Horas en que puede empezar el rango: la hora real del hueco (puede ser 10:15) y
 * luego cada 30 minutos, dejando al menos una hora antes del fin.
 *
 * @complexity T: O(n), S: O(n), n = medias horas del hueco
 */
export function rangeStarts(slot: SlotOption): string[] {
  const latest = toMinutes(slot.end) - MIN_SLOT_MINUTES;
  const out: string[] = [];
  for (let t = toMinutes(slot.start); t <= latest; t += RANGE_STEP_MINUTES) out.push(toClock(t));
  return out;
}

/**
 * [rango-distancia] Horas en que puede terminar el rango si empieza en `from`: desde una hora despues,
 * cada 30 minutos, y siempre el fin del hueco.
 *
 * @complexity T: O(n), S: O(n), n = medias horas del hueco
 */
export function rangeEnds(slot: SlotOption, from: string): string[] {
  const end = toMinutes(slot.end);
  const out: string[] = [];
  for (let t = toMinutes(from) + MIN_SLOT_MINUTES; t <= end; t += RANGE_STEP_MINUTES) out.push(toClock(t));
  if (out.length > 0 && out[out.length - 1] !== slot.end) out.push(slot.end);
  return out;
}

/** [rango-distancia] El hueco recortado al rango; la `key` no cambia para que siga marcado. */
export function withRange(slot: SlotOption, from: string, to: string): SlotOption {
  return { ...slot, start: from, end: to };
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
