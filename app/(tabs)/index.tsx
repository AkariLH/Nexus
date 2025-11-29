import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, ActivityIndicator } from "react-native";
import { MotiView } from "moti";
import { useAuth } from "../../context/AuthContext";
import { useQuestionnaireGuard } from "../../hooks/useQuestionnaireGuard";
import eventService from "../../services/event.service";

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

  const fetchLinkStatus = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const response = await fetch(`http://192.168.1.95:8080/api/link/status/${user.userId}`);
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

  // Verificar cada vez que el tab obtiene foco
  useFocusEffect(
    useCallback(() => {
      console.log('📍 Tab de inicio enfocado - verificando estado...');
      fetchLinkStatus();
      loadPendingCount();
    }, [fetchLinkStatus, loadPendingCount])
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
});

