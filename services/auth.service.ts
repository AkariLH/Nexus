import apiClient from './api.client';
import { API_CONFIG } from '../config/api.config';
import type {
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  LoginRequest,
  LoginResponse,
  ApiResponse,
  ErrorResponse,
} from '../types/auth.types';

export const authService = {
  /**
   * Registrar un nuevo usuario
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> => {
    try {
      const response = await apiClient.post<RegisterResponse>(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER,
        data
      );
      if (__DEV__) {
        console.log('📥 Respuesta recibida en authService:', response.status);
      }
      return { data: response.data };
    } catch (error) {
      if (__DEV__) {
        console.error('💥 Error capturado en authService:', (error as ErrorResponse)?.message);
      }
      return { error: error as ErrorResponse };
    }
  },

  /**
   * Verificar email con código de 6 dígitos
   */
  verifyEmail: async (data: VerifyEmailRequest): Promise<ApiResponse<VerifyEmailResponse>> => {
    try {
      const response = await apiClient.post<VerifyEmailResponse>(
        API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL,
        data
      );
      if (__DEV__) {
        console.log('📥 Verificación exitosa');
      }
      return { data: response.data };
    } catch (error) {
      if (__DEV__) {
        console.error('💥 Error en verificación:', (error as ErrorResponse)?.message);
      }
      return { error: error as ErrorResponse };
    }
  },

  /**
   * Reenviar código de verificación
   */
  resendVerificationCode: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await apiClient.post<{ message: string }>(
        `${API_CONFIG.ENDPOINTS.AUTH.RESEND_VERIFICATION}?email=${encodeURIComponent(email)}`,
        null
      );
      if (__DEV__) {
        console.log('✅ Código reenviado exitosamente');
      }
      return { data: response.data };
    } catch (error) {
      if (__DEV__) {
        console.error('💥 Error al reenviar código:', (error as ErrorResponse)?.message);
      }
      return { error: error as ErrorResponse };
    }
  },

  /**
   * Solicitar recuperación de contraseña
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse<ForgotPasswordResponse>> => {
    try {
      const response = await apiClient.post<ForgotPasswordResponse>(
        API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD,
        data
      );
      if (__DEV__) {
        console.log('✅ Solicitud de recuperación enviada');
      }
      return { data: response.data };
    } catch (error) {
      if (__DEV__) {
        console.error('💥 Error en recuperación:', (error as ErrorResponse)?.message);
      }
      return { error: error as ErrorResponse };
    }
  },

  /**
   * Verificar código de recuperación antes de cambiar la contraseña
   */
  verifyResetCode: async (data: VerifyEmailRequest): Promise<ApiResponse<VerifyEmailResponse>> => {
    try {
      const response = await apiClient.post<VerifyEmailResponse>(
        API_CONFIG.ENDPOINTS.AUTH.VERIFY_RESET_CODE,
        data
      );
      if (__DEV__) {
        console.log('✅ Código de recuperación verificado');
      }
      return { data: response.data };
    } catch (error) {
      if (__DEV__) {
        console.error('💥 Error al verificar código:', (error as ErrorResponse)?.message);
      }
      return { error: error as ErrorResponse };
    }
  },

  /**
   * Reenviar código de recuperación de contraseña
   */
  resendResetCode: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await apiClient.post<{ message: string }>(
        `${API_CONFIG.ENDPOINTS.AUTH.RESEND_RESET_CODE}?email=${encodeURIComponent(email)}`,
        null
      );
      if (__DEV__) {
        console.log('✅ Código de recuperación reenviado');
      }
      return { data: response.data };
    } catch (error) {
      if (__DEV__) {
        console.error('💥 Error al reenviar código:', (error as ErrorResponse)?.message);
      }
      return { error: error as ErrorResponse };
    }
  },

  /**
   * Restablecer contraseña con código
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse<ResetPasswordResponse>> => {
    try {
      const response = await apiClient.post<ResetPasswordResponse>(
        API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD,
        data
      );
      if (__DEV__) {
        console.log('✅ Contraseña restablecida exitosamente');
      }
      return { data: response.data };
    } catch (error) {
      if (__DEV__) {
        console.error('💥 Error al restablecer contraseña:', (error as ErrorResponse)?.message);
      }
      return { error: error as ErrorResponse };
    }
  },

  /**
   * Iniciar sesión
   */
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await apiClient.post<LoginResponse>(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        data
      );
      if (__DEV__) {
        console.log('✅ Inicio de sesión exitoso');
      }
      return { data: response.data };
    } catch (error) {
      if (__DEV__) {
        console.error('💥 Error en inicio de sesión:', (error as ErrorResponse)?.message);
      }
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
