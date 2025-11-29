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
import { expandRecurringEvent } from "../../utils/recurrenceUtils";
import { EventDetailsModal } from "../components/EventDetailsModal";

type ViewMode = "month" | "week" | "day";

interface Event {
  id: string;
  title: string;
  date: Date;
  endDate: Date;
  color: string;
  isShared: boolean;
  isAllDay: boolean;
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

  const checkLinkStatus = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const response = await fetch(`http://192.168.1.95:8080/api/link/status/${user.userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setHasActiveLink(data.hasActiveLink);
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
      
      // Filtrar solo eventos completamente aprobados
      const approvedEvents = userEvents.filter((event: EventResponse) => event.fullyApproved);
      
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
        
        // Verificar si es evento de todo el día
        const startDate = new Date(event.startDateTime);
        const endDate = new Date(event.endDateTime);
        const isAllDay = startDate.getHours() === 0 && startDate.getMinutes() === 0 &&
                        endDate.getHours() === 23 && endDate.getMinutes() === 59;
        
        if (event.isRecurring && event.recurrencePattern) {
          // Expandir el evento recurrente en múltiples ocurrencias
          const occurrences = expandRecurringEvent(
            {
              startDateTime: event.startDateTime,
              endDateTime: event.endDateTime,
              isRecurring: event.isRecurring,
              recurrencePattern: event.recurrencePattern,
            },
            startRange,
            endRange
          );

          console.log('Ocurrencias generadas:', occurrences.length);
          
          // Convertir las fechas de excepción a timestamps para comparación
          const exceptionTimestamps = (event.exceptionDates || []).map(dateStr => {
            const exceptionDate = new Date(dateStr);
            // Normalizar a medianoche para comparar solo la fecha
            return new Date(exceptionDate.getFullYear(), exceptionDate.getMonth(), exceptionDate.getDate()).getTime();
          });
          
          // Crear un evento para cada ocurrencia (filtrando excepciones)
          occurrences.forEach(occurrenceDate => {
            // Normalizar la fecha de ocurrencia a medianoche para comparar
            const normalizedOccurrence = new Date(
              occurrenceDate.getFullYear(),
              occurrenceDate.getMonth(),
              occurrenceDate.getDate()
            ).getTime();
            
            // Saltar esta ocurrencia si está en la lista de excepciones
            if (exceptionTimestamps.includes(normalizedOccurrence)) {
              console.log('Saltando ocurrencia excluida:', occurrenceDate);
              return;
            }
            
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

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error cargando eventos aprobados:', error);
    }
  }, [user?.userId]);

  const handleEventPress = (eventId: string) => {
    // Extraer el ID real del evento (quitar timestamp si es recurrente)
    const realEventId = eventId.includes('-') ? eventId.split('-')[0] : eventId;
    const fullEvent = fullEventsData.find(e => e.id === parseInt(realEventId));
    
    if (fullEvent) {
      setSelectedEvent(fullEvent);
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
      checkLinkStatus();
      loadApprovedEvents();
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
    const sunday = new Date(date);
    sunday.setDate(diff);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const weekDay = new Date(sunday);
      weekDay.setDate(sunday.getDate() + i);
      week.push(weekDay);
    }
    return week;
  };

  const getEventsForDay = (date: Date | null) => {
    if (!date) return [];
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    );
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
            >
              <View
                style={[styles.eventColorBox, { backgroundColor: event.color }]}
              />
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{event.title}</Text>
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
      e.isAllDay && weekDays.some(d => 
        d.getDate() === e.date.getDate() &&
        d.getMonth() === e.date.getMonth() &&
        d.getFullYear() === e.date.getFullYear()
      )
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
            <View style={styles.allDayLabel}>
              <Text style={styles.allDayLabelText}>Todo el día</Text>
            </View>
            <View style={styles.allDayEventsContainer}>
              {weekDays.map((date, dayIndex) => {
                const dayAllDayEvents = allDayEvents.filter(e =>
                  e.date.getDate() === date.getDate() &&
                  e.date.getMonth() === date.getMonth() &&
                  e.date.getFullYear() === date.getFullYear()
                );

                return (
                  <View key={dayIndex} style={styles.allDayColumn}>
                    {dayAllDayEvents.map((event) => (
                      <TouchableOpacity
                        key={event.id}
                        style={[styles.allDayEvent, { backgroundColor: event.color }]}
                        onPress={() => handleEventPress(event.id)}
                      >
                        <Text style={styles.allDayEventText} numberOfLines={1}>
                          {event.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })}
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
                    const isToday =
                      date.getDate() === today.getDate() &&
                      date.getMonth() === today.getMonth() &&
                      date.getFullYear() === today.getFullYear();

                    // Obtener eventos de esta hora que NO sean de todo el día
                    const hourEvents = events.filter(
                      (event) =>
                        !event.isAllDay &&
                        event.date.getDate() === date.getDate() &&
                        event.date.getMonth() === date.getMonth() &&
                        event.date.getFullYear() === date.getFullYear() &&
                        event.date.getHours() === hour
                    );

                    return (
                      <View
                        key={dayIndex}
                        style={[
                          styles.weekDayCell,
                          isToday && styles.weekDayCellToday,
                        ]}
                      >
                        {hourEvents.map((event) => (
                          <TouchableOpacity
                            key={event.id}
                            style={[
                              styles.weekTimeEvent,
                              { backgroundColor: event.color },
                            ]}
                            onPress={() => handleEventPress(event.id)}
                          >
                            <Text style={styles.weekTimeEventTitle} numberOfLines={1}>
                              {event.title}
                            </Text>
                            <Text style={styles.weekTimeEventTime}>
                              {event.date.toLocaleTimeString("es", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </Text>
                          </TouchableOpacity>
                        ))}
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
              >
                <Text style={styles.dayAllDayEventText}>{event.title}</Text>
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
              const hourString = hour.toString().padStart(2, "0") + ":00";

              return (
                <View key={hour} style={styles.timelineRow}>
                  <View style={styles.timelineHour}>
                    <Text style={styles.timelineHourText}>{hourString}</Text>
                  </View>
                  <View style={styles.timelineContent}>
                    {hourEvents.length > 0 ? (
                      <View style={styles.timelineEvents}>
                        {hourEvents.map((event) => (
                          <TouchableOpacity
                            key={event.id}
                            style={[
                              styles.timelineEventCard,
                              { backgroundColor: event.color },
                            ]}
                            onPress={() => handleEventPress(event.id)}
                          >
                            <View style={styles.timelineEventContent}>
                              <Text style={styles.timelineEventTitle}>
                                {event.title}
                              </Text>
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
                        ))}
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
    flexDirection: "row",
    paddingHorizontal: 60,
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
    gap: 8,
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

