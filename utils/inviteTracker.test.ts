jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadTracked, nextNotice, settle, trackInvite, TrackedInvite } from './inviteTracker';

const invite = (eventId: number, stage: TrackedInvite['stage'] = 'waiting'): TrackedInvite => ({
  eventId,
  title: 'Cine al aire libre',
  startsAt: '2026-10-17T00:00:00Z',
  endsAt: '2026-10-17T02:00:00Z',
  place: 'Coyoacán · Cineteca Nacional',
  costPerPersonMxn: 150,
  stage,
});

const event = (id: number, overrides: object = {}) =>
  ({ id, status: 'PENDING', fullyApproved: false, ...overrides }) as any;

describe('nextNotice', () => {
  it('primero avisa la invitacion recien enviada (A7)', () => {
    expect(nextNotice([invite(1), invite(2, 'sent')], [event(1, { fullyApproved: true })])).toEqual({
      kind: 'sent',
      invite: invite(2, 'sent'),
    });
  });

  it('avisa cuando la pareja acepto (A8)', () => {
    expect(nextNotice([invite(1)], [event(1, { status: 'CONFIRMED', fullyApproved: true })])).toEqual({
      kind: 'accepted',
      invite: invite(1),
    });
  });

  it('avisa cuando la pareja rechazo (A9)', () => {
    expect(nextNotice([invite(1)], [event(1, { status: 'REJECTED' })])).toEqual({
      kind: 'rejected',
      invite: invite(1),
    });
  });

  it('el evento borrado se olvida sin aviso', () => {
    expect(nextNotice([invite(1)], [])).toEqual({ kind: 'gone', invite: invite(1) });
  });

  it('nada que decir mientras sigue pendiente', () => {
    expect(nextNotice([invite(1)], [event(1)])).toBeNull();
    expect(nextNotice([], [event(1)])).toBeNull();
  });
});

describe('almacenamiento por usuario', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('guarda la invitacion como recien enviada', async () => {
    const { stage, ...rest } = invite(5);
    await trackInvite(4, rest);

    expect(await loadTracked(4)).toEqual([invite(5, 'sent')]);
    expect(await loadTracked(8)).toEqual([]);
  });

  it('al cerrar el aviso de enviada pasa a esperar; los demas avisos la quitan', async () => {
    const { stage, ...rest } = invite(5);
    await trackInvite(4, rest);

    await settle(4, 5, 'sent');
    expect(await loadTracked(4)).toEqual([invite(5, 'waiting')]);

    await settle(4, 5, 'accepted');
    expect(await loadTracked(4)).toEqual([]);
  });

  it('un valor danado se trata como vacio', async () => {
    await AsyncStorage.setItem('@nexus_sent_invites:4', 'no-es-json');

    expect(await loadTracked(4)).toEqual([]);
  });
});
