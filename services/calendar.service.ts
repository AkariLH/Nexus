import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export interface CalendarSource {
  id: string;
  name: string;
  type: string;
}

export interface ExternalCalendar {
  id: string;
  title: string;
  source: CalendarSource;
  color: string;
  allowsModifications: boolean;
  type: string;
  isPrimary: boolean;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  location?: string;
  notes?: string;
  recurrenceRule?: string;
  availability?: string;
}

export interface SyncConfig {
  calendarId: string;
  calendarName: string;
  syncEnabled: boolean;
  privacyMode: 'FULL_DETAILS' | 'BUSY_ONLY';
  lastSync?: Date;
}

class CalendarService {
  /**
   * RF-19: Solicitar permisos de calendario
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('❌ Permisos de calendario denegados');
        return false;
      }

      console.log('✅ Permisos de calendario concedidos');
      return true;
    } catch (error) {
      console.error('❌ Error solicitando permisos de calendario:', error);
      return false;
    }
  }

  /**
   * RF-19: Obtener todos los calendarios disponibles en el dispositivo
   */
  async getAvailableCalendars(): Promise<ExternalCalendar[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('No se tienen permisos de calendario');
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      
      return calendars.map(cal => ({
        id: cal.id,
        title: cal.title,
        source: {
          id: cal.source.id || cal.id,
          name: cal.source.name,
          type: cal.source.type,
        },
        color: cal.color,
        allowsModifications: cal.allowsModifications,
        type: cal.type || 'unknown',
        isPrimary: cal.isPrimary || false,
      }));
    } catch (error) {
      console.error('❌ Error obteniendo calendarios:', error);
      throw error;
    }
  }

  /**
   * RF-20: Leer eventos de un calendario específico
   */
  async getEventsFromCalendar(
    calendarId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('No se tienen permisos de calendario');
      }

      const events = await Calendar.getEventsAsync(
        [calendarId],
        startDate,
        endDate
      );

      return events.map(event => ({
        id: event.id,
        calendarId: event.calendarId,
        title: event.title,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        allDay: event.allDay,
        location: event.location || undefined,
        notes: event.notes || '',
        recurrenceRule: event.recurrenceRule ? JSON.stringify(event.recurrenceRule) : undefined,
        availability: event.availability,
      }));
    } catch (error) {
      console.error(`❌ Error leyendo eventos del calendario ${calendarId}:`, error);
      throw error;
    }
  }

  /**
   * RF-20: Leer eventos de múltiples calendarios
   */
  async getEventsFromMultipleCalendars(
    calendarIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('No se tienen permisos de calendario');
      }

      const events = await Calendar.getEventsAsync(
        calendarIds,
        startDate,
        endDate
      );

      return events.map(event => ({
        id: event.id,
        calendarId: event.calendarId,
        title: event.title,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        allDay: event.allDay,
        location: event.location || undefined,
        notes: event.notes || '',
        recurrenceRule: event.recurrenceRule ? JSON.stringify(event.recurrenceRule) : undefined,
        availability: event.availability,
      }));
    } catch (error) {
      console.error('❌ Error leyendo eventos de múltiples calendarios:', error);
      throw error;
    }
  }

  /**
   * RF-22: Crear un evento en un calendario externo
   */
  async createEventInExternalCalendar(
    calendarId: string,
    eventData: {
      title: string;
      startDate: Date;
      endDate: Date;
      location?: string;
      notes?: string;
      allDay?: boolean;
      recurrenceRule?: string;
    }
  ): Promise<string> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('No se tienen permisos de calendario');
      }

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: eventData.title,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        location: eventData.location,
        notes: eventData.notes,
        allDay: eventData.allDay || false,
        timeZone: 'GMT',
      });

      console.log('✅ Evento creado en calendario externo:', eventId);
      return eventId;
    } catch (error) {
      console.error('❌ Error creando evento en calendario externo:', error);
      throw error;
    }
  }

  /**
   * RF-22: Actualizar un evento en un calendario externo
   */
  async updateEventInExternalCalendar(
    eventId: string,
    eventData: {
      title?: string;
      startDate?: Date;
      endDate?: Date;
      location?: string;
      notes?: string;
      allDay?: boolean;
    }
  ): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('No se tienen permisos de calendario');
      }

      await Calendar.updateEventAsync(eventId, eventData);
      console.log('✅ Evento actualizado en calendario externo');
    } catch (error) {
      console.error('❌ Error actualizando evento en calendario externo:', error);
      throw error;
    }
  }

  /**
   * RF-22: Eliminar un evento de un calendario externo
   */
  async deleteEventFromExternalCalendar(eventId: string): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('No se tienen permisos de calendario');
      }

      await Calendar.deleteEventAsync(eventId);
      console.log('✅ Evento eliminado del calendario externo');
    } catch (error) {
      console.error('❌ Error eliminando evento del calendario externo:', error);
      throw error;
    }
  }

  /**
   * RF-27: Identificar espacios libres en el calendario
   */
  async findFreeSlots(
    calendarIds: string[],
    startDate: Date,
    endDate: Date,
    slotDuration: number = 60 // minutos
  ): Promise<{ start: Date; end: Date }[]> {
    try {
      const events = await this.getEventsFromMultipleCalendars(
        calendarIds,
        startDate,
        endDate
      );

      // Ordenar eventos por fecha de inicio
      const sortedEvents = events.sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime()
      );

      const freeSlots: { start: Date; end: Date }[] = [];
      let currentTime = new Date(startDate);

      for (const event of sortedEvents) {
        // Si hay un gap entre el tiempo actual y el inicio del evento
        const gapMinutes = (event.startDate.getTime() - currentTime.getTime()) / (1000 * 60);
        
        if (gapMinutes >= slotDuration) {
          freeSlots.push({
            start: new Date(currentTime),
            end: new Date(event.startDate),
          });
        }

        // Avanzar el tiempo actual al final del evento
        if (event.endDate > currentTime) {
          currentTime = new Date(event.endDate);
        }
      }

      // Agregar el último slot libre hasta el endDate
      const finalGapMinutes = (endDate.getTime() - currentTime.getTime()) / (1000 * 60);
      if (finalGapMinutes >= slotDuration) {
        freeSlots.push({
          start: new Date(currentTime),
          end: new Date(endDate),
        });
      }

      return freeSlots;
    } catch (error) {
      console.error('❌ Error encontrando espacios libres:', error);
      throw error;
    }
  }

  /**
   * RF-28: Cruce de disponibilidad entre dos usuarios
   */
  findMutualFreeSlots(
    user1FreeSlots: { start: Date; end: Date }[],
    user2FreeSlots: { start: Date; end: Date }[],
    minDuration: number = 60 // minutos
  ): { start: Date; end: Date }[] {
    const mutualSlots: { start: Date; end: Date }[] = [];

    for (const slot1 of user1FreeSlots) {
      for (const slot2 of user2FreeSlots) {
        // Encontrar la intersección de los dos slots
        const overlapStart = new Date(
          Math.max(slot1.start.getTime(), slot2.start.getTime())
        );
        const overlapEnd = new Date(
          Math.min(slot1.end.getTime(), slot2.end.getTime())
        );

        // Si hay overlap y cumple con la duración mínima
        const overlapMinutes = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
        
        if (overlapMinutes >= minDuration) {
          mutualSlots.push({
            start: overlapStart,
            end: overlapEnd,
          });
        }
      }
    }

    return mutualSlots;
  }

  /**
   * RF-23: Aplicar privacidad a eventos (ocultar detalles)
   */
  applyPrivacyToEvents(
    events: CalendarEvent[],
    privacyMode: 'FULL_DETAILS' | 'BUSY_ONLY'
  ): CalendarEvent[] {
    if (privacyMode === 'FULL_DETAILS') {
      return events;
    }

    // Modo BUSY_ONLY: ocultar detalles
    return events.map(event => ({
      ...event,
      title: 'Ocupado',
      location: undefined,
      notes: undefined,
    }));
  }

  /**
   * RF-24: Detectar si un evento ha sido modificado externamente
   */
  detectConflicts(
    localEvent: {
      externalEventId: string;
      lastUpdated: Date;
      title: string;
      startDate: Date;
      endDate: Date;
    },
    externalEvent: CalendarEvent
  ): {
    hasConflict: boolean;
    changes: string[];
  } {
    const changes: string[] = [];

    if (localEvent.title !== externalEvent.title) {
      changes.push('título');
    }

    if (localEvent.startDate.getTime() !== externalEvent.startDate.getTime()) {
      changes.push('fecha de inicio');
    }

    if (localEvent.endDate.getTime() !== externalEvent.endDate.getTime()) {
      changes.push('fecha de fin');
    }

    return {
      hasConflict: changes.length > 0,
      changes,
    };
  }

  /**
   * RF-26: Verificar si un calendario sigue existiendo
   */
  async verifyCalendarExists(calendarId: string): Promise<boolean> {
    try {
      const calendars = await this.getAvailableCalendars();
      return calendars.some(cal => cal.id === calendarId);
    } catch (error) {
      console.error('❌ Error verificando existencia de calendario:', error);
      return false;
    }
  }

  /**
   * Obtener el calendario predeterminado del dispositivo
   */
  async getDefaultCalendar(): Promise<ExternalCalendar | null> {
    try {
      const calendars = await this.getAvailableCalendars();
      
      // Buscar el calendario primario
      const primaryCalendar = calendars.find(cal => cal.isPrimary);
      if (primaryCalendar) {
        return primaryCalendar;
      }

      // Si no hay primario, devolver el primero que permita modificaciones
      const modifiableCalendar = calendars.find(cal => cal.allowsModifications);
      return modifiableCalendar || calendars[0] || null;
    } catch (error) {
      console.error('❌ Error obteniendo calendario predeterminado:', error);
      return null;
    }
  }
}

export const calendarService = new CalendarService();
