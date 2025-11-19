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
   * Verificar email con código de 6 dígitos
   */
  verifyEmail: async (data: VerifyEmailRequest): Promise<ApiResponse<VerifyEmailResponse>> => {
    try {
      console.log('📤 Enviando verificación de email:', data);
      const response = await apiClient.post<VerifyEmailResponse>(
        API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL,
        data
      );
      console.log('📥 Verificación exitosa:', response.data);
      return { data: response.data };
    } catch (error) {
      console.error('💥 Error en verificación:', error);
      return { error: error as ErrorResponse };
    }
  },

  /**
   * Reenviar código de verificación
   */
  resendVerificationCode: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      console.log('🔄 Reenviando código de verificación para:', email);
      const response = await apiClient.post<{ message: string }>(
        `${API_CONFIG.ENDPOINTS.AUTH.RESEND_VERIFICATION}?email=${encodeURIComponent(email)}`,
        null
      );
      console.log('✅ Código reenviado exitosamente');
      return { data: response.data };
    } catch (error) {
      console.error('💥 Error al reenviar código:', error);
      return { error: error as ErrorResponse };
    }
  },

  /**
   * Solicitar recuperación de contraseña
   */
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse<ForgotPasswordResponse>> => {
    try {
      console.log('🔑 Solicitando recuperación de contraseña para:', data.email);
      const response = await apiClient.post<ForgotPasswordResponse>(
        API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD,
        data
      );
      console.log('✅ Solicitud de recuperación enviada');
      return { data: response.data };
    } catch (error) {
      console.error('💥 Error en recuperación:', error);
      return { error: error as ErrorResponse };
    }
  },

  /**
   * Verificar código de recuperación antes de cambiar la contraseña
   */
  verifyResetCode: async (data: VerifyEmailRequest): Promise<ApiResponse<VerifyEmailResponse>> => {
    try {
      console.log('🔍 Verificando código de recuperación para:', data.email);
      const response = await apiClient.post<VerifyEmailResponse>(
        API_CONFIG.ENDPOINTS.AUTH.VERIFY_RESET_CODE,
        data
      );
      console.log('✅ Código de recuperación verificado');
      return { data: response.data };
    } catch (error) {
      console.error('💥 Error al verificar código:', error);
      return { error: error as ErrorResponse };
    }
  },

  /**
   * Reenviar código de recuperación de contraseña
   */
  resendResetCode: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    try {
      console.log('🔄 Reenviando código de recuperación para:', email);
      const response = await apiClient.post<{ message: string }>(
        `${API_CONFIG.ENDPOINTS.AUTH.RESEND_RESET_CODE}?email=${encodeURIComponent(email)}`,
        null
      );
      console.log('✅ Código de recuperación reenviado');
      return { data: response.data };
    } catch (error) {
      console.error('💥 Error al reenviar código:', error);
      return { error: error as ErrorResponse };
    }
  },

  /**
   * Restablecer contraseña con código
   */
  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse<ResetPasswordResponse>> => {
    try {
      console.log('🔐 Restableciendo contraseña para:', data.email);
      const response = await apiClient.post<ResetPasswordResponse>(
        API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD,
        data
      );
      console.log('✅ Contraseña restablecida exitosamente');
      return { data: response.data };
    } catch (error) {
      console.error('💥 Error al restablecer contraseña:', error);
      return { error: error as ErrorResponse };
    }
  },

  /**
   * Iniciar sesión
   */
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    try {
      console.log('🔐 Iniciando sesión para:', data.email);
      const response = await apiClient.post<LoginResponse>(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        data
      );
      console.log('✅ Inicio de sesión exitoso');
      return { data: response.data };
    } catch (error) {
      console.error('💥 Error en inicio de sesión:', error);
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
