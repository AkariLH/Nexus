import Constants from 'expo-constants';

/**
 * Forma admitida para `EXPO_PUBLIC_API_URL`: esquema http(s), autoridad, y opcionalmente una
 * ruta. Se valida con regex y no con `new URL()` a propósito: la implementación de `URL` en
 * React Native es un polyfill parcial y su comportamiento ante entradas inválidas no es el del
 * estándar. Una regex explícita se comporta igual en Node (jest) y en Hermes.
 */
const API_URL_SHAPE = /^https?:\/\/[^\s/?#]+(?:\/[^\s?#]*)?$/;

/** Puerto en el que escucha el backend Spring en desarrollo. Solo se usa para sugerir. */
const BACKEND_DEV_PORT = '8080';

/**
 * Deriva una base de API plausible a partir del `hostUri` de Expo (`host:puertoDeMetro`).
 *
 * Solo alimenta el mensaje de error: el valor sugerido **nunca** se usa como configuración. Una
 * URL presente pero equivocada es indistinguible de un backend caído, y ese es justo el fallo que
 * esta actividad existe para terminar.
 *
 * @param hostUri  `Constants.expoConfig?.hostUri`, p. ej. `mi-host:8081`
 * @returns        `http://<host>:8080/api`, o `undefined` si no hay hostUri utilizable
 * @complexity     T: O(n), S: O(1)
 */
export const suggestApiBaseUrl = (hostUri: string | undefined): string | undefined => {
  const trimmed = hostUri?.trim();

  if (!trimmed) {
    return undefined;
  }

  const host = trimmed.split(':')[0];

  if (!host) {
    return undefined;
  }

  return `http://${host}:${BACKEND_DEV_PORT}/api`;
};

/**
 * Cuerpo común de los dos errores de configuración. No inventa ningún host: el ejemplo es un
 * marcador, no una IP que alguien pueda copiar y creer buena.
 */
const CONFIG_GUIDANCE = [
  '',
  'Es la única fuente de la URL del backend. Debe ser una URL http(s) absoluta que',
  'incluya el prefijo /api, sin barra final. Por ejemplo:',
  '',
  '  EXPO_PUBLIC_API_URL=http://<TU-IP-LAN>:8080/api',
  '',
  'Fíjala en NEXUSPROJECT/.env y arranca con `make front-run`.',
  'Si arrancas Expo a mano, expórtala antes en tu shell.',
  'Tras cambiarla, reinicia limpiando caché: npx expo start -c',
].join('\n');

/**
 * Monta el mensaje completo: cabecera propia de cada fallo, guía común y, si Expo sabe en qué
 * host corre, una sugerencia. La sugerencia se imprime; jamás se adopta como valor.
 *
 * @complexity T: O(n), S: O(n)
 */
const configErrorMessage = (headline: string, hint?: string): string => {
  const suggestion = suggestApiBaseUrl(hint);

  if (!suggestion) {
    return `${headline}\n${CONFIG_GUIDANCE}`;
  }

  return `${headline}\n${CONFIG_GUIDANCE}\n\nDetectado en esta máquina, probablemente quieras: ${suggestion}`;
};

/**
 * Normaliza y valida la base de la API.
 *
 * No lee `process.env` por dentro: recibe el valor por parámetro para poder probarse (Babel
 * inlinea las `EXPO_PUBLIC_*` en tiempo de bundle) y por inyección de dependencias.
 *
 * Falla ruidosamente y sin valor por defecto: un host presente pero equivocado es
 * indistinguible de un backend caído, y diagnosticarlo cuesta horas.
 *
 * @param raw   valor crudo de `EXPO_PUBLIC_API_URL`
 * @param hint  `Constants.expoConfig?.hostUri`, solo para enriquecer el mensaje de error
 * @returns     la base sin barra final
 * @throws      `Error` con instrucciones si el valor falta o no es una URL absoluta http(s)
 * @complexity  T: O(n), S: O(1)
 */
export const resolveApiBaseUrl = (raw: string | undefined, hint?: string): string => {
  const trimmed = raw?.trim();

  if (!trimmed) {
    throw new Error(configErrorMessage('EXPO_PUBLIC_API_URL no está definida.', hint));
  }

  if (!API_URL_SHAPE.test(trimmed)) {
    throw new Error(
      configErrorMessage(`EXPO_PUBLIC_API_URL no es una URL válida: "${trimmed}"`, hint),
    );
  }

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
};

/** Segmento `/api` como prefijo de ruta completo: seguido de `/` o de fin de cadena. */
const API_PREFIX = /\/api(?=\/|$)/;

/**
 * Reapunta una URL del backend a la base configurada, conservando todo lo que sigue a `/api`.
 *
 * Mitigación de cliente para las URLs absolutas que `LinkService` emite con su propio host
 * dentro. Si no encuentra el prefijo `/api`, devuelve la entrada intacta: una URL externa (un
 * CDN) o una que algún día venga bien formada no debe romperse al pasar por aquí.
 *
 * @param absoluteUrl  URL tal como la devuelve el backend
 * @param baseUrl      base configurada, con o sin barra final
 * @returns            la URL reapuntada, o `absoluteUrl` si no hay prefijo `/api`
 * @complexity         T: O(n), S: O(n)
 */
export const rebaseApiUrl = (absoluteUrl: string, baseUrl: string): string => {
  const match = API_PREFIX.exec(absoluteUrl);

  if (!match) {
    return absoluteUrl;
  }

  const suffix = absoluteUrl.slice(match.index + '/api'.length);
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  return `${base}${suffix}`;
};

/** Memo de la base ya resuelta: el mensaje de error se compone una sola vez. */
let resolvedBaseUrl: string | undefined;

/**
 * Resuelve la base la primera vez que alguien la pide, y la recuerda.
 *
 * `process.env.EXPO_PUBLIC_API_URL` se escribe aquí **completa y estática**: es la única forma
 * que Expo sustituye al empaquetar. Ni desestructurada (`const { EXPO_PUBLIC_API_URL } = ...`)
 * ni por índice (`process.env[k]`), que llegan como `undefined` en silencio.
 *
 * Se resuelve de forma perezosa y no en el cuerpo del módulo para que importar este fichero no
 * tenga efectos: así las funciones puras de arriba se pueden probar sin montar ningún entorno.
 * La app no nota la diferencia — `services/api.client.ts` lee `BASE_URL` al cargarse, de modo
 * que una variable ausente sigue reventando al arrancar, con el mensaje completo.
 *
 * No hay rama por `Platform.OS`. Web y móvil comparten un solo valor; para web se pone
 * `localhost` en la variable. Tener dos hosts por diseño era justo la causa de que ninguno de
 * los dos estuviera bien.
 *
 * @complexity T: O(n) la primera vez, O(1) después; S: O(1)
 */
const baseUrl = (): string => {
  if (resolvedBaseUrl === undefined) {
    resolvedBaseUrl = resolveApiBaseUrl(
      process.env.EXPO_PUBLIC_API_URL,
      Constants.expoConfig?.hostUri,
    );
  }

  return resolvedBaseUrl;
};

export const API_CONFIG = {
  get BASE_URL(): string {
    return baseUrl();
  },

  ENDPOINTS: {
    AUTH: {
      REGISTER: '/auth/register',
      LOGIN: '/auth/login',
      VERIFY_EMAIL: '/auth/verify-email',
      RESEND_VERIFICATION: '/auth/resend-verification',
      FORGOT_PASSWORD: '/auth/forgot-password',
      VERIFY_RESET_CODE: '/auth/verify-reset-code',
      RESEND_RESET_CODE: '/auth/resend-reset-code',
      RESET_PASSWORD: '/auth/reset-password',
      HEALTH: '/auth/health',
    },
    PROFILE: {
      UPDATE: '/profile/:userId',
      UPDATE_AVATAR: '/profile/:userId/avatar',
      GET_AVATAR: '/profile/:userId/avatar',
      DELETE_AVATAR: '/profile/:userId/avatar',
      DELETE: '/profile/:userId',
    },
    LINK: {
      GENERATE_CODE: '/link/generate/:userId',
      ESTABLISH_LINK: '/link/establish/:userId',
      GET_STATUS: '/link/status/:userId',
      DELETE_LINK: '/link/:userId',
    },
    PREFERENCES: {
      GET_STATUS: '/preferences/status/:userId',
      GET_CATEGORIES: '/preferences/categories',
      SAVE: '/preferences/:userId',
      GET_USER_PREFERENCES: '/preferences/:userId',
    },
    EVENTS: {
      CREATE: '/events/create/:userId',
      GET_USER_EVENTS: '/events/user/:userId',
      GET_PENDING_APPROVAL: '/events/user/:userId/pending-approval',
      APPROVE: '/events/:eventId/approve/:userId',
      REJECT: '/events/:eventId/reject/:userId',
      UPDATE: '/events/:eventId/user/:userId',
      DELETE: '/events/:eventId/user/:userId',
    },
    EXTERNAL_CALENDARS: {
      LINK: '/calendars/external/link/:userId',
      UNLINK: '/calendars/external/unlink/:userId/:deviceCalendarId',
      GET_USER_CALENDARS: '/calendars/external/:userId',
      UPDATE_SETTINGS: '/calendars/external/:userId/:deviceCalendarId',
      SYNC_EVENTS: '/calendars/external/sync/:userId',
      GET_EVENTS: '/calendars/external/events/:userId',
      GET_AVAILABILITY: '/calendars/external/availability/:userId',
      GET_MUTUAL_AVAILABILITY: '/calendars/external/mutual-availability',
      HEALTH: '/calendars/external/health',
    },
  },
  
  TIMEOUT: 30000, // 30 segundos para dar tiempo al envío de email
} as const;
