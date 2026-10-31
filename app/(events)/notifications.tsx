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
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import eventService, { EventResponse } from "../../services/event.service";
import { ConfirmModal } from "../components/ConfirmModal";
import { externalCalendarIntegration } from "../../services/externalCalendar.integration.service";
import { palette, gradients } from "../../constants/colors";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { MetaLine } from "../../components/ui/Surface";
import { ResultModal } from "../components/ResultModal";
import { PlanSummaryCard } from "../components/PlanSummaryCard";
import { slotLabel } from "../../utils/recommendationFormat";
import appNotificationService, { AppNotification } from "../../services/appNotification.service";
import planningService from "../../services/planning.service";
import { noticeTime } from "../../utils/eventFormat";
import { routeForNotice } from "../../utils/pushRoute";

/** A8 / A9 (vista de la pareja): resultado de aceptar o rechazar una invitacion. */
interface Outcome {
  kind: "accepted" | "rejected";
  event: EventResponse | null;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [pendingEvents, setPendingEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingEventId, setProcessingEventId] = useState<number | null>(null);
  
  // Estados para modales
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);
  const [modalMessage, setModalMessage] = useState({ title: "", message: "" });
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [notices, setNotices] = useState<AppNotification[]>([]);
  const inviterName = outcome?.event?.creatorName || outcome?.event?.creatorNickname || "tu pareja";

  useFocusEffect(
    useCallback(() => {
      loadPendingEvents();
    }, [user?.userId])
  );

  const loadPendingEvents = async () => {
    if (!user?.userId) return;

    try {
      setLoading(true);
      const events = await eventService.getPendingApprovalEvents(user.userId);
      setPendingEvents(events);
      // B9: avisos de la planeacion en pareja; al verlos quedan leidos.
      try {
        const list = await appNotificationService.list(user.userId);
        setNotices(list.items);
        if (list.unread > 0) await appNotificationService.markAllRead(user.userId);
      } catch {
        setNotices([]);
      }
    } catch (error: any) {
      console.error('Error cargando eventos pendientes:', error);
      setModalMessage({
        title: "Error",
        message: "No se pudieron cargar las notificaciones"
      });
      setShowErrorModal(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (event: EventResponse) => {
    setSelectedEvent(event);
    setShowApproveModal(true);
  };
  
  const confirmApprove = async () => {
    if (!user?.userId || !selectedEvent) return;

    setShowApproveModal(false);
    setProcessingEventId(selectedEvent.id);
    
    try {
      await eventService.approveEvent(selectedEvent.id, user.userId);
      setOutcome({ kind: "accepted", event: selectedEvent });
      loadPendingEvents();
      // [sync-calendario] RF-22: ya no se pregunta; si eligio un calendario destino, se copia solo.
      if (Platform.OS !== "web") {
        externalCalendarIntegration.performPeriodicSync(user.userId).catch(() => undefined);
      }
    } catch (error: any) {
      console.error('Error aprobando evento:', error);
      setModalMessage({
        title: "Error",
        message: error.message || "No se pudo aprobar el evento"
      });
      setShowErrorModal(true);
    } finally {
      setProcessingEventId(null);
    }
  };

  const handleReject = async (event: EventResponse) => {
    setSelectedEvent(event);
    setShowRejectModal(true);
  };
  
  const confirmReject = async () => {
    if (!user?.userId || !selectedEvent) return;

    setShowRejectModal(false);
    setProcessingEventId(selectedEvent.id);
    
    try {
      await eventService.rejectEvent(selectedEvent.id, user.userId);
      setOutcome({ kind: "rejected", event: selectedEvent });
      loadPendingEvents();
    } catch (error: any) {
      console.error('Error rechazando evento:', error);
      setModalMessage({
        title: "Error",
        message: error.message || "No se pudo rechazar el evento"
      });
      setShowErrorModal(true);
    } finally {
      setProcessingEventId(null);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).replace(/\./g, '');
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getTimeAgo = (dateStr: string): string => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays} días`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
        <ScreenHeader title="Notificaciones" onBack={() => router.back()} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      {/* Header */}
      <ScreenHeader
        title="Notificaciones"
        onBack={() => router.back()}
        right={
          pendingEvents.length > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingEvents.length}</Text>
            </View>
          ) : undefined
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadPendingEvents();
            }}
            colors={[palette.primary]}
            tintColor={palette.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {pendingEvents.length === 0 && notices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="notifications-off-outline" size={64} color={palette.iconDisabled} />
            </View>
            <Text style={styles.emptyTitle}>No hay notificaciones</Text>
            <Text style={styles.emptyText}>
              Cuando tu pareja te invite a un evento, aparecerá aquí
            </Text>
          </View>
        ) : (
          <>
            {pendingEvents.length > 0 && <Text style={styles.sectionTitle}>Eventos pendientes</Text>}
            {pendingEvents.map((event) => {
              const inviter = event.creatorName || event.creatorNickname || "Tu pareja";
              const busy = processingEventId === event.id;
              return (
                <View key={event.id} style={styles.notificationCard}>
                  <View style={styles.notificationHeader}>
                    <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
                      <Text style={styles.avatarText}>{inviter.charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                    <View style={styles.notificationInfo}>
                      <Text style={styles.notificationName}>{inviter} te invita a una cita</Text>
                      <Text style={styles.notificationTime}>{getTimeAgo(event.createdAt)}</Text>
                    </View>
                  </View>

                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <MetaLine
                    icon="calendar-outline"
                    text={`${formatDate(event.startDateTime)} · ${formatTime(event.startDateTime)} – ${formatTime(event.endDateTime)}`}
                  />
                  {event.location ? <MetaLine icon="location-outline" text={event.location} /> : null}
                  {event.description ? <Text style={styles.descriptionText}>{event.description}</Text> : null}

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.rejectButton, busy && styles.actionButtonDisabled]}
                      onPress={() => handleReject(event)}
                      disabled={busy}
                      accessibilityRole="button"
                    >
                      <Text style={styles.rejectButtonText}>Rechazar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.approveButton, busy && styles.actionButtonDisabled]}
                      onPress={() => handleApprove(event)}
                      disabled={busy}
                      accessibilityRole="button"
                    >
                      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.approveButtonGradient}>
                        {busy ? (
                          <ActivityIndicator size="small" color={palette.onPrimary} />
                        ) : (
                          <Text style={styles.approveButtonText}>Aceptar</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {notices.length > 0 && <Text style={styles.sectionTitle}>Avisos</Text>}
            {notices.length > 0 && (
              <View style={styles.noticeList}>
                {notices.map((n) => {
                  // [avisos-calendario] El de libres juntos abre "Libres juntos"; los demas solo se leen.
                  const target = routeForNotice(n.type);
                  return (
                  <TouchableOpacity
                    key={n.id}
                    style={styles.noticeCard}
                    disabled={!target}
                    accessibilityRole={target ? "button" : undefined}
                    onPress={() => target && router.push(target as any)}
                  >
                    <LinearGradient colors={gradients.primary} style={styles.noticeIcon}>
                      <Ionicons name="heart-outline" size={20} color={palette.onPrimary} />
                    </LinearGradient>
                    <View style={styles.noticeText}>
                      <View style={styles.noticeHeader}>
                        <Text style={styles.noticeTitle}>{n.title}</Text>
                        <Text style={styles.noticeTime}>{noticeTime(n.createdAt, new Date())}</Text>
                      </View>
                      <Text style={styles.noticeBody}>{n.body}</Text>
                    </View>
                  </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
      
      {/* Modales de confirmación */}
      <ConfirmModal
        visible={showApproveModal}
        type="confirm"
        title="Aprobar evento"
        message={`¿Deseas aceptar "${selectedEvent?.title}"?`}
        confirmText="Aceptar"
        cancelText="Cancelar"
        onConfirm={confirmApprove}
        onCancel={() => setShowApproveModal(false)}
      />
      
      <ConfirmModal
        visible={showRejectModal}
        type="error"
        title="Rechazar evento"
        message={`¿Estás seguro de que deseas rechazar "${selectedEvent?.title}"?`}
        confirmText="Rechazar"
        cancelText="Cancelar"
        onConfirm={confirmReject}
        onCancel={() => setShowRejectModal(false)}
      />
      
      <ConfirmModal
        visible={showSuccessModal}
        type="success"
        title={modalMessage.title}
        message={modalMessage.message}
        confirmText="Aceptar"
        showCancel={false}
        onConfirm={() => setShowSuccessModal(false)}
      />
      
      <ConfirmModal
        visible={showErrorModal}
        type="error"
        title={modalMessage.title}
        message={modalMessage.message}
        confirmText="Aceptar"
        showCancel={false}
        onConfirm={() => setShowErrorModal(false)}
      />
      
      <ResultModal
        visible={outcome?.kind === "accepted"}
        icon="checkmark-circle-outline"
        title="Aceptaste la cita"
        subtitle={`Le avisamos a ${inviterName}.`}
        note="La cita ya está en el calendario de los dos."
        primary={{
          label: "Ver en el calendario",
          onPress: () => {
            setOutcome(null);
            router.push("/(tabs)/calendario");
          },
        }}
        onRequestClose={() => setOutcome(null)}
      >
        {outcome?.event && (
          <PlanSummaryCard
            title={outcome.event.title}
            when={slotLabel(outcome.event.startDateTime, outcome.event.endDateTime, new Date())}
            place={outcome.event.location}
          />
        )}
      </ResultModal>

      <ResultModal
        visible={outcome?.kind === "rejected"}
        icon="close"
        tone="danger"
        title="Rechazaste la invitación"
        subtitle={`Le avisamos a ${inviterName}.`}
        primary={{
          label: "Planear juntos",
          onPress: async () => {
            setOutcome(null);
            if (user?.userId) await planningService.invite(user.userId).catch(() => null);
            router.push("/(planning)/session");
          },
        }}
        secondary={{ label: "Cerrar", onPress: () => setOutcome(null) }}
        onRequestClose={() => setOutcome(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  notificationCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginBottom: 16,
    shadowColor: palette.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  notificationHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 15, fontWeight: "600", color: palette.onPrimary },
  notificationInfo: { flex: 1 },
  notificationName: { fontSize: 14, fontWeight: "500", color: palette.text },
  notificationTime: { fontSize: 12, color: palette.textMuted },
  eventTitle: { fontSize: 16, fontWeight: "600", color: palette.text },
  descriptionText: { fontSize: 14, lineHeight: 20, color: palette.textSecondary },
  actionButtons: { flexDirection: "row", gap: 12, marginTop: 4 },
  rejectButton: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  rejectButtonText: { fontSize: 14, fontWeight: "600", color: palette.textAccent },
  approveButton: { flex: 1, borderRadius: 20, overflow: "hidden" },
  approveButtonGradient: { height: 40, justifyContent: "center", alignItems: "center" },
  approveButtonText: { fontSize: 14, fontWeight: "600", color: palette.onPrimary },
  actionButtonDisabled: { opacity: 0.5 },

  noticeList: {
    gap: 12,
    marginTop: 8,
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: palette.surface,
    shadowColor: palette.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  noticeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  noticeText: {
    flex: 1,
    gap: 2,
  },
  noticeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  noticeTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: palette.text,
  },
  noticeTime: {
    fontSize: 12,
    color: palette.textMuted,
  },
  noticeBody: {
    fontSize: 13,
    color: palette.textSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  badge: {
    backgroundColor: palette.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: palette.onPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.text,
    marginBottom: 12,
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.surfaceMuted,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: "center",
    maxWidth: 250,
  },
});
