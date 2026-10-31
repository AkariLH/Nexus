/** RF-38 / RF-39 - La planeacion en pareja va por apiClient con las rutas de PlanningController. */
jest.mock('./api.client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

import { apiClient } from './api.client';
import planningService from './planning.service';
import appNotificationService from './appNotification.service';

const get = apiClient.get as jest.Mock;
const post = apiClient.post as jest.Mock;
const put = apiClient.put as jest.Mock;

describe('planningService', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    put.mockReset();
    post.mockResolvedValue({ data: { id: 50 } });
  });

  it('[libres-juntos] invita con un horario ya elegido', async () => {
    await planningService.invite(4, { slotStart: '2026-11-01T01:00:00.000Z', slotEnd: '2026-11-01T04:00:00.000Z' });
    expect(post).toHaveBeenCalledWith('/planning/4/invite', {
      slotStart: '2026-11-01T01:00:00.000Z',
      slotEnd: '2026-11-01T04:00:00.000Z',
    });
  });

  it('invita y consulta la planeacion actual (204 = ninguna)', async () => {
    await planningService.invite(4);
    expect(post).toHaveBeenCalledWith('/planning/4/invite');

    get.mockResolvedValueOnce({ status: 204, data: '' });
    await expect(planningService.current(4)).resolves.toBeNull();
    get.mockResolvedValueOnce({ status: 200, data: { id: 50 } });
    await expect(planningService.current(4)).resolves.toEqual({ id: 50 });
    expect(get).toHaveBeenCalledWith('/planning/4/current');
  });

  it('usa la ruta de la sesion para cada accion', async () => {
    put.mockResolvedValue({ data: {} });
    await planningService.accept(4, 50);
    await planningService.updateFilters(4, 50, { maxCostMxn: 1500 });
    await planningService.ready(4, 50, { lat: 19.4, lon: -99.1 });
    await planningService.vote(4, 50, 101, 'LIKE');
    await planningService.propose(4, 50, 101);
    await planningService.acceptProposal(4, 50);

    expect(post).toHaveBeenCalledWith('/planning/4/50/accept');
    expect(put).toHaveBeenCalledWith('/planning/4/50/filters', { maxCostMxn: 1500 });
    expect(post).toHaveBeenCalledWith('/planning/4/50/ready', { lat: 19.4, lon: -99.1 });
    expect(post).toHaveBeenCalledWith('/planning/4/50/options/101/vote', { vote: 'LIKE' });
    expect(post).toHaveBeenCalledWith('/planning/4/50/options/101/propose');
    expect(post).toHaveBeenCalledWith('/planning/4/50/proposal/accept');
  });

  it('listo sin ubicacion manda un cuerpo vacio', async () => {
    await planningService.ready(4, 50);
    expect(post).toHaveBeenCalledWith('/planning/4/50/ready', {});
  });

  it('mensajes y avisos', async () => {
    get.mockResolvedValue({ data: [] });
    await planningService.messages(4, 50);
    await planningService.send(4, 50, 'hola');
    await appNotificationService.list(4);
    await appNotificationService.markAllRead(4);

    expect(get).toHaveBeenCalledWith('/planning/4/50/messages');
    expect(post).toHaveBeenCalledWith('/planning/4/50/messages', { body: 'hola' });
    expect(get).toHaveBeenCalledWith('/notifications/4');
    expect(post).toHaveBeenCalledWith('/notifications/4/read');
  });
});
