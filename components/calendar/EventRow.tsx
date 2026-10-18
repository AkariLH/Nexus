import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../../constants/colors';
import { CalendarItem, hm } from '../../utils/calendarLayout';
import { barColor } from './calendarColors';

/** Figma E1: evento del dia elegido; barra de color, horas, titulo y de donde viene. */
export function EventRow({ item, onPress }: { item: CalendarItem; onPress?: () => void }) {
  const locked = item.source === 'partner';
  return (
    <TouchableOpacity
      style={[styles.row, { borderLeftColor: barColor(item) }]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.allDay ? 'todo el día' : `${hm(item.start)} a ${hm(item.end)}`}`}
    >
      <View style={styles.times}>
        {item.allDay ? (
          <Text style={styles.allDay}>Todo el día</Text>
        ) : (
          <>
            <Text style={styles.start}>{hm(item.start)}</Text>
            <Text style={styles.end}>{hm(item.end)}</Text>
          </>
        )}
      </View>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        {!!item.subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}
      </View>
      {locked && <Ionicons name="lock-closed-outline" size={18} color={palette.text} />}
      {item.source === 'couple' && <Ionicons name="heart-outline" size={18} color={palette.text} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderLeftWidth: 4,
    backgroundColor: palette.surface,
    shadowColor: palette.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  times: {
    width: 64,
  },
  allDay: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.text,
  },
  start: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.text,
  },
  end: {
    marginTop: 2,
    fontSize: 12,
    color: palette.textSecondary,
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.text,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: palette.textSecondary,
  },
});
