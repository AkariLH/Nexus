/** [ux-ajustes] D8 - Limpiar los avisos leidos. */
jest.mock('./api.client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

import { apiClient } from './api.client';
import appNotificationService from './appNotification.service';

const del = apiClient.delete as jest.Mock;

describe('appNotificationService.clearRead', () => {
  it('borra los leidos con DELETE /notifications/{id}/read y devuelve cuantos se fueron', async () => {
    del.mockResolvedValueOnce({ data: { removed: 8 } });

    await expect(appNotificationService.clearRead(4)).resolves.toBe(8);
    expect(del).toHaveBeenCalledWith('/notifications/4/read');
  });
});
