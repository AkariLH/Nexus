import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { findMutualAvailability } from "../../services/availabilityService";
import { ideaService, IdeaCategory } from "../../services/idea.service";
import linkService from "../../services/link.service";
import recommendationService, { Borough, Scope, ZoneType } from "../../services/recommendation.service";
import { DistanceChips, HoursCard } from "../../components/recommendation/TimeAndDistance";
import {
  budgetLabel,
  chooseScope,
  chooseSlot,
  DEFAULT_RADIUS_KM,
  eligibleSlots,
  isValid,
  MAX_COST_MXN,
  RequestForm,
  SlotOption,
} from "../../utils/recommendationParams";
import { formatMxn, slotOptionLabel } from "../../utils/recommendationFormat";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { ResultModal } from "../components/ResultModal";
import { GradientButton } from "../components/ui/GradientButton";
import { OptionChip } from "../components/ui/OptionChip";

/** Hasta donde el servidor acepta pedir (MutualSlotChecker.DAYS_AHEAD). */
const DAYS_AHEAD = 14;
const DEFAULT_BUDGET = 1500;
const BUDGET_STEP = 50;

const SCOPES: Array<{ value: Scope; label: string }> = [
  { value: "HOME", label: "En casa" },
  { value: "CITY", label: "En la ciudad" },
  { value: "ANY", label: "Cualquiera" },
];

type SlotsState = "loading" | "ready" | "no-link" | "error";

const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {hint && <Text style={styles.sectionHint}>{hint}</Text>}
    {children}
  </View>
);

/**
 * Figma A2, A3a y A3b - CU36 / CU39: detalles de la cita. "Cerca de nosotros" pide la ubicacion
 * solo en ese momento y no se guarda (RN-30); si se niega, se ofrece alcaldia o sin filtro.
 * [rango-distancia] Figma J1: primero cuando (todo el hueco o solo unas horas) y si es en casa;
 * con "En casa" no se pide zona ni distancia.
 */
export default function RecommendationRequestScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState<RequestForm>({ scope: "ANY", maxCostMxn: DEFAULT_BUDGET });
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [slotsState, setSlotsState] = useState<SlotsState>("loading");
  const [categories, setCategories] = useState<IdeaCategory[]>([]);
  const [boroughs, setBoroughs] = useState<Borough[]>([]);
  const [showLocation, setShowLocation] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationFailed, setLocationFailed] = useState(false);
  const [showBoroughs, setShowBoroughs] = useState(false);
  const now = useMemo(() => new Date(), []);

  const update = (patch: Partial<RequestForm>) => setForm((current) => ({ ...current, ...patch }));

  const loadSlots = useCallback(async () => {
    if (!user?.userId) return;
    setSlotsState("loading");
    try {
      const link = await linkService.getLinkStatus(user.userId);
      if (!link.hasActiveLink || !link.partner) {
        setSlotsState("no-link");
        return;
      }
      const mutual = await findMutualAvailability(user.userId, link.partner.userId, DAYS_AHEAD);
      setSlots(eligibleSlots(mutual.mutualAvailability ?? [], new Date()));
      setSlotsState("ready");
    } catch {
      setSlotsState("error");
    }
  }, [user?.userId]);

  useEffect(() => {
    loadSlots();
    ideaService.getCategories().then(setCategories).catch(() => setCategories([]));
    recommendationService.getBoroughs().then(setBoroughs).catch(() => setBoroughs([]));
  }, [loadSlots]);

  const chooseZone = (zoneType: ZoneType) => {
    if (zoneType === "NEAR_US") {
      setLocationFailed(false);
      setShowLocation(true);
    } else if (zoneType === "BOROUGH") {
      setShowBoroughs(true);
    } else {
      update({ zoneType: "NONE" });
    }
  };

  const allowLocation = async () => {
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLocationFailed(true);
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      update({ zoneType: "NEAR_US", coords: { lat: position.coords.latitude, lon: position.coords.longitude } });
      setShowLocation(false);
    } catch {
      setLocationFailed(true);
    } finally {
      setLocating(false);
    }
  };

  const pickBorough = (code: string) => {
    update({ zoneType: "BOROUGH", boroughCode: code });
    setShowBoroughs(false);
  };

  const boroughName = boroughs.find((b) => b.code === form.boroughCode)?.name;

  const submit = () => {
    router.push({
      pathname: "/(recommend)/results",
      params: { form: JSON.stringify(form), boroughName: boroughName ?? "" },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScreenHeader title="Detalles de la cita" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.content}>
        <Section title="¿Cuándo?" hint="Espacios libres de los dos.">
          {slotsState === "loading" && <ActivityIndicator color={palette.primary} style={styles.slotsLoading} />}
          {slotsState === "no-link" && <Text style={styles.emptyText}>Necesitas estar vinculado con tu pareja.</Text>}
          {slotsState === "error" && (
            <TouchableOpacity onPress={loadSlots} accessibilityRole="button">
              <Text style={styles.emptyText}>
                No pudimos cargar sus horarios. <Text style={styles.link}>Reintentar</Text>
              </Text>
            </TouchableOpacity>
          )}
          {slotsState === "ready" && slots.length === 0 && (
            <Text style={styles.emptyText}>No tienen horarios libres en común en los próximos días.</Text>
          )}
          {slotsState === "ready" && slots.length > 0 && (
            <View style={styles.chips}>
              {slots.map((slot) => (
                <OptionChip
                  key={slot.key}
                  label={slotOptionLabel(slot, now)}
                  selected={form.slot?.key === slot.key}
                  onPress={() => setForm((current) => chooseSlot(current, slot))}
                />
              ))}
            </View>
          )}
          {form.slot && (
            <HoursCard
              slot={form.slot}
              range={form.rangeFrom && form.rangeTo ? { from: form.rangeFrom, to: form.rangeTo } : null}
              onChange={(range) => update({ rangeFrom: range?.from, rangeTo: range?.to })}
            />
          )}
        </Section>

        <Section
          title="¿En casa o fuera?"
          hint={form.scope === "HOME" ? "Los planes en casa no necesitan ubicación." : undefined}
        >
          <View style={styles.chips}>
            {SCOPES.map((s) => (
              <OptionChip
                key={s.value}
                label={s.label}
                selected={form.scope === s.value}
                onPress={() => setForm((current) => chooseScope(current, s.value))}
              />
            ))}
          </View>
        </Section>

        {form.scope !== "HOME" && (
          <>
            <Section title="¿Dónde?">
              <View style={styles.chips}>
                <OptionChip label="Cerca de nosotros" selected={form.zoneType === "NEAR_US"} onPress={() => chooseZone("NEAR_US")} />
                <OptionChip
                  label={form.zoneType === "BOROUGH" && boroughName ? boroughName : "En una alcaldía"}
                  selected={form.zoneType === "BOROUGH"}
                  onPress={() => chooseZone("BOROUGH")}
                />
                <OptionChip label="Sin preferencia" selected={form.zoneType === "NONE"} onPress={() => chooseZone("NONE")} />
              </View>
            </Section>

            {(form.zoneType === "NEAR_US" || form.zoneType === "BOROUGH") && (
              <DistanceChips
                radiusKm={form.radiusKm ?? DEFAULT_RADIUS_KM}
                zoneType={form.zoneType}
                onChange={(radiusKm) => update({ radiusKm })}
              />
            )}
          </>
        )}

        <View style={styles.section}>
          <View style={styles.budgetHeader}>
            <Text style={styles.sectionTitle}>Presupuesto por persona</Text>
            <Text style={styles.budgetValue}>{budgetLabel(form.maxCostMxn)}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={MAX_COST_MXN}
            step={BUDGET_STEP}
            value={form.maxCostMxn}
            onValueChange={(value) => update({ maxCostMxn: Math.round(value) })}
            minimumTrackTintColor={palette.primary}
            maximumTrackTintColor={palette.border}
            thumbTintColor={palette.primary}
            accessibilityLabel="Presupuesto por persona"
          />
          <View style={styles.budgetScale}>
            <Text style={styles.scaleText}>$0</Text>
            <Text style={styles.scaleText}>${formatMxn(MAX_COST_MXN)}</Text>
          </View>
        </View>

        <Section title="Tipo de plan" hint="Opcional.">
          <View style={styles.chips}>
            <OptionChip label="Cualquiera" selected={!form.category} onPress={() => update({ category: undefined })} />
            {categories.map((c) => (
              <OptionChip key={c.code} label={c.label} selected={form.category === c.code} onPress={() => update({ category: c.code })} />
            ))}
          </View>
        </Section>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton title="Ver recomendaciones" onPress={submit} disabled={!isValid(form)} />
      </View>

      <ResultModal
        visible={showLocation}
        icon="location-outline"
        title="¿Compartir tu ubicación?"
        subtitle={
          locationFailed
            ? "No pudimos obtener tu ubicación. Puedes elegir una alcaldía."
            : "Solo la usamos para encontrar planes cerca de ti."
        }
        primary={{ label: "Permitir ubicación", onPress: allowLocation, loading: locating }}
        secondary={{
          label: "Elegir una alcaldía",
          onPress: () => {
            setShowLocation(false);
            setShowBoroughs(true);
          },
        }}
        onRequestClose={() => setShowLocation(false)}
      >
        <TouchableOpacity
          onPress={() => {
            update({ zoneType: "NONE" });
            setShowLocation(false);
          }}
          disabled={locating}
          accessibilityRole="button"
        >
          <Text style={styles.noFilter}>Continuar sin filtro de distancia</Text>
        </TouchableOpacity>
      </ResultModal>

      <Modal visible={showBoroughs} transparent animationType="slide" onRequestClose={() => setShowBoroughs(false)}>
        <Pressable accessible={false} style={styles.sheetOverlay} onPress={() => setShowBoroughs(false)}>
          <Pressable accessible={false} style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Elige la alcaldía</Text>
            <ScrollView>
              {boroughs.map((b) => {
                const selected = form.boroughCode === b.code;
                return (
                  <TouchableOpacity
                    key={b.code}
                    style={[styles.boroughRow, selected && styles.boroughRowSelected]}
                    onPress={() => pickBorough(b.code)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.boroughName, selected && styles.boroughNameSelected]}>{b.name}</Text>
                    <Ionicons
                      name={selected ? "radio-button-on" : "radio-button-off"}
                      size={22}
                      color={selected ? palette.primary : palette.iconDisabled}
                    />
                  </TouchableOpacity>
                );
              })}
              {boroughs.length === 0 && <ActivityIndicator color={palette.primary} style={styles.slotsLoading} />}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
    gap: 24,
    paddingBottom: 32,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: palette.text,
  },
  sectionHint: {
    fontSize: 13,
    color: palette.textMuted,
    marginTop: -4,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slotsLoading: {
    marginVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    color: palette.textSecondary,
  },
  link: {
    color: palette.textAccent,
    fontWeight: "600",
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetValue: {
    fontSize: 17,
    fontWeight: "700",
    color: palette.textAccent,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  budgetScale: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -6,
  },
  scaleText: {
    fontSize: 12,
    color: palette.textMuted,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.surface,
  },
  noFilter: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: "center",
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: palette.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "80%",
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.border,
    marginTop: 10,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 12,
  },
  boroughRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
  },
  boroughRowSelected: {
    backgroundColor: palette.primarySoft,
  },
  boroughName: {
    fontSize: 15,
    color: palette.text,
  },
  boroughNameSelected: {
    color: palette.textAccent,
    fontWeight: "600",
  },
});
