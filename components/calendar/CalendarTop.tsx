import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gradients, palette } from '../../constants/colors';

export type CalendarMode = 'month' | 'week' | 'day';

const MODES: { mode: CalendarMode; label: string }[] = [
  { mode: 'month', label: 'Mes' },
  { mode: 'week', label: 'Semana' },
  { mode: 'day', label: 'Día' },
];

interface CalendarTopProps {
  title: string;
  mode: CalendarMode;
  onMode: (mode: CalendarMode) => void;
  onToday: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

/** Figma E1-E3: mes y año, "Hoy", flechas y el selector Mes / Semana / Día. */
export function CalendarTop({ title, mode, onMode, onToday, onPrevious, onNext }: CalendarTopProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.row}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <TouchableOpacity style={styles.today} onPress={onToday} accessibilityRole="button">
          <Text style={styles.todayText}>Hoy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.arrow} onPress={onPrevious} accessibilityRole="button" accessibilityLabel="Anterior">
          <Ionicons name="arrow-back" size={20} color={palette.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.arrow} onPress={onNext} accessibilityRole="button" accessibilityLabel="Siguiente">
          <Ionicons name="arrow-forward" size={20} color={palette.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.switch} accessibilityRole="tablist">
        {MODES.map((m) => {
          const active = m.mode === mode;
          return (
            <TouchableOpacity
              key={m.mode}
              style={styles.switchItem}
              onPress={() => onMode(m.mode)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              {active ? (
                <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.switchActive}>
                  <Text style={styles.switchTextActive}>{m.label}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.switchText}>{m.label}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: palette.background,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: palette.text,
  },
  today: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.primaryBorder,
    backgroundColor: palette.surface,
    justifyContent: 'center',
  },
  todayText: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textAccent,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switch: {
    flexDirection: 'row',
    marginTop: 16,
    padding: 4,
    borderRadius: 14,
    backgroundColor: palette.surfaceMuted,
  },
  switchItem: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchActive: {
    alignSelf: 'stretch',
    flex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.textSecondary,
  },
  switchTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.onPrimary,
  },
});
