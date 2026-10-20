/** CU42 - Calificar citas va siempre por apiClient (con la sesion) y usa las rutas de RatingController. */
jest.mock('./api.client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

import { apiClient } from './api.client';
import ratingService from './rating.service';

const get = apiClient.get as jest.Mock;
const post = apiClient.post as jest.Mock;

describe('ratingService (CU42)', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it('pide las citas por calificar de la persona', async () => {
    get.mockResolvedValue({ data: [{ eventId: 5, title: 'Cine' }] });

    await expect(ratingService.pending(4)).resolves.toEqual([{ eventId: 5, title: 'Cine' }]);
    expect(get).toHaveBeenCalledWith('/ratings/4/pending');
  });

  it('manda solo el puntaje de 1 a 5', async () => {
    post.mockResolvedValue({ data: { eventId: 5, ratedAt: '2026-10-19T18:00:00Z' } });

    await ratingService.rate(4, 5, 4);

    expect(post).toHaveBeenCalledWith('/ratings/4/events/5', { score: 4 });
  });
});
