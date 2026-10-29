import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '../../constants/colors';
import { detailWhen, recurrenceLabel } from '../../utils/eventDetailFormat';

export interface ExternalEventDetail {
  title: string;
  description?: string;
  location?: string;
  /** Inicio y fin de la ocurrencia que se toco (no los de la serie). */
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

const Row = ({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) => (
  <View style={styles.row}>
    <View style={styles.rowIcon}>
      <Ionicons name={icon} size={18} color={palette.primary} />
    </View>
    <View style={styles.rowText}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  </View>
);

/**
 * [avisos-calendario] Figma J5 - Detalle de un evento de un calendario externo: hoja que sube desde
 * abajo y mide lo que su contenido (hasta 80 % de la pantalla, con scroll solo dentro). Muestra la
 * fecha y hora del dia que se toco y la repeticion en palabras.
 */
export function ExternalEventDetailModal({ visible, event, onClose }: ExternalEventDetailModalProps) {
  const insets = useSafeAreaInsets();
  if (!event) return null;
  const repeats = recurrenceLabel(event.recurrenceRule);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessible={false} style={styles.overlay} onPress={onClose}>
        <Pressable
          accessible={false}
          style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={[styles.colorBar, { backgroundColor: event.calendarColor ?? palette.info }]} />
            <View style={styles.headerText}>
              <Text style={styles.title} accessibilityRole="header">
                {event.title}
              </Text>
              {event.calendarName ? <Text style={styles.calendar}>{event.calendarName}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar">
              <Ionicons name="close" size={24} color={palette.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} bounces={false}>
            <Row
              icon="calendar-outline"
              label="Fecha y hora"
              value={detailWhen(new Date(event.startDate), new Date(event.endDate), event.allDay)}
            />
            {repeats && <Row icon="repeat-outline" label="Se repite" value={repeats} />}
            {event.location ? <Row icon="location-outline" label="Ubicación" value={event.location} /> : null}
            {event.description ? <Row icon="document-text-outline" label="Descripción" value={event.description} /> : null}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: palette.overlay, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '80%',
    gap: 14,
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: palette.border, marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  colorBar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  headerText: { flex: 1, gap: 4 },
  title: { fontSize: 20, fontWeight: '700', color: palette.text },
  calendar: { fontSize: 13, color: palette.textMuted },
  divider: { height: 1, backgroundColor: palette.border },
  body: { flexGrow: 0 },
  bodyContent: { gap: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 12, color: palette.textMuted },
  rowValue: { fontSize: 15, color: palette.text },
  closeButton: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 16, fontWeight: '700', color: palette.textAccent },
});
