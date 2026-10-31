import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../../constants/colors';
import { GradientIcon } from '../ui/Surface';

interface ProposalCardProps {
  title: string;
  subtitle: string;
  /** Lo que lee el lector de pantalla (el horario completo, R9). */
  accessibilityLabel?: string;
  icon?: 'heart-outline' | 'calendar-outline';
  /** Sin `onPress` la tarjeta solo informa (sin flecha). */
  onPress?: () => void;
}

/**
 * [libres-juntos] Figma K1/K2 - Tarjeta rosa suave con corazon, como la de la planeacion en pareja
 * de Inicio: una propuesta, la proxima cita o el aviso de que no coinciden.
 */
export function ProposalCard({ title, subtitle, accessibilityLabel, icon = 'heart-outline', onPress }: ProposalCardProps) {
  const body = (
    <>
      <GradientIcon name={icon} size={40} radius={12} />
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />}
    </>
  );
  if (!onPress) {
    return (
      <View style={styles.card} accessible accessibilityLabel={accessibilityLabel ?? `${title}. ${subtitle}`}>
        {body}
      </View>
    );
  }
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${title}. ${subtitle}`}
    >
      {body}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.primaryBorder,
    backgroundColor: palette.primarySoft,
  },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '600', color: palette.text },
  subtitle: { fontSize: 13, color: palette.textSecondary },
});
