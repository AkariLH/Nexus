import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '../components/ui/GradientButton';
import { OptionChip } from '../components/ui/OptionChip';
import { Card, MetaLine, Pill, PillTone } from '../../components/ui/Surface';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import eventService, { EventResponse } from '@/services/event.service';
import { ConfirmModal } from '../components/ConfirmModal';
import { palette } from '../../constants/colors';
import { ScreenHeader } from '../components/layout/ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { eventRange, sortForList } from '@/utils/eventFormat';

type EventGroup = 'CONFIRMED' | 'PENDING' | 'REJECTED';

const FILTERS: { value: EventGroup; label: string }[] = [
  { value: 'CONFIRMED', label: 'Confirmados' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'REJECTED', label: 'Rechazados' },
];


/**
 * Pantalla para ver los eventos propios creados por el usuario
 * Muestra el estado de aprobación de cada evento
 */
export default function MyEventsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<EventGroup>('CONFIRMED');
  
  // Estados para modales
  const [errorModal, setErrorModal] = useState<{visible: boolean, message: string}>({visible: false, message: ""});
  const [successModal, setSuccessModal] = useState<{visible: boolean, message: string}>({visible: false, message: ""});
  const [deleteConfirm, setDeleteConfirm] = useState<{visible: boolean, eventId: number | null}>({visible: false, eventId: null});

  const loadEvents = async () => {
    if (!user) return;

    try {
      const myEvents = await eventService.getMyCreatedEvents(user.userId);
      // Primero lo que viene (lo más cercano arriba); al final lo que ya pasó.
      setEvents(sortForList(myEvents, new Date()));
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

  const groupOf = (event: EventResponse): EventGroup => {
    if (event.fullyApproved) return 'CONFIRMED';
    if (event.status === 'REJECTED' || event.status === 'CANCELLED') return 'REJECTED';
    return 'PENDING';
  };

  const pillOf = (event: EventResponse): { label: string; tone: PillTone; icon: keyof typeof Ionicons.glyphMap } => {
    const group = groupOf(event);
    if (group === 'CONFIRMED') return { label: 'Confirmado', tone: 'success', icon: 'checkmark-circle-outline' };
    if (group === 'REJECTED') {
      return event.status === 'CANCELLED'
        ? { label: 'Cancelado', tone: 'error', icon: 'ban-outline' }
        : { label: 'Rechazado', tone: 'error', icon: 'close-circle-outline' };
    }
    const partner = event.partnerNickname || event.partnerName;
    return { label: partner ? `Pendiente de ${partner}` : 'Pendiente', tone: 'warning', icon: 'hourglass-outline' };
  };

  const header = (
    <ScreenHeader
      title="Mis eventos"
      onBack={() => router.back()}
      right={
        <TouchableOpacity
          onPress={() => router.push('/(events)/create-event')}
          accessibilityRole="button"
          accessibilityLabel="Crear evento"
          hitSlop={12}
        >
          <Ionicons name="add" size={26} color={palette.text} />
        </TouchableOpacity>
      }
    />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </View>
    );
  }

  const visible = events.filter((e) => groupOf(e) === filter);
  const now = new Date();

  return (
    <View style={styles.container}>
      {header}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.primary]} />}
      >
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={56} color={palette.iconDisabled} />
            </View>
            <Text style={styles.emptyTitle}>No tienes eventos creados</Text>
            <Text style={styles.emptySubtitle}>Crea un evento para compartir con tu pareja.</Text>
            <GradientButton title="Crear evento" onPress={() => router.push('/(events)/create-event')} style={styles.emptyButton} />
          </View>
        ) : (
          <>
            <View style={styles.filters}>
              {FILTERS.map((f) => (
                <OptionChip key={f.value} label={f.label} selected={filter === f.value} onPress={() => setFilter(f.value)} />
              ))}
            </View>

            <Text style={styles.scopeText}>Los que tú creaste. Los de tu pareja están en el calendario.</Text>

            {visible.length === 0 && <Text style={styles.noneText}>No hay eventos en esta lista.</Text>}

            {visible.map((event) => {
              const pill = pillOf(event);
              const isProcessing = processingId === event.id;
              const canDelete = !event.fullyApproved && event.status === 'PENDING';
              return (
                <Card key={event.id} style={styles.eventCard}>
                  <View style={[styles.colorBar, { backgroundColor: event.color || palette.primary }]} />
                  <View style={styles.eventBody}>
                    <View style={styles.eventTop}>
                      <Text style={styles.eventTitle} numberOfLines={2}>
                        {event.title}
                      </Text>
                      {canDelete && (
                        <TouchableOpacity
                          onPress={() => handleDeleteEvent(event.id)}
                          disabled={isProcessing}
                          accessibilityRole="button"
                          accessibilityLabel={`Eliminar ${event.title}`}
                          hitSlop={14}
                        >
                          {isProcessing ? (
                            <ActivityIndicator size="small" color={palette.error} />
                          ) : (
                            <Ionicons name="trash-outline" size={20} color={palette.icon} />
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                    <MetaLine icon="calendar-outline" text={eventRange(event.startDateTime, event.endDateTime, now)} />
                    {event.location ? <MetaLine icon="location-outline" text={event.location} /> : null}
                    <View style={styles.pills}>
                      <Pill label={pill.label} tone={pill.tone} icon={pill.icon} />
                      {event.isRecurring ? <Pill label="Se repite" icon="repeat-outline" /> : null}
                      {event.category ? <Pill label={event.category} /> : null}
                    </View>
                  </View>
                </Card>
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
  container: { flex: 1, backgroundColor: palette.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  noneText: { fontSize: 14, color: palette.textSecondary, textAlign: 'center', paddingVertical: 24 },
  scopeText: { fontSize: 12, color: palette.textSecondary },
  eventCard: { flexDirection: 'row', gap: 12, paddingLeft: 0, overflow: 'hidden' },
  colorBar: { width: 4, alignSelf: 'stretch' },
  eventBody: { flex: 1, gap: 6 },
  eventTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  eventTitle: { flex: 1, fontSize: 15, fontWeight: '500', color: palette.text },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: palette.text },
  emptySubtitle: { fontSize: 14, color: palette.textSecondary, textAlign: 'center' },
  emptyButton: { alignSelf: 'stretch', marginTop: 8 },
});
