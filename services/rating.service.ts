import { API_CONFIG } from '../config/api.config';
import { apiClient } from './api.client';

/** CU42 - Cita que aun se puede calificar (Figma C12a). */
export interface PendingRating {
  eventId: number;
  title: string;
  startDateTime: string;
  endDateTime: string;
  location?: string | null;
  /** Fin de las 48 h para calificar (RN-36). */
  expiresAt: string;
}

/** Confirmacion; nunca trae el puntaje (RN-37). */
export interface RatingResult {
  eventId: number;
  ratedAt: string;
}

const paths = API_CONFIG.ENDPOINTS.RATINGS;

/** CU42 / RF-41 - Calificar la satisfaccion de una cita. */
const ratingService = {
  pending: async (userId: number): Promise<PendingRating[]> => {
    const response = await apiClient.get(paths.PENDING.replace(':userId', String(userId)));
    return response.data;
  },

  /** @param score 1 (muy mal) a 5 (muy bien) */
  rate: async (userId: number, eventId: number, score: number): Promise<RatingResult> => {
    const endpoint = paths.RATE.replace(':userId', String(userId)).replace(':eventId', String(eventId));
    const response = await apiClient.post(endpoint, { score });
    return response.data;
  },
};

export default ratingService;
