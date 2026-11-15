import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * QR de vínculo: el QR abre "Escribir el código" de Nexus con el código puesto. Si quien lo escanea
 * no tiene sesión, el código se guarda en el teléfono (sobrevive a cerrar la app para leer el
 * correo de verificación) y Inicio lo retoma al entrar. Los códigos valen 15 minutos (RN-09).
 */
const KEY = '@nexus_pending_link_code';
const VALID_MS = 15 * 60_000;

export function linkCodeUrl(code: string): string {
  return `nexus://enter-link-code?code=${encodeURIComponent(code)}`;
}

/**
 * Mensaje del botón Compartir. WhatsApp solo vuelve tocables los links https, así que el link
 * (`<base>/unirme?code=…`, que abrirá Nexus por App Links) solo va cuando hay dirección pública
 * https (`EXPO_PUBLIC_INVITE_URL`, pendiente del despliegue); mientras, se explica dónde escribirlo.
 */
export function inviteMessage(code: string, validityMinutes: number, baseUrl?: string): string {
  const steps = `la app → Pareja → Unirme a mi pareja y escribe ${code}. Vence en ${validityMinutes} minutos.`;
  const base = baseUrl?.trim().replace(/\/+$/, '');
  if (!base || !/^https:\/\//i.test(base)) {
    return `¡Únete a mí en Nexus! Abre ${steps}`;
  }
  return `¡Únete a mí en Nexus! Toca para unirte: ${base}/unirme?code=${encodeURIComponent(code)}\n\nO abre ${steps}`;
}

const CODE_LENGTH = 6;
const PREFIX = 'NEXUS';

/**
 * El código como lo acepta el campo: sin "NEXUS-", en mayúsculas, solo letras y números, 6 caracteres.
 * [vinculo-pegar] «Copiar» copia `NEXUS-ABC234`; pegado junto al `NEXUS-` del campo llegaba
 * `NEXUS-NEXUS-ABC234` y se mandaba `NEXUSA`. Se quita el prefijo las veces que venga: con separador
 * siempre, y pegado al código solo si después quedan 6 o más (un código real puede empezar con NEXUS).
 */
export function codeFromLink(raw: string | string[] | undefined): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  let text = (value ?? '').trim().toUpperCase();
  for (;;) {
    const withSeparator = text.match(/^NEXUS[^A-Z0-9]+/);
    if (withSeparator) {
      text = text.slice(withSeparator[0].length);
    } else if (text.startsWith(PREFIX) && text.replace(/[^A-Z0-9]/g, '').length >= PREFIX.length + CODE_LENGTH) {
      text = text.slice(PREFIX.length);
    } else {
      break;
    }
  }
  return text.replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH);
}

export async function savePendingLinkCode(code: string, now: Date = new Date()): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ code, savedAt: now.toISOString() }));
  } catch {
    // Sin almacenamiento solo se pierde el atajo: la pareja puede escribir el código.
  }
}

/** Entrega el código pendiente una sola vez; `expired` si ya pasaron los 15 minutos. */
export async function takePendingLinkCode(now: Date = new Date()): Promise<{ code: string; expired: boolean } | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(KEY);
    const saved = JSON.parse(raw);
    if (typeof saved?.code !== 'string' || !saved.code) return null;
    const age = now.getTime() - new Date(saved.savedAt).getTime();
    return { code: saved.code, expired: !(age <= VALID_MS) };
  } catch {
    return null;
  }
}
