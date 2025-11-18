import apiClient from './api.client';
import { API_CONFIG } from '../config/api.config';
import type {
  RegisterRequest,
  RegisterResponse,
  ApiResponse,
  ErrorResponse,
} from '../types/auth.types';

export const authService = {
  /**
   * Registrar un nuevo usuario
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> => {
    try {
      console.log('📤 Enviando registro:', data);
      const response = await apiClient.post<RegisterResponse>(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER,
        data
      );
      console.log('📥 Respuesta recibida en authService:', response.status);
      console.log('📥 Data recibida:', response.data);
      return { data: response.data };
    } catch (error) {
      console.error('💥 Error capturado en authService:', error);
      return { error: error as ErrorResponse };
    }
  },

  /**
   * Verificar estado del servidor
   */
  healthCheck: async (): Promise<ApiResponse<string>> => {
    try {
      const response = await apiClient.get<string>(
        API_CONFIG.ENDPOINTS.AUTH.HEALTH
      );
      return { data: response.data };
    } catch (error) {
      return { error: error as ErrorResponse };
    }
  },
};
