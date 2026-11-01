import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../../constants/colors';
import { belowBusy, CalendarItem, dayTitle, FreeSlot, hm, itemsOnDay, layoutLanes, sameDay } from '../../utils/calendarLayout';
import { barColor, tint } from './calendarColors';

const HOURS = Array.from({ length: 24 }, (_, h) => h);

interface TimeGridProps {
  days: Date[];
  items: CalendarItem[];
  /** Huecos libres de los dos; cada uno sale solo en la columna de su dia. */
  freeSlots?: FreeSlot[];
  /** Semana (Figma L3): bloques como barras de color sin texto; el detalle sale al tocarlos. */
  compact?: boolean;
  /** Hora a la que abre desplazado. */
  firstHour?: number;
  /** [ux-ajustes] Dibuja la linea de "ahora" en la columna de hoy. */
  now?: Date;
  onPressItem: (item: CalendarItem) => void;
  onPressFree?: (slot: FreeSlot) => void;
  /** [pulido-critica] Semana: tocar la columna de un dia lo abre (en lugar de cada bloque). */
  onPressDay?: (day: Date) => void;
}

/**
 * Figma E2/E3 y L3: horario con bloques en color claro y barra del color del evento. Los eventos que
 * se enciman se reparten en columnas; los huecos libres de los dos van punteados.
 */
export function TimeGrid({ days, items, freeSlots = [], compact, firstHour = 8, now, onPressItem, onPressFree, onPressDay }: TimeGridProps) {
  const hourHeight = compact ? 44 : 56;
  const byDay = !!compact && !!onPressDay;
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
            // [pulido-critica] D3 (Figma M3): en Semana la columna entera abre ese dia; los bloques
            // de adentro ya no reciben el toque (median 21-41 px).
            const Column = byDay ? TouchableOpacity : View;
            const columnProps = byDay
              ? { onPress: () => onPressDay?.(day), accessibilityRole: 'button' as const, accessibilityLabel: `Ver ${dayTitle(day).toLowerCase()}` }
              : {};
            return (
              <Column key={day.toISOString()} style={[styles.column, days.length > 1 && styles.columnDivider]} {...columnProps}>
                {freeSlots
                  .filter((slot) => sameDay(slot.start, day))
                  .map((slot) => {
                    const box = belowBusy(position(slot.start, slot.end, day), busy);
                    return (
                      <TouchableOpacity
                        key={`${slot.date}-${slot.label}`}
                        style={[styles.free, compact && styles.freeWeek, box]}
                        onPress={() => onPressFree?.(slot)}
                        disabled={byDay}
                        accessibilityRole="button"
                        accessibilityLabel={`Libres los dos de ${slot.label}. Toca para planear`}
                      >
                        {compact ? (
                          box.height >= 20 && <Ionicons name="heart" size={12} color={palette.textAccent} style={styles.freeHeart} />
                        ) : (
                          <>
                            <Text style={styles.freeTitle}>Libres los dos</Text>
                            <Text style={styles.subtitle}>{slot.label} · Toca para planear</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    );
                  })}
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
                      disabled={byDay}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.title}, ${hm(item.start)} a ${hm(item.end)}`}
                    >
                      {/* Semana: barra de color sin texto (los titulos quedaban en "Dor…", "V"). */}
                      {!compact && (
                        <>
                          <View style={styles.blockHeader}>
                            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                              {item.title}
                            </Text>
                            {item.source === 'partner' && <Ionicons name="lock-closed-outline" size={16} color={palette.text} />}
                            {item.source === 'couple' && <Ionicons name="heart-outline" size={16} color={palette.text} />}
                          </View>
                          <Text style={styles.subtitle} numberOfLines={1}>
                            {[`${hm(item.start)} – ${hm(item.end)}`, item.subtitle].filter(Boolean).join(' · ')}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })}
                {now && sameDay(day, now) && (
                  <View
                    testID="now-line"
                    pointerEvents="none"
                    style={[styles.now, { top: ((now.getHours() * 60 + now.getMinutes()) / 60) * hourHeight - 1 }]}
                  >
                    <View style={styles.nowDot} />
                  </View>
                )}
              </Column>
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
    fontSize: 12,
    color: palette.textSecondary,
  },
  now: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: palette.primaryStrong,
  },
  nowDot: {
    position: 'absolute',
    left: -4,
    top: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.primaryStrong,
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
  subtitle: {
    marginTop: 2,
    fontSize: 12,
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
  // Semana (Figma M3): relleno lila con borde liso, para no confundirse con un evento.
  freeWeek: {
    left: 1,
    right: 1,
    paddingHorizontal: 0,
    alignItems: 'center',
    borderStyle: 'solid',
    borderColor: palette.secondaryBorder,
    backgroundColor: palette.secondarySoft,
  },
  freeHeart: {
    marginTop: 2,
  },
  freeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: palette.textAccent,
  },
});
