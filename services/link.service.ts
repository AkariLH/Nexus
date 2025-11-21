import { API_CONFIG } from '../config/api.config';
import { apiClient } from './api.client';

export interface ApiResponse {
  success: boolean;
  message: string;
}

export interface UnlinkResponse extends ApiResponse {
  partnerName?: string;
  notificationSent?: boolean;
}

export interface LinkStatusResponse {
  hasActiveLink: boolean;
  partner?: {
    userId: number;
    displayName: string;
    nickname: string;
    linkedAt: string;
    profilePhoto?: string;
  };
}

export interface LinkCodeResponse {
  code: string;
  expiresAt: string;
  validityMinutes: number;
  message: string;
}

/**
 * Servicio para la gestión de vínculos
 */
const linkService = {
  /**
   * Generar un código de vínculo
   */
  generateCode: async (userId: number): Promise<LinkCodeResponse> => {
    const endpoint = API_CONFIG.ENDPOINTS.LINK.GENERATE_CODE.replace(':userId', userId.toString());
    const response = await apiClient.post(endpoint);
    return response.data;
  },

  /**
   * Establecer vínculo usando un código
   */
  establishLink: async (userId: number, code: string): Promise<LinkStatusResponse> => {
    const endpoint = API_CONFIG.ENDPOINTS.LINK.ESTABLISH_LINK.replace(':userId', userId.toString());
    const response = await apiClient.post(endpoint, { code });
    return response.data;
  },

  /**
   * Obtener el estado del vínculo del usuario
   */
  getLinkStatus: async (userId: number): Promise<LinkStatusResponse> => {
    const endpoint = API_CONFIG.ENDPOINTS.LINK.GET_STATUS.replace(':userId', userId.toString());
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  /**
   * Eliminar el vínculo activo del usuario
   * CU11 - Eliminación de vínculo
   */
  deleteLink: async (userId: number): Promise<UnlinkResponse> => {
    const endpoint = API_CONFIG.ENDPOINTS.LINK.DELETE_LINK.replace(':userId', userId.toString());
    const response = await apiClient.delete(endpoint);
    return response.data;
  },
};

export default linkService;
