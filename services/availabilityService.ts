import { apiClient } from './api.client';

export interface FreeSlot {
  start: string;
  end: string;
}

export interface AvailableDay {
  date: string;
  dayOfWeek: string;
  freeSlots: FreeSlot[];
}

export interface MutualAvailableDay {
  date: string;
  dayOfWeek: string;
  mutualFreeSlots: FreeSlot[];
  totalMutualMinutes: number;
}

export interface AvailabilityResponse {
  userId: number;
  dateRange: {
    start: string;
    end: string;
  };
  availableSlots: AvailableDay[];
  totalDaysWithAvailability: number;
}

export interface MutualAvailabilityResponse {
  user1Id: number;
  user2Id: number;
  mutualAvailability: MutualAvailableDay[];
  totalDaysWithMutualAvailability: number;
  totalMutualMinutes: number;
}

export interface AvailabilityScheduleDTO {
  day: string; // MONDAY ... SUNDAY
  enabled: boolean;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

/** Obtener configuración de horarios permitidos */
export const getUserSchedule = async (userId: number): Promise<AvailabilityScheduleDTO[]> => {
  try {
    const response = await apiClient.get(`/availability/schedule/${userId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error obteniendo horarios:', error);
    throw new Error(error.response?.data?.message || 'Error al obtener horarios');
  }
};

/** Guardar configuración de horarios permitidos */
export const saveUserSchedule = async (userId: number, schedule: AvailabilityScheduleDTO[]): Promise<AvailabilityScheduleDTO[]> => {
  try {
    console.log('📤 Guardando horarios para usuario:', userId);
    console.log('📋 Payload:', JSON.stringify(schedule, null, 2));
    
    const response = await apiClient.put(`/availability/schedule/${userId}`, schedule);
    
    console.log('✅ Respuesta exitosa:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error guardando horarios:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      payload: schedule
    });
    
    const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Error al guardar horarios';
    throw new Error(errorMsg);
  }
};

/**
 * Calcula los espacios disponibles de un usuario
 * CU28 - Identificar espacios disponibles individuales
 */
export const calculateAvailableSlots = async (
  userId: number,
  days: number = 7
): Promise<AvailabilityResponse> => {
  try {
    const response = await apiClient.get(`/availability/calculate/${userId}`, {
      params: { days }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error calculando espacios disponibles:', error);
    throw new Error(error.response?.data?.message || 'Error al calcular disponibilidad');
  }
};

/**
 * Encuentra disponibilidad mutua entre dos usuarios
 * CU29 - Comparar espacios de ambos usuarios
 */
export const findMutualAvailability = async (
  userId1: number,
  userId2: number,
  days: number = 7
): Promise<MutualAvailabilityResponse> => {
  try {
    const response = await apiClient.get(`/availability/mutual/${userId1}/${userId2}`, {
      params: { days }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error calculando disponibilidad mutua:', error);
    throw new Error(error.response?.data?.message || 'Error al calcular disponibilidad mutua');
  }
};

export default {
  calculateAvailableSlots,
  findMutualAvailability,
  getUserSchedule,
  saveUserSchedule,
};
