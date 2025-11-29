import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { ConfirmModal } from "./ConfirmModal";
import eventService from "../../services/event.service";
import { useAuth } from "../../context/AuthContext";

const { height } = Dimensions.get("window");

interface EventDetailsModalProps {
  visible: boolean;
  event: {
    id: number | string; // Puede ser number (evento normal) o string (instancia recurrente "eventId-timestamp")
    title: string;
    startDateTime: string;
    endDateTime: string;
    location?: string;
    category?: string;
    description?: string;
    color?: string;
    isRecurring?: boolean;
    recurrencePattern?: string;
    reminders?: Array<{ minutesBefore: number; label: string }>;
    status: string;
    creatorApproved: boolean;
    partnerApproved: boolean;
    creatorName?: string;
    partnerName?: string;
  } | null;
  onClose: () => void;
  onEdit: (eventId: number) => void;
  onDelete?: (eventId: number) => void;
  onRefresh?: () => Promise<void>; // Callback para recargar eventos después de cambios
}

export function EventDetailsModal({ visible, event, onClose, onEdit, onDelete, onRefresh }: EventDetailsModalProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteRecurringModal, setShowDeleteRecurringModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteType, setDeleteType] = useState<'single' | 'all'>('single');
  const { user } = useAuth();
  
  if (!event) return null;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const isAllDay = (start: string, end: string): boolean => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return startDate.getHours() === 0 && startDate.getMinutes() === 0 &&
           endDate.getHours() === 23 && endDate.getMinutes() === 59;
  };

  const getRecurrenceText = (pattern?: string): string => {
    if (!pattern) return '';
    
    if (pattern.includes('FREQ=DAILY')) return 'Se repite diariamente';
    if (pattern.includes('FREQ=WEEKLY')) return 'Se repite semanalmente';
    if (pattern.includes('FREQ=MONTHLY')) return 'Se repite mensualmente';
    if (pattern.includes('FREQ=YEARLY')) return 'Se repite anualmente';
    
    return 'Evento recurrente';
  };

  const getStatusColor = () => {
    if (event.creatorApproved && event.partnerApproved) return '#10B981';
    if (event.status === 'REJECTED' || event.status === 'CANCELLED') return '#EF4444';
    return '#F59E0B';
  };

  const getStatusText = () => {
    if (event.creatorApproved && event.partnerApproved) return 'Confirmado';
    if (event.status === 'REJECTED') return 'Rechazado';
    if (event.status === 'CANCELLED') return 'Cancelado';
    return 'Pendiente de aprobación';
  };
  
  const handleDeletePress = () => {
    if (event.isRecurring) {
      // Si es recurrente, mostrar opciones
      setShowDeleteRecurringModal(true);
    } else {
      // Si no es recurrente, confirmar eliminación directa
      setShowDeleteModal(true);
    }
  };
  
  const handleDeleteRecurringChoice = (type: 'single' | 'all') => {
    setDeleteType(type);
    setShowDeleteRecurringModal(false);
    setShowDeleteModal(true);
  };
  
  const handleDelete = async () => {
    if (!onDelete || !user) return;
    
    setDeleting(true);
    setShowDeleteModal(false);
    
    try {
      console.log('=== DEBUG DELETE ===');
      console.log('deleteType:', deleteType);
      console.log('event.id:', event.id);
      console.log('event.isRecurring:', event.isRecurring);
      console.log('includes dash:', event.id.toString().includes('-'));
      
      if (deleteType === 'single' && event.isRecurring) {
        // Es una instancia específica de un evento recurrente
        if (!event.id.toString().includes('-')) {
          console.error('ERROR: Event ID no tiene formato de instancia (eventId-timestamp)');
          throw new Error('No se puede eliminar instancia: ID inválido');
        }
        
        // El ID tiene el formato "eventId-timestamp"
        const [realEventId, timestamp] = event.id.toString().split('-');
        const occurrenceDate = new Date(parseInt(timestamp));
        
        console.log('realEventId:', realEventId);
        console.log('timestamp:', timestamp);
        console.log('occurrenceDate:', occurrenceDate);
        
        // Normalizar a medianoche UTC para enviar al backend
        const normalizedDate = new Date(Date.UTC(
          occurrenceDate.getFullYear(),
          occurrenceDate.getMonth(),
          occurrenceDate.getDate()
        ));
        
        console.log('normalizedDate UTC:', normalizedDate.toISOString());
        
        // Agregar excepción para esta fecha específica
        await eventService.addEventException(
          parseInt(realEventId),
          normalizedDate.toISOString(),
          user.userId
        );
        
        console.log('✅ Instancia eliminada exitosamente');
        
        // Recargar eventos para obtener las excepciones actualizadas
        console.log('🔄 Recargando eventos para actualizar excepciones...');
        if (onRefresh) {
          await onRefresh();
          console.log('✅ Eventos recargados');
        }
      } else {
        // Eliminar el evento completo (o toda la serie)
        console.log('Eliminando evento completo o toda la serie...');
        // Extraer el ID real si es una instancia recurrente
        const realId = typeof event.id === 'string' && event.id.includes('-')
          ? parseInt(event.id.split('-')[0])
          : typeof event.id === 'number'
          ? event.id
          : parseInt(event.id.toString());
        await onDelete(realId);
      }
      onClose();
    } catch (error) {
      console.error('❌ Error eliminando evento:', error);
      alert('Error al eliminar el evento: ' + (error as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
      <BlurView intensity={20} style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header con color del evento */}
            <LinearGradient
              colors={[event.color || '#FF4F81', event.color ? `${event.color}CC` : '#FF4F81CC']}
              style={styles.header}
            >
              <View style={styles.headerTop}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                  <Text style={styles.statusText}>{getStatusText()}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.title}>{event.title}</Text>
              
              {event.category && (
                <View style={styles.categoryBadge}>
                  <Ionicons name="pricetag" size={14} color="#FFF" />
                  <Text style={styles.categoryText}>{event.category}</Text>
                </View>
              )}
            </LinearGradient>

            {/* Contenido scrolleable */}
            <ScrollView 
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Fecha y hora */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="calendar" size={20} color={event.color || '#FF4F81'} />
                  <Text style={styles.sectionTitle}>Fecha y hora</Text>
                </View>
                
                <View style={styles.dateTimeContainer}>
                  <View style={styles.dateTimeRow}>
                    <Text style={styles.dateTimeLabel}>Inicio:</Text>
                    <Text style={styles.dateTimeValue}>
                      {formatDate(event.startDateTime)}
                      {!isAllDay(event.startDateTime, event.endDateTime) && 
                        ` - ${formatTime(event.startDateTime)}`}
                    </Text>
                  </View>
                  
                  <View style={styles.dateTimeRow}>
                    <Text style={styles.dateTimeLabel}>Fin:</Text>
                    <Text style={styles.dateTimeValue}>
                      {formatDate(event.endDateTime)}
                      {!isAllDay(event.startDateTime, event.endDateTime) && 
                        ` - ${formatTime(event.endDateTime)}`}
                    </Text>
                  </View>
                </View>

                {isAllDay(event.startDateTime, event.endDateTime) && (
                  <View style={styles.allDayBadge}>
                    <Ionicons name="time" size={16} color="#8A2BE2" />
                    <Text style={styles.allDayText}>Todo el día</Text>
                  </View>
                )}
              </View>

              {/* Recurrencia */}
              {event.isRecurring && event.recurrencePattern && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="repeat" size={20} color={event.color || '#FF4F81'} />
                    <Text style={styles.sectionTitle}>Recurrencia</Text>
                  </View>
                  <Text style={styles.recurrenceText}>
                    {getRecurrenceText(event.recurrencePattern)}
                  </Text>
                </View>
              )}

              {/* Ubicación */}
              {event.location && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="location" size={20} color={event.color || '#FF4F81'} />
                    <Text style={styles.sectionTitle}>Ubicación</Text>
                  </View>
                  <Text style={styles.infoText}>{event.location}</Text>
                </View>
              )}

              {/* Recordatorios */}
              {event.reminders && event.reminders.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="notifications" size={20} color={event.color || '#FF4F81'} />
                    <Text style={styles.sectionTitle}>Recordatorios</Text>
                  </View>
                  <View style={styles.remindersContainer}>
                    {event.reminders.map((reminder, index) => (
                      <View key={index} style={styles.reminderChip}>
                        <Ionicons name="alarm" size={14} color="#8A2BE2" />
                        <Text style={styles.reminderText}>{reminder.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Descripción */}
              {event.description && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="document-text" size={20} color={event.color || '#FF4F81'} />
                    <Text style={styles.sectionTitle}>Descripción</Text>
                  </View>
                  <Text style={styles.description}>{event.description}</Text>
                </View>
              )}

              {/* Información de aprobación */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="people" size={20} color={event.color || '#FF4F81'} />
                  <Text style={styles.sectionTitle}>Estado de aprobación</Text>
                </View>
                
                <View style={styles.approvalContainer}>
                  <View style={styles.approvalRow}>
                    <Ionicons 
                      name={event.creatorApproved ? "checkmark-circle" : "time"} 
                      size={20} 
                      color={event.creatorApproved ? "#10B981" : "#F59E0B"} 
                    />
                    <Text style={styles.approvalText}>
                      {event.creatorName || 'Creador'}: {event.creatorApproved ? 'Aprobado' : 'Pendiente'}
                    </Text>
                  </View>
                  
                  <View style={styles.approvalRow}>
                    <Ionicons 
                      name={event.partnerApproved ? "checkmark-circle" : "time"} 
                      size={20} 
                      color={event.partnerApproved ? "#10B981" : "#F59E0B"} 
                    />
                    <Text style={styles.approvalText}>
                      {event.partnerName || 'Pareja'}: {event.partnerApproved ? 'Aprobado' : 'Pendiente'}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Botones de acción */}
            <View style={styles.footer}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    onClose();
                    // Si es una instancia recurrente, extraer el ID real
                    const realId = typeof event.id === 'string' && event.id.includes('-')
                      ? parseInt(event.id.split('-')[0])
                      : typeof event.id === 'number'
                      ? event.id
                      : parseInt(event.id);
                    onEdit(realId);
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#FF4F81", "#8A2BE2"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.editButtonGradient}
                  >
                    <Ionicons name="create-outline" size={20} color="#FFF" />
                    <Text style={styles.editButtonText}>Editar</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                {onDelete && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDeletePress}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#EF4444", "#DC2626"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.deleteButtonGradient}
                    >
                      <Ionicons name="trash-outline" size={20} color="#FFF" />
                      <Text style={styles.deleteButtonText}>Eliminar</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
    
    {/* Modal de opciones para eventos recurrentes */}
    <Modal
      visible={showDeleteRecurringModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowDeleteRecurringModal(false)}
    >
      <BlurView intensity={20} style={styles.modalOverlay}>
        <View style={styles.choiceModalContainer}>
          <View style={styles.choiceModalContent}>
            {/* Icono */}
            <View style={[styles.iconContainer, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="repeat" size={48} color="#F59E0B" />
            </View>

            {/* Título */}
            <Text style={styles.modalTitle}>Evento recurrente</Text>

            {/* Mensaje */}
            <Text style={styles.modalMessage}>Este evento se repite. ¿Qué deseas eliminar?</Text>

            {/* Opciones */}
            <View style={styles.choiceButtonsContainer}>
              <TouchableOpacity
                style={styles.choiceButton}
                onPress={() => handleDeleteRecurringChoice('single')}
              >
                <Ionicons name="document-outline" size={24} color="#8A2BE2" />
                <View style={styles.choiceTextContainer}>
                  <Text style={styles.choiceButtonTitle}>Solo este evento</Text>
                  <Text style={styles.choiceButtonSubtitle}>Eliminar solo este evento</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.choiceButton}
                onPress={() => handleDeleteRecurringChoice('all')}
              >
                <Ionicons name="documents-outline" size={24} color="#8A2BE2" />
                <View style={styles.choiceTextContainer}>
                  <Text style={styles.choiceButtonTitle}>Toda la serie</Text>
                  <Text style={styles.choiceButtonSubtitle}>Eliminar todos los eventos repetidos</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.choiceButton, styles.cancelChoiceButton]}
                onPress={() => setShowDeleteRecurringModal(false)}
              >
                <Ionicons name="close-circle-outline" size={24} color="#666" />
                <View style={styles.choiceTextContainer}>
                  <Text style={[styles.choiceButtonTitle, { color: '#666' }]}>Cancelar</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
    
    {/* Modal de confirmación de eliminación */}
    <ConfirmModal
      visible={showDeleteModal}
      type="error"
      title="Eliminar evento"
      message={
        event.isRecurring && deleteType === 'all'
          ? `¿Estás seguro de que deseas eliminar toda la serie de "${event.title}"? Esta acción no se puede deshacer.`
          : `¿Estás seguro de que deseas eliminar "${event.title}"? Esta acción no se puede deshacer.`
      }
      confirmText="Eliminar"
      cancelText="Cancelar"
      onConfirm={handleDelete}
      onCancel={() => setShowDeleteModal(false)}
      loading={deleting}
    />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    height: height * 0.85,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
  },
  modalContent: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  dateTimeContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  dateTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateTimeLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#666",
  },
  dateTimeValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  allDayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#F5F0FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  allDayText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8A2BE2",
  },
  recurrenceText: {
    fontSize: 15,
    color: "#1A1A1A",
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 15,
    color: "#1A1A1A",
    lineHeight: 22,
  },
  remindersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reminderChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F5F0FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  reminderText: {
    fontSize: 13,
    color: "#8A2BE2",
    fontWeight: "500",
  },
  description: {
    fontSize: 15,
    color: "#1A1A1A",
    lineHeight: 22,
  },
  approvalContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  approvalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  approvalText: {
    fontSize: 15,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  footer: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  // Estilos para modal de opciones de recurrencia
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  choiceModalContainer: {
    width: "85%",
    maxWidth: 400,
  },
  choiceModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  choiceButtonsContainer: {
    width: "100%",
    gap: 12,
  },
  choiceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F0FF",
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  cancelChoiceButton: {
    backgroundColor: "#F5F5F5",
  },
  choiceTextContainer: {
    flex: 1,
  },
  choiceButtonTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  choiceButtonSubtitle: {
    fontSize: 13,
    color: "#666",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  editButton: {
    flex: 1,
    height: 56,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#FF4F81",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteButton: {
    flex: 1,
    height: 56,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteButtonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  deleteButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
  editButtonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  editButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
