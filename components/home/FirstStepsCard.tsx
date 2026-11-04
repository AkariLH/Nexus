import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../../constants/colors';
import type { OnboardingProgress } from '../../services/onboarding.service';
import { MilestoneId, milestonesFrom, partnerDid, partnerLine } from '../../utils/onboarding';
import { GradientIcon } from '../ui/Surface';
import { tourAvailability, tourForMilestone } from '../../utils/tours';

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<MilestoneId, IconName> = {
  questionnaire: 'list-outline',
  link: 'link-outline',
  calendar: 'calendar-outline',
  schedule: 'time-outline',
  recommendation: 'sparkles-outline',
  rating: 'star-outline',
};

interface FirstStepsCardProps {
  progress: OnboardingProgress;
  onOpen: (route: Href) => void;
  onHide: () => void;
  /** «Enséñame dónde» (Figma N1): empieza el recorrido del siguiente paso. */
  onShowMe?: (id: MilestoneId) => void;
}

/**
 * [primeros-pasos] U3 · Figma N1/N4: tarjeta «Primeros pasos» de Inicio. Barra n/6 que avanza con
 * animación, botón al siguiente paso, cómo va la pareja y «Ocultar». Al tocar el encabezado se
 * despliegan los 6 hitos. En 6 de 6 no dibuja nada.
 */
export function FirstStepsCard({ progress, onOpen, onHide, onShowMe }: FirstStepsCardProps) {
  const summary = milestonesFrom(progress, Platform.OS === 'web');
  const [open, setOpen] = useState(false);
  const fill = useRef(new Animated.Value(summary.done / summary.total)).current;

  useEffect(() => {
    Animated.timing(fill, {
      toValue: summary.done / summary.total,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [summary.done, summary.total, fill]);

  if (!summary.next) return null;
  const next = summary.next;
  const partner = partnerLine(progress);
  const countLabel = `${summary.done} de ${summary.total}`;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setOpen(o => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Primeros pasos, ${countLabel}. ${open ? 'Ver menos' : 'Ver todos'}`}
      >
        <Text style={styles.title}>Primeros pasos</Text>
        <View style={styles.countRow}>
          <Text style={styles.count}>{countLabel}</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={palette.textAccent} />
        </View>
      </TouchableOpacity>

      <View style={styles.track} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.View
          style={[styles.fill, { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
        />
      </View>

      {open ? (
        <View style={styles.list}>
          <Text style={styles.listHint}>Toca un paso y te enseñamos cómo</Text>
          {summary.items.map(item => {
            const theirs = partnerDid(progress, item.id);
            const together = item.shared || (item.id === 'link' && !!progress.partner);
            // Cualquier paso, en orden o no: su recorrido; sin recorrido, su pantalla si falta.
            const { tour, reason } = tourAvailability(item.id, progress, Platform.OS === 'web');
            const action = tour && onShowMe
              ? () => onShowMe(item.id)
              : !item.done && item.route && !reason ? () => item.route && onOpen(item.route) : null;
            const state = item.done ? 'hecho' : 'pendiente';
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.row}
                disabled={!action}
                onPress={() => action?.()}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}: ${state}${tour && onShowMe ? '. Ver cómo' : ''}`}
              >
                {item.done ? (
                  <Ionicons name="checkmark-circle-outline" size={22} color={palette.success} />
                ) : (
                  <View style={styles.emptyDot} />
                )}
                <View style={styles.rowBody}>
                  <Text style={[styles.rowText, !item.done && styles.rowTextPending]}>{item.title}</Text>
                  {reason && <Text style={styles.rowReason}>{reason}</Text>}
                </View>
                {together ? (
                  <View style={[styles.chip, { backgroundColor: palette.secondarySoft }]}>
                    <Text style={styles.chipText}>Juntos</Text>
                  </View>
                ) : theirs !== null && progress.partner ? (
                  <View style={[styles.chip, { backgroundColor: theirs ? palette.successSoft : palette.surfaceMuted }]}>
                    <Text style={[styles.chipText, theirs && { color: palette.success }]}>
                      {theirs ? `${progress.partner.name} ✓` : `${progress.partner.name}: pendiente`}
                    </Text>
                  </View>
                ) : null}
                {action && tour && <Ionicons name="chevron-forward" size={18} color={palette.icon} />}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.next}
          disabled={!next.route}
          onPress={() => next.route && onOpen(next.route)}
          accessibilityRole="button"
          accessibilityLabel={`Siguiente paso: ${next.title}`}
        >
          <GradientIcon name={ICONS[next.id]} />
          <View style={styles.nextText}>
            <Text style={styles.nextTitle}>{next.title}</Text>
            <Text style={styles.nextHint}>{next.phoneOnly ? 'Hazlo desde tu teléfono' : next.hint}</Text>
          </View>
          {next.route && <Ionicons name="chevron-forward" size={22} color={palette.text} />}
        </TouchableOpacity>
      )}

      {!open && onShowMe && next.route && tourForMilestone(next.id) && (
        <TouchableOpacity onPress={() => onShowMe(next.id)} accessibilityRole="button" hitSlop={8} style={styles.showMe}>
          <Text style={styles.showMeText}>Enséñame dónde</Text>
        </TouchableOpacity>
      )}

      {partner && (
        <View style={styles.partner}>
          <Ionicons name="people-outline" size={16} color={palette.textSecondary} />
          <Text style={styles.partnerText}>{partner}</Text>
        </View>
      )}

      <TouchableOpacity onPress={onHide} style={styles.hide} accessibilityRole="button" hitSlop={12}>
        <Text style={styles.hideText}>Ocultar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.primaryBorder,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 24 },
  title: { fontSize: 18, fontWeight: '700', color: palette.text },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  count: { fontSize: 13, fontWeight: '600', color: palette.textAccent },
  track: { height: 8, borderRadius: 4, backgroundColor: palette.surfaceMuted, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: palette.primary },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: palette.primarySoft,
  },
  nextText: { flex: 1, gap: 2 },
  nextTitle: { fontSize: 15, fontWeight: '600', color: palette.text },
  nextHint: { fontSize: 13, color: palette.textSecondary },
  list: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, minHeight: 44 },
  emptyDot: { width: 20, height: 20, marginHorizontal: 1, borderRadius: 10, borderWidth: 2, borderColor: palette.border },
  listHint: { fontSize: 13, color: palette.textSecondary, marginBottom: 2 },
  rowBody: { flex: 1, gap: 2 },
  rowReason: { fontSize: 12, color: palette.textMuted },
  rowText: { fontSize: 14, color: palette.textSecondary },
  rowTextPending: { color: palette.text, fontWeight: '600' },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  chipText: { fontSize: 12, color: palette.textSecondary },
  showMe: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  showMeText: { fontSize: 13, fontWeight: '600', color: palette.textAccent },
  partner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  partnerText: { fontSize: 13, color: palette.textSecondary },
  hide: { alignSelf: 'flex-end' },
  hideText: { fontSize: 13, fontWeight: '600', color: palette.textMuted },
});
