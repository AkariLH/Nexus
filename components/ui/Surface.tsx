import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { palette, gradients } from '../../constants/colors';

/**
 * Piezas comunes del rediseño (Figma F y G): tarjeta blanca, cuadros de icono, filas de lista,
 * pastillas de estado y lineas de dato. Las pantallas las combinan en lugar de dibujar cada una.
 */

type IconName = keyof typeof Ionicons.glyphMap;

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Cuadro con degradado e icono blanco (accesos rapidos, avisos). */
export function GradientIcon({ name, size = 44, radius = 12 }: { name: IconName; size?: number; radius?: number }) {
  return (
    <LinearGradient
      colors={gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: radius, justifyContent: 'center', alignItems: 'center' }}
    >
      <Ionicons name={name} size={size >= 44 ? 24 : 20} color={palette.onPrimary} />
    </LinearGradient>
  );
}

/** Cuadro morado claro (o rojo claro en acciones peligrosas) para las filas de lista. */
export function SoftIcon({ name, danger }: { name: IconName; danger?: boolean }) {
  return (
    <View style={[styles.softIcon, { backgroundColor: danger ? palette.errorSoft : palette.secondarySoft }]}>
      <Ionicons name={name} size={20} color={danger ? palette.error : palette.textAccent} />
    </View>
  );
}

interface ListRowProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  danger?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  trailing?: ReactNode;
}

/** Fila de lista con icono suave, titulo, detalle opcional y flecha. */
export function ListRow({ icon, title, subtitle, danger, onPress, disabled, trailing }: ListRowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
    >
      <SoftIcon name={icon} danger={danger} />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, danger && { color: palette.error }]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ?? <Ionicons name="chevron-forward" size={20} color={palette.icon} />}
    </TouchableOpacity>
  );
}

/** Tarjeta con filas separadas por una linea. */
export function ListCard({ children }: { children: ReactNode[] | ReactNode }) {
  const items = (Array.isArray(children) ? children : [children]).filter(Boolean);
  return (
    <Card style={styles.listCard}>
      {items.map((child, i) => (
        <View key={i}>
          {i > 0 && <View style={styles.divider} />}
          {child}
        </View>
      ))}
    </Card>
  );
}

export type PillTone = 'success' | 'warning' | 'error' | 'accent';

const PILL_COLORS: Record<PillTone, { bg: string; fg: string }> = {
  success: { bg: palette.successSoft, fg: palette.success },
  warning: { bg: palette.warningSoft, fg: palette.warning },
  error: { bg: palette.errorSoft, fg: palette.error },
  accent: { bg: palette.secondarySoft, fg: palette.textAccent },
};

/** Pastilla de estado ("Confirmado", "Pendiente de Sam") o de categoria. */
export function Pill({ label, tone = 'accent', icon }: { label: string; tone?: PillTone; icon?: IconName }) {
  const c = PILL_COLORS[tone];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      {icon && <Ionicons name={icon} size={14} color={c.fg} />}
      <Text style={[styles.pillText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

/** Linea de dato con icono gris ("Sáb 18 oct · 17:00 – 19:00"). */
export function MetaLine({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={16} color={palette.icon} />
      <Text style={styles.metaText} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

/** Titulo grande de las pestañas (sin flecha de regreso). */
export function TabTitle({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.tabTitleRow}>
      <Text style={styles.tabTitle} accessibilityRole="header">
        {children}
      </Text>
      {right}
    </View>
  );
}

export function SectionLabel({ children, muted }: { children: string; muted?: boolean }) {
  return <Text style={[styles.sectionLabel, muted && styles.sectionLabelMuted]}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: palette.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  softIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  disabled: { opacity: 0.5 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '500', color: palette.text },
  rowSubtitle: { fontSize: 12, color: palette.textSecondary },
  listCard: { gap: 0 },
  divider: { height: 1, backgroundColor: palette.divider, marginVertical: 12 },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pillText: { fontSize: 12, fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { flexShrink: 1, fontSize: 12, color: palette.textSecondary },
  tabTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  tabTitle: { fontSize: 24, fontWeight: '700', color: palette.text },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: palette.text },
  sectionLabelMuted: { fontSize: 14, fontWeight: '500', color: palette.textSecondary },
});
