import { API_CONFIG } from '../config/api.config';
import { apiClient } from './api.client';
import { CreateEventResponse } from './event.service';

export type ZoneType = 'NEAR_US' | 'BOROUGH' | 'NONE';
export type Scope = 'HOME' | 'CITY' | 'ANY';

/** CU36 - Lo que se pide. La ubicacion solo va con NEAR_US y el servidor no la guarda (RN-30). */
export interface RecommendationParams {
  zoneType: ZoneType;
  boroughCode?: string;
  lat?: number;
  lon?: number;
  scope: Scope;
  maxCostMxn: number;
  category?: string;
  slotStart: string;
  slotEnd: string;
}

/** Una tarjeta. Nunca trae datos de animo (RN-28) ni coordenadas. */
export interface RecommendationItem {
  id: number;
  activityId: number;
  title: string;
  category: string;
  categoryLabel: string;
  scope: 'HOME' | 'CITY';
  placeName?: string | null;
  boroughName?: string | null;
  durationMinutes: number;
  costPerPersonMxn: number;
  reason: string;
  reasonSource: string;
  startsAt: string;
  endsAt: string;
}

/** Las opciones que se ven ahora. Nunca dice cuantas quedan, solo si hay mas. */
export interface RecommendationBatch {
  requestId: number;
  items: RecommendationItem[];
  relaxedFilters: string[];
  selectionSource?: string | null;
  hasMore: boolean;
}

export interface DiscardResponse {
  replacement: RecommendationItem | null;
  hasMore: boolean;
}

export interface Borough {
  code: string;
  name: string;
}

const paths = API_CONFIG.ENDPOINTS.RECOMMENDATIONS;

const itemPath = (template: string, userId: number, recommendationId: number): string =>
  template.replace(':userId', String(userId)).replace(':recommendationId', String(recommendationId));

/**
 * RF-33 / RF-37 / RF-40 - Recomendaciones en la modalidad individual.
 */
const recommendationService = {
  getBoroughs: async (): Promise<Borough[]> => {
    const response = await apiClient.get(paths.BOROUGHS);
    return response.data;
  },

  /** Espera `API_CONFIG.RECOMMEND_TIMEOUT` (30 s salvo `EXPO_PUBLIC_RECOMMEND_TIMEOUT_MS`). */
  request: async (userId: number, params: RecommendationParams): Promise<RecommendationBatch> => {
    const response = await apiClient.post(paths.REQUEST.replace(':userId', String(userId)), params, {
      timeout: API_CONFIG.RECOMMEND_TIMEOUT,
    });
    return response.data;
  },

  /** "Buscar mas opciones": las siguientes ya guardadas; 409 cuando ya no hay. */
  more: async (userId: number, requestId: number): Promise<RecommendationBatch> => {
    const endpoint = paths.MORE.replace(':userId', String(userId)).replace(':requestId', String(requestId));
    const response = await apiClient.post(endpoint);
    return response.data;
  },

  discard: async (userId: number, recommendationId: number): Promise<DiscardResponse> => {
    const response = await apiClient.post(itemPath(paths.DISCARD, userId, recommendationId));
    return response.data;
  },

  /** Crea el evento PENDIENTE para la pareja (RN-16). */
  invite: async (userId: number, recommendationId: number): Promise<CreateEventResponse> => {
    const response = await apiClient.post(itemPath(paths.INVITE, userId, recommendationId));
    return response.data;
  },
};

export default recommendationService;
export { recommendationService };
