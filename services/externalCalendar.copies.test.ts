/** [sync-calendario] RF-21 / RF-22 - Copias de los eventos de Nexus en el calendario del telefono. */
jest.mock('./api.client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), delete: jest.fn(), patch: jest.fn() },
}));
jest.mock('./calendar.service', () => ({
  calendarService: {
    verifyCalendarExists: jest.fn(),
    eventExists: jest.fn(),
    getEventsFromCalendar: jest.fn(),
    createEventInExternalCalendar: jest.fn(),
    updateEventInExternalCalendar: jest.fn(),
    deleteEventFromExternalCalendar: jest.fn(),
  },
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn(),
}));

import { apiClient } from './api.client';
import { calendarService } from './calendar.service';
import { CopyItem, CopyPlan, externalCalendarIntegration } from './externalCalendar.integration.service';

const api = apiClient as unknown as Record<'get' | 'post' | 'delete', jest.Mock>;
const phone = calendarService as unknown as Record<string, jest.Mock>;

const item = (over: Partial<CopyItem> = {}): CopyItem => ({
  appEventId: 21,
  deviceEventId: null,
  title: 'Cena',
  start: '2026-11-07T02:00:00Z',
  end: '2026-11-07T04:00:00Z',
  allDay: false,
  location: 'Coyoacán',
  description: null,
  recurrencePattern: null,
  ...over,
});

const plan = (over: Partial<CopyPlan> = {}): CopyPlan => ({
  externalCalendarId: 1,
  deviceCalendarId: 'cal-1',
  create: [],
  update: [],
  remove: [],
  keep: [],
  ...over,
});

const registered = () => api.post.mock.calls.filter(([url]) => url === '/calendars/external/sync/13').map(([, body]) => body[0]);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  phone.verifyCalendarExists.mockResolvedValue(true);
  phone.eventExists.mockResolvedValue(true);
  phone.getEventsFromCalendar.mockResolvedValue([]);
  phone.createEventInExternalCalendar.mockResolvedValue('dev-new');
  phone.updateEventInExternalCalendar.mockResolvedValue(undefined);
  phone.deleteEventFromExternalCalendar.mockResolvedValue(undefined);
  api.post.mockResolvedValue({ data: { conflicts: [] } });
  api.delete.mockResolvedValue({});
});

describe('applyCopyPlan', () => {
  it('crea la copia y la registra como escrita por Nexus', async () => {
    const result = await externalCalendarIntegration.applyCopyPlan(13, plan({ create: [item({ recurrencePattern: 'FREQ=WEEKLY;BYDAY=SA' })] }));

    expect(result).toEqual({ created: 1, updated: 0, removed: 0 });
    expect(phone.createEventInExternalCalendar).toHaveBeenCalledWith('cal-1', expect.objectContaining({
      title: 'Cena',
      startDate: new Date('2026-11-07T02:00:00Z'),
      location: 'Coyoacán',
      allDay: false,
      recurrenceRule: { frequency: 'weekly', interval: 1, daysOfTheWeek: [{ dayOfTheWeek: 7 }] },
    }));
    expect(registered()).toEqual([expect.objectContaining({
      externalCalendarId: 1,
      deviceEventId: 'dev-new',
      appEventId: 21,
      fromNexus: true,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=SA',
    })]);
  });

  it('actualiza en su mismo evento del telefono', async () => {
    await externalCalendarIntegration.applyCopyPlan(13, plan({ update: [item({ deviceEventId: 'dev-21' })] }));

    expect(phone.updateEventInExternalCalendar).toHaveBeenCalledWith('dev-21', expect.objectContaining({ title: 'Cena', recurrenceRule: null }));
    expect(registered()).toEqual([expect.objectContaining({ deviceEventId: 'dev-21', fromNexus: true })]);
  });

  it('si el evento ya no esta en el telefono lo vuelve a crear y quita la copia vieja', async () => {
    phone.updateEventInExternalCalendar.mockRejectedValue(new Error('not found'));

    const result = await externalCalendarIntegration.applyCopyPlan(13, plan({ update: [item({ deviceEventId: 'dev-21' })] }));

    expect(result.updated).toBe(1);
    expect(api.delete).toHaveBeenCalledWith('/calendars/external/13/copies/1/dev-21');
    expect(registered()).toEqual([expect.objectContaining({ deviceEventId: 'dev-new' })]);
  });

  it('borra la copia del telefono y del backend', async () => {
    const result = await externalCalendarIntegration.applyCopyPlan(13, plan({ remove: [{ appEventId: 31, externalCalendarId: 2, deviceEventId: 'dev-31' }] }));

    expect(result.removed).toBe(1);
    expect(phone.deleteEventFromExternalCalendar).toHaveBeenCalledWith('dev-31');
    expect(api.delete).toHaveBeenCalledWith('/calendars/external/13/copies/2/dev-31');
  });

  it('si ya hay uno igual en el destino lo adopta en vez de crear otro (R3)', async () => {
    phone.getEventsFromCalendar.mockResolvedValue([
      { id: 'dev-orfano', title: ' Cena ', startDate: new Date('2026-11-07T02:00:30Z'), endDate: new Date('2026-11-07T04:00:00Z') },
    ]);

    await externalCalendarIntegration.applyCopyPlan(13, plan({ create: [item()] }));

    expect(phone.createEventInExternalCalendar).not.toHaveBeenCalled();
    expect(registered()).toEqual([expect.objectContaining({ deviceEventId: 'dev-orfano' })]);
  });

  it('un error en un evento no detiene los demas (R7)', async () => {
    phone.createEventInExternalCalendar.mockRejectedValueOnce(new Error('sin permiso')).mockResolvedValueOnce('dev-22');

    const result = await externalCalendarIntegration.applyCopyPlan(13, plan({ create: [item(), item({ appEventId: 22, title: 'Cine' })] }));

    expect(result.created).toBe(1);
    expect(registered()).toEqual([expect.objectContaining({ appEventId: 22, deviceEventId: 'dev-22' })]);
  });

  it('no hace nada si el calendario destino no esta en este telefono (R4)', async () => {
    phone.verifyCalendarExists.mockResolvedValue(false);

    const result = await externalCalendarIntegration.applyCopyPlan(13, plan({ create: [item()] }));

    expect(result).toEqual({ created: 0, updated: 0, removed: 0 });
    expect(phone.createEventInExternalCalendar).not.toHaveBeenCalled();
  });

  it('los de todo el dia van como todo el dia, con la fecha del dia (R5)', async () => {
    await externalCalendarIntegration.applyCopyPlan(13, plan({
      create: [item({ allDay: true, start: '2026-11-03T00:00:00Z', end: '2026-11-03T23:59:59.999Z' })],
    }));

    expect(phone.createEventInExternalCalendar).toHaveBeenCalledWith('cal-1', expect.objectContaining({
      allDay: true,
      startDate: new Date(2026, 10, 3),
      endDate: new Date(2026, 10, 3),
    }));
  });

  it('una copia al dia que ya no esta en el telefono se vuelve a crear (R2)', async () => {
    phone.eventExists.mockResolvedValue(false);

    const result = await externalCalendarIntegration.applyCopyPlan(13, plan({ keep: [item({ deviceEventId: 'dev-21' })] }));

    expect(result.created).toBe(1);
    expect(api.delete).toHaveBeenCalledWith('/calendars/external/13/copies/1/dev-21');
    expect(registered()).toEqual([expect.objectContaining({ deviceEventId: 'dev-new' })]);
  });
});

describe('performPeriodicSync', () => {
  beforeEach(() => {
    api.get.mockImplementation((url: string) =>
      url === '/calendars/external/13/copy-plan'
        ? Promise.resolve({ status: 200, data: plan({ create: [item()] }) })
        : Promise.resolve({ data: [{ id: 1, deviceCalendarId: 'cal-1', calendarName: 'Personal', syncEnabled: true, isActive: true }] }),
    );
  });

  it('primero trae el telefono y despues copia lo de Nexus', async () => {
    const order: string[] = [];
    phone.getEventsFromCalendar.mockImplementation(async () => { order.push('importar'); return []; });
    phone.createEventInExternalCalendar.mockImplementation(async () => { order.push('copiar'); return 'dev-new'; });

    const result = await externalCalendarIntegration.performPeriodicSync(13);

    expect(order[0]).toBe('importar');
    expect(order).toContain('copiar');
    expect(order.indexOf('copiar')).toBeGreaterThan(order.indexOf('importar'));
    expect(result.copied).toBe(1);
  });

  it('sin calendario destino (204) solo importa', async () => {
    api.get.mockImplementation((url: string) =>
      url === '/calendars/external/13/copy-plan'
        ? Promise.resolve({ status: 204, data: '' })
        : Promise.resolve({ data: [] }),
    );

    await expect(externalCalendarIntegration.performPeriodicSync(13)).resolves.toEqual({ conflicts: [], copied: 0 });
  });

  it('dos llamadas a la vez comparten una sola corrida', async () => {
    const [a, b] = await Promise.all([
      externalCalendarIntegration.performPeriodicSync(13),
      externalCalendarIntegration.performPeriodicSync(13),
    ]);

    expect(a).toBe(b);
    expect(api.get.mock.calls.filter(([url]) => url === '/calendars/external/13/copy-plan')).toHaveLength(1);
  });
});
