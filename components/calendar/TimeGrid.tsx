import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../../constants/colors';
import { belowBusy, CalendarItem, FreeSlot, hm, itemsOnDay, layoutLanes } from '../../utils/calendarLayout';
import { barColor, tint } from './calendarColors';

const HOURS = Array.from({ length: 24 }, (_, h) => h);

interface TimeGridProps {
  days: Date[];
  items: CalendarItem[];
  /** Huecos libres de los dos (solo en la vista Dia, Figma E3). */
  freeSlots?: FreeSlot[];
  /** Semana: bloques angostos solo con titulo. */
  compact?: boolean;
  /** Hora a la que abre desplazado. */
  firstHour?: number;
  onPressItem: (item: CalendarItem) => void;
  onPressFree?: (slot: FreeSlot) => void;
}

/**
 * Figma E2/E3: horario con bloques en color claro y barra del color del evento. Los eventos que
 * se enciman se reparten en columnas; los huecos libres de los dos van punteados.
 */
export function TimeGrid({ days, items, freeSlots = [], compact, firstHour = 8, onPressItem, onPressFree }: TimeGridProps) {
  const hourHeight = compact ? 44 : 56;
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    const id = setTimeout(() => scroll.current?.scrollTo({ y: firstHour * hourHeight, animated: false }), 0);
    return () => clearTimeout(id);
  }, [firstHour, hourHeight]);

  const position = (start: Date, end: Date, day: Date) => {
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    const from = Math.max(start.getTime(), dayStart);
    const to = Math.min(end.getTime(), dayStart + 24 * 3_600_000);
    const top = ((from - dayStart) / 3_600_000) * hourHeight;
    return { top, height: Math.max(((to - from) / 3_600_000) * hourHeight, compact ? 20 : 28) };
  };

  return (
    <ScrollView ref={scroll} style={styles.scroll} contentContainerStyle={{ height: 24 * hourHeight + 8 }} nestedScrollEnabled>
      <View style={styles.body}>
        <View style={styles.hours}>
          {HOURS.map((h) => (
            <Text key={h} style={[styles.hour, { top: h * hourHeight - 7 }]}>
              {`${String(h).padStart(2, '0')}:00`}
            </Text>
          ))}
        </View>
        <View style={styles.columns}>
          {HOURS.map((h) => (
            <View key={h} style={[styles.line, { top: h * hourHeight }]} />
          ))}
          {days.map((day) => {
            const timed = itemsOnDay(items, day).filter((i) => !i.allDay);
            const busy = timed.map((i) => position(i.start, i.end, day));
            return (
              <View key={day.toISOString()} style={[styles.column, days.length > 1 && styles.columnDivider]}>
                {freeSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot.label}
                    style={[styles.free, belowBusy(position(slot.start, slot.end, day), busy)]}
                    onPress={() => onPressFree?.(slot)}
                    accessibilityRole="button"
                    accessibilityLabel={`Libres los dos de ${slot.label}. Toca para planear`}
                  >
                    <Text style={styles.freeTitle}>Libres los dos</Text>
                    <Text style={styles.subtitle}>{slot.label} · Toca para planear</Text>
                  </TouchableOpacity>
                ))}
                {layoutLanes(timed).map(({ item, lane, lanes }) => {
                  const color = barColor(item);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.block,
                        position(item.start, item.end, day),
                        {
                          left: `${(lane / lanes) * 100}%`,
                          width: `${100 / lanes}%`,
                          backgroundColor: tint(color),
                          borderLeftColor: color,
                        },
                      ]}
                      onPress={() => onPressItem(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.title}, ${hm(item.start)} a ${hm(item.end)}`}
                    >
                      <View style={styles.blockHeader}>
                        {/* Una linea con "…": en Semana la columna es angosta y partia palabras ("Ocup/ado"). */}
                        <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={1} ellipsizeMode="tail">
                          {item.title}
                        </Text>
                        {!compact && item.source === 'partner' && (
                          <Ionicons name="lock-closed-outline" size={16} color={palette.text} />
                        )}
                        {!compact && item.source === 'couple' && <Ionicons name="heart-outline" size={16} color={palette.text} />}
                      </View>
                      {!compact && (
                        <Text style={styles.subtitle} numberOfLines={1}>
                          {[`${hm(item.start)} – ${hm(item.end)}`, item.subtitle].filter(Boolean).join(' · ')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: palette.surface,
  },
  body: {
    flexDirection: 'row',
    paddingTop: 8,
    flex: 1,
  },
  hours: {
    width: 48,
  },
  hour: {
    position: 'absolute',
    left: 6,
    fontSize: 11,
    color: palette.textSecondary,
  },
  columns: {
    flex: 1,
    flexDirection: 'row',
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.divider,
  },
  column: {
    flex: 1,
  },
  columnDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: palette.divider,
  },
  block: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: palette.text,
  },
  titleCompact: {
    fontSize: 10,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 11,
    color: palette.textSecondary,
  },
  free: {
    position: 'absolute',
    left: 2,
    right: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  freeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textAccent,
  },
});
