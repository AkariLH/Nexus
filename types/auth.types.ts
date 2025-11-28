// Tipos para Autenticación

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  nickname: string;
  birthDate: string; // formato: "YYYY-MM-DD"
  termsAccepted: boolean;
}

export interface RegisterResponse {
  userId: number;
  email: string;
  displayName: string;
  nickname?: string;
  linkCode: string;
  emailConfirmed: boolean;
  createdAt: string;
  message: string;
}

export interface ErrorResponse {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
  validationErrors?: Record<string, string>;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  userId: number;
  email: string;
  displayName: string;
  nickname: string;
  emailConfirmed: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  userId?: number;
  email: string;
  displayName?: string;
  nickname?: string;
  linkCode?: string;
  emailConfirmed: boolean;
  token?: string;
  questionnaireCompleted?: boolean; // Flag para saber si completó el cuestionario
}

export interface ApiResponse<T> {
  data?: T;
  error?: ErrorResponse;
}

// Tipos para Perfil de Usuario

export interface UpdateProfileRequest {
  displayName: string;
  nickname?: string;
  email: string;
  birthDate: string; // formato: "YYYY-MM-DD"
}

export interface UpdateProfileResponse {
  userId: number;
  email: string;
  displayName: string;
  nickname?: string;
  emailConfirmed: boolean;
  emailChanged: boolean;
  message: string;
  updatedAt: string;
}
