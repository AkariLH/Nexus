import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import eventService, { EventResponse } from '@/services/event.service';
import { ConfirmModal } from '../components/ConfirmModal';

/**
 * Pantalla para ver los eventos propios creados por el usuario
 * Muestra el estado de aprobación de cada evento
 */
export default function MyEventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // Estados para modales
  const [errorModal, setErrorModal] = useState<{visible: boolean, message: string}>({visible: false, message: ""});
  const [successModal, setSuccessModal] = useState<{visible: boolean, message: string}>({visible: false, message: ""});
  const [deleteConfirm, setDeleteConfirm] = useState<{visible: boolean, eventId: number | null}>({visible: false, eventId: null});

  const loadEvents = async () => {
    if (!user) return;

    try {
      const myEvents = await eventService.getMyCreatedEvents(user.userId);
      // Ordenar por fecha de creación descendente (más recientes primero)
      const sorted = myEvents.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setEvents(sorted);
    } catch (error) {
      console.error('Error loading my events:', error);
      setErrorModal({visible: true, message: 'No se pudieron cargar los eventos'});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!user) return;
    setDeleteConfirm({visible: true, eventId});
  };

  const confirmDelete = async () => {
    const eventId = deleteConfirm.eventId;
    if (!eventId || !user) return;

    try {
      setProcessingId(eventId);
      setDeleteConfirm({visible: false, eventId: null});
      await eventService.deleteEvent(eventId, user.userId);
      await loadEvents();
      setSuccessModal({visible: true, message: 'Evento eliminado correctamente'});
    } catch (error) {
      console.error('Error deleting event:', error);
      setErrorModal({visible: true, message: 'No se pudo eliminar el evento'});
    } finally {
      setProcessingId(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [user])
  );

  const formatDateTime = (dateTimeStr: string): string => {
    const date = new Date(dateTimeStr);
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('es-ES', options);
  };

  const getStatusInfo = (event: EventResponse) => {
    if (event.fullyApproved) {
      return {
        label: 'Confirmado',
        color: '#10B981',
        icon: 'checkmark-circle' as const,
        bg: '#ECFDF5'
      };
    }
    
    if (event.status === 'REJECTED') {
      return {
        label: 'Rechazado',
        color: '#EF4444',
        icon: 'close-circle' as const,
        bg: '#FEF2F2'
      };
    }

    if (event.status === 'CANCELLED') {
      return {
        label: 'Cancelado',
        color: '#6B7280',
        icon: 'ban' as const,
        bg: '#F3F4F6'
      };
    }

    // Pendiente
    return {
      label: 'Pendiente de aprobación',
      color: '#F59E0B',
      icon: 'time' as const,
      bg: '#FEF3C7'
    };
  };

  const getApprovalDetails = (event: EventResponse): string => {
    if (event.fullyApproved) {
      return 'Evento confirmado por ambas partes';
    }

    const parts: string[] = [];
    
    if (event.creatorApproved) {
      parts.push('✓ Tú has aprobado');
    }
    
    if (event.partnerApproved && event.partnerName) {
      parts.push(`✓ ${event.partnerName} ha aprobado`);
    } else if (event.partnerName) {
      parts.push(`⏳ Esperando aprobación de ${event.partnerName}`);
    }

    return parts.length > 0 ? parts.join('\n') : 'Esperando aprobaciones';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Eventos</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4F81" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Eventos</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No tienes eventos creados</Text>
            <Text style={styles.emptySubtitle}>
              Crea un evento para compartir con tu pareja
            </Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push('/(events)/create-event')}
            >
              <LinearGradient
                colors={['#FF4F81', '#8A2BE2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createButtonGradient}
              >
                <Ionicons name="add" size={24} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Crear evento</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{events.filter(e => e.fullyApproved).length}</Text>
                <Text style={styles.statLabel}>Confirmados</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#F59E0B' }]}>
                  {events.filter(e => !e.fullyApproved && e.status !== 'REJECTED' && e.status !== 'CANCELLED').length}
                </Text>
                <Text style={styles.statLabel}>Pendientes</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#EF4444' }]}>
                  {events.filter(e => e.status === 'REJECTED' || e.status === 'CANCELLED').length}
                </Text>
                <Text style={styles.statLabel}>Rechazados</Text>
              </View>
            </View>

            {events.map((event) => {
              const statusInfo = getStatusInfo(event);
              const isProcessing = processingId === event.id;

              return (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <View style={styles.eventTitleRow}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                        <Ionicons name={statusInfo.icon} size={14} color={statusInfo.color} />
                        <Text style={[styles.statusText, { color: statusInfo.color }]}>
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.eventDetails}>
                    <View style={styles.eventDetailRow}>
                      <Ionicons name="calendar-outline" size={16} color="#FF4F81" />
                      <Text style={styles.eventDetailText}>
                        {formatDateTime(event.startDateTime)}
                      </Text>
                    </View>

                    {event.location && (
                      <View style={styles.eventDetailRow}>
                        <Ionicons name="location-outline" size={16} color="#FF4F81" />
                        <Text style={styles.eventDetailText} numberOfLines={1}>
                          {event.location}
                        </Text>
                      </View>
                    )}

                    {event.category && (
                      <View style={styles.eventDetailRow}>
                        <Ionicons name="pricetag-outline" size={16} color="#FF4F81" />
                        <Text style={styles.eventDetailText}>
                          {event.category}
                        </Text>
                      </View>
                    )}

                    {event.partnerName && (
                      <View style={styles.eventDetailRow}>
                        <Ionicons name="person-outline" size={16} color="#FF4F81" />
                        <Text style={styles.eventDetailText}>
                          Con {event.partnerNickname || event.partnerName}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.approvalSection}>
                    <Text style={styles.approvalTitle}>Estado de aprobación:</Text>
                    <Text style={styles.approvalDetails}>
                      {getApprovalDetails(event)}
                    </Text>
                  </View>

                  {!event.fullyApproved && event.status === 'PENDING' && (
                    <View style={styles.eventActions}>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteEvent(event.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                          <>
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            <Text style={styles.deleteButtonText}>Eliminar</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
      
      {/* Modales */}
      <ConfirmModal
        visible={errorModal.visible}
        type="error"
        title="Error"
        message={errorModal.message}
        confirmText="Entendido"
        showCancel={false}
        onConfirm={() => setErrorModal({visible: false, message: ""})}
      />
      
      <ConfirmModal
        visible={successModal.visible}
        type="success"
        title="Éxito"
        message={successModal.message}
        confirmText="Continuar"
        showCancel={false}
        onConfirm={() => setSuccessModal({visible: false, message: ""})}
      />
      
      <ConfirmModal
        visible={deleteConfirm.visible}
        type="confirm"
        title="Eliminar evento"
        message="¿Estás seguro de que deseas eliminar este evento?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({visible: false, eventId: null})}
      />
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  createButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF4F81',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    marginBottom: 12,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  eventTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  eventDetails: {
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  approvalSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  approvalTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  approvalDetails: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    gap: 6,
    minWidth: 100,
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
});

// Agregar modales al componente - buscar el return principal y agregar antes del cierre
// Los modales deben ir justo antes del </View> final del componente
