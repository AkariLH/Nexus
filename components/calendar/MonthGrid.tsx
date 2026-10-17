import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { gradients, palette } from '../../constants/colors';
import { CalendarItem, monthGrid, sameDay, sourcesOn, WEEKDAY_INITIALS } from '../../utils/calendarLayout';
import { SOURCE_COLORS } from './calendarColors';

interface MonthGridProps {
  month: Date;
  selected: Date;
  today: Date;
  items: CalendarItem[];
  onSelect: (day: Date) => void;
}

/** Figma E1: cuadricula del mes en tarjeta; hoy en degradado, el dia elegido con contorno y puntos por tipo. */
export function MonthGrid({ month, selected, today, items, onSelect }: MonthGridProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {WEEKDAY_INITIALS.map((d, i) => (
          <Text key={i} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>
      {monthGrid(month).map((week, w) => (
        <View key={w} style={styles.row}>
          {week.map((day, i) => {
            if (!day) return <View key={i} style={styles.cell} />;
            const isToday = sameDay(day, today);
            const isSelected = !isToday && sameDay(day, selected);
            const dots = sourcesOn(items, day);
            return (
              <TouchableOpacity
                key={i}
                style={styles.cell}
                onPress={() => onSelect(day)}
                accessibilityRole="button"
                accessibilityLabel={`${day.getDate()}${dots.length ? ', con eventos' : ''}`}
                accessibilityState={{ selected: sameDay(day, selected) }}
              >
                {isToday ? (
                  <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.number}>
                    <Text style={styles.todayText}>{day.getDate()}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.number, isSelected && styles.selected]}>
                    <Text style={[styles.dayText, isSelected && styles.selectedText]}>{day.getDate()}</Text>
                  </View>
                )}
                <View style={styles.dots}>
                  {dots.map((s) => (
                    <View key={s} style={[styles.dot, { backgroundColor: SOURCE_COLORS[s] }]} />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: palette.surface,
    shadowColor: palette.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: palette.textSecondary,
    paddingVertical: 8,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 48,
  },
  number: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selected: {
    borderWidth: 1.5,
    borderColor: palette.primary,
  },
  dayText: {
    fontSize: 15,
    color: palette.text,
  },
  selectedText: {
    color: palette.textAccent,
    fontWeight: '600',
  },
  todayText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.onPrimary,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    height: 6,
    marginTop: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
