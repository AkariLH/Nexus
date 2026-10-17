/**
 * F4 - Las recomendaciones (RF-37/RF-40) van siempre por apiClient, que adjunta la sesion, y usan
 * las rutas de RecommendationController (ola 4').
 */
jest.mock('./api.client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

import { apiClient } from './api.client';
import recommendationService, { RecommendationParams } from './recommendation.service';

const get = apiClient.get as jest.Mock;
const post = apiClient.post as jest.Mock;

const params: RecommendationParams = {
  zoneType: 'BOROUGH',
  boroughCode: 'COY',
  scope: 'ANY',
  maxCostMxn: 1500,
  slotStart: '2026-10-17T00:00:00.000Z',
  slotEnd: '2026-10-17T03:00:00.000Z',
};

describe('recommendationService (F4)', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it('pide las alcaldias', async () => {
    get.mockResolvedValue({ data: [{ code: 'COY', name: 'Coyoacán' }] });

    await expect(recommendationService.getBoroughs()).resolves.toEqual([{ code: 'COY', name: 'Coyoacán' }]);
    expect(get).toHaveBeenCalledWith('/recommendations/boroughs');
  });

  it('pide recomendaciones con los parametros cerrados', async () => {
    post.mockResolvedValue({ data: { requestId: 9, items: [], relaxedFilters: [], hasMore: true } });

    const batch = await recommendationService.request(4, params);

    expect(post).toHaveBeenCalledWith('/recommendations/4', params);
    expect(batch.requestId).toBe(9);
  });

  it('busca mas opciones de la misma solicitud', async () => {
    post.mockResolvedValue({ data: { requestId: 9, items: [], relaxedFilters: [], hasMore: false } });

    await recommendationService.more(4, 9);

    expect(post).toHaveBeenCalledWith('/recommendations/4/requests/9/more');
  });

  it('descarta una opcion', async () => {
    post.mockResolvedValue({ data: { replacement: null, hasMore: false } });

    await expect(recommendationService.discard(4, 31)).resolves.toEqual({ replacement: null, hasMore: false });
    expect(post).toHaveBeenCalledWith('/recommendations/4/items/31/discard');
  });

  it('envia una opcion como invitacion', async () => {
    post.mockResolvedValue({ data: { success: true, event: { id: 70 } } });

    const response = await recommendationService.invite(4, 31);

    expect(post).toHaveBeenCalledWith('/recommendations/4/items/31/invite');
    expect(response.event.id).toBe(70);
  });
});
