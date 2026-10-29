import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import recommendationService, { RecommendationItem } from "../../services/recommendation.service";
import { trackInvite } from "../../utils/inviteTracker";
import { costLabel, placeLabel, slotLabel, slotOptionLabel } from "../../utils/recommendationFormat";
import {
  budgetLabel,
  DEFAULT_RADIUS_KM,
  nextRadius,
  relaxedMessage,
  RequestForm,
  requestedSlot,
  toParams,
  zoneLabel,
} from "../../utils/recommendationParams";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { PlanSummaryCard } from "../components/PlanSummaryCard";
import { RecommendationCard } from "../components/RecommendationCard";
import { ResultModal } from "../components/ResultModal";
import { SearchingPlans } from "../components/SearchingPlans";
import { GradientButton } from "../components/ui/GradientButton";

/** La animacion de busqueda se ve completa aunque el servidor conteste antes. */
const MIN_SEARCH_MS = 2200;
const MIN_MORE_MS = 1200;

type Phase = "searching" | "ready" | "error";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Corre la peticion y espera al menos `ms` para que la animacion no parpadee. */
async function atLeast<T>(ms: number, task: Promise<T>): Promise<T> {
  const [result] = await Promise.all([task, wait(ms)]);
  return result;
}

const errorText = (error: any): string => {
  if (error?.status === 400) return "Ese horario ya no está libre para los dos. Elige otro.";
  if (error?.status === 403) return "Necesitas estar vinculado con tu pareja.";
  return "No pudimos buscar planes ahora. Intenta de nuevo.";
};

const FilterPill = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
  <View style={styles.pill}>
    <Ionicons name={icon} size={16} color={palette.textAccent} />
    <Text style={styles.pillText}>{text}</Text>
  </View>
);

/**
 * Figma A4, A5 y A6 - RF-37 / RF-40 / RN-39: buscar (animado), ver 5 opciones, descartar (entra la
 * siguiente), "Buscar más opciones" con los mismos filtros y enviar una como invitacion. Nunca se
 * dice cuantas opciones hay guardadas: al agotarse se invita a ajustar filtros.
 */
export default function RecommendationResultsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ form: string; boroughName?: string }>();
  const form = useMemo<RequestForm>(() => JSON.parse(params.form), [params.form]);
  const now = useMemo(() => new Date(), []);

  const [phase, setPhase] = useState<Phase>("searching");
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState<number | null>(null);
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [relaxed, setRelaxed] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toInvite, setToInvite] = useState<RecommendationItem | null>(null);
  const [sending, setSending] = useState(false);

  const search = useCallback(async () => {
    if (!user?.userId) return;
    setPhase("searching");
    try {
      const batch = await atLeast(MIN_SEARCH_MS, recommendationService.request(user.userId, toParams(form)));
      setRequestId(batch.requestId);
      setItems(batch.items);
      setRelaxed(batch.relaxedFilters ?? []);
      setHasMore(batch.hasMore);
      setPhase("ready");
    } catch (e) {
      setError(errorText(e));
      setPhase("error");
    }
  }, [user?.userId, form]);

  useEffect(() => {
    search();
  }, [search]);

  const searchMore = async () => {
    if (!user?.userId || requestId === null) return;
    setPhase("searching");
    try {
      const batch = await atLeast(MIN_MORE_MS, recommendationService.more(user.userId, requestId));
      setItems(batch.items);
      setHasMore(batch.hasMore);
    } catch (e: any) {
      if (e?.status === 409) setHasMore(false);
    } finally {
      setPhase("ready");
    }
  };

  const discard = async (item: RecommendationItem) => {
    if (!user?.userId) return;
    setBusyId(item.id);
    try {
      const { replacement, hasMore: more } = await recommendationService.discard(user.userId, item.id);
      setItems((current) =>
        replacement ? current.map((i) => (i.id === item.id ? replacement : i)) : current.filter((i) => i.id !== item.id),
      );
      setHasMore(more);
    } catch {
      // Si no se pudo descartar, la tarjeta se queda.
    } finally {
      setBusyId(null);
    }
  };

  const sendInvite = async () => {
    if (!user?.userId || !toInvite) return;
    setSending(true);
    try {
      const response = await recommendationService.invite(user.userId, toInvite.id);
      await trackInvite(user.userId, {
        eventId: response.event.id,
        title: toInvite.title,
        startsAt: toInvite.startsAt,
        endsAt: toInvite.endsAt,
        place: placeLabel(toInvite),
        costPerPersonMxn: toInvite.costPerPersonMxn,
      });
      setToInvite(null);
      router.dismissAll();
      router.navigate("/(tabs)");
    } catch (e) {
      setToInvite(null);
      setError(errorText(e));
      setPhase("error");
    } finally {
      setSending(false);
    }
  };

  const adjustFilters = () => router.back();
  // [rango-distancia] Figma J3: sin opciones con poca distancia se ofrece buscar con la siguiente.
  const withDistance = form.zoneType === "NEAR_US" || form.zoneType === "BOROUGH";
  const radiusKm = form.radiusKm ?? DEFAULT_RADIUS_KM;
  const widerRadius = withDistance ? nextRadius(radiusKm) : null;
  const tryWider = () => {
    if (widerRadius === null) return;
    router.replace({
      pathname: "/(recommend)/results",
      params: { form: JSON.stringify({ ...form, radiusKm: widerRadius }), boroughName: params.boroughName ?? "" },
    });
  };
  const shownSlot = requestedSlot(form);
  const zone = zoneLabel(form.zoneType ?? "NONE", params.boroughName || undefined);
  const notice = relaxedMessage(relaxed);

  if (phase === "searching") {
    return (
      <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
        <ScreenHeader title="Recomendaciones" onBack={() => router.back()} />
        <SearchingPlans withDistance={withDistance} radiusKm={radiusKm} />
      </SafeAreaView>
    );
  }

  if (phase === "error") {
    return (
      <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
        <ScreenHeader title="Recomendaciones" onBack={() => router.back()} />
        <View style={styles.errorBox}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={56} color={palette.iconDisabled} />
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <GradientButton title="Ajustar filtros" onPress={adjustFilters} style={styles.errorButton} />
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0 && widerRadius !== null) {
    return (
      <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
        <ScreenHeader title="Recomendaciones" onBack={() => router.back()} />
        <View style={styles.errorBox}>
          <View style={[styles.errorIcon, styles.softIcon]}>
            <Ionicons name="location-outline" size={48} color={palette.primary} />
          </View>
          <Text style={styles.emptyTitle}>No encontramos planes a {radiusKm} km</Text>
          <Text style={styles.errorText}>Con una distancia mayor suelen salir más opciones. Tus demás filtros se quedan igual.</Text>
          <GradientButton title={`Prueba con ${widerRadius} km`} onPress={tryWider} style={styles.errorButton} />
          <TouchableOpacity style={[styles.moreButton, styles.errorButton]} onPress={adjustFilters} accessibilityRole="button">
            <Text style={styles.moreText}>Cambiar filtros</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScreenHeader title="Recomendaciones" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.pills}>
          {shownSlot && <FilterPill icon="calendar-outline" text={slotOptionLabel(shownSlot, now)} />}
          {zone && <FilterPill icon="location-outline" text={withDistance ? `${zone} · ${radiusKm} km` : zone} />}
          <FilterPill icon="cash-outline" text={budgetLabel(form.maxCostMxn)} />
        </View>

        {notice && (
          <View style={styles.notice}>
            <Ionicons name="sparkles-outline" size={16} color={palette.textAccent} />
            <Text style={styles.noticeText}>{notice}</Text>
          </View>
        )}

        {items.map((item) => (
          <RecommendationCard
            key={item.id}
            item={item}
            now={now}
            busy={busyId === item.id}
            onDiscard={() => discard(item)}
            onInvite={() => setToInvite(item)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {hasMore ? (
          <TouchableOpacity style={styles.moreButton} onPress={searchMore} accessibilityRole="button">
            <Text style={styles.moreText}>Buscar más opciones</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Text style={styles.exhausted}>Ajusta los filtros para ver más opciones.</Text>
            <GradientButton title="Ajustar filtros" onPress={adjustFilters} />
          </>
        )}
        {hasMore && (
          <TouchableOpacity onPress={adjustFilters} accessibilityRole="button">
            <Text style={styles.adjustText}>Ajustar filtros</Text>
          </TouchableOpacity>
        )}
      </View>

      <ResultModal
        visible={toInvite !== null}
        title="Enviar invitación"
        footnote="Tu pareja podrá aceptarla o rechazarla."
        primary={{ label: "Enviar invitación", onPress: sendInvite, loading: sending }}
        secondary={{ label: "Cancelar", onPress: () => setToInvite(null) }}
        onRequestClose={() => !sending && setToInvite(null)}
      >
        {toInvite && (
          <PlanSummaryCard
            title={toInvite.title}
            when={slotLabel(toInvite.startsAt, toInvite.endsAt, now)}
            place={placeLabel(toInvite)}
            cost={costLabel(toInvite.costPerPersonMxn)}
          />
        )}
      </ResultModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 24,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: palette.secondarySoft,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: palette.textAccent,
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: -4,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: palette.textSecondary,
  },
  footer: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.surface,
  },
  moreButton: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  moreText: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.textAccent,
  },
  adjustText: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.textAccent,
    textAlign: "center",
  },
  exhausted: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: "center",
  },
  errorBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  errorIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.surfaceMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 15,
    color: palette.textSecondary,
    textAlign: "center",
  },
  errorButton: {
    alignSelf: "stretch",
  },
  softIcon: {
    backgroundColor: palette.primarySoft,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.text,
    textAlign: "center",
  },
});
