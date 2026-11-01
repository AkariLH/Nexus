import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { gradients, palette } from '../../constants/colors';
import { sameDay, WEEKDAY_INITIALS } from '../../utils/calendarLayout';

interface DayStripProps {
  days: Date[];
  today: Date;
  /** Dia elegido con contorno (vista Dia); en Semana no se marca. */
  selected?: Date;
  onSelect: (day: Date) => void;
}

/** Figma E2/E3: tira de los 7 dias; hoy en degradado y el dia elegido con contorno. */
export function DayStrip({ days, today, selected, onSelect }: DayStripProps) {
  return (
    <View style={styles.row}>
      {days.map((day) => {
        const isToday = sameDay(day, today);
        const isSelected = !!selected && !isToday && sameDay(day, selected);
        const content = (color: string) => (
          <>
            <Text style={[styles.initial, { color }]}>{WEEKDAY_INITIALS[day.getDay()]}</Text>
            <Text style={[styles.number, { color }]}>{day.getDate()}</Text>
          </>
        );
        return (
          <TouchableOpacity
            key={day.toISOString()}
            style={styles.item}
            onPress={() => onSelect(day)}
            accessibilityRole="button"
            accessibilityLabel={`Ver el día ${day.getDate()}`}
            accessibilityState={{ selected: !!selected && sameDay(day, selected) }}
          >
            {isToday ? (
              <LinearGradient colors={gradients.onText} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.box}>
                {content(palette.onPrimary)}
              </LinearGradient>
            ) : (
              <View style={[styles.box, styles.plain, isSelected && styles.selected]}>
                {content(isSelected ? palette.textAccent : palette.text)}
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  item: {
    flex: 1,
  },
  box: {
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plain: {
    backgroundColor: palette.surface,
  },
  selected: {
    borderWidth: 1.5,
    borderColor: palette.primary,
  },
  initial: {
    fontSize: 12,
    fontWeight: '500',
  },
  number: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '600',
  },
});
