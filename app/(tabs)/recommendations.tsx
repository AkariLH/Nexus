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
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useAvailability } from "../../context/AvailabilityContext";
import { useQuestionnaireGuard } from "../../hooks/useQuestionnaireGuard";
import { findMutualAvailability, MutualAvailabilityResponse } from "../../services/availabilityService";
import { API_CONFIG } from "../../config/api.config";

interface LinkStatusData {
  hasActiveLink: boolean;
  partner?: {
    userId: number;
    displayName: string;
    nickname: string;
  };
}

export default function RecommendationsScreen() {
  useQuestionnaireGuard();
  const { user } = useAuth();
  const router = useRouter();
  const { loading: contextLoading, refreshAvailability } = useAvailability();
  
  const [linkStatus, setLinkStatus] = useState<LinkStatusData | null>(null);
  const [mutualAvailability, setMutualAvailability] = useState<MutualAvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const checkLinkStatus = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/link/status/${user.userId}`);
      
      if (response.ok) {
        const data: LinkStatusData = await response.json();
        setLinkStatus(data);
      }
    } catch (error) {
      console.error('Error verificando estado del vínculo:', error);
    }
  }, [user?.userId]);

  const loadMutualAvailability = useCallback(async () => {
    if (!user?.userId || !linkStatus?.partner?.userId) return;

    try {
      console.log(`🔍 Cargando disponibilidad mutua entre ${user.userId} y ${linkStatus.partner.userId}`);
      const mutual = await findMutualAvailability(user.userId, linkStatus.partner.userId, 7);
      console.log('✅ Disponibilidad mutua cargada:', mutual);
      setMutualAvailability(mutual);
    } catch (error) {
      console.error('❌ Error cargando disponibilidad mutua:', error);
    }
  }, [user?.userId, linkStatus?.partner?.userId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await checkLinkStatus();
    setLoading(false);
  }, [checkLinkStatus]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAvailability();
    await checkLinkStatus();
    setRefreshing(false);
  }, [refreshAvailability, checkLinkStatus]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Cargar disponibilidad mutua cuando cambie el link status
  useFocusEffect(
    useCallback(() => {
      if (linkStatus?.hasActiveLink) {
        loadMutualAvailability();
      }
    }, [linkStatus?.hasActiveLink, loadMutualAvailability])
  );

  const formatDate = (dateStr: string) => {
    // Parsear la fecha en formato YYYY-MM-DD como fecha local (no UTC)
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month es 0-indexed
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
      return "Hoy";
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return "Mañana";
    } else {
      return date.toLocaleDateString("es-MX", { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const getDayName = (dayOfWeek: string) => {
    const days: Record<string, string> = {
      'MONDAY': 'Lunes',
      'TUESDAY': 'Martes',
      'WEDNESDAY': 'Miércoles',
      'THURSDAY': 'Jueves',
      'FRIDAY': 'Viernes',
      'SATURDAY': 'Sábado',
      'SUNDAY': 'Domingo'
    };
    return days[dayOfWeek] || dayOfWeek;
  };

  if (loading || contextLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={["#FF4F81", "#8A2BE2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.iconGradient}
            >
              <Ionicons name="bulb" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.headerTitle}>Recomendaciones</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4F81" />
          <Text style={styles.loadingText}>Calculando disponibilidad...</Text>
        </View>
      </View>
    );
  }

  const hasActiveLink = linkStatus?.hasActiveLink && linkStatus?.partner;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={["#FF4F81", "#8A2BE2"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.iconGradient}
          >
            <Ionicons name="bulb" size={24} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.headerTitle}>Recomendaciones</Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/(settings)/availability-schedule')}
          style={styles.settingsButton}
        >
          <Ionicons name="settings-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#FF4F81']} />
        }
      >
        {/* Solo mostrar disponibilidad mutua */}
        {!hasActiveLink ? (
          <View style={styles.emptyCard}>
            <Ionicons name="link-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Sin vínculo activo</Text>
            <Text style={styles.emptyText}>
              Necesitas tener un vínculo activo para ver recomendaciones de horarios en común
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/link')}
              style={styles.linkButton}
            >
              <LinearGradient
                colors={["#FF4F81", "#8A2BE2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.linkButtonGradient}
              >
                <Ionicons name="link" size={20} color="#FFFFFF" />
                <Text style={styles.linkButtonText}>Gestionar vínculo</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : !mutualAvailability || mutualAvailability.totalDaysWithMutualAvailability === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-clear-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Sin coincidencias</Text>
            <Text style={styles.emptyText}>
              No hay horarios libres en común con {linkStatus?.partner?.nickname || 'tu pareja'} en los próximos 7 días
            </Text>
            <Text style={styles.emptySubtext}>
              Se consideran eventos personales (calendarios externos) y eventos creados en la app
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={24} color="#8A2BE2" />
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Horarios disponibles en común</Text>
                <Text style={styles.sectionSubtitle}>
                  Con {linkStatus?.partner?.nickname || 'tu pareja'}
                </Text>
              </View>
            </View>

            <View style={styles.statsCard}>
              <LinearGradient
                colors={["#8A2BE2", "#FF4F81"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.statsGradient}
              >
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {mutualAvailability.totalDaysWithMutualAvailability}
                  </Text>
                  <Text style={styles.statLabel}>días compatibles</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Math.floor(mutualAvailability.totalMutualMinutes / 60)}h {mutualAvailability.totalMutualMinutes % 60}m
                  </Text>
                  <Text style={styles.statLabel}>tiempo total</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {mutualAvailability.mutualAvailability.reduce(
                      (acc, day) => acc + day.mutualFreeSlots.length,
                      0
                    )}
                  </Text>
                  <Text style={styles.statLabel}>momentos en común</Text>
                </View>
              </LinearGradient>
            </View>

            <View style={styles.daysContainer}>
              {mutualAvailability.mutualAvailability.map((day, index) => (
                <View key={index} style={styles.mutualDayCard}>
                  <View style={styles.dayHeader}>
                    <View>
                      <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
                      <Text style={styles.dayName}>{getDayName(day.dayOfWeek)}</Text>
                    </View>
                    <View style={styles.dayStats}>
                      <Ionicons name="time-outline" size={16} color="#8A2BE2" />
                      <Text style={styles.dayMinutes}>
                        {Math.floor(day.totalMutualMinutes / 60)}h {day.totalMutualMinutes % 60}m
                      </Text>
                    </View>
                  </View>
                  <View style={styles.slotsContainer}>
                    {day.mutualFreeSlots.map((slot, slotIndex) => (
                      <View key={slotIndex} style={styles.mutualSlotChip}>
                        <Ionicons name="heart" size={14} color="#FF4F81" />
                        <Text style={styles.mutualSlotText}>
                          {slot.start} - {slot.end}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={styles.createEventButton}
                    onPress={() => {
                      router.push({
                        pathname: '/(events)/create-event',
                        params: { suggestedDate: day.date }
                      });
                    }}
                  >
                    <Text style={styles.createEventText}>Crear evento</Text>
                    <Ionicons name="add-circle" size={16} color="#8A2BE2" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsGradient: {
    flexDirection: 'row',
    padding: 20,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
  },
  daysContainer: {
    gap: 12,
  },
  mutualDayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FF4F81',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  dayName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  dayStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8A2BE210',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  dayMinutes: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A2BE2',
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  mutualSlotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FF4F8110',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF4F8130',
  },
  mutualSlotText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF4F81',
  },
  createEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  createEventText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8A2BE2',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  linkButton: {
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  linkButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 40,
  },
});
