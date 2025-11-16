import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

type ViewMode = "month" | "week" | "day";

interface Event {
  id: string;
  title: string;
  date: Date;
  color: string;
  isShared: boolean;
}

// Mock events - reemplaza con tus datos reales
const mockEvents: Event[] = [
  {
    id: "1",
    title: "Cita romántica",
    date: new Date(2025, 10, 20, 19, 0),
    color: "#FF4F81",
    isShared: true,
  },
  {
    id: "2",
    title: "Aniversario",
    date: new Date(2025, 10, 25, 12, 0),
    color: "#8A2BE2",
    isShared: true,
  },
];

export default function CalendarioScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [events] = useState<Event[]>(mockEvents);

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
            <View
              key={index}
              style={[
                styles.dayCell,
                isToday && styles.todayCell,
              ]}
            >
              {date && (
                <View style={styles.dayCellContent}>
                  <Text style={[styles.dayNumber, isToday && styles.todayText]}>
                    {date.getDate()}
                  </Text>
                  <View style={styles.eventDots}>
                    {dayEvents.slice(0, 2).map((event) => (
                      <View
                        key={event.id}
                        style={[
                          styles.eventDot,
                          { backgroundColor: event.color },
                        ]}
                      >
                        {event.isShared && (
                          <Ionicons name="heart" size={8} color="white" />
                        )}
                      </View>
                    ))}
                    {dayEvents.length > 2 && (
                      <Text style={styles.moreEvents}>+{dayEvents.length - 2}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>
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
              onPress={() => {
                // Navegar a detalles del evento
              }}
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
      </View>
    </ScrollView>
  );

  const renderWeekView = () => (
    <ScrollView style={styles.scrollView}>
      {/* Week header */}
      <View style={styles.weekViewHeader}>
        {weekDays.map((date, index) => {
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

          return (
            <View key={index} style={styles.weekDayHeader}>
              <Text style={styles.weekDayName}>{daysOfWeek[index]}</Text>
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

      {/* Week grid */}
      <View style={styles.weekGrid}>
        {weekDays.map((date, index) => {
          const dayEvents = getEventsForDay(date);
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

          return (
            <View
              key={index}
              style={[styles.weekDayColumn, isToday && styles.weekDayColumnToday]}
            >
              {dayEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={[styles.weekEventCard, { backgroundColor: event.color }]}
                >
                  <Text style={styles.weekEventTitle}>{event.title}</Text>
                  <View style={styles.weekEventTime}>
                    <Text style={styles.weekEventTimeText}>
                      {event.date.toLocaleTimeString("es", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {event.isShared && (
                      <Ionicons name="heart" size={12} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderDayView = () => (
    <ScrollView style={styles.scrollView}>
      {/* Day header */}
      <View style={styles.dayViewHeader}>
        <Text style={styles.dayViewDayName}>
          {daysOfWeek[currentDate.getDay()]}
        </Text>
        <Text style={styles.dayViewDate}>{currentDate.getDate()}</Text>
      </View>

      {/* Timeline */}
      <View style={styles.timeline}>
        {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
          const hourEvents = getEventsForHour(currentDate, hour);
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
  );

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

          <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>

          <TouchableOpacity
            style={styles.navButton}
            onPress={nextPeriod}
          >
            <Ionicons name="chevron-forward" size={20} color="#1A1A1A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              // Navegar a crear evento
            }}
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
  headerTitle: {
    fontSize: 18,
    color: "#1A1A1A",
    fontWeight: "600",
    minWidth: 180,
    textAlign: "center",
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
  weekViewHeader: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: "center",
  },
  weekDayName: {
    fontSize: 12,
    color: "#1A1A1A66",
    marginBottom: 4,
  },
  weekDayNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  weekDayNumberToday: {
    backgroundColor: "#FF4F81",
  },
  weekDayNumberText: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  weekDayNumberTextToday: {
    color: "white",
    fontWeight: "600",
  },
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
});
