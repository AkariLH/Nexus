/**
 * RF-37 / RF-40 - Textos de las tarjetas de recomendacion. Las horas se muestran en CDMX, que es
 * donde el servidor calcula los huecos libres (UTC-6, sin horario de verano desde 2022).
 */
import type { SlotOption } from './recommendationParams';

const CDMX_OFFSET_MS = -6 * 60 * 60_000;
const DAY_MS = 24 * 60 * 60_000;
const SHORT_DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const LONG_DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Fecha corrida a CDMX: leer siempre con getUTC*. */
const inCdmx = (instant: Date | string): Date => new Date(new Date(instant).getTime() + CDMX_OFFSET_MS);

const dayIndex = (cdmx: Date): number => Math.floor(cdmx.getTime() / DAY_MS);

const two = (n: number): string => String(n).padStart(2, '0');

const clock = (cdmx: Date): string => `${two(cdmx.getUTCHours())}:${two(cdmx.getUTCMinutes())}`;

/** Dias de diferencia entre la fecha (CDMX) y hoy (CDMX). */
const daysFromToday = (cdmx: Date, now: Date): number => dayIndex(cdmx) - dayIndex(inCdmx(now));

const dayWord = (cdmx: Date, now: Date): string => {
  const diff = daysFromToday(cdmx, now);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  return `${SHORT_DAYS[cdmx.getUTCDay()]} ${cdmx.getUTCDate()}`;
};

/** "1,500": separador de miles fijo, igual en Hermes y en Node. */
export function formatMxn(amount: number): string {
  return String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** "Hoy · 18:00 – 20:00"; compacto: "Hoy · 18:00–20:00" (filtros y chips). */
export function slotLabel(startIso: string, endIso: string, now: Date, compact = false): string {
  const start = inCdmx(startIso);
  const separator = compact ? '–' : ' – ';
  return `${dayWord(start, now)} · ${clock(start)}${separator}${clock(inCdmx(endIso))}`;
}

/** Etiqueta de un hueco libre de los dos (fecha y horas ya en CDMX). */
export function slotOptionLabel(slot: SlotOption, now: Date): string {
  const day = new Date(`${slot.date}T00:00:00.000Z`);
  return `${dayWord(day, now)} · ${slot.start}–${slot.end}`;
}

/** Completa "Ya tienen cita ...": "para hoy", "para mañana", "para el miércoles 21". */
export function dayPhrase(startIso: string, now: Date): string {
  const start = inCdmx(startIso);
  const diff = daysFromToday(start, now);
  if (diff === 0) return 'para hoy';
  if (diff === 1) return 'para mañana';
  return `para el ${LONG_DAYS[start.getUTCDay()]} ${start.getUTCDate()}`;
}

export function costLabel(costPerPersonMxn: number): string {
  return costPerPersonMxn > 0 ? `$${formatMxn(costPerPersonMxn)} por persona` : 'Gratis';
}

export interface PlaceSource {
  scope: 'HOME' | 'CITY';
  placeName?: string | null;
  boroughName?: string | null;
  placeAddress?: string | null;
  placeNeighborhood?: string | null;
  placeWebsite?: string | null;
  placePhone?: string | null;
}

export function placeLabel(item: PlaceSource): string {
  if (item.scope === 'HOME') return 'En casa';
  return [item.boroughName, item.placeName].filter(Boolean).join(' · ');
}

/** [kb-lugares] U8 - Lo que muestra el bloque del lugar; cada enlace solo si el dato sirve. */
export interface PlaceDetail {
  /** "Lugar · Alcaldía" */
  name: string;
  /** "Dirección, Colonia" */
  address?: string;
  websiteUrl?: string;
  phoneUrl?: string;
  /** Busqueda en Google Maps por nombre, direccion y alcaldia (la tarjeta no lleva coordenadas). */
  mapsUrl: string;
}

const MAPS_SEARCH = 'https://www.google.com/maps/search/?api=1&query=';
const MIN_PHONE_DIGITS = 7;

const filled = (...parts: (string | null | undefined)[]): string[] =>
  parts.map((p) => p?.trim()).filter((p): p is string => !!p);

/** Solo http(s): nunca abre esquemas como javascript: ni direcciones sin esquema. */
function websiteUrl(raw?: string | null): string | undefined {
  const url = raw?.trim();
  return url && /^https?:\/\//i.test(url) ? url : undefined;
}

/** Digitos y un + inicial; con muy pocos digitos no es un telefono. */
function phoneUrl(raw?: string | null): string | undefined {
  const trimmed = raw?.trim() ?? '';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < MIN_PHONE_DIGITS) return undefined;
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`;
}

export function placeDetail(item: PlaceSource): PlaceDetail | null {
  if (item.scope === 'HOME') return null;
  const address = filled(item.placeAddress, item.placeNeighborhood).join(', ');
  const query = filled(item.placeName, item.placeAddress, item.placeNeighborhood, item.boroughName).join(', ');
  return {
    name: filled(item.placeName, item.boroughName).join(' · '),
    address: address || undefined,
    websiteUrl: websiteUrl(item.placeWebsite),
    phoneUrl: phoneUrl(item.placePhone),
    mapsUrl: MAPS_SEARCH + encodeURIComponent(query),
  };
}
