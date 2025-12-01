import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

export interface ExternalEventDetail {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  recurrenceRule?: string;
  calendarName?: string;
  calendarColor?: string;
}

interface ExternalEventDetailModalProps {
  visible: boolean;
  event: ExternalEventDetail | null;
  onClose: () => void;
}

export function ExternalEventDetailModal({
  visible,
  event,
  onClose,
}: ExternalEventDetailModalProps) {
  if (!event) return null;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatRecurrence = (rrule: string | undefined) => {
    if (!rrule) return null;

    // Parse RRULE
    const freqMatch = rrule.match(/FREQ=([A-Z]+)/);
    const intervalMatch = rrule.match(/INTERVAL=(\d+)/);
    const bydayMatch = rrule.match(/BYDAY=([A-Z,]+)/);
    const untilMatch = rrule.match(/UNTIL=(\d{8})/);

    if (!freqMatch) return null;

    const freq = freqMatch[1];
    const interval = intervalMatch ? parseInt(intervalMatch[1]) : 1;
    const bydays = bydayMatch ? bydayMatch[1].split(',') : [];
    const until = untilMatch ? untilMatch[1] : null;

    const dayNames: { [key: string]: string } = {
      MO: 'Lunes',
      TU: 'Martes',
      WE: 'Miércoles',
      TH: 'Jueves',
      FR: 'Viernes',
      SA: 'Sábado',
      SU: 'Domingo',
    };

    let text = '';

    if (freq === 'WEEKLY') {
      if (interval === 1) {
        text = 'Cada semana';
      } else {
        text = `Cada ${interval} semanas`;
      }

      if (bydays.length > 0) {
        const daysList = bydays.map(day => dayNames[day] || day).join(', ');
        text += ` los ${daysList}`;
      }
    } else if (freq === 'DAILY') {
      text = interval === 1 ? 'Diariamente' : `Cada ${interval} días`;
    } else if (freq === 'MONTHLY') {
      text = interval === 1 ? 'Mensualmente' : `Cada ${interval} meses`;
    } else if (freq === 'YEARLY') {
      text = interval === 1 ? 'Anualmente' : `Cada ${interval} años`;
    }

    if (until) {
      const year = until.substring(0, 4);
      const month = until.substring(4, 6);
      const day = until.substring(6, 8);
      text += ` hasta ${day}/${month}/${year}`;
    }

    return text;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.backdrop} tint="dark">
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  {event.calendarColor && (
                    <View
                      style={[
                        styles.colorIndicator,
                        { backgroundColor: event.calendarColor },
                      ]}
                    />
                  )}
                  <View style={styles.headerTitleContainer}>
                    <Text style={styles.modalTitle}>{event.title}</Text>
                    {event.calendarName && (
                      <Text style={styles.calendarName}>{event.calendarName}</Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={28} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.scrollContent}>
                {/* Fecha y hora */}
                <View style={styles.section}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={20} color="#FF4F81" />
                    <View style={styles.detailTextContainer}>
                      <Text style={styles.detailLabel}>Fecha</Text>
                      <Text style={styles.detailValue}>{formatDate(event.startDate)}</Text>
                    </View>
                  </View>

                  {!event.allDay && (
                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={20} color="#FF4F81" />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Horario</Text>
                        <Text style={styles.detailValue}>
                          {formatTime(event.startDate)} - {formatTime(event.endDate)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {event.allDay && (
                    <View style={styles.detailRow}>
                      <Ionicons name="sunny" size={20} color="#FF4F81" />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Duración</Text>
                        <Text style={styles.detailValue}>Todo el día</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Recurrencia */}
                {event.recurrenceRule && (
                  <View style={styles.section}>
                    <View style={styles.detailRow}>
                      <Ionicons name="repeat" size={20} color="#FF4F81" />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Repetición</Text>
                        <Text style={styles.detailValue}>
                          {formatRecurrence(event.recurrenceRule)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Ubicación */}
                {event.location && (
                  <View style={styles.section}>
                    <View style={styles.detailRow}>
                      <Ionicons name="location" size={20} color="#FF4F81" />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Ubicación</Text>
                        <Text style={styles.detailValue}>{event.location}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Descripción */}
                {event.description && (
                  <View style={styles.section}>
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text" size={20} color="#FF4F81" />
                      <View style={styles.detailTextContainer}>
                        <Text style={styles.detailLabel}>Descripción</Text>
                        <Text style={styles.detailValue}>{event.description}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  colorIndicator: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 2,
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  calendarName: {
    fontSize: 13,
    color: '#1A1A1A99',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    maxHeight: 500,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: '#1A1A1A99',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#1A1A1A',
  },
});
