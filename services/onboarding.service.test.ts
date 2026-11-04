/** [primeros-pasos] P-09: el avance va por apiClient (con la sesión) a OnboardingController. */
jest.mock('./api.client', () => ({
  apiClient: { get: jest.fn() },
}));

import { apiClient } from './api.client';
import onboardingService from './onboarding.service';

const get = apiClient.get as jest.Mock;

describe('onboardingService', () => {
  it('pide el avance propio', async () => {
    const progress = {
      me: { questionnaire: true, linked: false, calendar: false, schedule: false },
      partner: null,
      couple: { firstRecommendation: false, firstRatedDate: false },
    };
    get.mockResolvedValue({ data: progress });

    await expect(onboardingService.getProgress(4)).resolves.toEqual(progress);
    expect(get).toHaveBeenCalledWith('/onboarding/4/progress');
  });
});
