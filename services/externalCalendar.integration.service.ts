import { apiClient } from './api.client';
import { API_CONFIG } from '../config/api.config';
import { calendarService, CalendarEvent, ExternalCalendar, SyncConfig } from './calendar.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toDeviceRecurrence } from '../utils/deviceRecurrence';

const SYNC_CONFIG_KEY = 'calendar_sync_config';
const LAST_SYNC_KEY = 'calendar_last_sync';

/**
 * Extrae DTSTART de una regla de recurrencia iCalendar
 */
function extractDTSTART(rule: string | undefined): string | undefined {
  if (!rule || !rule.includes('DTSTART')) return undefined;
  
  const match = rule.match(/DTSTART[=:]([^;]+)/);
  return match ? match[1] : undefined;
}

/**
 * Extrae UNTIL de una regla de recurrencia iCalendar
 */
function extractUNTIL(rule: string | undefined): string | undefined {
  if (!rule || !rule.includes('UNTIL')) return undefined;
  
  const match = rule.match(/UNTIL=([^;]+)/);
  return match ? match[1] : undefined;
}

/**
 * Extrae COUNT de una regla de recurrencia iCalendar
 */
function extractCOUNT(rule: string | undefined): number | undefined {
  if (!rule || !rule.includes('COUNT')) return undefined;
  
  const match = rule.match(/COUNT=(\d+)/);
  return match ? parseInt(match[1]) : undefined;
}

/**
 * Infiere BYDAY del día de la semana de DTSTART si FREQ=WEEKLY y no tiene BYDAY
 * Esto soluciona el problema de Google Calendar que no especifica BYDAY explícitamente
 * @param rule Regla de recurrencia en formato iCalendar
 * @param startDate Fecha de inicio del evento
 * @param inferredDays Días inferidos del análisis de ocurrencias (opcional)
 * @param inferredUntil Fecha de fin inferida de la última ocurrencia (opcional)
 */
function inferBYDAY(rule: string | undefined, startDate: Date, inferredDays?: string[], inferredUntil?: Date): string | undefined {
  if (!rule) return rule;
  
  // Solo aplicar si es WEEKLY y NO tiene BYDAY
  if (!rule.includes('FREQ=WEEKLY') || rule.includes('BYDAY')) {
    return rule;
  }
  
  console.log('🔍 Evento WEEKLY sin BYDAY detectado, infiriendo del análisis de ocurrencias...');
  
  let byday: string;
  
  if (inferredDays && inferredDays.length > 0) {
    // Usar los días inferidos del análisis
    byday = inferredDays.join(',');
    console.log(`   Días inferidos del análisis: ${byday}`);
  } else {
    // Fallback: usar el día de la fecha de inicio
    const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    const dayOfWeek = startDate.getDay();
    byday = dayMap[dayOfWeek];
    console.log(`   Día de inicio: ${startDate.toLocaleDateString()} (${dayOfWeek}) -> BYDAY=${byday}`);
  }
  
  // Insertar BYDAY en la regla
  let updatedRule = rule + `;BYDAY=${byday}`;
  
  // Si tenemos fecha final inferida y la regla no tiene UNTIL ni COUNT, agregarla
  if (inferredUntil && !rule.includes('UNTIL') && !rule.includes('COUNT')) {
    // Convertir fecha a formato YYYYMMDD
    const year = inferredUntil.getFullYear();
    const month = String(inferredUntil.getMonth() + 1).padStart(2, '0');
    const day = String(inferredUntil.getDate()).padStart(2, '0');
    const untilStr = `${year}${month}${day}`;
    
    updatedRule += `;UNTIL=${untilStr}`;
    console.log(`   Fecha final inferida: ${inferredUntil.toLocaleDateString()} -> UNTIL=${untilStr}`);
  }
  
  console.log(`   Regla actualizada: ${updatedRule}`);
  
  return updatedRule;
}

/**
 * Mapea el tipo de fuente de expo-calendar al enum del backend
 */
function mapCalendarSourceToBackend(expoSourceType: string): string {
  // expo-calendar source types:
  // - iOS: "com.apple.eventkit", "com.google", "com.apple.icloud", etc.
  // - Android: "com.google", "com.samsung.android.calendar", etc.
  
  const sourceTypeLower = expoSourceType.toLowerCase();
  
  if (sourceTypeLower.includes('google')) {
    return 'GOOGLE';
  }
  
  if (sourceTypeLower.includes('outlook') || sourceTypeLower.includes('office') || sourceTypeLower.includes('microsoft')) {
    return 'OUTLOOK';
  }
  
  // Apple EventKit, Samsung, local calendars, etc.
  return 'LOCAL';
}

/**
 * Convierte el formato de recurrencia de expo-calendar a formato iCalendar RFC 5545
 * expo-calendar usa un objeto JSON: {"frequency":"weekly","interval":2}
 * iCalendar usa string: "FREQ=WEEKLY;INTERVAL=2"
 */
function convertRecurrenceToICalendar(recurrenceRule: string | undefined): string | undefined {
  if (!recurrenceRule) {
    return undefined;
  }

  try {
    console.log('🔄 Convirtiendo recurrencia:', recurrenceRule);
    
    // Si ya es un string que parece iCalendar, devolverlo tal cual
    if (typeof recurrenceRule === 'string' && recurrenceRule.includes('FREQ=')) {
      console.log('✅ Ya es formato iCalendar:', recurrenceRule);
      return recurrenceRule;
    }

    // Parse el JSON (expo-calendar devuelve objeto que se stringifica)
    const rule = typeof recurrenceRule === 'string' 
      ? JSON.parse(recurrenceRule) 
      : recurrenceRule;

    console.log('📋 Regla parseada:', JSON.stringify(rule, null, 2));

    const parts: string[] = [];

    // FREQ (obligatorio)
    if (rule.frequency) {
      const freq = rule.frequency.toUpperCase();
      parts.push(`FREQ=${freq}`);
    } else {
      // Si no hay frecuencia, no es válido
      return undefined;
    }

    // INTERVAL
    if (rule.interval && rule.interval > 1) {
      parts.push(`INTERVAL=${rule.interval}`);
    }

    // COUNT (número de ocurrencias)
    if (rule.occurrence) {
      parts.push(`COUNT=${rule.occurrence}`);
    }

    // UNTIL (fecha de fin)
    if (rule.endDate) {
      // Convertir a formato iCalendar: YYYYMMDD
      const endDate = new Date(rule.endDate);
      const until = endDate.toISOString().split('T')[0].replace(/-/g, '');
      parts.push(`UNTIL=${until}`);
    }

    // BYDAY (días de la semana)
    if (rule.daysOfTheWeek && Array.isArray(rule.daysOfTheWeek)) {
      const dayMap: { [key: number]: string } = {
        1: 'SU', // Sunday
        2: 'MO', // Monday
        3: 'TU', // Tuesday
        4: 'WE', // Wednesday
        5: 'TH', // Thursday
        6: 'FR', // Friday
        7: 'SA', // Saturday
      };
      const days = rule.daysOfTheWeek.map((d: number) => dayMap[d]).filter(Boolean);
      if (days.length > 0) {
        parts.push(`BYDAY=${days.join(',')}`);
      }
    }

    // BYMONTHDAY (días del mes)
    if (rule.daysOfTheMonth && Array.isArray(rule.daysOfTheMonth)) {
      parts.push(`BYMONTHDAY=${rule.daysOfTheMonth.join(',')}`);
    }

    // BYMONTH (meses del año)
    if (rule.monthsOfTheYear && Array.isArray(rule.monthsOfTheYear)) {
      parts.push(`BYMONTH=${rule.monthsOfTheYear.join(',')}`);
    }

    // BYSETPOS (posición en el conjunto, ej: primer lunes)
    if (rule.setPositions && Array.isArray(rule.setPositions)) {
      parts.push(`BYSETPOS=${rule.setPositions.join(',')}`);
    }

    const result = parts.join(';');
    console.log('✅ Resultado iCalendar:', result);
    return result;
  } catch (error) {
    console.error('❌ Error convirtiendo recurrencia a iCalendar:', error);
    return undefined;
  }
}

export interface LinkedCalendar {
  id: number;
  deviceCalendarId: string;
  calendarName: string;
  calendarSource: string;
  calendarColor: string;
  syncEnabled: boolean;
  privacyMode: 'FULL_DETAILS' | 'BUSY_ONLY';
  lastSync?: string;
  isActive: boolean;
}

export interface ExternalEventDTO {
  id: number;
  externalCalendarId: number;
  ownerId: number; // ID del usuario dueño del calendario
  deviceEventId: string;
  title: string;
  startDatetime: string;
  endDatetime: string;
  location?: string;
  description?: string;
  isAllDay: boolean;
  recurrenceRule?: string;
  rruleDtstartUtc?: string; // Fecha de inicio de la recurrencia
  rruleUntilUtc?: string;   // Fecha de fin de la recurrencia
  rruleCount?: number;      // Número de ocurrencias
  visibility: 'FULL_DETAILS' | 'BUSY_ONLY';
}

export interface AvailabilitySlot {
  start: string;
  end: string;
  durationMinutes: number;
}

class ExternalCalendarIntegrationService {
  /**
   * RF-19: Vincular un calendario externo
   */
  async linkCalendar(
    userId: number,
    deviceCalendarId: string,
    calendarName: string,
    calendarSource: string,
    calendarColor: string,
    syncEnabled: boolean = true,
    privacyMode: 'FULL_DETAILS' | 'BUSY_ONLY' = 'BUSY_ONLY'
  ): Promise<LinkedCalendar> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.EXTERNAL_CALENDARS.LINK.replace(':userId', userId.toString());
      
      // Mapear el tipo de fuente de expo-calendar al enum del backend
      const backendCalendarSource = mapCalendarSourceToBackend(calendarSource);
      
      const response = await apiClient.post(endpoint, {
        deviceCalendarId,
        calendarName,
        calendarSource: backendCalendarSource,
        calendarColor,
        syncEnabled,
        privacyMode,
      });

      console.log('✅ Calendario vinculado:', response.data);
      
      // Guardar configuración localmente
      await this.saveSyncConfig(userId, deviceCalendarId, {
        calendarId: deviceCalendarId,
        calendarName,
        syncEnabled,
        privacyMode,
        lastSync: new Date(),
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error vinculando calendario:', error);
      throw error;
    }
  }

  /**
   * RF-26: Desvincular un calendario externo
   */
  async unlinkCalendar(userId: number, deviceCalendarId: string): Promise<void> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.EXTERNAL_CALENDARS.UNLINK
        .replace(':userId', userId.toString())
        .replace(':deviceCalendarId', deviceCalendarId);
      
      await apiClient.delete(endpoint);
      console.log('✅ Calendario desvinculado');

      // Eliminar configuración local
      await this.removeSyncConfig(userId, deviceCalendarId);
    } catch (error) {
      console.error('❌ Error desvinculando calendario:', error);
      throw error;
    }
  }

  /**
   * Obtener calendarios vinculados del usuario
   */
  async getUserLinkedCalendars(userId: number, activeOnly: boolean = true): Promise<LinkedCalendar[]> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.EXTERNAL_CALENDARS.GET_USER_CALENDARS
        .replace(':userId', userId.toString());
      
      const response = await apiClient.get(endpoint, {
        params: { activeOnly },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo calendarios vinculados:', error);
      throw error;
    }
  }

  /**
   * Actualizar configuración de un calendario
   */
  async updateCalendarSettings(
    userId: number,
    deviceCalendarId: string,
    syncEnabled?: boolean,
    privacyMode?: 'FULL_DETAILS' | 'BUSY_ONLY'
  ): Promise<LinkedCalendar> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.EXTERNAL_CALENDARS.UPDATE_SETTINGS
        .replace(':userId', userId.toString())
        .replace(':deviceCalendarId', deviceCalendarId);
      
      const params: any = {};
      if (syncEnabled !== undefined) params.syncEnabled = syncEnabled;
      if (privacyMode) params.privacyMode = privacyMode;

      const response = await apiClient.patch(endpoint, null, { params });
      
      // Actualizar configuración local
      if (syncEnabled !== undefined || privacyMode) {
        const config = await this.getSyncConfig(userId, deviceCalendarId);
        if (config) {
          if (syncEnabled !== undefined) config.syncEnabled = syncEnabled;
          if (privacyMode) config.privacyMode = privacyMode;
          await this.saveSyncConfig(userId, deviceCalendarId, config);
        }
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error actualizando configuración:', error);
      throw error;
    }
  }

  /**
   * RF-20 & RF-21: Sincronizar eventos desde el dispositivo al backend
   */
  async syncEventsToBackend(
    userId: number,
    externalCalendarId: number,
    deviceCalendarId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ created: number; updated: number; conflicts: string[]; total: number }> {
    try {
      console.log('📅 Sincronizando eventos del calendario...');

      // Leer eventos desde el dispositivo
      const events = await calendarService.getEventsFromCalendar(
        deviceCalendarId,
        startDate,
        endDate
      );

      console.log(`📊 Encontrados ${events.length} eventos para sincronizar`);

      if (events.length === 0) {
        return { created: 0, updated: 0, conflicts: [], total: 0 };
      }

      // ESTRATEGIA NUEVA: Para eventos recurrentes semanales, analizar ocurrencias de una semana
      // para reconstruir el patrón BYDAY completo
      console.log('🔍 Analizando eventos recurrentes para reconstruir patrones BYDAY...');
      
      const uniqueEventsMap = new Map<string, typeof events[0] & { inferredByday?: string[]; inferredUntil?: Date }>();
      
      // Agrupar eventos por deviceEventId
      const eventsByIdMap = new Map<string, typeof events>();
      for (const event of events) {
        const key = event.id;
        if (!eventsByIdMap.has(key)) {
          eventsByIdMap.set(key, []);
        }
        eventsByIdMap.get(key)!.push(event);
      }
      
      console.log(`📋 Eventos agrupados: ${eventsByIdMap.size} IDs únicos`);
      
      // Procesar cada grupo
      for (const [deviceEventId, occurrences] of eventsByIdMap.entries()) {
        // Ordenar por fecha
        occurrences.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        
        const firstOccurrence = occurrences[0];
        const lastOccurrence = occurrences[occurrences.length - 1];
        
        // Si el evento tiene recurrencia FREQ=WEEKLY, analizar las ocurrencias
        if (firstOccurrence.recurrenceRule) {
          const ruleStr = typeof firstOccurrence.recurrenceRule === 'string' 
            ? firstOccurrence.recurrenceRule 
            : JSON.stringify(firstOccurrence.recurrenceRule);
            
          if (ruleStr.includes('FREQ=WEEKLY') || ruleStr.includes('weekly')) {
            console.log(`🔁 Analizando evento semanal: ${firstOccurrence.title} (${occurrences.length} ocurrencias)`);
            
            // Analizar los días de la semana de las primeras ocurrencias (máximo 7 para una semana)
            const daysOfWeek = new Set<number>();
            const sampleSize = Math.min(7, occurrences.length);
            
            for (let i = 0; i < sampleSize; i++) {
              const dayOfWeek = occurrences[i].startDate.getDay();
              daysOfWeek.add(dayOfWeek);
            }
            
            // Convertir a formato iCalendar BYDAY
            const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
            const inferredByday = Array.from(daysOfWeek).sort().map(d => dayMap[d]);
            
            console.log(`   Días detectados: ${Array.from(daysOfWeek).sort()} -> BYDAY=${inferredByday.join(',')}`);
            
            // Detectar fecha de fin (UNTIL) de la última ocurrencia
            console.log(`   Primera ocurrencia: ${firstOccurrence.startDate.toISOString()}`);
            console.log(`   Última ocurrencia: ${lastOccurrence.startDate.toISOString()}`);
            
            // Guardar el primer evento con los días inferidos y la fecha final
            uniqueEventsMap.set(deviceEventId, {
              ...firstOccurrence,
              inferredByday,
              inferredUntil: lastOccurrence.startDate
            });
          } else {
            // Otro tipo de recurrencia, usar solo la primera ocurrencia
            uniqueEventsMap.set(deviceEventId, firstOccurrence);
          }
        } else {
          // Evento no recurrente, usar solo la primera (o única) ocurrencia
          uniqueEventsMap.set(deviceEventId, firstOccurrence);
        }
      }

      const uniqueEvents = Array.from(uniqueEventsMap.values());
      console.log(`📊 Eventos únicos después de análisis: ${uniqueEvents.length} (de ${events.length} ocurrencias)`);

      // Log de algunos eventos para debugging
      if (uniqueEvents.length > 0) {
        const sample = uniqueEvents.slice(0, 3);
        console.log('📝 Muestra de eventos a sincronizar:', sample.map(e => ({
          id: e.id,
          title: e.title,
          start: e.startDate.toISOString(),
          recurring: !!e.recurrenceRule,
          inferredByday: (e as any).inferredByday,
          inferredUntil: (e as any).inferredUntil?.toISOString()
        })));
      }

      // Preparar datos para el backend
      const syncData = uniqueEvents.map(event => {
        // Convertir recurrencia a iCalendar y inferir BYDAY si falta
        let recurrenceRule = convertRecurrenceToICalendar(event.recurrenceRule);
        
        // Usar los días inferidos del análisis si están disponibles
        const eventWithInferred = event as typeof event & { inferredByday?: string[]; inferredUntil?: Date };
        recurrenceRule = inferBYDAY(
          recurrenceRule, 
          event.startDate, 
          eventWithInferred.inferredByday,
          eventWithInferred.inferredUntil
        );
        
        // Extraer componentes de la regla de recurrencia
        const rruleDtstartUtc = recurrenceRule ? event.startDate.toISOString() : undefined;
        const rruleUntilUtc = extractUNTIL(recurrenceRule);
        const rruleCount = extractCOUNT(recurrenceRule);
        
        // Convertir UNTIL de formato iCalendar (YYYYMMDD) a ISO si existe
        let rruleUntilIso: string | undefined;
        if (rruleUntilUtc) {
          try {
            // Formato: YYYYMMDD o YYYYMMDDTHHMMSSZ
            const year = parseInt(rruleUntilUtc.substring(0, 4));
            const month = parseInt(rruleUntilUtc.substring(4, 6)) - 1;
            const day = parseInt(rruleUntilUtc.substring(6, 8));
            rruleUntilIso = new Date(Date.UTC(year, month, day, 23, 59, 59, 999)).toISOString();
          } catch (e) {
            console.warn('No se pudo parsear UNTIL:', rruleUntilUtc);
          }
        }
        
        // Log detallado para eventos recurrentes
        if (recurrenceRule) {
          console.log(`📋 Evento recurrente: ${event.title}`);
          console.log(`   RRULE: ${recurrenceRule}`);
          console.log(`   DTSTART: ${rruleDtstartUtc}`);
          console.log(`   UNTIL: ${rruleUntilIso || 'N/A'}`);
          console.log(`   COUNT: ${rruleCount || 'N/A'}`);
        }
        
        return {
          externalCalendarId,
          deviceEventId: event.id,
          title: event.title,
          startDatetime: event.startDate.toISOString(),
          endDatetime: event.endDate.toISOString(),
          location: event.location,
          description: event.notes,
          isAllDay: event.allDay,
          recurrenceRule,
          rruleDtstartUtc,
          rruleUntilUtc: rruleUntilIso,
          rruleCount,
          lastDeviceUpdate: new Date().toISOString(),
        };
      });

      const endpoint = API_CONFIG.ENDPOINTS.EXTERNAL_CALENDARS.SYNC_EVENTS
        .replace(':userId', userId.toString());
      
      console.log('📤 Enviando sincronización a:', endpoint);
      console.log('📊 Eventos a sincronizar:', syncData.length);
      
      const response = await apiClient.post(endpoint, syncData);

      console.log('✅ Sincronización completada:', response.data);

      // Actualizar última sincronización
      const config = await this.getSyncConfig(userId, deviceCalendarId);
      if (config) {
        config.lastSync = new Date();
        await this.saveSyncConfig(userId, deviceCalendarId, config);
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ Error sincronizando eventos:', error);
      
      // No lanzar el error si es un problema de red, solo registrarlo
      // Esto evita que crashee la app
      if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
        console.warn('⚠️ Sincronización fallida por problema de red, continuando...');
        return { created: 0, updated: 0, conflicts: [], total: 0 };
      }
      
      throw error;
    }
  }

  /**
   * RF-20: Obtener eventos externos desde el backend (con privacidad aplicada)
   */
  async getExternalEvents(
    userId: number,
    startDate: Date,
    endDate: Date,
    partnerId?: number
  ): Promise<ExternalEventDTO[]> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.EXTERNAL_CALENDARS.GET_EVENTS
        .replace(':userId', userId.toString());
      
      const response = await apiClient.get(endpoint, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          partnerId,
        },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo eventos externos:', error);
      throw error;
    }
  }

  /**
   * RF-27: Obtener disponibilidad individual
   */
  async getUserAvailability(
    userId: number,
    startDate: Date,
    endDate: Date,
    minDurationMinutes: number = 60
  ): Promise<AvailabilitySlot[]> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.EXTERNAL_CALENDARS.GET_AVAILABILITY
        .replace(':userId', userId.toString());
      
      const response = await apiClient.get(endpoint, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          minDurationMinutes,
        },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo disponibilidad:', error);
      throw error;
    }
  }

  /**
   * RF-28 & RF-29: Obtener disponibilidad mutua con la pareja
   */
  async getMutualAvailability(
    user1Id: number,
    user2Id: number,
    startDate: Date,
    endDate: Date,
    minDurationMinutes: number = 60
  ): Promise<AvailabilitySlot[]> {
    try {
      const endpoint = API_CONFIG.ENDPOINTS.EXTERNAL_CALENDARS.GET_MUTUAL_AVAILABILITY;
      
      const response = await apiClient.get(endpoint, {
        params: {
          user1Id,
          user2Id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          minDurationMinutes,
        },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo disponibilidad mutua:', error);
      throw error;
    }
  }

  /**
   * RF-22: Crear evento en calendario nativo y sincronizar con backend
   */
  async createEventInNativeCalendar(
    userId: number,
    externalCalendarId: number,
    deviceCalendarId: string,
    eventData: {
      title: string;
      startDate: Date;
      endDate: Date;
      location?: string;
      notes?: string;
      allDay?: boolean;
    },
    /** [avisos-calendario] RF-24: evento de Nexus del que sale la copia. */
    appEventId?: number
  ): Promise<string> {
    try {
      // Crear en calendario nativo
      const deviceEventId = await calendarService.createEventInExternalCalendar(
        deviceCalendarId,
        eventData
      );

      // Sincronizar con backend
      const endpoint = API_CONFIG.ENDPOINTS.EXTERNAL_CALENDARS.SYNC_EVENTS
        .replace(':userId', userId.toString());
      
      await apiClient.post(endpoint, [{
        externalCalendarId,
        deviceEventId,
        title: eventData.title,
        startDatetime: eventData.startDate.toISOString(),
        endDatetime: eventData.endDate.toISOString(),
        location: eventData.location,
        description: eventData.notes,
        isAllDay: eventData.allDay || false,
        lastDeviceUpdate: new Date().toISOString(),
        appEventId,
      }]);

      console.log('✅ Evento creado y sincronizado');
      return deviceEventId;
    } catch (error) {
      console.error('❌ Error creando evento:', error);
      throw error;
    }
  }

  /**
   * [sync-calendario] RF-22 - Deja el calendario destino como dice el plan del backend: crea,
   * actualiza y borra copias, y registra cada una como escrita por Nexus. Un error en un evento no
   * detiene los demás (R7); si el destino no está en este teléfono no hace nada (R4).
   */
  async applyCopyPlan(userId: number, plan: CopyPlan): Promise<{ created: number; updated: number; removed: number }> {
    const result = { created: 0, updated: 0, removed: 0 };
    if (!(await calendarService.verifyCalendarExists(plan.deviceCalendarId))) return result;

    const orphans = plan.create.length > 0 ? await this.phoneEventsAround(plan) : [];
    for (const item of plan.create) {
      try {
        // R3: si la app se cerró después de crearlo, ya está en el teléfono sin registrar.
        const orphan = orphans.find((e) => sameTitle(e.title, item.title) && sameMinute(e.startDate, new Date(item.start)));
        const deviceEventId = orphan?.id ?? (await this.createCopy(plan, item));
        await this.registerCopy(userId, plan, item, deviceEventId);
        result.created++;
      } catch (error) {
        console.warn('⚠️ No se pudo copiar un evento de Nexus:', error);
      }
    }
    for (const item of plan.update) {
      try {
        await calendarService.updateEventInExternalCalendar(item.deviceEventId!, deviceFields(item));
        await this.registerCopy(userId, plan, item, item.deviceEventId!);
        result.updated++;
      } catch {
        // Ya no estaba en el teléfono: se vuelve a crear.
        if (await this.recreateCopy(userId, plan, item)) result.updated++;
      }
    }
    for (const item of plan.keep) {
      if (await calendarService.eventExists(item.deviceEventId!)) continue;
      // R2: la borraron en el teléfono; manda Nexus.
      if (await this.recreateCopy(userId, plan, item)) result.created++;
    }
    for (const copy of plan.remove) {
      try {
        await calendarService.deleteEventFromExternalCalendar(copy.deviceEventId).catch(() => undefined);
        await apiClient.delete(deleteCopyUrl(userId, copy.externalCalendarId, copy.deviceEventId));
        result.removed++;
      } catch (error) {
        console.warn('⚠️ No se pudo quitar una copia:', error);
      }
    }
    return result;
  }

  private async recreateCopy(userId: number, plan: CopyPlan, item: CopyItem): Promise<boolean> {
    try {
      await apiClient.delete(deleteCopyUrl(userId, plan.externalCalendarId, item.deviceEventId!));
      const deviceEventId = await this.createCopy(plan, item);
      await this.registerCopy(userId, plan, item, deviceEventId);
      return true;
    } catch (error) {
      console.warn('⚠️ No se pudo volver a crear una copia:', error);
      return false;
    }
  }

  private createCopy(plan: CopyPlan, item: CopyItem): Promise<string> {
    return calendarService.createEventInExternalCalendar(plan.deviceCalendarId, deviceFields(item));
  }

  /** Lo que ya hay en el destino cerca de los eventos a crear (para adoptarlos, R3). */
  private async phoneEventsAround(plan: CopyPlan): Promise<CalendarEvent[]> {
    const starts = plan.create.map((i) => new Date(i.start).getTime());
    const ends = plan.create.map((i) => new Date(i.end).getTime());
    try {
      return await calendarService.getEventsFromCalendar(
        plan.deviceCalendarId,
        new Date(Math.min(...starts) - 86_400_000),
        new Date(Math.max(...ends) + 86_400_000),
      );
    } catch {
      return [];
    }
  }

  private async registerCopy(userId: number, plan: CopyPlan, item: CopyItem, deviceEventId: string): Promise<void> {
    const endpoint = API_CONFIG.ENDPOINTS.EXTERNAL_CALENDARS.SYNC_EVENTS.replace(':userId', userId.toString());
    await apiClient.post(endpoint, [{
      externalCalendarId: plan.externalCalendarId,
      deviceEventId,
      title: item.title,
      startDatetime: item.start,
      endDatetime: item.end,
      location: item.location ?? undefined,
      description: item.description ?? undefined,
      isAllDay: item.allDay,
      recurrenceRule: item.recurrencePattern ?? undefined,
      lastDeviceUpdate: new Date().toISOString(),
      appEventId: item.appEventId,
      fromNexus: true,
    }]);
  }

  /**
   * Sincronización automática periódica (RF-21). [avisos-calendario] RF-24: devuelve los eventos
   * creados en Nexus que cambiaron en el teléfono (el backend ya dejó el aviso en la campanita).
   * [sync-calendario] Después copia lo de Nexus al calendario destino (RF-22). Si ya hay una
   * sincronización corriendo, devuelve esa misma (nunca corren dos a la vez).
   */
  performPeriodicSync(userId: number): Promise<{ conflicts: string[]; copied: number }> {
    if (!this.syncInFlight) {
      this.syncInFlight = this.runPeriodicSync(userId).finally(() => {
        this.syncInFlight = null;
      });
    }
    return this.syncInFlight;
  }

  private syncInFlight: Promise<{ conflicts: string[]; copied: number }> | null = null;

  private async runPeriodicSync(userId: number): Promise<{ conflicts: string[]; copied: number }> {
    const { conflicts } = await this.importLinkedCalendars(userId);
    let copied = 0;
    try {
      const endpoint = API_CONFIG.ENDPOINTS.EXTERNAL_CALENDARS.COPY_PLAN.replace(':userId', userId.toString());
      const response = await apiClient.get(endpoint);
      if (response.status !== 204 && response.data) {
        const done = await this.applyCopyPlan(userId, response.data as CopyPlan);
        copied = done.created + done.updated;
      }
    } catch (error) {
      console.error('❌ Error copiando los eventos de Nexus:', error);
    }
    return { conflicts, copied };
  }

  /** RF-21 / RF-24: trae cada calendario con «Sincronizar» prendido. */
  private async importLinkedCalendars(userId: number): Promise<{ conflicts: string[] }> {
    const conflicts: string[] = [];
    try {
      console.log('🔄 Iniciando sincronización periódica...');

      const linkedCalendars = await this.getUserLinkedCalendars(userId, true);
      const syncableCalendars = linkedCalendars.filter(cal => cal.syncEnabled);

      if (syncableCalendars.length === 0) {
        console.log('ℹ️ No hay calendarios habilitados para sincronización');
        return { conflicts };
      }

      // Sincronizar 1 mes antes, mes actual y 1 mes después (3 meses total)
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 2);

      for (const calendar of syncableCalendars) {
        try {
          const result = await this.syncEventsToBackend(
            userId,
            calendar.id,
            calendar.deviceCalendarId,
            startDate,
            endDate
          );
          conflicts.push(...(result?.conflicts ?? []));
        } catch (error: any) {
          console.error(`❌ Error sincronizando calendario ${calendar.calendarName}:`, error);
          // No propagar el error, continuar con el siguiente calendario
          if (error?.code === 'ERR_NETWORK') {
            console.warn('⚠️ Problema de red detectado, saltando este calendario');
          }
        }
      }

      console.log('✅ Sincronización periódica completada');
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (error) {
      console.error('❌ Error en sincronización periódica:', error);
    }
    return { conflicts };
  }

  /**
   * Guardar configuración de sincronización localmente
   */
  private async saveSyncConfig(userId: number, calendarId: string, config: SyncConfig): Promise<void> {
    try {
      const key = `${SYNC_CONFIG_KEY}_${userId}_${calendarId}`;
      await AsyncStorage.setItem(key, JSON.stringify(config));
    } catch (error) {
      console.error('Error guardando configuración:', error);
    }
  }

  /**
   * Obtener configuración de sincronización local
   */
  private async getSyncConfig(userId: number, calendarId: string): Promise<SyncConfig | null> {
    try {
      const key = `${SYNC_CONFIG_KEY}_${userId}_${calendarId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error obteniendo configuración:', error);
      return null;
    }
  }

  /**
   * Eliminar configuración local
   */
  private async removeSyncConfig(userId: number, calendarId: string): Promise<void> {
    try {
      const key = `${SYNC_CONFIG_KEY}_${userId}_${calendarId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error eliminando configuración:', error);
    }
  }

  /**
   * Verificar salud del API
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.EXTERNAL_CALENDARS.HEALTH);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

/** [sync-calendario] RF-22 - Un evento de Nexus a copiar (CopyPlanDTO.CopyItem del backend). */
export interface CopyItem {
  appEventId: number;
  /** `null` al crear. */
  deviceEventId: string | null;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location?: string | null;
  description?: string | null;
  recurrencePattern?: string | null;
}

export interface CopyRemoval {
  appEventId: number;
  externalCalendarId: number;
  deviceEventId: string;
}

/** Lo que hay que hacer en el calendario destino del teléfono. */
export interface CopyPlan {
  externalCalendarId: number;
  deviceCalendarId: string;
  create: CopyItem[];
  update: CopyItem[];
  remove: CopyRemoval[];
  /** Copias al día: se revisa que sigan en el teléfono (R2). */
  keep: CopyItem[];
}

/** Los de todo el día se guardan de 00:00 a 23:59 UTC; en el teléfono van con la fecha local de ese día (R5). */
function deviceFields(item: CopyItem) {
  const start = new Date(item.start);
  const end = new Date(item.end);
  const day = (d: Date) => new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return {
    title: item.title,
    startDate: item.allDay ? day(start) : start,
    endDate: item.allDay ? day(end) : end,
    location: item.location ?? undefined,
    notes: item.description ?? undefined,
    allDay: item.allDay,
    recurrenceRule: toDeviceRecurrence(item.recurrencePattern),
  };
}

function deleteCopyUrl(userId: number, externalCalendarId: number, deviceEventId: string): string {
  return API_CONFIG.ENDPOINTS.EXTERNAL_CALENDARS.DELETE_COPY
    .replace(':userId', userId.toString())
    .replace(':externalCalendarId', externalCalendarId.toString())
    .replace(':deviceEventId', encodeURIComponent(deviceEventId));
}

const sameTitle = (a: string, b: string) => a.trim().replace(/\s+/g, ' ') === b.trim().replace(/\s+/g, ' ');
const sameMinute = (a: Date, b: Date) => Math.floor(a.getTime() / 60_000) === Math.floor(b.getTime() / 60_000);

export const externalCalendarIntegration = new ExternalCalendarIntegrationService();
