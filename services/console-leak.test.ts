/**
 * nexus-SEC-03 — verificacion automatizada de la Parte 2 del test de aceptacion.
 *
 * El test de aceptacion pedia mirar la consola del depurador a ojo mientras se escribe una
 * contrasena real. Esto hace lo mismo de forma repetible: conduce los mismos caminos de codigo
 * con centinelas irrepetibles, captura TODO lo que pasa por console.*, y afirma que ningun
 * centinela aparece.
 *
 * Cobertura frente al documento (.devs/aceptacion-2026-09-09-bloque0.md):
 *   2.1 iniciar sesion            -> login, exito y credenciales invalidas
 *   2.2 registro                  -> register (contrasena Y fecha de nacimiento)
 *   2.3 restablecer contrasena    -> forgotPassword + verifyResetCode + resetPassword
 *   2.4 baja de cuenta            -> deleteAccount (contrasena y correo, incluido deletedEmail)
 *   2.5 error de red              -> los cinco anteriores con el backend caido
 *
 * Lo que NO cubre: la consola nativa de un dispositivo. El codigo de logging es el mismo, pero
 * un `console.log` de React Native pasa por el puente nativo; esto corre sobre Node.
 */
import { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';

// `config/api.config.ts` (nexus-OPS-03) aborta la carga si esta variable no existe, asi que hay
// que fijarla ANTES de requerir api.client. Por eso los modulos se cargan con require perezoso:
// los import de ESM se izan por encima de cualquier asignacion.
process.env.EXPO_PUBLIC_API_URL = 'http://127.0.0.1:8080/api';

const apiClient: AxiosInstance = require('./api.client').default;
const { authService } = require('./auth.service');
const { profileService } = require('./profile.service');

// Centinelas: cadenas que no pueden aparecer por casualidad en ningun log.
const PASSWORD = 'Zx9-CENTINELA-PASSWORD-4f7a2b';
const NEW_PASSWORD = 'Qw3-CENTINELA-NUEVA-8c1d5e';
const BIRTHDATE = '1991-07-23';
const CODE = 'CENTINELA-CODIGO-931744';
const EMAIL = 'centinela-usuario@ejemplo-nexus.test';

const SECRETS = [PASSWORD, NEW_PASSWORD, CODE];
const PII = [BIRTHDATE, EMAIL];

let captured: string[] = [];
const realConsole = { ...console };
const realAdapter = apiClient.defaults.adapter;

/**
 * Sustituye el adapter de axios. Es lo que usaria `axios-mock-adapter`, pero sin dependencia
 * nueva: `.localsettings` exige aprobacion del dev para anadir paquetes.
 */
type Escenario =
  | { tipo: 'responde'; status: number; data: unknown }
  | { tipo: 'red' }
  | { tipo: 'timeout' };

let escenario: Escenario = { tipo: 'responde', status: 200, data: {} };

function instalarAdapter() {
  apiClient.defaults.adapter = ((config: any) => {
    const request = { __fake: true };
    if (escenario.tipo === 'red') {
      return Promise.reject(
        new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, request),
      );
    }
    if (escenario.tipo === 'timeout') {
      return Promise.reject(
        new AxiosError(
          `timeout of ${config.timeout}ms exceeded`,
          AxiosError.ECONNABORTED,
          config,
          request,
        ),
      );
    }
    const response = {
      data: escenario.data,
      status: escenario.status,
      statusText: escenario.status === 200 ? 'OK' : 'Error',
      headers: {},
      config,
      request,
    };
    if (escenario.status >= 400) {
      return Promise.reject(
        new AxiosError(
          `Request failed with status code ${escenario.status}`,
          AxiosError.ERR_BAD_REQUEST,
          config,
          request,
          response as any,
        ),
      );
    }
    return Promise.resolve(response as any);
  }) as any;
}

function responde(status: number, data: unknown) {
  escenario = { tipo: 'responde', status, data };
}
function errorDeRed() {
  escenario = { tipo: 'red' };
}
function timeout() {
  escenario = { tipo: 'timeout' };
}

/** Serializa un argumento de console.* como lo veria alguien leyendo el depurador. */
function render(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) {
    // Un Error de axios arrastra config.data: el cuerpo original de la peticion.
    return `${arg.message} ${arg.stack ?? ''} ${safeJson(arg)}`;
  }
  return safeJson(arg);
}

function safeJson(v: unknown): string {
  const seen = new WeakSet();
  try {
    return JSON.stringify(v, (_k, val) => {
      if (typeof val === 'object' && val !== null) {
        if (seen.has(val)) return '[circular]';
        seen.add(val);
      }
      return val;
    }) ?? String(v);
  } catch {
    return String(v);
  }
}

beforeAll(() => {
  (global as any).__DEV__ = true;
});

beforeEach(() => {
  captured = [];
  instalarAdapter();
  for (const level of ['log', 'info', 'warn', 'error', 'debug', 'trace'] as const) {
    jest.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      captured.push(args.map(render).join(' '));
    });
  }
});

afterEach(() => {
  apiClient.defaults.adapter = realAdapter;
  jest.restoreAllMocks();
  Object.assign(console, realConsole);
});

/** Falla nombrando el centinela y la linea culpable, no con un booleano pelado. */
function expectNoLeak(needles: string[], etiqueta: string) {
  const todo = captured.join('\n');
  for (const needle of needles) {
    const linea = captured.find((l) => l.includes(needle));
    if (linea) {
      throw new Error(
        `FUGA en ${etiqueta}: el centinela ${JSON.stringify(needle)} llego a la consola.\n` +
          `Linea: ${linea.slice(0, 400)}`,
      );
    }
  }
  expect(todo).not.toContain('__nunca__');
}

/** Registra las llamadas para poder afirmar que el camino se ejecuto de verdad. */
function expectSeEjecuto() {
  expect(captured.length).toBeGreaterThan(0);
}

describe('nexus-SEC-03 — ningun secreto llega a la consola', () => {
  describe('con el backend respondiendo', () => {
    it('2.1 · login', async () => {
      responde(200, { userId: 4, email: EMAIL, displayName: 'C' });
      await authService.login({ email: EMAIL, password: PASSWORD } as any);
      expectSeEjecuto();
      expectNoLeak(SECRETS, 'login (200)');
    });

    it('2.1 · login rechazado (credenciales invalidas)', async () => {
      responde(401, { status: 401, message: 'Credenciales invalidas' });
      const r = await authService.login({ email: EMAIL, password: PASSWORD } as any);
        expect(r.error).toBeDefined();
      expectSeEjecuto();
      expectNoLeak(SECRETS, 'login (401)');
    });

    it('2.2 · registro — contrasena y fecha de nacimiento', async () => {
      responde(200, { message: 'ok', email: EMAIL });
      await authService.register({
        email: EMAIL,
        password: PASSWORD,
        displayName: 'Centinela',
        birthDate: BIRTHDATE,
      } as any);
      expectSeEjecuto();
      expectNoLeak([...SECRETS, BIRTHDATE], 'register (200)');
    });

    it('2.3 · restablecer contrasena — codigo de un solo uso y contrasena nueva', async () => {
      responde(200, { message: 'ok', verified: true });

      await authService.forgotPassword({ email: EMAIL } as any);
      await authService.verifyResetCode({ email: EMAIL, code: CODE } as any);
      await authService.resetPassword({
        email: EMAIL,
        code: CODE,
        newPassword: NEW_PASSWORD,
      } as any);

      expectSeEjecuto();
      expectNoLeak(SECRETS, 'flujo de reseteo (200)');
    });

    it('2.4 · baja de cuenta — contrasena y el deletedEmail de la respuesta', async () => {
      responde(200, { message: 'Cuenta eliminada', deletedEmail: EMAIL });
      await profileService.deleteAccount(4, PASSWORD as any);
      expectSeEjecuto();
      expectNoLeak([...SECRETS, EMAIL], 'deleteAccount (200)');
    });
  });

  describe('2.5 · con el backend caido — el Error de axios arrastra config.data', () => {
    it('login', async () => {
      errorDeRed();
      const r = await authService.login({ email: EMAIL, password: PASSWORD } as any);
        expect(r.error).toBeDefined();
      expectSeEjecuto();
      expectNoLeak(SECRETS, 'login (network error)');
    });

    it('registro', async () => {
      errorDeRed();
      const r = await authService.register({
        email: EMAIL,
        password: PASSWORD,
        displayName: 'Centinela',
        birthDate: BIRTHDATE,
      } as any);
      expect(r.error).toBeDefined();
      expectSeEjecuto();
      expectNoLeak([...SECRETS, BIRTHDATE], 'register (network error)');
    });

    it('reseteo de contrasena', async () => {
      errorDeRed();
      const r = await authService.resetPassword({
        email: EMAIL,
        code: CODE,
        newPassword: NEW_PASSWORD,
      } as any);
      expect(r.error).toBeDefined();
      expectSeEjecuto();
      expectNoLeak(SECRETS, 'resetPassword (network error)');
    });

    it('baja de cuenta', async () => {
      errorDeRed();
      const r = await profileService.deleteAccount(4, PASSWORD as any);
      expect(r.error).toBeDefined();
      expectSeEjecuto();
      expectNoLeak(SECRETS, 'deleteAccount (network error)');
    });

    it('timeout', async () => {
      timeout();
      const r = await authService.login({ email: EMAIL, password: PASSWORD } as any);
        expect(r.error).toBeDefined();
      expectSeEjecuto();
      expectNoLeak(SECRETS, 'login (timeout)');
    });
  });

  it('control negativo: el arnes detecta una fuga de verdad', () => {
    console.log('payload enviado:', { email: EMAIL, password: PASSWORD });
    expect(() => expectNoLeak(SECRETS, 'control')).toThrow(/FUGA en control/);
  });

  it('el interceptor de respuesta desactiva la trampa: el llamador nunca ve config.data', async () => {
    errorDeRed();
    let recibido: unknown;
    try {
      await apiClient.post('/auth/login', { email: EMAIL, password: PASSWORD });
    } catch (e) {
      recibido = e;
      console.error('error completo:', e);
    }
    // El interceptor rechaza con un ErrorResponse plano, no con el AxiosError.
    expect(recibido).not.toBeInstanceOf(Error);
    expect((recibido as any).status).toBe(0);
    expectNoLeak(SECRETS, 'serializar el error recibido');
  });

  it('control negativo: el arnes SI detecta el AxiosError crudo, que es la trampa fina', () => {
    const crudo = new AxiosError('Network Error', 'ERR_NETWORK', {
      url: '/auth/login',
      data: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    } as any);
    console.error('error crudo:', crudo);
    expect(() => expectNoLeak(SECRETS, 'control-crudo')).toThrow(/FUGA en control-crudo/);
  });

  it('el correo sigue viajando en la query string de resendVerificationCode (fuera de alcance de SEC-03)', async () => {
    responde(200, { message: 'ok' });
    await authService.resendVerificationCode(EMAIL);
    const url = captured.find((l) => l.includes('resend-verification'));
    expect(url).toBeDefined();
    // Documenta el hueco que el propio commit de SEC-03 declaro pendiente.
    expect(url).toContain(encodeURIComponent(EMAIL));
    void PII;
  });
});
