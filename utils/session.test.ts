import { isSessionExpired, notifySessionExpired, onSessionExpired } from './session';

/** JWT de prueba (sin firma real): solo importa el `exp` del cuerpo. */
function jwtExpiringAt(epochSeconds: number): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256' })}.${encode({ sub: '4', exp: epochSeconds })}.firma`;
}

const NOW_MS = Date.parse('2026-10-09T12:00:00Z');
const NOW_S = NOW_MS / 1000;

describe('session — vigencia', () => {
  it('considers a session whose expiry is in the future as valid', () => {
    expect(isSessionExpired(jwtExpiringAt(NOW_S + 3600), NOW_MS)).toBe(false);
  });

  it('considers a session whose expiry already passed as expired', () => {
    expect(isSessionExpired(jwtExpiringAt(NOW_S - 1), NOW_MS)).toBe(true);
  });

  it('considers a session expired at the exact expiry instant', () => {
    expect(isSessionExpired(jwtExpiringAt(NOW_S), NOW_MS)).toBe(true);
  });

  it('treats anything that is not a readable JWT as expired', () => {
    expect(isSessionExpired('abc.def.ghi', NOW_MS)).toBe(true);
    expect(isSessionExpired('', NOW_MS)).toBe(true);
  });
});

describe('session — aviso de sesion vencida', () => {
  it('tells every subscriber when the server rejects the session', () => {
    const first = jest.fn();
    const second = jest.fn();
    const offFirst = onSessionExpired(first);
    const offSecond = onSessionExpired(second);

    notifySessionExpired();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    offFirst();
    offSecond();
  });

  it('stops telling a subscriber once it unsubscribes', () => {
    const listener = jest.fn();
    const off = onSessionExpired(listener);
    off();

    notifySessionExpired();

    expect(listener).not.toHaveBeenCalled();
  });
});
