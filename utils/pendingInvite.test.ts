/**
 * [reaprobar-edicion] En la campanita, el plan que falta aprobar dice quién lo mandó. Si la pareja
 * editó un plan que yo creé, me toca aprobarlo a mí: el nombre es el de la pareja, no el mío.
 */
import { inviteHeadline } from './pendingInvite';
import type { EventResponse } from '../services/event.service';

const plan = (over: Partial<EventResponse>) =>
  ({ id: 1, creatorUserId: 4, creatorName: 'Ana', partnerName: 'Luis', ...over }) as EventResponse;

it('un plan nuevo de la pareja: «Ana te invita a una cita»', () => {
  expect(inviteHeadline(plan({}), 9)).toEqual({ name: 'Ana', text: 'Ana te invita a una cita' });
});

it('mi plan que la pareja cambió: «Luis cambió un plan»', () => {
  expect(inviteHeadline(plan({}), 4)).toEqual({ name: 'Luis', text: 'Luis cambió un plan' });
});

it('sin nombres usa «Tu pareja»', () => {
  expect(inviteHeadline(plan({ creatorName: undefined, partnerName: undefined }), 4).name).toBe('Tu pareja');
});
