import { bellCount, groupNotices, isPastInvite, splitInvites } from './noticeFormat';
import type { AppNotification } from '../services/appNotification.service';
import type { EventResponse } from '../services/event.service';

// Viernes 31 de octubre de 2026, 12:00.
const NOW = new Date(2026, 9, 31, 12, 0);

const invite = (start: Date, end: Date): EventResponse =>
  ({
    id: 1,
    title: 'Noche de boliche',
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
    location: 'Bol Polanco',
    status: 'PENDING',
    creatorUserId: 2,
    linkId: 1,
    creatorApproved: true,
    partnerApproved: false,
    fullyApproved: false,
  }) as EventResponse;

const notice = (id: number, over: Partial<AppNotification> = {}): AppNotification => ({
  id,
  type: 'FREE_TIME',
  title: 'Esta semana tienen tiempo juntos',
  body: 'El sábado tienen 4 horas. ¿Planeamos algo?',
  createdAt: new Date(2026, 9, 31, 9, id).toISOString(),
  read: true,
  ...over,
});

describe('isPastInvite (D1)', () => {
  it('terminó hace un minuto: ya pasó', () => {
    expect(isPastInvite(invite(new Date(2026, 9, 31, 10, 0), new Date(2026, 9, 31, 11, 59)), NOW)).toBe(true);
  });

  it('termina en un minuto o está en curso: todavía no', () => {
    expect(isPastInvite(invite(new Date(2026, 9, 31, 11, 0), new Date(2026, 9, 31, 12, 1)), NOW)).toBe(false);
    expect(isPastInvite(invite(new Date(2026, 9, 31, 18, 0), new Date(2026, 9, 31, 20, 0)), NOW)).toBe(false);
  });
});

describe('groupNotices (D2)', () => {
  it('junta tres iguales seguidos en uno con ×3 y la hora del más reciente', () => {
    // La lista llega del más reciente al más viejo.
    const list = [notice(3), notice(2), notice(1)];
    expect(groupNotices(list)).toEqual([{ notice: list[0], count: 3 }]);
  });

  it('no junta iguales separados por otro aviso', () => {
    const other = notice(2, { type: 'MATCH', title: '¡Coinciden!', body: 'A los dos les gusta "Cine".' });
    const list = [notice(3), other, notice(1)];
    expect(groupNotices(list).map((g) => g.count)).toEqual([1, 1, 1]);
  });

  it('[pulido-critica] D2: los de libres juntos se juntan aunque cambie el texto; queda el más reciente', () => {
    const list = [notice(2), notice(1, { body: 'El domingo tienen 2 horas. ¿Planeamos algo?' })];
    expect(groupNotices(list)).toEqual([{ notice: list[0], count: 2 }]);
  });

  it('[pulido-critica] D2: los recordatorios también se reemplazan', () => {
    const list = [notice(2, { type: 'REMINDER', title: 'Les quedan 1 hora' }), notice(1, { type: 'REMINDER', title: 'Les quedan 6 horas' })];
    expect(groupNotices(list).map((g) => g.count)).toEqual([2]);
  });

  it('otros tipos con distinto texto no se juntan', () => {
    const match = (id: number, body: string) => notice(id, { type: 'MATCH', title: '¡Coinciden!', body });
    const list = [match(2, 'A los dos les late "Cine".'), match(1, 'A los dos les late "Picnic".')];
    expect(groupNotices(list).map((g) => g.count)).toEqual([1, 1]);
  });

  it('lista vacía', () => {
    expect(groupNotices([])).toEqual([]);
  });
});

describe('bellCount (D1)', () => {
  it('no cuenta las invitaciones que ya pasaron', () => {
    const past = invite(new Date(2026, 9, 28, 20, 0), new Date(2026, 9, 28, 22, 0));
    const next = invite(new Date(2026, 10, 1, 20, 0), new Date(2026, 10, 1, 22, 0));
    expect(bellCount([past, next], 2, NOW)).toBe(3);
    expect(bellCount([past], 0, NOW)).toBe(0);
  });
});

describe('splitInvites ([pulido-critica] D2)', () => {
  it('separa las invitaciones abiertas de las que ya pasaron', () => {
    const past = invite(new Date(2026, 9, 28, 20, 0), new Date(2026, 9, 28, 22, 0));
    const next = invite(new Date(2026, 10, 1, 20, 0), new Date(2026, 10, 1, 22, 0));
    expect(splitInvites([past, next], NOW)).toEqual({ open: [next], past: [past] });
    expect(splitInvites([], NOW)).toEqual({ open: [], past: [] });
  });
});
