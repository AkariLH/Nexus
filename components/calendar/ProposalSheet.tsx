import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientButton } from '../../app/components/ui/GradientButton';
import { gradients, palette } from '../../constants/colors';
import { detailWhen } from '../../utils/eventDetailFormat';
import { FreeWindow, proposalLabel } from '../../utils/freeProposals';

interface ProposalSheetProps {
  window: FreeWindow | null;
  visible: boolean;
  /** «Buscar un plan para este horario»: Pedir recomendacion con el horario ya elegido. */
  onPlan: () => void;
  /** «Agregar un plan nuestro»: Crear evento de los dos con el dia y las horas. */
  onReserve: () => void;
  onClose: () => void;
}

const at = (date: string, clock: string) => {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = clock.split(':').map(Number);
  return new Date(y, m - 1, d, h, min);
};

/**
 * [libres-juntos] Figma K3 - Al tocar una propuesta: hoja desde abajo (como J5) con el horario y
 * las dos salidas, buscar un plan o agregar uno que ya tienen.
 */
export function ProposalSheet({ window, visible, onPlan, onReserve, onClose }: ProposalSheetProps) {
  const insets = useSafeAreaInsets();
  if (!window) return null;
  const { when } = proposalLabel(window, new Date());

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessible={false} style={styles.overlay} onPress={onClose}>
        <Pressable accessible={false} style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.colorBar} />
            <View style={styles.headerText}>
              <Text style={styles.title} accessibilityRole="header">
                {when}
              </Text>
              <Text style={styles.subtitle}>Los dos están libres</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cerrar">
              <Ionicons name="close" size={24} color={palette.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Ionicons name="calendar-outline" size={18} color={palette.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Horario</Text>
              <Text style={styles.rowValue}>
                {detailWhen(at(window.date, window.start), at(window.date, window.end), false)}
              </Text>
            </View>
          </View>

          <GradientButton title="Buscar un plan para este horario" onPress={onPlan} />
          <TouchableOpacity style={styles.secondary} onPress={onReserve} accessibilityRole="button">
            <Text style={styles.secondaryText}>Agregar un plan nuestro</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: palette.overlay, justifyContent: 'flex-end' },
  sheet: {
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
  subtitle: { fontSize: 13, color: palette.textMuted },
  divider: { height: 1, backgroundColor: palette.border },
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
  secondary: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontSize: 16, fontWeight: '700', color: palette.textAccent },
});
