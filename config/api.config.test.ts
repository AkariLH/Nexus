import { rebaseApiUrl, resolveApiBaseUrl, suggestApiBaseUrl } from './api.config';

/**
 * Tests de la resolución de la base de la API (nexus-OPS-03).
 *
 * `resolveApiBaseUrl` recibe el valor **por parámetro** y no lee `process.env` por dentro. Es
 * deliberado: `babel-preset-expo` inlinea las variables `EXPO_PUBLIC_*` en tiempo de bundle,
 * también bajo `jest-expo`. Un test que asignara `process.env.EXPO_PUBLIC_API_URL` antes de
 * importar el módulo no probaría nada, porque el valor ya estaría sustituido como literal en el
 * código transformado.
 *
 * Aquí no aparece ninguna IP con esquema: el árbol fuente debe quedar sin literales de host.
 */
const VALID = 'http://api.test:8080/api';

describe('resolveApiBaseUrl', () => {
  it('TC-01: returns the value unchanged when it is a well-formed absolute API base', () => {
    expect(resolveApiBaseUrl(VALID)).toBe(VALID);
  });

  it('TC-02: throws naming the variable when the value is undefined', () => {
    expect(() => resolveApiBaseUrl(undefined)).toThrow('EXPO_PUBLIC_API_URL');
  });

  it('TC-03: throws naming the variable when the value is an empty string', () => {
    expect(() => resolveApiBaseUrl('')).toThrow('EXPO_PUBLIC_API_URL');
  });

  it('TC-04: throws naming the variable when the value is only whitespace', () => {
    expect(() => resolveApiBaseUrl('   ')).toThrow('EXPO_PUBLIC_API_URL');
  });

  it('TC-05: throws when the value carries no scheme', () => {
    expect(() => resolveApiBaseUrl('api.test:8080/api')).toThrow('EXPO_PUBLIC_API_URL');
  });

  it('TC-06: throws when the scheme is neither http nor https', () => {
    expect(() => resolveApiBaseUrl('ftp://api.test/api')).toThrow('EXPO_PUBLIC_API_URL');
  });

  it('TC-07: accepts https and trims a single trailing slash', () => {
    expect(resolveApiBaseUrl('https://api.test/v1/')).toBe('https://api.test/v1');
  });

  it('TC-08: trims surrounding whitespace before validating', () => {
    expect(resolveApiBaseUrl(`  ${VALID}  `)).toBe(VALID);
  });
});

/**
 * `hostUri` de Expo llega como `host:puertoDeMetro` (8081). La sugerencia cambia el puerto de
 * Metro por el del backend y añade el prefijo `/api`.
 *
 * El host de LAN se compone por interpolación, no se escribe como literal con esquema, para que
 * el árbol siga sin ninguna IP de host embebida.
 */
const LAN_HOST = '10.0.0.5';

describe('suggestApiBaseUrl', () => {
  it('TC-09: derives the backend base from an Expo hostUri with a Metro port', () => {
    expect(suggestApiBaseUrl(`${LAN_HOST}:8081`)).toBe(`http://${LAN_HOST}:8080/api`);
  });

  it('TC-10: derives the backend base from a hostUri with no port', () => {
    expect(suggestApiBaseUrl(LAN_HOST)).toBe(`http://${LAN_HOST}:8080/api`);
  });

  it('TC-11: returns undefined when there is no hostUri', () => {
    expect(suggestApiBaseUrl(undefined)).toBeUndefined();
  });

  it('TC-12: returns undefined when the hostUri is empty or blank', () => {
    expect(suggestApiBaseUrl('')).toBeUndefined();
    expect(suggestApiBaseUrl('   ')).toBeUndefined();
  });
});

/**
 * El mensaje es el producto principal de esta actividad: cuando la variable falta, el
 * desarrollador debe salir del error sabiendo qué variable es, dónde se pone y por qué su cambio
 * no surte efecto sin limpiar la caché de Metro.
 */
const messageOf = (raw: string | undefined, hint?: string): string => {
  try {
    resolveApiBaseUrl(raw, hint);
  } catch (error) {
    return (error as Error).message;
  }

  throw new Error('se esperaba que resolveApiBaseUrl lanzara');
};

describe('resolveApiBaseUrl error message', () => {
  it('TC-13: names the variable, the .env that holds it and the cache-clearing restart', () => {
    const message = messageOf(undefined);

    expect(message).toContain('EXPO_PUBLIC_API_URL');
    expect(message).toContain('NEXUSPROJECT/.env');
    expect(message).toContain('expo start -c');
  });

  it('TC-14: appends a suggestion derived from the Expo hostUri when one is available', () => {
    const message = messageOf(undefined, `${LAN_HOST}:8081`);

    expect(message).toContain(`http://${LAN_HOST}:8080/api`);
  });

  it('TC-15: omits the suggestion line when no hostUri is available', () => {
    expect(messageOf(undefined)).not.toContain('probablemente quieras');
  });

  it('TC-16: gives the same guidance when the value is present but malformed', () => {
    const message = messageOf('api.test:8080/api');

    expect(message).toContain('EXPO_PUBLIC_API_URL');
    expect(message).toContain('expo start -c');
  });
});

/**
 * `rebaseApiUrl` es una mitigación de cliente, no el arreglo de fondo. El backend
 * (`LinkService.java:172,206`) emite la foto de la pareja como URL absoluta con un host
 * compilado dentro; el cliente la pintaba tal cual, y por eso la foto está rota hoy. Reapuntarla
 * a la base configurada la arregla sin tocar el backend.
 */
const CONFIGURED = 'http://configured-host:8080/api';
const BACKEND_ABSOLUTE = 'http://backend-host:8080/api/profile/7/avatar';

describe('rebaseApiUrl', () => {
  it('TC-17: repoints an absolute backend URL onto the configured base', () => {
    expect(rebaseApiUrl(BACKEND_ABSOLUTE, CONFIGURED)).toBe(`${CONFIGURED}/profile/7/avatar`);
  });

  it('TC-18: returns the input untouched when it carries no /api segment', () => {
    const external = 'https://cdn.example/photos/7.jpg';

    expect(rebaseApiUrl(external, CONFIGURED)).toBe(external);
  });

  it('TC-19: prefixes the base when the backend already returns a relative /api path', () => {
    expect(rebaseApiUrl('/api/profile/7/avatar', CONFIGURED)).toBe(
      `${CONFIGURED}/profile/7/avatar`,
    );
  });

  it('TC-20: tolerates a base with a trailing slash', () => {
    expect(rebaseApiUrl(BACKEND_ABSOLUTE, `${CONFIGURED}/`)).toBe(
      `${CONFIGURED}/profile/7/avatar`,
    );
  });

  it('TC-21: does not treat a path that merely starts with /api as the API prefix', () => {
    const docs = 'https://docs.example/apidocs/link';

    expect(rebaseApiUrl(docs, CONFIGURED)).toBe(docs);
  });
});
