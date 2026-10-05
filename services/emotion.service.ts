import { API_CONFIG } from '../config/api.config';
import { apiClient } from './api.client';

/** Coordenadas del modelo circunflejo del afecto (2.7.1, Russell 1980): -1.0 a 1.0 en cada eje. */
export interface LogEmotionRequest {
  valence: number;
  activation: number;
  label?: string;
}

export interface EmotionLogResponse {
  id: number;
  valence: number;
  activation: number;
  label?: string;
  loggedAt: string;
}

/**
 * RF-31/RF-32 - Registro e historial de estado emocional. RN-28: privado, el backend ni siquiera
 * deja que la pareja vinculada lo lea (a diferencia del avatar de perfil).
 */
const emotionService = {
  logEmotion: async (userId: number, data: LogEmotionRequest): Promise<EmotionLogResponse> => {
    const endpoint = API_CONFIG.ENDPOINTS.EMOTIONS.LOG.replace(':userId', userId.toString());
    const response = await apiClient.post(endpoint, data);
    return response.data;
  },

  getHistory: async (userId: number): Promise<EmotionLogResponse[]> => {
    const endpoint = API_CONFIG.ENDPOINTS.EMOTIONS.GET_HISTORY.replace(':userId', userId.toString());
    const response = await apiClient.get(endpoint);
    return response.data;
  },
};

export default emotionService;
export { emotionService };
