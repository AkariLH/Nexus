import { API_CONFIG } from '../config/api.config';
import { apiClient } from './api.client';

export interface CreateEventRequest {
  title: string;
  startDateTime: string; // ISO string
  endDateTime: string; // ISO string
  location?: string;
  category?: string;
  description?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
  reminderMinutes?: number; // Compatibilidad con API anterior
  reminders?: Array<{ minutesBefore: number; label: string }>; // Múltiples recordatorios
  color?: string;
}

export interface EventResponse {
  id: number;
  title: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  category?: string;
  description?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED';
  creatorUserId: number;
  creatorName?: string;
  creatorNickname?: string;
  linkId: number;
  partnerName?: string;
  partnerNickname?: string;
  creatorApproved: boolean;
  partnerApproved: boolean;
  fullyApproved: boolean;
  creatorApprovedAt?: string;
  partnerApprovedAt?: string;
  isRecurring?: boolean;
  recurrencePattern?: string;
  reminderMinutes?: number;
  reminders?: Array<{ minutesBefore: number; label: string }>; // Múltiples recordatorios
  color?: string;
  exceptionDates?: string[]; // Fechas de instancias excluidas (ISO 8601)
  createdAt: string;
  updatedAt: string;
  pendingApprovalUserId?: number;
  pendingApprovalUserName?: string;
}

export interface CreateEventResponse {
  success: boolean;
  message: string;
  event: EventResponse;
  partnerNotificationStatus: string;
}

/**
 * Servicio para la gestión de eventos
 */
const eventService = {
  /**
   * Crear un nuevo evento
   */
  createEvent: async (userId: number, eventData: CreateEventRequest): Promise<CreateEventResponse> => {
    const endpoint = API_CONFIG.ENDPOINTS.EVENTS.CREATE.replace(':userId', userId.toString());
    const response = await apiClient.post(endpoint, eventData);
    return response.data;
  },

  /**
   * Obtener todos los eventos de un usuario
   */
  getUserEvents: async (userId: number): Promise<EventResponse[]> => {
    const endpoint = API_CONFIG.ENDPOINTS.EVENTS.GET_USER_EVENTS.replace(':userId', userId.toString());
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  /**
   * Obtener eventos pendientes de aprobación
   */
  getPendingApprovalEvents: async (userId: number): Promise<EventResponse[]> => {
    const endpoint = API_CONFIG.ENDPOINTS.EVENTS.GET_PENDING_APPROVAL.replace(':userId', userId.toString());
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  /**
   * Obtener eventos propios creados por el usuario
   */
  getMyCreatedEvents: async (userId: number): Promise<EventResponse[]> => {
    const endpoint = API_CONFIG.ENDPOINTS.EVENTS.GET_USER_EVENTS.replace(':userId', userId.toString());
    const response = await apiClient.get(endpoint);
    // Filtrar solo eventos creados por el usuario
    return response.data.filter((event: EventResponse) => event.creatorUserId === userId);
  },

  /**
   * Aprobar un evento
   */
  approveEvent: async (eventId: number, userId: number): Promise<EventResponse> => {
    const endpoint = API_CONFIG.ENDPOINTS.EVENTS.APPROVE
      .replace(':eventId', eventId.toString())
      .replace(':userId', userId.toString());
    const response = await apiClient.post(endpoint);
    return response.data;
  },

  /**
   * Rechazar un evento
   */
  rejectEvent: async (eventId: number, userId: number): Promise<EventResponse> => {
    const endpoint = API_CONFIG.ENDPOINTS.EVENTS.REJECT
      .replace(':eventId', eventId.toString())
      .replace(':userId', userId.toString());
    const response = await apiClient.post(endpoint);
    return response.data;
  },

  /**
   * Actualizar un evento (CU17)
   */
  updateEvent: async (eventId: number, userId: number, eventData: Partial<CreateEventRequest>): Promise<EventResponse> => {
    const endpoint = API_CONFIG.ENDPOINTS.EVENTS.UPDATE
      .replace(':eventId', eventId.toString())
      .replace(':userId', userId.toString());
    const response = await apiClient.put(endpoint, eventData);
    return response.data;
  },

  /**
   * Eliminar un evento
   */
  deleteEvent: async (eventId: number, userId: number): Promise<void> => {
    const endpoint = API_CONFIG.ENDPOINTS.EVENTS.DELETE
      .replace(':eventId', eventId.toString())
      .replace(':userId', userId.toString());
    await apiClient.delete(endpoint);
  },

  /**
   * Agregar excepción a evento recurrente (eliminar instancia específica)
   */
  addEventException: async (eventId: number, exceptionDate: string, userId: number): Promise<void> => {
    const endpoint = `${API_CONFIG.BASE_URL}/events/${eventId}/exceptions`;
    await apiClient.post(endpoint, null, {
      params: {
        exceptionDate,
        userId,
      },
    });
  },
};

export default eventService;
