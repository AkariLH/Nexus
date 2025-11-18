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

export interface ApiResponse<T> {
  data?: T;
  error?: ErrorResponse;
}
