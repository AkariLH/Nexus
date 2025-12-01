import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useQuestionnaireGuard } from "../../hooks/useQuestionnaireGuard";
import eventService, { EventResponse } from "../../services/event.service";
import { API_CONFIG } from "../../config/api.config";
import { expandRecurringEvent } from "../../utils/recurrenceUtils";
import { EventDetailsModal } from "../components/EventDetailsModal";
import { externalCalendarIntegration, ExternalEventDTO } from "../../services/externalCalendar.integration.service";
import { ExternalEventDetailModal, ExternalEventDetail } from "../components/ExternalEventDetailModal";

type ViewMode = "month" | "week" | "day";

interface Event {
  id: string;
  title: string;
  date: Date;
  endDate: Date;
  color: string;
  isShared: boolean;
  isAllDay: boolean;
  isExternal?: boolean; // Marca si viene de calendario externo
  isReadOnly?: boolean; // Marca si es solo lectura
}

export default function CalendarioScreen() {
  useQuestionnaireGuard();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasActiveLink, setHasActiveLink] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [fullEventsData, setFullEventsData] = useState<EventResponse[]>([]);
  const [partnerId, setPartnerId] = useState<number | null>(null);
  const [externalEventDetails, setExternalEventDetails] = useState<ExternalEventDetail | null>(null);
  const [showExternalEventModal, setShowExternalEventModal] = useState(false);
  const [externalEventsData, setExternalEventsData] = useState<ExternalEventDTO[]>([]);

  const checkLinkStatus = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/link/status/${user.userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setHasActiveLink(data.hasActiveLink);
        
        // Guardar partnerId para cargar sus eventos externos
        if (data.hasActiveLink && data.partner) {
          setPartnerId(data.partner.userId);
        } else {
          setPartnerId(null);
        }
      }
    } catch (error) {
      console.error('Error verificando estado del vínculo:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  const loadApprovedEvents = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const userEvents = await eventService.getUserEvents(user.userId);
      // Guardar eventos completos para el modal
      setFullEventsData(userEvents);
      
      console.log('=== DEBUG CARGA DE EVENTOS ===');
      console.log(`Total eventos del usuario: ${userEvents.length}`);
      
      // Mostrar detalles de cada evento
      userEvents.forEach((event: EventResponse, index: number) => {
        console.log(`\nEvento ${index + 1}:`, {
          id: event.id,
          title: event.title,
          status: event.status,
          creatorApproved: event.creatorApproved,
          partnerApproved: event.partnerApproved,
          fullyApproved: event.fullyApproved,
          startDateTime: event.startDateTime,
          isRecurring: event.isRecurring,
          recurrencePattern: event.recurrencePattern,
          // Verificar tipos
          typeOfIsRecurring: typeof event.isRecurring,
          typeOfPattern: typeof event.recurrencePattern,
        });
        
        // Alertar si hay inconsistencias
        if (event.isRecurring && !event.recurrencePattern) {
          console.warn(`⚠️ EVENTO ${event.id}: Marcado como recurrente pero SIN patrón`);
        }
        if (!event.isRecurring && event.recurrencePattern) {
          console.warn(`⚠️ EVENTO ${event.id}: Tiene patrón pero NO marcado como recurrente`);
        }
      });
      
      // Filtrar eventos que deben mostrarse en el calendario:
      // - Eventos completamente aprobados (ambos usuarios aprobaron)
      // - Eventos propios aprobados por el creador (creatorApproved) independientemente del estado de la pareja
      const approvedEvents = userEvents.filter((event: EventResponse) => 
        event.fullyApproved || event.creatorApproved
      );
      
      console.log(`\nEventos filtrados para mostrar: ${approvedEvents.length}`);
      
      // Calcular rango de expansión: 6 meses antes y 12 meses después
      const startRange = new Date();
      startRange.setMonth(startRange.getMonth() - 6);
      const endRange = new Date();
      endRange.setMonth(endRange.getMonth() + 12);

      console.log('=== CALENDARIO DEBUG ===');
      console.log('Total eventos aprobados:', approvedEvents.length);
      console.log('Rango expansión:', startRange.toISOString(), 'hasta', endRange.toISOString());

      // Expandir eventos recurrentes
      const formattedEvents: Event[] = [];
      
      approvedEvents.forEach((event: EventResponse) => {
        console.log('\n--- Evento:', event.id, event.title);
        console.log('isRecurring:', event.isRecurring, 'pattern:', event.recurrencePattern);
        console.log('Fecha inicio:', event.startDateTime);
        
        // Parsear fechas del backend (formato UTC ISO)
        let startDate: Date;
        let endDate: Date;
        
        // Verificar si es evento de todo el día comparando las horas en UTC
        const tempStart = new Date(event.startDateTime);
        const tempEnd = new Date(event.endDateTime);
        
        console.log(`🔍 Verificando si es todo el día:`);
        console.log(`   Start UTC: ${event.startDateTime} -> ${tempStart.getUTCHours()}:${tempStart.getUTCMinutes()}`);
        console.log(`   End UTC: ${event.endDateTime} -> ${tempEnd.getUTCHours()}:${tempEnd.getUTCMinutes()}`);
        
        // Evento de todo el día si:
        // - Empieza a medianoche UTC (00:00)
        // - Y termina a las 23:59 UTC del mismo día
        const startsAtMidnight = tempStart.getUTCHours() === 0 && tempStart.getUTCMinutes() === 0;
        const endsAt2359 = tempEnd.getUTCHours() === 23 && tempEnd.getUTCMinutes() === 59;
        
        // TAMBIÉN aceptar eventos que abarcan 24 horas completas (creados antes del fix)
        // Por ejemplo: 2025-12-14 06:00:00 hasta 2025-12-15 05:59:59 en zona UTC-6
        const durationHours = (tempEnd.getTime() - tempStart.getTime()) / (1000 * 60 * 60);
        const isFullDayDuration = Math.abs(durationHours - 24) < 0.1; // ~24 horas
        
        const isAllDay = (startsAtMidnight && endsAt2359) || isFullDayDuration;
        
        console.log(`   Es todo el día: ${isAllDay} (midnight: ${startsAtMidnight}, ends2359: ${endsAt2359}, duration: ${durationHours}h)`);
        
        if (isAllDay) {
          // Para eventos de todo el día, extraer fecha sin conversión de zona horaria
          const startISO = event.startDateTime.substring(0, 10);
          const endISO = event.endDateTime.substring(0, 10);
          
          const [startYear, startMonth, startDay] = startISO.split('-').map(Number);
          const [endYear, endMonth, endDay] = endISO.split('-').map(Number);
          
          startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
          endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
          
          console.log(`📅 Evento todo el día regular: ${event.title} -> ${startDate.toLocaleDateString()}`);
        } else {
          // Para eventos con hora específica, usar conversión estándar UTC -> local
          startDate = new Date(event.startDateTime);
          endDate = new Date(event.endDateTime);
        }
        
        if (event.isRecurring && event.recurrencePattern) {
          console.log('🔄 Expandiendo evento recurrente:', {
            id: event.id,
            title: event.title,
            pattern: event.recurrencePattern,
            start: event.startDateTime
          });
          
          // Expandir el evento recurrente en múltiples ocurrencias
          const occurrences = expandRecurringEvent(
            {
              startDateTime: event.startDateTime,
              endDateTime: event.endDateTime,
              isRecurring: event.isRecurring,
              recurrencePattern: event.recurrencePattern,
              rruleDtstartUtc: event.rruleDtstartUtc,
            },
            startRange,
            endRange
          );

          console.log('✅ Ocurrencias generadas:', occurrences.length);
          if (occurrences.length === 0) {
            console.warn('⚠️ No se generaron ocurrencias para evento recurrente:', event.id, event.title);
          }
          
          // Debug: Ver las excepciones del evento
          console.log(`📋 Evento ${event.id} (${event.title}):`, {
            isRecurring: event.isRecurring,
            exceptionDates: event.exceptionDates,
            exceptionCount: event.exceptionDates?.length || 0
          });
          
          // Convertir las fechas de excepción a timestamps para comparación
          const exceptionTimestamps = (event.exceptionDates || []).map(dateStr => {
            const exceptionDate = new Date(dateStr);
            // Normalizar a medianoche UTC para comparar
            const normalized = Date.UTC(exceptionDate.getUTCFullYear(), exceptionDate.getUTCMonth(), exceptionDate.getUTCDate());
            console.log(`  🚫 Excepción: ${dateStr} → timestamp: ${normalized} (${new Date(normalized).toLocaleDateString()})`);
            return normalized;
          });
          
          // Crear un evento para cada ocurrencia (filtrando excepciones)
          occurrences.forEach(occurrenceDate => {
            // Normalizar la fecha de ocurrencia a medianoche UTC para comparar
            const normalizedOccurrence = Date.UTC(
              occurrenceDate.getFullYear(),
              occurrenceDate.getMonth(),
              occurrenceDate.getDate()
            );
            
            console.log(`  ⏰ Ocurrencia: ${occurrenceDate.toLocaleDateString()} → timestamp: ${normalizedOccurrence}`);
            
            // Saltar esta ocurrencia si está en la lista de excepciones
            if (exceptionTimestamps.includes(normalizedOccurrence)) {
              console.log(`  ❌ SALTANDO ocurrencia excluida: ${occurrenceDate.toLocaleDateString()}`);
              return;
            }
            
            console.log(`  ✅ Incluyendo ocurrencia: ${occurrenceDate.toLocaleDateString()}`);
            
            // Calcular endDate manteniendo la misma duración
            const duration = endDate.getTime() - startDate.getTime();
            const occurrenceEnd = new Date(occurrenceDate.getTime() + duration);
            
            formattedEvents.push({
              id: `${event.id}-${occurrenceDate.getTime()}`,
              title: event.title,
              date: occurrenceDate,
              endDate: occurrenceEnd,
              color: event.color || '#8B5CF6',
              isShared: true,
              isAllDay: isAllDay,
            });
          });
        } else {
          // Evento normal (no recurrente)
          formattedEvents.push({
            id: event.id.toString(),
            title: event.title,
            date: startDate,
            endDate: endDate,
            color: event.color || '#8B5CF6',
            isShared: true,
            isAllDay: isAllDay,
          });
        }
      });

      // Cargar eventos externos del backend (RF-23)
      try {
        console.log('📅 Cargando eventos externos...');
        const externalEvents = await externalCalendarIntegration.getExternalEvents(
          user.userId,
          startRange,
          endRange,
          partnerId || undefined // Pasar partnerId para obtener también sus eventos
        );
        
        console.log(`✅ Eventos externos cargados: ${externalEvents.length}`);
        
        // Guardar eventos externos completos para el modal
        setExternalEventsData(externalEvents);
        
        // Convertir eventos externos a formato Event
        externalEvents.forEach((extEvent: ExternalEventDTO) => {
          // El backend envía Instant (ISO string en UTC), convertir a fecha local
          // Para eventos de todo el día, mantener la fecha sin ajuste de zona
          let startDate: Date;
          let endDate: Date;
          
          if (extEvent.isAllDay) {
            // Para eventos de todo el día, extraer la fecha sin conversión de zona horaria
            // El backend envía: "2025-12-03T00:00:00.000Z"
            // Queremos: 3 de diciembre (sin importar la zona horaria)
            
            // Extraer año-mes-día del string ISO
            const startISO = extEvent.startDatetime.substring(0, 10); // "2025-12-03"
            const endISO = extEvent.endDatetime.substring(0, 10);
            
            const [startYear, startMonth, startDay] = startISO.split('-').map(Number);
            const [endYear, endMonth, endDay] = endISO.split('-').map(Number);
            
            // Crear fecha local con esos componentes (mes es 0-indexed)
            startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
            endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
            
            console.log(`📅 Evento todo el día: ${extEvent.title}`);
            console.log(`   ISO: ${startISO} -> Local: ${startDate.toLocaleDateString()} (${startDate.getDate()}/${startDate.getMonth()}/${startDate.getFullYear()})`);
          } else {
            // Para eventos con hora, usar la conversión estándar (UTC -> local)
            startDate = new Date(extEvent.startDatetime);
            endDate = new Date(extEvent.endDatetime);
          }
          
          // Si la privacidad es BUSY_ONLY, ocultar detalles
          const isBusyOnly = extEvent.visibility === 'BUSY_ONLY';
          
          // Determinar si el evento es del usuario o de la pareja
          const isOwnEvent = extEvent.ownerId === user.userId;
          
          // Si el evento tiene recurrencia, expandirlo
          if (extEvent.recurrenceRule) {
            try {
              console.log(`🔁 Expandiendo evento externo recurrente: ${extEvent.title}`);
              console.log(`   Start UTC: ${extEvent.startDatetime}`);
              console.log(`   Start Local: ${startDate.toISOString()}`);
              console.log(`   Pattern: ${extEvent.recurrenceRule}`);
              console.log(`   RRULE DTSTART: ${extEvent.rruleDtstartUtc}`);
              console.log(`   RRULE UNTIL: ${extEvent.rruleUntilUtc}`);
              console.log(`   RRULE COUNT: ${extEvent.rruleCount}`);
              
              // Convertir las fechas locales a formato ISO local (sin el offset)
              // Para que expandRecurringEvent use las horas correctas
              const localStartISO = new Date(
                startDate.getTime() - (startDate.getTimezoneOffset() * 60000)
              ).toISOString();
              
              const localEndISO = new Date(
                endDate.getTime() - (endDate.getTimezoneOffset() * 60000)
              ).toISOString();
              
              // Usar rruleDtstartUtc si está disponible, pero convertido a local
              let rruleDtstartLocal: string | undefined;
              if (extEvent.rruleDtstartUtc) {
                const rruleStart = new Date(extEvent.rruleDtstartUtc);
                rruleDtstartLocal = new Date(
                  rruleStart.getTime() - (rruleStart.getTimezoneOffset() * 60000)
                ).toISOString();
                console.log(`   RRULE DTSTART convertido a local: ${rruleDtstartLocal}`);
              }
              
              const occurrences = expandRecurringEvent(
                {
                  startDateTime: localStartISO,
                  endDateTime: localEndISO,
                  isRecurring: true,
                  recurrencePattern: extEvent.recurrenceRule,
                  rruleDtstartUtc: rruleDtstartLocal,
                },
                startRange,
                endRange
              );

              console.log(`✅ Evento externo "${extEvent.title}" expandido a ${occurrences.length} ocurrencias`);
              
              // Crear un evento para cada ocurrencia
              const duration = endDate.getTime() - startDate.getTime();
              
              occurrences.forEach(occurrenceDate => {
                const occurrenceEnd = new Date(occurrenceDate.getTime() + duration);
                
                formattedEvents.push({
                  id: `external-${extEvent.id}-${occurrenceDate.getTime()}`,
                  title: isBusyOnly ? '🔒 Ocupado' : extEvent.title,
                  date: occurrenceDate,
                  endDate: occurrenceEnd,
                  color: isBusyOnly ? '#94A3B8' : (isOwnEvent ? '#10B981' : '#3B82F6'),
                  isShared: !isOwnEvent,
                  isAllDay: extEvent.isAllDay,
                  isExternal: true,
                  isReadOnly: true,
                });
              });
            } catch (error) {
              console.error(`❌ Error expandiendo evento externo recurrente "${extEvent.title}":`, error);
              // Si falla la expansión, agregar al menos el evento base
              formattedEvents.push({
                id: `external-${extEvent.id}`,
                title: isBusyOnly ? '🔒 Ocupado' : extEvent.title,
                date: startDate,
                endDate: endDate,
                color: isBusyOnly ? '#94A3B8' : (isOwnEvent ? '#10B981' : '#3B82F6'),
                isShared: !isOwnEvent,
                isAllDay: extEvent.isAllDay,
                isExternal: true,
                isReadOnly: true,
              });
            }
          } else {
            // Evento no recurrente
            formattedEvents.push({
              id: `external-${extEvent.id}`,
              title: isBusyOnly ? '🔒 Ocupado' : extEvent.title,
              date: startDate,
              endDate: endDate,
              color: isBusyOnly ? '#94A3B8' : (isOwnEvent ? '#10B981' : '#3B82F6'),
              isShared: !isOwnEvent,
              isAllDay: extEvent.isAllDay,
              isExternal: true,
              isReadOnly: true,
            });
          }
        });
        
        console.log(`📊 Total eventos (locales + externos): ${formattedEvents.length}`);
      } catch (error) {
        console.error('❌ Error cargando eventos externos:', error);
        // Continuar sin eventos externos
      }

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error cargando eventos aprobados:', error);
    }
  }, [user?.userId, partnerId]); // Agregar partnerId como dependencia

  const handleEventPress = (eventId: string) => {
    // Verificar si es un evento externo
    if (eventId.startsWith('external-')) {
      // Extraer el ID del evento externo (formato: "external-{id}" o "external-{id}-{timestamp}")
      const externalIdPart = eventId.replace('external-', '');
      const realExternalId = externalIdPart.includes('-') ? externalIdPart.split('-')[0] : externalIdPart;
      
      // Buscar el evento en los datos externos completos
      const externalEvent = externalEventsData.find(e => e.id === parseInt(realExternalId));
      
      if (externalEvent && externalEvent.visibility === 'FULL_DETAILS') {
        // Solo mostrar detalles si la privacidad lo permite
        setExternalEventDetails({
          title: externalEvent.title,
          description: externalEvent.description || undefined,
          location: externalEvent.location || undefined,
          startDate: externalEvent.startDatetime,
          endDate: externalEvent.endDatetime,
          allDay: externalEvent.isAllDay,
          recurrenceRule: externalEvent.recurrenceRule || undefined,
        });
        setShowExternalEventModal(true);
      }
      return;
    }
    
    // Extraer el ID real del evento (quitar timestamp si es recurrente)
    const realEventId = eventId.includes('-') ? eventId.split('-')[0] : eventId;
    const fullEvent = fullEventsData.find(e => e.id === parseInt(realEventId));
    
    if (fullEvent) {
      // Si es una instancia recurrente, mantener el ID compuesto
      if (eventId.includes('-')) {
        setSelectedEvent({
          ...fullEvent,
          id: eventId as any, // Mantener el ID compuesto "eventId-timestamp"
        });
      } else {
        setSelectedEvent(fullEvent);
      }
      setShowEventModal(true);
    }
  };

  const handleEditEvent = (eventId: number) => {
    router.push(`/(events)/edit-event?eventId=${eventId}`);
  };
  
  const handleDeleteEvent = async (eventId: number) => {
    if (!user?.userId) return;
    
    try {
      await eventService.deleteEvent(eventId, user.userId);
      // Recargar eventos después de eliminar
      await loadApprovedEvents();
    } catch (error: any) {
      console.error('Error eliminando evento:', error);
      throw error; // Re-throw para que el modal maneje el error
    }
  };

  // Verificar cada vez que el tab obtiene foco
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await checkLinkStatus(); // Primero obtener partnerId
        await loadApprovedEvents(); // Luego cargar eventos con partnerId actualizado
      };
      loadData();
    }, [checkLinkStatus, loadApprovedEvents])
  );

  // Vista cuando no hay vínculo activo
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calendario</Text>
        </View>
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator size="large" color="#FF4F81" />
        </View>
      </View>
    );
  }

  if (!hasActiveLink) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Calendario</Text>
        </View>
        <View style={styles.emptyStateContainer}>
          <LinearGradient
            colors={["#FF4F8120", "#8A2BE220"]}
            style={styles.emptyStateCard}
          >
            <Ionicons name="calendar-outline" size={64} color="#FF4F81" style={styles.emptyIcon} />
            <Text style={styles.emptyTitle}>Calendario no disponible</Text>
            <Text style={styles.emptyText}>
              Necesitas establecer un vínculo con tu pareja para acceder al calendario compartido
            </Text>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => router.push('/(tabs)/link')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#FF4F81", "#8A2BE2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.linkButtonGradient}
              >
                <Ionicons name="heart" size={20} color="#FFF" />
                <Text style={styles.linkButtonText}>Establecer vínculo</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    );
  }

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const daysOfWeek = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const daysOfWeekShort = ["D", "L", "M", "M", "J", "V", "S"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getWeekDays = (date: Date) => {
    const day = date.getDay();
    const diff = date.getDate() - day;
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      // Crear cada día a medianoche para evitar problemas de zona horaria
      const weekDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        diff + i,
        0, 0, 0, 0
      );
      week.push(weekDay);
    }
    
    return week;
  };

  // Comparación robusta de fecha (día, mes, año) en hora local
  const isSameLocalDay = (a: Date, b: Date) => {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const getEventsForDay = (date: Date | null) => {
    if (!date) return [];
    const filtered = events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    );
    
    // Debug: mostrar eventos para días con muchos eventos
    if (filtered.length > 5) {
      console.log(`📅 ${date.toLocaleDateString()}: ${filtered.length} eventos`);
    }
    
    return filtered;
  };

  const getEventsForHour = (date: Date, hour: number) => {
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear() &&
        event.date.getHours() === hour
    );
  };

  const previousPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
      );
    } else if (viewMode === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const nextPeriod = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
      );
    } else if (viewMode === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  const getHeaderTitle = () => {
    if (viewMode === "month") {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (viewMode === "week") {
      const weekDays = getWeekDays(currentDate);
      const firstDay = weekDays[0];
      const lastDay = weekDays[6];

      if (firstDay.getMonth() === lastDay.getMonth()) {
        return `${monthNames[firstDay.getMonth()]} ${firstDay.getFullYear()}`;
      } else {
        return `${monthNames[firstDay.getMonth()]} - ${monthNames[lastDay.getMonth()]} ${firstDay.getFullYear()}`;
      }
    } else {
      return `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = getWeekDays(currentDate);
  const today = new Date();

  const renderMonthView = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      {/* Day headers */}
      <View style={styles.weekHeader}>
        {daysOfWeekShort.map((day, index) => (
          <View key={index} style={styles.dayHeaderCell}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Days grid */}
      <View style={styles.daysGrid}>
        {days.map((date, index) => {
          const dayEvents = getEventsForDay(date);
          const isToday =
            date &&
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isToday && styles.todayCell,
              ]}
              disabled={!date}
              onPress={() => {
                if (date) {
                  setCurrentDate(date);
                  setViewMode("day");
                }
              }}
              activeOpacity={0.7}
            >
              {date && (
                <View style={styles.dayCellContent}>
                  <Text style={[styles.dayNumber, isToday && styles.todayText]}>
                    {date.getDate()}
                  </Text>
                  <View style={styles.eventDots}>
                    {dayEvents.slice(0, 3).map((event) => (
                      <View
                        key={event.id}
                        style={[
                          styles.eventDot,
                          { backgroundColor: event.color },
                        ]}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <Text style={styles.moreEvents}>+{dayEvents.length - 3}</Text>
                    )}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Upcoming events */}
      <View style={styles.upcomingSection}>
        <Text style={styles.sectionTitle}>Próximos eventos</Text>
        {events
          .filter((e) => e.date >= today)
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .slice(0, 5)
          .map((event) => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => handleEventPress(event.id)}
              disabled={event.isReadOnly}
            >
              <View
                style={[styles.eventColorBox, { backgroundColor: event.color }]}
              />
              <View style={styles.eventInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  {event.isExternal && (
                    <Ionicons name="cloud-outline" size={16} color="#10B981" />
                  )}
                  {event.isReadOnly && (
                    <Ionicons name="lock-closed-outline" size={14} color="#64748B" />
                  )}
                </View>
                <Text style={styles.eventDate}>
                  {event.date.toLocaleDateString("es", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  •{" "}
                  {event.date.toLocaleTimeString("es", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              {event.isShared && (
                <Ionicons name="heart" size={20} color="#FF4F81" />
              )}
            </TouchableOpacity>
          ))}
        {events.filter((e) => e.date >= today).length === 0 && (
          <View style={styles.noEventsContainer}>
            <Ionicons name="calendar-outline" size={32} color="#999" />
            <Text style={styles.noEventsText}>No hay eventos próximos</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderWeekView = () => {
    // Separar eventos de todo el día y eventos con hora
    const allDayEvents = events.filter(e => 
      e.isAllDay && weekDays.some(d => isSameLocalDay(d, e.date))
    );

    return (
      <View style={styles.weekViewContainer}>
        {/* Week header con días */}
        <View style={styles.weekViewHeader}>
          <View style={styles.weekTimeGutter} />
          {weekDays.map((date, index) => {
            const isToday =
              date.getDate() === today.getDate() &&
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear();

            return (
              <View key={index} style={styles.weekDayHeader}>
                <Text style={[styles.weekDayName, isToday && styles.weekDayNameToday]}>
                  {daysOfWeek[index].substring(0, 3)}
                </Text>
                <View
                  style={[
                    styles.weekDayNumber,
                    isToday && styles.weekDayNumberToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.weekDayNumberText,
                      isToday && styles.weekDayNumberTextToday,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Eventos de todo el día */}
        {allDayEvents.length > 0 && (
          <View style={styles.allDaySection}>
            <View style={{ flexDirection: 'row' }}>
              <View style={styles.allDayLabel}>
                <Text style={styles.allDayLabelText}>Todo el día</Text>
              </View>
              <View style={styles.allDayEventsContainer}>
                {weekDays.map((date, dayIndex) => {
                  const dayAllDayEvents = allDayEvents.filter(e => isSameLocalDay(e.date, date));

                  return (
                    <View key={dayIndex} style={styles.allDayColumn}>
                      {dayAllDayEvents.map((event) => (
                        <TouchableOpacity
                          key={event.id}
                          style={[
                            styles.allDayEvent, 
                            { backgroundColor: event.color },
                            event.isReadOnly && { opacity: 0.85 }
                          ]}
                          onPress={() => handleEventPress(event.id)}
                          disabled={event.isReadOnly}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={styles.allDayEventText} numberOfLines={1}>
                              {event.title}
                            </Text>
                            {event.isExternal && (
                              <Ionicons name="cloud-outline" size={10} color="white" />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Timeline con horas */}
        <ScrollView style={styles.weekScrollView}>
          <View style={styles.weekTimelineContainer}>
            {Array.from({ length: 24 }, (_, hour) => {
              const hourString = hour.toString().padStart(2, "0") + ":00";

              return (
                <View key={hour} style={styles.weekTimelineRow}>
                  {/* Columna de hora */}
                  <View style={styles.weekTimeColumn}>
                    <Text style={styles.weekTimeText}>{hourString}</Text>
                  </View>

                  {/* Columnas de días */}
                  {weekDays.map((date, dayIndex) => {
                    const isToday = isSameLocalDay(date, today);

                    // Obtener eventos de esta hora que NO sean de todo el día
                    const hourEvents = events.filter(
                      (event) =>
                        !event.isAllDay &&
                        isSameLocalDay(event.date, date) &&
                        event.date.getHours() === hour
                    );

                    // Detectar eventos que se superponen y asignar columnas
                    const eventsWithColumns: Array<{ event: typeof hourEvents[0], column: number, totalColumns: number }> = [];
                    
                    hourEvents.forEach((event, index) => {
                      const eventStart = event.date.getTime();
                      const eventEnd = event.endDate.getTime();
                      
                      // Encontrar qué columnas ya están ocupadas por eventos que se superponen
                      const usedColumns = new Set<number>();
                      
                      eventsWithColumns.forEach(({ event: existingEvent, column }) => {
                        const existingStart = existingEvent.date.getTime();
                        const existingEnd = existingEvent.endDate.getTime();
                        
                        // Si hay superposición, marcar esa columna como ocupada
                        if ((eventStart < existingEnd) && (existingStart < eventEnd)) {
                          usedColumns.add(column);
                        }
                      });
                      
                      // Asignar la primera columna disponible
                      let column = 0;
                      while (usedColumns.has(column)) {
                        column++;
                      }
                      
                      eventsWithColumns.push({ event, column, totalColumns: 1 });
                    });
                    
                    // Calcular el total de columnas necesarias
                    const maxColumn = eventsWithColumns.reduce((max, e) => Math.max(max, e.column), 0);
                    const totalColumns = maxColumn + 1;
                    
                    // Actualizar totalColumns para todos los eventos
                    eventsWithColumns.forEach(e => e.totalColumns = totalColumns);

                    return (
                      <View
                        key={dayIndex}
                        style={[
                          styles.weekDayCell,
                          isToday && styles.weekDayCellToday,
                        ]}
                      >
                        {eventsWithColumns.map(({ event, column, totalColumns }) => {
                          const minute = event.date.getMinutes();
                          const minuteOffset = (minute / 60) * 60; // Offset en px desde el inicio de la hora
                          
                          // Calcular altura basada en duración
                          const durationMs = event.endDate.getTime() - event.date.getTime();
                          const durationHours = durationMs / (1000 * 60 * 60);
                          const eventHeight = Math.max(40, durationHours * 60); // Mínimo 40px
                          
                          // Posicionamiento horizontal basado en columna asignada
                          const eventWidthPercent = totalColumns > 1 ? 95 / totalColumns : 100;
                          const marginLeftPercent = column * (100 / totalColumns);
                          
                          return (
                          <TouchableOpacity
                            key={event.id}
                            style={[
                              styles.weekTimeEvent,
                              { 
                                backgroundColor: event.color, 
                                minHeight: eventHeight,
                                width: `${eventWidthPercent}%`,
                                marginLeft: `${marginLeftPercent}%`,
                                position: 'absolute',
                                top: minuteOffset,
                              },
                              event.isReadOnly && { opacity: 0.85 }
                            ]}
                              onPress={() => handleEventPress(event.id)}
                              disabled={event.isReadOnly}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Text style={styles.weekTimeEventTitle} numberOfLines={1}>
                                  {event.title}
                                </Text>
                                {event.isExternal && (
                                  <Ionicons name="cloud-outline" size={12} color="white" />
                                )}
                              </View>
                              <Text style={styles.weekTimeEventTime}>
                                {event.date.toLocaleTimeString("es", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Text>
                            </TouchableOpacity>
                            );
                        })}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderDayView = () => {
    // Separar eventos de todo el día
    const dayAllDayEvents = events.filter(e => 
      e.isAllDay &&
      e.date.getDate() === currentDate.getDate() &&
      e.date.getMonth() === currentDate.getMonth() &&
      e.date.getFullYear() === currentDate.getFullYear()
    );

    return (
      <View style={styles.dayViewContainer}>
        {/* Day header */}
        <View style={styles.dayViewHeader}>
          <Text style={styles.dayViewDayName}>
            {daysOfWeek[currentDate.getDay()]}
          </Text>
          <Text style={styles.dayViewDate}>{currentDate.getDate()}</Text>
        </View>

        {/* Eventos de todo el día */}
        {dayAllDayEvents.length > 0 && (
          <View style={styles.dayAllDaySection}>
            <Text style={styles.dayAllDayTitle}>Todo el día</Text>
            {dayAllDayEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[styles.dayAllDayEvent, { backgroundColor: event.color }]}
                onPress={() => handleEventPress(event.id)}
                disabled={event.isReadOnly}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.dayAllDayEventText}>{event.title}</Text>
                  {event.isExternal && (
                    <Ionicons name="cloud-outline" size={14} color="white" />
                  )}
                </View>
                {event.isShared && (
                  <Ionicons name="heart" size={16} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Timeline */}
        <ScrollView style={styles.scrollView}>
          <View style={styles.timeline}>
            {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
              // Filtrar eventos que NO sean de todo el día
              const hourEvents = events.filter(
                (event) =>
                  !event.isAllDay &&
                  event.date.getDate() === currentDate.getDate() &&
                  event.date.getMonth() === currentDate.getMonth() &&
                  event.date.getFullYear() === currentDate.getFullYear() &&
                  event.date.getHours() === hour
              );
              
              // Detectar eventos que se superponen y asignar columnas
              const eventsWithColumns: Array<{ event: typeof hourEvents[0], column: number, totalColumns: number }> = [];
              
              hourEvents.forEach((event, index) => {
                const eventStart = event.date.getTime();
                const eventEnd = event.endDate.getTime();
                
                // Encontrar qué columnas ya están ocupadas por eventos que se superponen
                const usedColumns = new Set<number>();
                
                eventsWithColumns.forEach(({ event: existingEvent, column }) => {
                  const existingStart = existingEvent.date.getTime();
                  const existingEnd = existingEvent.endDate.getTime();
                  
                  // Si hay superposición, marcar esa columna como ocupada
                  if ((eventStart < existingEnd) && (existingStart < eventEnd)) {
                    usedColumns.add(column);
                  }
                });
                
                // Asignar la primera columna disponible
                let column = 0;
                while (usedColumns.has(column)) {
                  column++;
                }
                
                eventsWithColumns.push({ event, column, totalColumns: 1 });
              });
              
              // Calcular el total de columnas necesarias
              const maxColumn = eventsWithColumns.reduce((max, e) => Math.max(max, e.column), 0);
              const totalColumns = maxColumn + 1;
              
              // Actualizar totalColumns para todos los eventos
              eventsWithColumns.forEach(e => e.totalColumns = totalColumns);
              
              const hourString = hour.toString().padStart(2, "0") + ":00";

              return (
                <View key={hour} style={styles.timelineRow}>
                  <View style={styles.timelineHour}>
                    <Text style={styles.timelineHourText}>{hourString}</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    {hourEvents.length > 0 ? (
                      <View style={styles.timelineEvents}>
                        {eventsWithColumns.map(({ event, column, totalColumns }) => {
                          const minute = event.date.getMinutes();
                          const minuteOffset = (minute / 60) * 60; // Offset en px desde el inicio de la hora
                          
                          // Calcular altura basada en duración (1 hora = 60px)
                          const durationMs = event.endDate.getTime() - event.date.getTime();
                          const durationHours = durationMs / (1000 * 60 * 60);
                          const eventHeight = Math.max(60, durationHours * 60); // Mínimo 60px
                          
                          // Posicionamiento horizontal basado en columna asignada
                          const eventWidthPercent = totalColumns > 1 ? 95 / totalColumns : 100;
                          const marginLeftPercent = column * (100 / totalColumns);
                          
                          return (
                          <TouchableOpacity
                            key={event.id}
                            style={[
                              styles.timelineEventCard,
                              { 
                                backgroundColor: event.color, 
                                minHeight: eventHeight,
                                width: `${eventWidthPercent}%`,
                                marginLeft: `${marginLeftPercent}%`,
                                position: 'absolute',
                                top: minuteOffset,
                              },
                              event.isReadOnly && { opacity: 0.85 }
                            ]}
                            onPress={() => handleEventPress(event.id)}
                            disabled={event.isReadOnly}
                          >
                            <View style={styles.timelineEventContent}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={styles.timelineEventTitle} numberOfLines={1}>
                                  {event.title}
                                </Text>
                                {event.isExternal && (
                                  <Ionicons name="cloud-outline" size={14} color="white" />
                                )}
                              </View>
                              <Text style={styles.timelineEventTime}>
                                {event.date.toLocaleTimeString("es", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Text>
                            </View>
                            {event.isShared && (
                              <Ionicons name="heart" size={20} color="white" />
                            )}
                          </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={previousPeriod}
          >
            <Ionicons name="chevron-back" size={20} color="#1A1A1A" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
            <TouchableOpacity
              style={styles.todayButton}
              onPress={() => setCurrentDate(new Date())}
            >
              <Text style={styles.todayButtonText}>Hoy</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.navButton}
            onPress={nextPeriod}
          >
            <Ionicons name="chevron-forward" size={20} color="#1A1A1A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(events)/create-event')}
          >
            <LinearGradient
              colors={["#FF4F81", "#8A2BE2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* View mode selector */}
        <View style={styles.viewModeContainer}>
          <View style={styles.viewModeSelector}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === "month" && styles.viewModeButtonActive,
              ]}
              onPress={() => setViewMode("month")}
            >
              {viewMode === "month" ? (
                <LinearGradient
                  colors={["#FF4F81", "#8A2BE2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.viewModeButtonGradient}
                >
                  <Ionicons name="calendar" size={16} color="white" />
                  <Text style={styles.viewModeTextActive}>Mes</Text>
                </LinearGradient>
              ) : (
                <>
                  <Ionicons name="calendar-outline" size={16} color="#1A1A1A66" />
                  <Text style={styles.viewModeText}>Mes</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === "week" && styles.viewModeButtonActive,
              ]}
              onPress={() => setViewMode("week")}
            >
              {viewMode === "week" ? (
                <LinearGradient
                  colors={["#FF4F81", "#8A2BE2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.viewModeButtonGradient}
                >
                  <Ionicons name="calendar" size={16} color="white" />
                  <Text style={styles.viewModeTextActive}>Semana</Text>
                </LinearGradient>
              ) : (
                <>
                  <Ionicons name="calendar-outline" size={16} color="#1A1A1A66" />
                  <Text style={styles.viewModeText}>Semana</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === "day" && styles.viewModeButtonActive,
              ]}
              onPress={() => setViewMode("day")}
            >
              {viewMode === "day" ? (
                <LinearGradient
                  colors={["#FF4F81", "#8A2BE2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.viewModeButtonGradient}
                >
                  <Ionicons name="time" size={16} color="white" />
                  <Text style={styles.viewModeTextActive}>Día</Text>
                </LinearGradient>
              ) : (
                <>
                  <Ionicons name="time-outline" size={16} color="#1A1A1A66" />
                  <Text style={styles.viewModeText}>Día</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      {viewMode === "month" && renderMonthView()}
      {viewMode === "week" && renderWeekView()}
      {viewMode === "day" && renderDayView()}

      {/* Modal de detalles del evento */}
      <EventDetailsModal
        visible={showEventModal}
        event={selectedEvent}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onRefresh={loadApprovedEvents}
      />

      {/* Modal de detalles de evento externo */}
      <ExternalEventDetailModal
        visible={showExternalEventModal}
        event={externalEventDetails}
        onClose={() => {
          setShowExternalEventModal(false);
          setExternalEventDetails(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#F5F5F5",
    paddingTop: 50,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  linkButton: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
  },
  linkButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  linkButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  navButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  headerTitle: {
    fontSize: 18,
    color: "#1A1A1A",
    fontWeight: "600",
    textAlign: "center",
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: "#FF4F8120",
    borderRadius: 12,
  },
  todayButtonText: {
    fontSize: 12,
    color: "#FF4F81",
    fontWeight: "600",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  addButtonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  viewModeContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  viewModeSelector: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  viewModeButtonActive: {
    overflow: "hidden",
  },
  viewModeButtonGradient: {
    flex: 1,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
  },
  viewModeText: {
    fontSize: 14,
    color: "#1A1A1A66",
    marginLeft: 8,
  },
  viewModeTextActive: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    color: "#1A1A1A66",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.28571%", // 100% / 7 días
    aspectRatio: 1,
    padding: 2,
    borderRadius: 12,
  },
  todayCell: {
    backgroundColor: "rgba(255, 79, 129, 0.1)",
  },
  dayCellContent: {
    flex: 1,
  },
  dayNumber: {
    fontSize: 14,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 4,
  },
  todayText: {
    color: "#FF4F81",
    fontWeight: "600",
  },
  eventDots: {
    flexDirection: "column",
    gap: 2,
    alignItems: "center",
  },
  eventDot: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  moreEvents: {
    fontSize: 10,
    color: "#1A1A1A66",
    textAlign: "center",
  },
  upcomingSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#1A1A1A",
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#F5F5F5",
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  eventColorBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  eventDate: {
    fontSize: 14,
    color: "#1A1A1A66",
    marginTop: 2,
  },
  noEventsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  noEventsText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  // Vista Semanal - Estilo Google Calendar
  weekViewContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  weekViewHeader: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    paddingVertical: 8,
  },
  weekTimeGutter: {
    width: 60,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  weekDayName: {
    fontSize: 11,
    color: "#666",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  weekDayNameToday: {
    color: "#FF4F81",
    fontWeight: "600",
  },
  weekDayNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  weekDayNumberToday: {
    backgroundColor: "#FF4F81",
  },
  weekDayNumberText: {
    fontSize: 18,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  weekDayNumberTextToday: {
    color: "white",
    fontWeight: "600",
  },
  // Sección de eventos de todo el día
  allDaySection: {
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  allDayLabel: {
    width: 60,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  allDayLabelText: {
    fontSize: 10,
    color: "#666",
    textTransform: "uppercase",
  },
  allDayEventsContainer: {
    flex: 1,
    flexDirection: "row",
    paddingBottom: 8,
  },
  allDayColumn: {
    flex: 1,
    paddingHorizontal: 2,
  },
  allDayEvent: {
    borderRadius: 4,
    padding: 6,
    marginBottom: 4,
  },
  allDayEventText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  // Timeline de horas
  weekScrollView: {
    flex: 1,
  },
  weekTimelineContainer: {
    flexDirection: "column",
  },
  weekTimelineRow: {
    flexDirection: "row",
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  weekTimeColumn: {
    width: 60,
    paddingTop: 4,
    paddingRight: 8,
    alignItems: "flex-end",
  },
  weekTimeText: {
    fontSize: 11,
    color: "#999",
  },
  weekDayCell: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: "#F0F0F0",
    position: "relative",
  },
  weekDayCellToday: {
    backgroundColor: "rgba(255, 79, 129, 0.02)",
  },
  weekTimeEvent: {
    position: "absolute",
    left: 2,
    right: 2,
    top: 2,
    borderRadius: 4,
    padding: 4,
    zIndex: 1,
  },
  weekTimeEventTitle: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 2,
  },
  weekTimeEventTime: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.9)",
  },
  // Mantener estilos antiguos para compatibilidad
  weekGrid: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
    minHeight: 400,
  },
  weekDayColumn: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#F5F5F5",
    borderRadius: 16,
    padding: 8,
    gap: 8,
  },
  weekDayColumnToday: {
    borderColor: "#FF4F8166",
    backgroundColor: "rgba(255, 79, 129, 0.05)",
  },
  weekEventCard: {
    padding: 8,
    borderRadius: 12,
  },
  weekEventTitle: {
    fontSize: 12,
    color: "white",
    fontWeight: "500",
  },
  weekEventTime: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  weekEventTimeText: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.8)",
  },
  dayViewHeader: {
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingVertical: 16,
  },
  dayViewDayName: {
    fontSize: 14,
    color: "#1A1A1A66",
    marginBottom: 4,
  },
  dayViewDate: {
    fontSize: 24,
    color: "#1A1A1A",
    fontWeight: "600",
  },
  timeline: {
    padding: 16,
  },
  timelineRow: {
    flexDirection: "row",
    minHeight: 60,
    gap: 12,
  },
  timelineHour: {
    width: 64,
    paddingTop: 4,
  },
  timelineHourText: {
    fontSize: 14,
    color: "#1A1A1A66",
  },
  timelineContent: {
    flex: 1,
    borderLeftWidth: 2,
    borderLeftColor: "#F5F5F5",
    paddingLeft: 12,
    paddingBottom: 8,
  },
  timelineEvents: {
    position: 'relative',
    minHeight: 60,
    width: '100%',
  },
  timelineEventCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    gap: 8,
  },
  timelineEventContent: {
    flex: 1,
  },
  timelineEventTitle: {
    fontSize: 16,
    color: "white",
    fontWeight: "500",
    marginBottom: 4,
  },
  timelineEventTime: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  // Day view - all-day events styles
  dayViewContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  dayAllDaySection: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  dayAllDayTitle: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  dayAllDayEvent: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  dayAllDayEventText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    flex: 1,
  },
});

