import { API_CONFIG } from '../config/api.config';
import { apiClient } from './api.client';

export interface IdeaResponse {
  id: number;
  title: string;
  description?: string;
  category: string;
  categoryLabel: string;
  atHome: boolean;
  outdoor: boolean;
  durationMinutes?: number;
  priceBand?: string;
  costPerPersonMxn?: number;
}

export interface IdeaCategory {
  code: string;
  label: string;
}

/**
 * RF-34 - Banco de ideas de citas. RN-29: el backend responde 403 si no hay vinculo activo.
 */
const ideaService = {
  getCategories: async (): Promise<IdeaCategory[]> => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.IDEAS.GET_CATEGORIES);
    return response.data;
  },

  getIdeas: async (userId: number, category?: string): Promise<IdeaResponse[]> => {
    const endpoint = API_CONFIG.ENDPOINTS.IDEAS.GET_IDEAS.replace(':userId', userId.toString());
    const response = await apiClient.get(endpoint, { params: category ? { category } : undefined });
    return response.data;
  },
};

export default ideaService;
export { ideaService };
