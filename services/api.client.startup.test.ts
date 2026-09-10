/**
 * Fija la garantía de arranque de `nexus-OPS-03` R1 (nota N2 de la revisión).
 *
 * R1 exige que una `EXPO_PUBLIC_API_URL` ausente o malformada aborte **en la carga del módulo**,
 * no en la primera petición. `API_CONFIG.BASE_URL` es un getter perezoso —tuvo que serlo, porque
 * la forma ansiosa lanzaba al importar `api.config` y eso mataba la suite entera— así que la
 * garantía no vive en `api.config`: vive en que **algún módulo la fuerce al cargarse**.
 *
 * Hoy la fuerza `services/api.client.ts`, que lee `API_CONFIG.BASE_URL` dentro del
 * `axios.create` de nivel superior, y ese módulo entra en la cadena
 * `expo-router/entry` → `app/_layout.tsx` → `externalCalendar.integration.service` → aquí.
 *
 * Eso es frágil de una forma concreta: si alguien hiciera perezosa la creación del cliente axios
 * —moviéndola dentro de una función, por ejemplo— la app dejaría de abortar al arrancar y pasaría
 * a fallar en la primera petición, en silencio y sin que ningún test se pusiera rojo. Este
 * fichero es ese test.
 *
 * Bajo `jest-expo` la variable es una lectura en tiempo de ejecución de `process.env` (verificado
 * el 2026-09-09; ver la cabecera de `config/api.config.test.ts`), lo que permite manipularla
 * aquí. En el bundle real está inlineada, pero eso solo hace que el fallo sea aún más temprano.
 */

const VAR = 'EXPO_PUBLIC_API_URL';

describe('garantía de arranque: api.client fuerza la resolución al cargarse', () => {
  const original = process.env[VAR];

  afterEach(() => {
    if (original === undefined) {
      delete process.env[VAR];
    } else {
      process.env[VAR] = original;
    }
    jest.resetModules();
  });

  it('should throw while loading api.client when the variable is missing', () => {
    delete process.env[VAR];

    expect(() => {
      jest.isolateModules(() => {
        require('./api.client');
      });
    }).toThrow(new RegExp(VAR));
  });

  it('should throw while loading api.client when the variable is malformed', () => {
    process.env[VAR] = 'api.test:8080/api';

    expect(() => {
      jest.isolateModules(() => {
        require('./api.client');
      });
    }).toThrow(new RegExp(VAR));
  });

  it('should load api.client without throwing when the variable is well formed', () => {
    process.env[VAR] = 'http://api.test:8080/api';

    expect(() => {
      jest.isolateModules(() => {
        require('./api.client');
      });
    }).not.toThrow();
  });
});
