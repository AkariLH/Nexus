import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { gradients, palette } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { useQuestionnaireGuard } from "../../hooks/useQuestionnaireGuard";
import { findMutualAvailability, MutualAvailabilityResponse } from "../../services/availabilityService";
import eventService, { EventResponse } from "../../services/event.service";
import { externalCalendarIntegration, ExternalEventDTO } from "../../services/externalCalendar.integration.service";
import linkService from "../../services/link.service";
import {
  buildCalendarItems,
  CalendarItem,
  dayTitle,
  FreeSlot,
  freeSlotsOn,
  freeTogetherDays,
  isoDate,
  itemsOnDay,
  monthTitle,
  sameDay,
  shortDay,
  weekOf,
} from "../../utils/calendarLayout";
import { CalendarMode, CalendarTop } from "../../components/calendar/CalendarTop";
import { MonthGrid } from "../../components/calendar/MonthGrid";
import { DayStrip } from "../../components/calendar/DayStrip";
import { EventRow } from "../../components/calendar/EventRow";
import { TimeGrid } from "../../components/calendar/TimeGrid";
import { FreeTogetherBubble, FreeTogetherModal } from "../../components/calendar/FreeTogether";
import { barColor, SOURCE_COLORS } from "../../components/calendar/calendarColors";
import { EventDetailsModal } from "../components/EventDetailsModal";
import { ExternalEventDetail, ExternalEventDetailModal } from "../components/ExternalEventDetailModal";

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/**
 * Figma E1-E4 - Calendario compartido: Mes, Semana y Día con los eventos de los dos, del
 * calendario propio y del de la pareja (solo lectura), y la burbuja "Libres juntos" que abre los
 * horarios libres de los dos para crear una cita con esa hora.
 */
export default function CalendarioScreen() {
  const insets = useSafeAreaInsets();
  useQuestionnaireGuard();
  const { user } = useAuth();
  const router = useRouter();
  const { freeTogether } = useLocalSearchParams<{ freeTogether?: string }>();

  const [loading, setLoading] = useState(true);
  const [hasActiveLink, setHasActiveLink] = useState(false);
  const [partner, setPartner] = useState<{ id: number; name: string } | null>(null);
  const [mode, setMode] = useState<CalendarMode>("month");
  const [selected, setSelected] = useState(() => new Date());
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [external, setExternal] = useState<ExternalEventDTO[]>([]);
  const [mutual, setMutual] = useState<MutualAvailabilityResponse | null>(null);
  const [showFree, setShowFree] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);
  const [externalDetail, setExternalDetail] = useState<ExternalEventDetail | null>(null);

  const now = new Date();
  const range = useMemo(() => {
    const start = new Date();
    start.setMonth(start.getMonth() - 6);
    const end = new Date();
    end.setMonth(end.getMonth() + 12);
    return { start, end };
  }, []);

  const load = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const link = await linkService.getLinkStatus(user.userId);
      setHasActiveLink(link.hasActiveLink);
      const partnerId = link.hasActiveLink && link.partner ? link.partner.userId : null;
      setPartner(
        partnerId && link.partner
          ? { id: partnerId, name: link.partner.displayName || link.partner.nickname || "tu pareja" }
          : null,
      );
      if (!link.hasActiveLink) return;

      const [mine, ext, free] = await Promise.all([
        eventService.getUserEvents(user.userId),
        externalCalendarIntegration
          .getExternalEvents(user.userId, range.start, range.end, partnerId ?? undefined)
          .catch(() => [] as ExternalEventDTO[]),
        partnerId ? findMutualAvailability(user.userId, partnerId, 7).catch(() => null) : Promise.resolve(null),
      ]);
      setEvents(mine);
      setExternal(ext);
      setMutual(free);
    } catch (error) {
      console.error("Error cargando el calendario:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.userId, range]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Desde Vínculo ("Horarios libres juntos") se llega con ?freeTogether=1.
  useEffect(() => {
    if (freeTogether === "1") {
      setShowFree(true);
      router.setParams({ freeTogether: undefined });
    }
  }, [freeTogether]);

  const items = useMemo(
    () =>
      user?.userId
        ? buildCalendarItems({ events, external, userId: user.userId, partnerName: partner?.name ?? "tu pareja", range })
        : [],
    [events, external, user?.userId, partner?.name, range],
  );
  const freeDays = useMemo(() => freeTogetherDays(mutual, now), [mutual, now.getHours()]);
  const freeCount = freeDays.reduce((n, d) => n + d.slots.length, 0);

  const openItem = (item: CalendarItem) => {
    if (item.eventId !== null) {
      const event = events.find((e) => e.id === item.eventId);
      // Las repeticiones guardan el id compuesto "id-fecha" para editar o borrar solo esa.
      if (event) setSelectedEvent(item.id.includes("-") ? { ...event, id: item.id as any } : event);
      return;
    }
    const ext = external.find((e) => e.id === item.externalId);
    if (ext) {
      setExternalDetail({
        title: ext.title,
        description: ext.description || undefined,
        location: ext.location || undefined,
        startDate: ext.startDatetime,
        endDate: ext.endDatetime,
        allDay: ext.isAllDay,
        recurrenceRule: ext.recurrenceRule || undefined,
      });
    }
  };

  const createAt = (slot?: FreeSlot) => {
    setShowFree(false);
    router.push({
      pathname: "/(events)/create-event",
      params: slot
        ? { suggestedDate: slot.date, suggestedStart: slot.startTime, suggestedEnd: slot.endTime }
        : { suggestedDate: isoDate(selected) },
    });
  };

  const move = (direction: 1 | -1) => {
    if (mode === "month") {
      const first = new Date(selected.getFullYear(), selected.getMonth() + direction, 1);
      setSelected(first.getFullYear() === now.getFullYear() && first.getMonth() === now.getMonth() ? new Date() : first);
    } else {
      setSelected(addDays(selected, direction * (mode === "week" ? 7 : 1)));
    }
  };

  const header = (
    <CalendarTop
      title={monthTitle(selected)}
      mode={mode}
      onMode={setMode}
      onToday={() => setSelected(new Date())}
      onPrevious={() => move(-1)}
      onNext={() => move(1)}
    />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </View>
    );
  }

  if (!hasActiveLink) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.center}>
          <LinearGradient colors={gradients.soft} style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={56} color={palette.primary} />
            <Text style={styles.emptyTitle}>Calendario no disponible</Text>
            <Text style={styles.emptyText}>
              Necesitas establecer un vínculo con tu pareja para acceder al calendario compartido
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.push("/(tabs)/link")} accessibilityRole="button">
              <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyButtonInner}>
                <Ionicons name="heart" size={20} color={palette.onPrimary} />
                <Text style={styles.emptyButtonText}>Establecer vínculo</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    );
  }

  const week = weekOf(selected);
  const shownDays = mode === "day" ? [selected] : week;
  const allDay = shownDays.flatMap((day) =>
    itemsOnDay(items, day)
      .filter((i) => i.allDay)
      .map((item) => ({ day, item })),
  );
  const timedHours = shownDays.flatMap((day) =>
    itemsOnDay(items, day)
      .filter((i) => !i.allDay)
      .map((i) => (sameDay(i.start, day) ? i.start.getHours() : 0)),
  );
  const firstHour = Math.min(8, ...timedHours);

  return (
    <View style={styles.container}>
      {header}

      {mode === "month" && (
        <ScrollView contentContainerStyle={styles.monthContent}>
          <MonthGrid month={selected} selected={selected} today={now} items={items} onSelect={setSelected} />
          <View style={styles.legend}>
            {[
              { color: SOURCE_COLORS.couple, label: "De los dos" },
              { color: SOURCE_COLORS.mine, label: "Tu calendario" },
              { color: SOURCE_COLORS.partner, label: `De ${partner?.name ?? "tu pareja"}` },
            ].map((l) => (
              <View key={l.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendText}>{l.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.dayTitle}>{dayTitle(selected)}</Text>
          {itemsOnDay(items, selected).length === 0 ? (
            <Text style={styles.noEvents}>Sin eventos este día.</Text>
          ) : (
            <View style={styles.list}>
              {itemsOnDay(items, selected).map((item) => (
                <EventRow
                  key={item.id}
                  item={item}
                  onPress={item.eventId !== null || item.externalId !== null ? () => openItem(item) : undefined}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {mode !== "month" && (
        <View style={styles.gridContent}>
          <DayStrip
            days={week}
            today={now}
            selected={mode === "day" ? selected : undefined}
            onSelect={(day) => {
              setSelected(day);
              setMode("day");
            }}
          />
          {mode === "day" && <Text style={styles.dayTitle}>{dayTitle(selected)}</Text>}
          {allDay.map(({ day, item }) => (
            <TouchableOpacity
              key={`${isoDate(day)}-${item.id}`}
              style={styles.allDay}
              onPress={() => openItem(item)}
              accessibilityRole="button"
            >
              <View style={[styles.legendDot, { backgroundColor: barColor(item) }]} />
              <Text style={styles.allDayText} numberOfLines={1}>
                {mode === "week" ? `${shortDay(day)} · ` : ""}Todo el día · {item.title}
              </Text>
            </TouchableOpacity>
          ))}
          <TimeGrid
            key={mode}
            days={shownDays}
            items={items}
            compact={mode === "week"}
            firstHour={firstHour}
            freeSlots={mode === "day" ? freeSlotsOn(mutual, selected, now) : []}
            onPressItem={openItem}
            onPressFree={createAt}
          />
        </View>
      )}

      <View style={styles.floating} pointerEvents="box-none">
        <FreeTogetherBubble count={freeCount} onPress={() => setShowFree(true)} />
        <View style={styles.flex} />
        <TouchableOpacity style={styles.fab} onPress={() => createAt()} accessibilityRole="button" accessibilityLabel="Crear evento">
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabInner}>
            <Ionicons name="add" size={28} color={palette.onPrimary} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FreeTogetherModal visible={showFree} days={freeDays} onPick={createAt} onClose={() => setShowFree(false)} />

      <EventDetailsModal
        visible={selectedEvent !== null}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onEdit={(eventId: number) => router.push(`/(events)/edit-event?eventId=${eventId}`)}
        onDelete={async (eventId: number) => {
          if (!user?.userId) return;
          await eventService.deleteEvent(eventId, user.userId);
          await load();
        }}
        onRefresh={load}
      />

      <ExternalEventDetailModal
        visible={externalDetail !== null}
        event={externalDetail}
        onClose={() => setExternalDetail(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  monthContent: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  dayTitle: {
    marginTop: 16,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "600",
    color: palette.text,
  },
  noEvents: {
    fontSize: 14,
    color: palette.textSecondary,
  },
  list: {
    gap: 10,
  },
  gridContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
    gap: 10,
  },
  allDay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: palette.secondarySoft,
  },
  allDayText: {
    flex: 1,
    fontSize: 13,
    color: palette.text,
  },
  floating: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  flex: {
    flex: 1,
  },
  fab: {
    borderRadius: 28,
    shadowColor: palette.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCard: {
    width: "100%",
    padding: 32,
    borderRadius: 24,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
    color: palette.text,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 24,
    borderRadius: 24,
    overflow: "hidden",
  },
  emptyButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.onPrimary,
  },
});
