import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../config/api.config';
import type { ErrorResponse } from '../types/auth.types';
import { getAuthToken } from '../utils/authToken';

// Crear instancia de axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests - agregar token si existe
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (__DEV__) {
      console.log('🚀 Haciendo petición a:', `${config.baseURL || ''}${config.url || ''}`);
      console.log('🚀 Método:', config.method);
    }
    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error('❌ Error en request interceptor:', error?.message);
    }
    return Promise.reject(error);
  }
);

// Interceptor para responses - manejo de errores
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log('✅ Respuesta exitosa:', response.status, response.statusText);
    }
    return response;
  },
  (error: any) => {
    if (__DEV__) {
      console.error('❌ Error interceptado:', error.message);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error response:', error.response?.status, error.response?.statusText);
      console.error('❌ Error request:', error.request ? 'Request was made' : 'No request');
    }
    // Formatear error para que sea más fácil de usar
    if (error.response) {
      // El servidor respondió con un error
      const errorData: ErrorResponse = error.response.data || {
        status: error.response.status,
        error: 'Error',
        message: error.message || 'Ocurrió un error inesperado',
        timestamp: new Date().toISOString(),
        path: error.config?.url || '',
      };
      return Promise.reject(errorData);
    } else if (error.request) {
      // La petición fue hecha pero no hubo respuesta
      const networkError: ErrorResponse = {
        status: 0,
        error: 'Network Error',
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        timestamp: new Date().toISOString(),
        path: error.config?.url || '',
      };
      return Promise.reject(networkError);
    } else {
      // Algo pasó al configurar la petición
      const unknownError: ErrorResponse = {
        status: 0,
        error: 'Unknown Error',
        message: error.message || 'Ocurrió un error inesperado',
        timestamp: new Date().toISOString(),
        path: '',
      };
      return Promise.reject(unknownError);
    }
  }
);

export default apiClient;
export { apiClient };
