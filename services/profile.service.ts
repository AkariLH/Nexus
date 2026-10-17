import apiClient from './api.client';
import { API_CONFIG } from '../config/api.config';
import { bytesToDataUri } from '../utils/dataUri';
import type { 
  UpdateProfileRequest, 
  UpdateProfileResponse,
  ApiResponse 
} from '../types/auth.types';

export const profileService = {
  /**
   * Actualiza el perfil del usuario (CU05)
   */
  updateProfile: async (
    userId: number, 
    data: UpdateProfileRequest
  ): Promise<ApiResponse<UpdateProfileResponse>> => {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.PROFILE.UPDATE.replace(':userId', userId.toString());
      if (__DEV__) {
        console.log('📤 Actualizando perfil:', { userId, endpoint });
      }

      const response = await apiClient.put<UpdateProfileResponse>(endpoint, data);

      if (__DEV__) {
        console.log('✅ Perfil actualizado');
      }
      return { data: response.data };
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ Error al actualizar perfil:', error?.message);
      }

      if (error.response?.data) {
        return { error: error.response.data };
      }
      
      return {
        error: {
          status: 500,
          error: 'Error',
          message: error.message || 'Error al actualizar perfil',
          timestamp: new Date().toISOString(),
          path: '/profile'
        }
      };
    }
  },

  /**
   * Actualiza el avatar del usuario
   */
  updateAvatar: async (
    userId: number,
    imageBase64: string
  ): Promise<ApiResponse<{ success: boolean; message: string; avatarUrl: string }>> => {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.PROFILE.UPDATE_AVATAR.replace(':userId', userId.toString());
      if (__DEV__) {
        console.log('📤 Actualizando avatar:', { userId, endpoint });
      }

      const response = await apiClient.put(endpoint, { imageBase64 });

      if (__DEV__) {
        console.log('✅ Avatar actualizado');
      }
      return { data: response.data };
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ Error al actualizar avatar:', error?.message);
      }

      if (error.response?.data) {
        return { error: error.response.data };
      }
      
      return {
        error: {
          status: 500,
          error: 'Error',
          message: error.message || 'Error al actualizar avatar',
          timestamp: new Date().toISOString(),
          path: '/profile/avatar'
        }
      };
    }
  },

  /**
   * Obtiene la URL del avatar del usuario
   */
  getAvatarUrl: (userId: number): string => {
    return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROFILE.GET_AVATAR.replace(':userId', userId.toString())}`;
  },

  /**
   * Foto de perfil (propia o de la pareja vinculada) como data URI, o null si no tiene.
   * Va por apiClient porque la ruta exige sesion: un <Image uri> no manda el Authorization y el
   * servidor responde 401 (nexus-SEC-04).
   */
  fetchAvatar: async (userId: number): Promise<string | null> => {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.PROFILE.GET_AVATAR.replace(':userId', userId.toString());
      const response = await apiClient.get(endpoint, { responseType: 'arraybuffer' });
      const data = response.data as ArrayBuffer;
      if (!data || data.byteLength === 0) return null;
      const mime = String(response.headers?.['content-type'] ?? 'image/jpeg').split(';')[0];
      return bytesToDataUri(data, mime);
    } catch {
      return null;
    }
  },

  /**
   * Elimina el avatar del usuario
   */
  deleteAvatar: async (
    userId: number
  ): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.PROFILE.DELETE_AVATAR.replace(':userId', userId.toString());
      if (__DEV__) {
        console.log('📤 Eliminando avatar:', { userId, endpoint });
      }

      const response = await apiClient.delete(endpoint);

      if (__DEV__) {
        console.log('✅ Avatar eliminado');
      }
      return { data: response.data };
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ Error al eliminar avatar:', error?.message);
      }

      if (error.response?.data) {
        return { error: error.response.data };
      }
      
      return {
        error: {
          status: 500,
          error: 'Error',
          message: error.message || 'Error al eliminar avatar',
          timestamp: new Date().toISOString(),
          path: '/profile/avatar'
        }
      };
    }
  },

  /**
   * Elimina la cuenta del usuario (CU07)
   */
  deleteAccount: async (
    userId: number,
    password: string
  ): Promise<ApiResponse<{ message: string; deletedEmail: string }>> => {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.PROFILE.DELETE.replace(':userId', userId.toString());
      if (__DEV__) {
        console.log('📤 Eliminando cuenta:', { userId, endpoint });
      }

      const response = await apiClient.delete(endpoint, {
        data: { password }
      });

      if (__DEV__) {
        console.log('✅ Cuenta eliminada');
      }
      return { data: response.data };
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ Error al eliminar cuenta:', error?.message);
      }

      if (error.response?.data) {
        return { error: error.response.data };
      }
      
      return {
        error: {
          status: 500,
          error: 'Error',
          message: error.message || 'Error al eliminar cuenta',
          timestamp: new Date().toISOString(),
          path: '/profile'
        }
      };
    }
  },
};
