/**
 * Types for Preference Questionnaire API
 */

export interface PreferenceCategory {
  id: number;
  name: string;
  description: string;
  preferences: Preference[];
}

export interface Preference {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  categoryName: string;
}

export interface UserPreference {
  preferenceId: number;
  preferenceName: string;
  categoryName: string;
  level: number; // 0-100
  notes?: string;
}

// Tipo extendido con información completa (para respuestas detalladas)
export interface UserPreferenceDetailed {
  id: number;
  preference: {
    id: number;
    name: string;
    category: {
      id: number;
      name: string;
    };
  };
  level: number;
  notes?: string;
}

export interface QuestionnaireStatus {
  completed: boolean;
  totalPreferences: number;
  completedPreferences: number;
  userPreferences: UserPreference[];
}

export interface UserPreferenceRequest {
  preferenceId: number;
  level: number; // 0-100
  notes?: string;
}

export interface SavePreferencesRequest {
  preferences: UserPreferenceRequest[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: ErrorResponse;
}

export interface ErrorResponse {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
}
