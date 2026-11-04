import { API_CONFIG } from '../config/api.config';
import { apiClient } from './api.client';

/**
 * [primeros-pasos] Avance de los hitos de la primera configuración (OnboardingController).
 * De la pareja solo llega su nombre y sí/no; `partner` es null sin vínculo.
 */
export interface OnboardingProgress {
  me: { questionnaire: boolean; linked: boolean; calendar: boolean; schedule: boolean };
  partner: { name: string; questionnaire: boolean; calendar: boolean; schedule: boolean } | null;
  couple: { firstRecommendation: boolean; firstRatedDate: boolean };
}

const onboardingService = {
  getProgress: async (userId: number): Promise<OnboardingProgress> => {
    const response = await apiClient.get(
      API_CONFIG.ENDPOINTS.ONBOARDING.PROGRESS.replace(':userId', String(userId)),
    );
    return response.data;
  },
};

export default onboardingService;
