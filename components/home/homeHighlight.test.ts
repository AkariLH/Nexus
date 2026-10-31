import { homeHighlight } from './homeHighlight';
import type { EventResponse } from '../../services/event.service';
import type { FreeWindow } from '../../utils/freeProposals';

const now = new Date(2026, 9, 31, 12, 0);
const event = (over: Partial<EventResponse>): EventResponse =>
  ({
    id: 1,
    title: 'Cine al aire libre',
    startDateTime: new Date(2026, 10, 1, 17, 0).toISOString(),
    endDateTime: new Date(2026, 10, 1, 19, 0).toISOString(),
    status: 'CONFIRMED',
    fullyApproved: true,
    linkId: 6,
    ...over,
  }) as EventResponse;
const proposal: FreeWindow = { date: '2026-10-31', start: '19:00', end: '22:00', part: 'EVENING', minutes: 180 };

describe('homeHighlight ([libres-juntos] Figma K1)', () => {
  it('primero su proxima cita confirmada de los dos', () => {
    const later = event({ id: 2, startDateTime: new Date(2026, 10, 3, 17, 0).toISOString(), endDateTime: new Date(2026, 10, 3, 19, 0).toISOString() });
    expect(homeHighlight([later, event({})], [proposal], now)).toEqual({ kind: 'date', event: event({}) });
  });

  it('una cita pendiente, ya pasada o sin vinculo no cuenta', () => {
    const pending = event({ status: 'PENDING', fullyApproved: false });
    const past = event({ startDateTime: new Date(2026, 9, 30, 17, 0).toISOString(), endDateTime: new Date(2026, 9, 30, 19, 0).toISOString() });
    const personal = event({ linkId: null as any });
    expect(homeHighlight([pending, past, personal], [proposal], now)).toEqual({ kind: 'proposal', window: proposal });
  });

  it('sin cita, la mejor propuesta; sin propuestas, el aviso de que no coinciden', () => {
    expect(homeHighlight([], [proposal], now)).toEqual({ kind: 'proposal', window: proposal });
    expect(homeHighlight([], [], now)).toEqual({ kind: 'none' });
  });

  it('si no se pudo saber su tiempo libre no muestra nada', () => {
    expect(homeHighlight([], null, now)).toBeNull();
  });
});
