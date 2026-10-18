import { reminderSchedule } from './eventReminders';
import type { EventResponse } from '../services/event.service';

const NOW = new Date(2026, 9, 18, 9, 0);

const event = (over: Partial<EventResponse>): EventResponse =>
  ({
    id: 1,
    title: 'Paseo en bicicleta',
    startDateTime: new Date(2026, 9, 21, 9, 5).toISOString(),
    endDateTime: new Date(2026, 9, 21, 11, 5).toISOString(),
    location: 'Coyoacán',
    status: 'CONFIRMED',
    creatorUserId: 13,
    linkId: 4,
    creatorApproved: true,
    partnerApproved: true,
    fullyApproved: true,
    createdAt: '',
    updatedAt: '',
    reminders: [{ minutesBefore: 10, label: '10 minutos antes' }],
    ...over,
  }) as EventResponse;

describe('reminderSchedule', () => {
  it('un aviso por recordatorio, a la hora correcta y con lo que hace falta saber', () => {
    expect(reminderSchedule([event({})], NOW)).toEqual([
      {
        key: '1-' + new Date(2026, 9, 21, 9, 5).getTime() + '-10',
        at: new Date(2026, 9, 21, 8, 55),
        title: 'Paseo en bicicleta',
        body: 'Empieza en 10 minutos · Coyoacán',
      },
    ]);
  });

  it('no programa avisos pasados, de eventos sin aprobar ni de mas de 14 dias', () => {
    const past = event({ id: 2, startDateTime: new Date(2026, 9, 18, 9, 5).toISOString() });
    const pending = event({ id: 3, fullyApproved: false });
    const far = event({ id: 4, startDateTime: new Date(2026, 10, 20, 9, 0).toISOString(),
      endDateTime: new Date(2026, 10, 20, 10, 0).toISOString() });
    expect(reminderSchedule([past, pending, far], NOW)).toEqual([]);
  });

  it('en eventos repetidos avisa en cada ocurrencia de los proximos 14 dias', () => {
    const weekly = event({
      id: 5,
      startDateTime: new Date(2026, 9, 19, 19, 0).toISOString(),
      endDateTime: new Date(2026, 9, 19, 20, 0).toISOString(),
      isRecurring: true,
      recurrencePattern: 'FREQ=WEEKLY;INTERVAL=1',
      reminders: [{ minutesBefore: 60, label: '1 hora antes' }],
    });
    const at = reminderSchedule([weekly], NOW).map((r) => r.at.getTime());
    expect(at).toEqual([new Date(2026, 9, 19, 18, 0).getTime(), new Date(2026, 9, 26, 18, 0).getTime()]);
    expect(reminderSchedule([weekly], NOW)[0].body).toBe('Empieza en 1 hora · Coyoacán');
  });
});
