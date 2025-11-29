import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, ActivityIndicator } from "react-native";
import { MotiView } from "moti";
import { useAuth } from "../../context/AuthContext";
import { useQuestionnaireGuard } from "../../hooks/useQuestionnaireGuard";
import eventService, { EventResponse } from "../../services/event.service";
import { API_CONFIG } from "../../config/api.config";

interface LinkStatus {
  hasActiveLink: boolean;
  partner?: {
    userId: number;
    displayName: string;
    nickname: string;
    linkedAt: string;
  };
}

export default function HomeScreen() {
  useQuestionnaireGuard();
  const router = useRouter();
  const { user } = useAuth();
  const [linkStatus, setLinkStatus] = useState<LinkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState<EventResponse[]>([]);

  const fetchLinkStatus = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/link/status/${user.userId}`);
      if (response.ok) {
        const data: LinkStatus = await response.json();
        setLinkStatus(data);
      }
    } catch (error) {
      console.error("Error al obtener estado del vínculo:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  const loadPendingCount = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const pendingEvents = await eventService.getPendingApprovalEvents(user.userId);
      setPendingCount(pendingEvents.length);
    } catch (error: any) {
      // Si hay error (por ejemplo, sin vínculo activo), establecer contador en 0
      setPendingCount(0);
    }
  }, [user?.userId]);

  const loadUpcomingEvents = useCallback(async () => {
    if (!user?.userId || !linkStatus?.hasActiveLink) {
      setUpcomingEvents([]);
      return;
    }

    try {
      console.log('📅 Cargando próximos eventos...');
      const allEvents = await eventService.getUserEvents(user.userId);
      
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const upcoming = allEvents
        .filter(e => e.fullyApproved)
        .filter(e => {
          const start = new Date(e.startDateTime);
          return start >= now && start <= sevenDaysFromNow;
        })
        .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
        .slice(0, 5); // Limitar a 5 eventos
      
      console.log(`✅ ${upcoming.length} eventos próximos encontrados`);
      setUpcomingEvents(upcoming);
    } catch (error) {
      console.error('❌ Error cargando próximos eventos:', error);
      setUpcomingEvents([]);
    }
  }, [user?.userId, linkStatus?.hasActiveLink]);

  // Verificar cada vez que el tab obtiene foco
  useFocusEffect(
    useCallback(() => {
      console.log('📍 Tab de inicio enfocado - verificando estado...');
      fetchLinkStatus();
      loadPendingCount();
      loadUpcomingEvents();
    }, [fetchLinkStatus, loadPendingCount, loadUpcomingEvents])
  );

  const isLinked = linkStatus?.hasActiveLink || false;
  const partnerName = linkStatus?.partner?.displayName || linkStatus?.partner?.nickname || "";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 600 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Hola, {user?.displayName || user?.nickname || "Usuario"} 👋</Text>
            <Text style={styles.subtitle}>
              {isLinked ? `Conectado con ${partnerName} ❤️` : "Bienvenido a Nexus"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/(events)/notifications')}
          >
            <Ionicons name="notifications-outline" size={26} color="#333" />
            {pendingCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {pendingCount > 9 ? '9+' : pendingCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </MotiView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4F81" />
        </View>
      ) : (
        <>
          {/* Dashboard - Accesos rápidos */}
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 600, delay: 200 }}
          >
            <Text style={styles.sectionTitle}>Accesos rápidos</Text>
            <View style={styles.quickActionsGrid}>
              {/* Mis Eventos */}
              <TouchableOpacity
                style={[styles.quickActionCard, !isLinked && styles.quickActionDisabled]}
                onPress={() => isLinked && router.push("/(events)/my-events")}
                activeOpacity={0.8}
                disabled={!isLinked}
              >
                <LinearGradient
                  colors={isLinked ? ["#8B5CF6", "#EC4899"] : ["#CCC", "#999"]}
                  style={styles.quickActionGradient}
                >
                  <Ionicons name="list" size={32} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.quickActionLabel, !isLinked && styles.quickActionLabelDisabled]}>
                  Mis Eventos
                </Text>
                {!isLinked && (
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed" size={12} color="#999" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Crear Evento */}
              <TouchableOpacity
                style={[styles.quickActionCard, !isLinked && styles.quickActionDisabled]}
                onPress={() => isLinked && router.push("/(events)/create-event")}
                activeOpacity={0.8}
                disabled={!isLinked}
              >
                <LinearGradient
                  colors={isLinked ? ["#FF4F81", "#8A2BE2"] : ["#CCC", "#999"]}
                  style={styles.quickActionGradient}
                >
                  <Ionicons name="add-circle" size={32} color="#FFF" />
                </LinearGradient>
                <Text style={[styles.quickActionLabel, !isLinked && styles.quickActionLabelDisabled]}>
                  Crear Evento
                </Text>
                {!isLinked && (
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed" size={12} color="#999" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </MotiView>

          {/* Mensaje informativo si no está vinculado */}
          {!isLinked && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "spring", delay: 400 }}
              style={styles.infoCard}
            >
              <View style={styles.infoIconContainer}>
                <Ionicons name="information-circle" size={24} color="#8A2BE2" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Funciones limitadas</Text>
                <Text style={styles.infoDescription}>
                  Necesitas estar vinculado para acceder al calendario y otras funciones
                </Text>
              </View>
            </MotiView>
          )}

          {/* Próximos eventos (próximos 7 días) */}
          {isLinked && upcomingEvents.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "spring", delay: 500 }}
              style={{ marginTop: 8 }}
            >
              <Text style={styles.sectionTitle}>Próximos eventos</Text>
              <View style={styles.upcomingEventsContainer}>
                {upcomingEvents.map((event, index) => {
                  const startDate = new Date(event.startDateTime);
                  const endDate = new Date(event.endDateTime);
                  const dayName = startDate.toLocaleDateString('es-ES', { weekday: 'short' });
                  const dayNumber = startDate.getDate();
                  const month = startDate.toLocaleDateString('es-ES', { month: 'short' });
                  const startTime = startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                  const endTime = endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <TouchableOpacity
                      key={`${event.id}-${index}`}
                      style={styles.upcomingEventCard}
                      onPress={() => router.push('/(tabs)/calendario')}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.eventDateBadge, { backgroundColor: event.color || '#8B5CF6' }]}>
                        <Text style={styles.eventDayName}>{dayName.toUpperCase()}</Text>
                        <Text style={styles.eventDayNumber}>{dayNumber}</Text>
                        <Text style={styles.eventMonth}>{month.toUpperCase()}</Text>
                      </View>
                      <View style={styles.eventDetailsContainer}>
                        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                        <View style={styles.eventTimeRow}>
                          <Ionicons name="time-outline" size={14} color="#666" />
                          <Text style={styles.eventTime}>{startTime} - {endTime}</Text>
                        </View>
                        {event.location && (
                          <View style={styles.eventLocationRow}>
                            <Ionicons name="location-outline" size={14} color="#666" />
                            <Text style={styles.eventLocation} numberOfLines={1}>{event.location}</Text>
                          </View>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </MotiView>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF4F81',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#F5F5F5',
  },
  notificationBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },

  // Dashboard - Accesos rápidos
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  quickActionCard: {
    width: '47%',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  quickActionDisabled: {
    opacity: 0.6,
  },
  quickActionGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  quickActionLabelDisabled: {
    color: '#999',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF5010',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  lockedBadge: {
    backgroundColor: '#F5F5F5',
    padding: 6,
    borderRadius: 12,
    marginTop: 8,
  },

  // Card informativa
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#8A2BE210",
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#8A2BE2",
    elevation: 2,
    shadowColor: "#8A2BE2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoIconContainer: {
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },

  // Próximos eventos
  upcomingEventsContainer: {
    gap: 12,
  },
  upcomingEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventDateBadge: {
    width: 60,
    height: 70,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  eventDayName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
    opacity: 0.9,
  },
  eventDayNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginVertical: 2,
  },
  eventMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
    opacity: 0.9,
  },
  eventDetailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eventTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 13,
    color: '#666',
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventLocation: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
});

