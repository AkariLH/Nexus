import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, ActivityIndicator } from "react-native";
import { MotiView } from "moti";
import { useAuth } from "../../context/AuthContext";
import { useQuestionnaireGuard } from "../../hooks/useQuestionnaireGuard";
import eventService, { EventResponse } from "../../services/event.service";
import linkService from "../../services/link.service";
import { palette, gradients } from "../../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const insets = useSafeAreaInsets();
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
      const data: LinkStatus = await linkService.getLinkStatus(user.userId);
      setLinkStatus(data);
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
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 24 }]}>
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
            <Ionicons name="notifications-outline" size={26} color={palette.text} />
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
          <ActivityIndicator size="large" color={palette.primary} />
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
                  colors={isLinked ? gradients.primaryReversed : gradients.locked}
                  style={styles.quickActionGradient}
                >
                  <Ionicons name="list" size={32} color={palette.onPrimary} />
                </LinearGradient>
                <Text style={[styles.quickActionLabel, !isLinked && styles.quickActionLabelDisabled]}>
                  Mis Eventos
                </Text>
                {!isLinked && (
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed" size={12} color={palette.icon} />
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
                  colors={isLinked ? gradients.primary : gradients.locked}
                  style={styles.quickActionGradient}
                >
                  <Ionicons name="add-circle" size={32} color={palette.onPrimary} />
                </LinearGradient>
                <Text style={[styles.quickActionLabel, !isLinked && styles.quickActionLabelDisabled]}>
                  Crear Evento
                </Text>
                {!isLinked && (
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed" size={12} color={palette.icon} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Registrar estado de ánimo (RF-31) */}
              <TouchableOpacity
                style={styles.quickActionCard}
                onPress={() => router.push('/(mood)/mood-log')}
                activeOpacity={0.8}
              >
                <LinearGradient colors={gradients.primaryReversed} style={styles.quickActionGradient}>
                  <Ionicons name="happy" size={32} color={palette.onPrimary} />
                </LinearGradient>
                <Text style={styles.quickActionLabel}>¿Cómo estuvo tu día?</Text>
              </TouchableOpacity>

              {/* Banco de ideas (RF-34; RN-29: requiere vínculo) */}
              <TouchableOpacity
                style={[styles.quickActionCard, !isLinked && styles.quickActionDisabled]}
                onPress={() => isLinked && router.push('/(ideas)/idea-bank')}
                activeOpacity={0.8}
                disabled={!isLinked}
              >
                <LinearGradient
                  colors={isLinked ? gradients.primary : gradients.locked}
                  style={styles.quickActionGradient}
                >
                  <Ionicons name="bulb" size={32} color={palette.onPrimary} />
                </LinearGradient>
                <Text style={[styles.quickActionLabel, !isLinked && styles.quickActionLabelDisabled]}>
                  Banco de ideas
                </Text>
                {!isLinked && (
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed" size={12} color={palette.icon} />
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
                <Ionicons name="information-circle" size={24} color={palette.secondary} />
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
                      <View style={[styles.eventDateBadge, { backgroundColor: event.color || palette.secondary }]}>
                        <Text style={styles.eventDayName}>{dayName.toUpperCase()}</Text>
                        <Text style={styles.eventDayNumber}>{dayNumber}</Text>
                        <Text style={styles.eventMonth}>{month.toUpperCase()}</Text>
                      </View>
                      <View style={styles.eventDetailsContainer}>
                        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                        <View style={styles.eventTimeRow}>
                          <Ionicons name="time-outline" size={14} color={palette.textSecondary} />
                          <Text style={styles.eventTime}>{startTime} - {endTime}</Text>
                        </View>
                        {event.location && (
                          <View style={styles.eventLocationRow}>
                            <Ionicons name="location-outline" size={14} color={palette.textSecondary} />
                            <Text style={styles.eventLocation} numberOfLines={1}>{event.location}</Text>
                          </View>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={palette.icon} />
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
    backgroundColor: palette.surfaceMuted,
  },
  content: {
    padding: 20,
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
    color: palette.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: palette.textSecondary,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    elevation: 3,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: palette.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: palette.divider,
  },
  notificationBadgeText: {
    color: palette.onPrimary,
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
    color: palette.text,
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
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: palette.shadow,
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
    color: palette.text,
    textAlign: 'center',
  },
  quickActionLabelDisabled: {
    color: palette.textMuted,
  },
  lockedBadge: {
    backgroundColor: palette.surfaceMuted,
    padding: 6,
    borderRadius: 12,
    marginTop: 8,
  },

  // Card informativa
  infoCard: {
    flexDirection: "row",
    backgroundColor: palette.secondarySoft,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: palette.secondary,
    elevation: 2,
    shadowColor: palette.secondary,
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
    color: palette.text,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 12,
    color: palette.textSecondary,
    lineHeight: 18,
  },

  // Próximos eventos
  upcomingEventsContainer: {
    gap: 12,
  },
  upcomingEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    shadowColor: palette.shadow,
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
    color: palette.onPrimary,
    opacity: 0.9,
  },
  eventDayNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.onPrimary,
    marginVertical: 2,
  },
  eventMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: palette.onPrimary,
    opacity: 0.9,
  },
  eventDetailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: palette.text,
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
    color: palette.textSecondary,
  },
  eventLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventLocation: {
    fontSize: 13,
    color: palette.textSecondary,
    flex: 1,
  },
});

