import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { gradients, palette } from '../../constants/colors';
import type { FreeSlot } from '../../utils/calendarLayout';

interface Day {
  date: string;
  title: string;
  slots: FreeSlot[];
}

/** Figma E1-E3: burbuja flotante "N horarios libres juntos" junto al "+". */
export function FreeTogetherBubble({ count, onPress }: { count: number; onPress: () => void }) {
  if (count === 0) return null;
  return (
    <TouchableOpacity style={styles.bubble} onPress={onPress} accessibilityRole="button">
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bubbleIcon}>
        <Ionicons name="heart-outline" size={16} color={palette.onPrimary} />
      </LinearGradient>
      <Text style={styles.bubbleText}>
        {count === 1 ? '1 horario libre juntos' : `${count} horarios libres juntos`}
      </Text>
    </TouchableOpacity>
  );
}

interface FreeTogetherModalProps {
  visible: boolean;
  days: Day[];
  onPick: (slot: FreeSlot) => void;
  onClose: () => void;
}

/** Figma E4: horarios libres de los dos por dia; al tocar uno se crea un evento con esa hora. */
export function FreeTogetherModal({ visible, days, onPick, onClose }: FreeTogetherModalProps) {
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card} accessibilityViewIsModal>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.icon}>
            <Ionicons name="heart-outline" size={30} color={palette.onPrimary} />
          </LinearGradient>
          <Text style={styles.title} accessibilityRole="header">
            Libres juntos
          </Text>
          <Text style={styles.subtitle}>Toca un horario para planear una cita.</Text>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {days.map((day) => (
              <View key={day.date}>
                <Text style={styles.dayTitle}>{day.title}</Text>
                <View style={styles.chips}>
                  {day.slots.map((slot) => (
                    <TouchableOpacity
                      key={slot.label}
                      style={styles.chip}
                      onPress={() => onPick(slot)}
                      accessibilityRole="button"
                      accessibilityLabel={`${day.title}, ${slot.label}`}
                    >
                      <Text style={styles.chipText}>{slot.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.close} onPress={onClose} accessibilityRole="button">
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 6,
    paddingRight: 16,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.primaryBorder,
    backgroundColor: palette.surface,
    shadowColor: palette.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  bubbleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textAccent,
  },
  overlay: {
    flex: 1,
    backgroundColor: palette.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    padding: 24,
    borderRadius: 24,
    backgroundColor: palette.surface,
    alignItems: 'center',
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '700',
    color: palette.text,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
  },
  list: {
    alignSelf: 'stretch',
    marginTop: 16,
  },
  listContent: {
    gap: 16,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.text,
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.text,
  },
  close: {
    alignSelf: 'stretch',
    height: 48,
    marginTop: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.textAccent,
  },
});
