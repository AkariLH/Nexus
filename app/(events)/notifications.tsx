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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import eventService, { EventResponse } from "../../services/event.service";
import { ConfirmModal } from "../components/ConfirmModal";
import { externalCalendarIntegration } from "../../services/externalCalendar.integration.service";

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
  
  // Estados para sincronización con calendario externo
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [externalCalendars, setExternalCalendars] = useState<any[]>([]);

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
      
      // Cargar calendarios externos para preguntar si quiere sincronizar
      try {
        const calendars = await externalCalendarIntegration.getUserLinkedCalendars(user.userId, true);
        const syncEnabled = calendars.filter(cal => cal.syncEnabled);
        setExternalCalendars(syncEnabled);
        
        if (syncEnabled.length > 0) {
          // Mostrar modal para preguntar si quiere agregar al calendario externo
          setShowSyncModal(true);
        } else {
          // No tiene calendarios, solo mostrar éxito
          setModalMessage({
            title: "✅ Evento Aprobado",
            message: "El evento se ha añadido a tu calendario de Nexus"
          });
          setShowSuccessModal(true);
          loadPendingEvents();
        }
      } catch (calError) {
        console.error('Error cargando calendarios:', calError);
        // Continuar aunque falle la carga de calendarios
        setModalMessage({
          title: "✅ Evento Aprobado",
          message: "El evento se ha añadido a tu calendario de Nexus"
        });
        setShowSuccessModal(true);
        loadPendingEvents();
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
  
  const handleSyncToExternalCalendar = async () => {
    if (!user?.userId || !selectedEvent || externalCalendars.length === 0) return;
    
    setShowSyncModal(false);
    setProcessingEventId(selectedEvent.id);
    
    try {
      const calendar = externalCalendars[0]; // Usar el primero
      
      await externalCalendarIntegration.createEventInNativeCalendar(
        user.userId,
        calendar.id,
        calendar.deviceCalendarId,
        {
          title: selectedEvent.title,
          startDate: new Date(selectedEvent.startDateTime),
          endDate: new Date(selectedEvent.endDateTime),
          location: selectedEvent.location,
          notes: selectedEvent.description,
          allDay: false, // Puedes agregar esta propiedad al EventResponse si la necesitas
        }
      );
      
      setModalMessage({
        title: "✅ Evento Sincronizado",
        message: `Evento agregado a tu calendario de Nexus y a ${calendar.name}`
      });
      setShowSuccessModal(true);
      loadPendingEvents();
    } catch (error: any) {
      console.error('Error sincronizando con calendario externo:', error);
      setModalMessage({
        title: "Evento Aprobado",
        message: "El evento está en Nexus, pero no se pudo agregar a tu calendario externo"
      });
      setShowSuccessModal(true);
      loadPendingEvents();
    } finally {
      setProcessingEventId(null);
    }
  };
  
  const handleSkipSync = () => {
    setShowSyncModal(false);
    setModalMessage({
      title: "✅ Evento Aprobado",
      message: "El evento se ha añadido a tu calendario de Nexus"
    });
    setShowSuccessModal(true);
    loadPendingEvents();
  };
  
  const confirmReject = async () => {
    if (!user?.userId || !selectedEvent) return;

    setShowRejectModal(false);
    setProcessingEventId(selectedEvent.id);
    
    try {
      await eventService.rejectEvent(selectedEvent.id, user.userId);
      setModalMessage({
        title: "Evento Rechazado",
        message: "El evento no se añadirá a tu calendario"
      });
      setShowSuccessModal(true);
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
    return date.toLocaleDateString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es', {
      hour: '2-digit',
      minute: '2-digit',
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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF4F81" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={styles.badgeContainer}>
          {pendingEvents.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingEvents.length}</Text>
            </View>
          )}
        </View>
      </View>

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
            colors={['#FF4F81']}
            tintColor="#FF4F81"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {pendingEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
            </View>
            <Text style={styles.emptyTitle}>No hay notificaciones</Text>
            <Text style={styles.emptyText}>
              Cuando tu pareja te invite a un evento, aparecerá aquí
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Eventos Pendientes</Text>
            {pendingEvents.map((event) => (
              <View key={event.id} style={styles.notificationCard}>
                {/* Header de la notificación */}
                <View style={styles.notificationHeader}>
                  <View style={styles.avatarContainer}>
                    <LinearGradient
                      colors={['#FF4F81', '#8A2BE2']}
                      style={styles.avatar}
                    >
                      <Ionicons name="calendar" size={24} color="#FFF" />
                    </LinearGradient>
                  </View>
                  <View style={styles.notificationInfo}>
                    <Text style={styles.notificationName}>
                      {event.creatorName || event.creatorNickname}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {getTimeAgo(event.createdAt)}
                    </Text>
                  </View>
                </View>

                {/* Mensaje */}
                <Text style={styles.notificationMessage}>
                  Te ha invitado a un evento
                </Text>

                {/* Detalles del evento */}
                <View style={styles.eventDetails}>
                  <View style={styles.eventTitleContainer}>
                    <Ionicons name="calendar-outline" size={20} color="#FF4F81" />
                    <Text style={styles.eventTitle}>{event.title}</Text>
                  </View>

                  <View style={styles.eventRow}>
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.eventDetailText}>
                      {formatDate(event.startDateTime)}
                    </Text>
                  </View>

                  <View style={styles.eventRow}>
                    <Ionicons name="alarm-outline" size={16} color="#666" />
                    <Text style={styles.eventDetailText}>
                      {formatTime(event.startDateTime)} - {formatTime(event.endDateTime)}
                    </Text>
                  </View>

                  {event.location && (
                    <View style={styles.eventRow}>
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text style={styles.eventDetailText}>{event.location}</Text>
                    </View>
                  )}

                  {event.description && (
                    <View style={styles.descriptionContainer}>
                      <Text style={styles.descriptionText}>{event.description}</Text>
                    </View>
                  )}
                </View>

                {/* Botones de acción */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.rejectButton,
                      processingEventId === event.id && styles.actionButtonDisabled,
                    ]}
                    onPress={() => handleReject(event)}
                    disabled={processingEventId === event.id}
                  >
                    {processingEventId === event.id ? (
                      <ActivityIndicator size="small" color="#FF4757" />
                    ) : (
                      <>
                        <Ionicons name="close-circle" size={20} color="#FF4757" />
                        <Text style={styles.rejectButtonText}>Rechazar</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      styles.approveButton,
                      processingEventId === event.id && styles.actionButtonDisabled,
                    ]}
                    onPress={() => handleApprove(event)}
                    disabled={processingEventId === event.id}
                  >
                    <LinearGradient
                      colors={['#FF4F81', '#8A2BE2']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.approveButtonGradient}
                    >
                      {processingEventId === event.id ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                          <Text style={styles.approveButtonText}>Aceptar</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
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
      
      {/* Modal de sincronización con calendario externo */}
      <ConfirmModal
        visible={showSyncModal}
        type="confirm"
        title="Agregar a tu calendario"
        message={`¿Deseas agregar este evento a ${externalCalendars[0]?.name || 'tu calendario externo'}?`}
        confirmText="Sí, agregar"
        cancelText="Solo en Nexus"
        onConfirm={handleSyncToExternalCalendar}
        onCancel={handleSkipSync}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  badgeContainer: {
    width: 40,
    alignItems: "flex-end",
  },
  badge: {
    backgroundColor: "#FF4F81",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#FFF",
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
    color: "#1A1A1A",
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
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    maxWidth: 250,
  },
  notificationCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationInfo: {
    flex: 1,
  },
  notificationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 13,
    color: "#999",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  eventDetails: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  eventTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    flex: 1,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  eventDetailText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  descriptionText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  rejectButton: {
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#FF4757",
    flexDirection: "row",
    gap: 6,
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FF4757",
  },
  approveButton: {
    overflow: "hidden",
  },
  approveButtonGradient: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    width: "100%",
  },
  approveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
});
