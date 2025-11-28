import apiClient from './api.client';
import type {
  PreferenceCategory,
  QuestionnaireStatus,
  UserPreference,
  SavePreferencesRequest,
  ApiResponse,
  ErrorResponse,
} from '../types/preferences.api.types';

export const preferenceService = {
  /**
   * Obtener todas las categorías con sus preferencias
   */
  getAllCategories: async (): Promise<ApiResponse<PreferenceCategory[]>> => {
    try {
      console.log('📤 Obteniendo todas las categorías de preferencias');
      const response = await apiClient.get<PreferenceCategory[]>('/preferences/categories');
      console.log('📥 Categorías recibidas:', response.data.length);
      return { data: response.data };
    } catch (error) {
      console.error('💥 Error obteniendo categorías:', error);
      return { error: error as ErrorResponse };
    }
  },

  /**
   * Verificar si el usuario completó el cuestionario
   */
  getQuestionnaireStatus: async (userId: number): Promise<ApiResponse<QuestionnaireStatus>> => {
    try {
      console.log('📤 Obteniendo estado del cuestionario para usuario:', userId);
      const response = await apiClient.get<QuestionnaireStatus>(
        `/preferences/status/${userId}`
      );
      console.log('📥 Estado recibido:', response.data);
      return { data: response.data };
    } catch (error) {
      console.error('💥 Error obteniendo estado del cuestionario:', error);
      return { error: error as ErrorResponse };
    }
  },

  /**
   * Obtener preferencias del usuario
   */
  getUserPreferences: async (userId: number): Promise<ApiResponse<UserPreference[]>> => {
    try {
      console.log('📤 Obteniendo preferencias del usuario:', userId);
      const response = await apiClient.get<UserPreference[]>(`/preferences/user/${userId}`);
      console.log('📥 Preferencias recibidas:', response.data.length);
      return { data: response.data };
    } catch (error) {
      console.error('💥 Error obteniendo preferencias del usuario:', error);
      return { error: error as ErrorResponse };
    }
  },

  /**
   * Guardar preferencias del usuario
   */
  savePreferences: async (
    userId: number,
    preferences: SavePreferencesRequest
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    try {
      console.log('📤 Guardando preferencias para usuario:', userId);
      console.log('📤 Total de preferencias:', preferences.preferences.length);
      const response = await apiClient.post<{ success: boolean; message: string }>(
        `/preferences/user/${userId}`,
        preferences
      );
      console.log('📥 Preferencias guardadas:', response.data);
      return { data: response.data };
    } catch (error) {
      console.error('💥 Error guardando preferencias:', error);
      return { error: error as ErrorResponse };
    }
  },
};

export default preferenceService;
