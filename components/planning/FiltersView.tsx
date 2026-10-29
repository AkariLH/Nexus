import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { OptionChip } from '../../app/components/ui/OptionChip';
import { GradientButton } from '../../app/components/ui/GradientButton';
import { palette } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { findMutualAvailability } from '../../services/availabilityService';
import { ideaService, IdeaCategory } from '../../services/idea.service';
import type { PlanningFilters, PlanningView } from '../../services/planning.service';
import recommendationService, { Borough, Scope, ZoneType } from '../../services/recommendation.service';
import { DistanceChips, HoursCard } from '../recommendation/TimeAndDistance';
import { filtersToSlot, slotContaining, timeLeftToDecide } from '../../utils/planningFormat';
import { formatMxn, slotOptionLabel } from '../../utils/recommendationFormat';
import {
  DEFAULT_RADIUS_KM,
  eligibleSlots,
  MAX_COST_MXN,
  SlotOption,
  slotToInstants,
  withRange,
} from '../../utils/recommendationParams';
import { ActivityLine, ChatAccess, MemberAvatar, TimeLeftPill } from './SessionBits';

/** Hasta donde el servidor acepta pedir (MutualSlotChecker.DAYS_AHEAD): una semana. */
const DAYS_AHEAD = 7;
const BUDGET_STEP = 50;
const SCOPES: Array<{ value: Scope; label: string }> = [
  { value: 'HOME', label: 'En casa' },
  { value: 'CITY', label: 'En la ciudad' },
  { value: 'ANY', label: 'Cualquiera' },
];

interface FiltersViewProps {
  view: PlanningView;
  now: Date;
  busy: boolean;
  onChange: (filters: PlanningFilters) => void;
  onReady: () => void;
  onUnready: () => void;
  onOpenChat: () => void;
}

const Section = ({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {hint && <Text style={styles.hint}>{hint}</Text>}
    {children}
  </View>
);

/**
 * Figma B2 - Los dos ven y cambian los mismos filtros; cada cambio le avisa a la pareja. La
 * busqueda empieza cuando los dos tocan "Listo". El tipo de plan admite varias dimensiones.
 * [rango-distancia] Figma J2: mismo orden que la individual (cuando, en casa o fuera, donde,
 * distancia); el horario guardado puede ser solo una parte del hueco libre.
 */
export function FiltersView({ view, now, busy, onChange, onReady, onUnready, onOpenChat }: FiltersViewProps) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<PlanningFilters>(view.filters ?? {});
  const [budget, setBudget] = useState<number>(view.filters?.maxCostMxn ?? 1500);
  const [slots, setSlots] = useState<SlotOption[] | null>(null);
  const [categories, setCategories] = useState<IdeaCategory[]>([]);
  const [boroughs, setBoroughs] = useState<Borough[]>([]);
  const [showBoroughs, setShowBoroughs] = useState(false);
  const lastSent = useRef<string>('');

  // Los cambios de la pareja llegan con la consulta periodica; los propios ya estan aplicados.
  useEffect(() => {
    const incoming = JSON.stringify(view.filters ?? {});
    if (incoming !== lastSent.current) {
      setFilters(view.filters ?? {});
      setBudget(view.filters?.maxCostMxn ?? 1500);
    }
  }, [view.filters]);

  useEffect(() => {
    ideaService.getCategories().then(setCategories).catch(() => setCategories([]));
    recommendationService.getBoroughs().then(setBoroughs).catch(() => setBoroughs([]));
    if (user?.userId) {
      findMutualAvailability(user.userId, view.partner.userId, DAYS_AHEAD)
        .then((m) => setSlots(eligibleSlots(m.mutualAvailability ?? [], new Date())))
        .catch(() => setSlots([]));
    }
  }, [user?.userId, view.partner.userId]);

  const send = (patch: Partial<PlanningFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    lastSent.current = JSON.stringify(next);
    onChange(next);
  };

  const fullSlot = useMemo(
    () => (slots ? slotContaining(slots, filters.slotStart, filters.slotEnd) : undefined),
    [slots, filters.slotStart, filters.slotEnd],
  );
  const chosenRange = useMemo(() => filtersToSlot(filters.slotStart, filters.slotEnd), [filters.slotStart, filters.slotEnd]);
  const range =
    fullSlot && chosenRange && (chosenRange.start !== fullSlot.start || chosenRange.end !== fullSlot.end)
      ? { from: chosenRange.start, to: chosenRange.end }
      : null;
  const scope = filters.scope ?? 'ANY';
  const chooseScope = (value: Scope) =>
    value === 'HOME' ? send({ scope: value, zoneType: 'NONE', boroughCode: null }) : send({ scope: value });
  const chosen = new Set(filters.categories ?? []);
  const boroughName = boroughs.find((b) => b.code === filters.boroughCode)?.name;
  const partner = view.partner.name;

  const toggleCategory = (code: string) => {
    const next = new Set(chosen);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    send({ categories: [...next] });
  };

  const chooseZone = (zoneType: ZoneType) => {
    if (zoneType === 'BOROUGH') {
      setShowBoroughs(true);
      return;
    }
    send({ zoneType, boroughCode: null });
  };

  const ready = view.me.ready;
  const canBeReady = Boolean(filters.zoneType && filters.slotStart && (filters.zoneType !== 'BOROUGH' || filters.boroughCode));

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <TimeLeftPill text={timeLeftToDecide(view.sessionExpiresAt, now)} />
        <ChatAccess
          partnerName={partner}
          subtitle={view.unreadMessages > 0 ? `${partner} te escribió` : 'Escríbanse mientras ajustan los filtros'}
          unread={view.unreadMessages}
          onPress={onOpenChat}
        />

        <View style={styles.members}>
          <MemberAvatar name={view.me.name} label="Tú" status="En línea" tone="online" />
          <MemberAvatar
            name={partner}
            label={partner}
            status={view.partner.online ? 'En línea' : 'Fuera de línea'}
            tone={view.partner.online ? 'online' : 'offline'}
          />
        </View>

        {view.activity.map((line, i) => (
          <ActivityLine key={`${i}-${line}`} text={line} />
        ))}

        <Section title="¿Cuándo?" hint="Espacios libres de los dos.">
          {slots === null && <ActivityIndicator color={palette.primary} />}
          {slots?.length === 0 && <Text style={styles.empty}>No tienen horarios libres en común en los próximos días.</Text>}
          {slots && slots.length > 0 && (
            <View style={styles.chips}>
              {slots.map((slot) => (
                <OptionChip
                  key={slot.key}
                  label={slotOptionLabel(slot, now)}
                  selected={fullSlot?.key === slot.key}
                  onPress={() => send(slotToInstants(slot))}
                />
              ))}
            </View>
          )}
          {fullSlot && (
            <HoursCard
              slot={fullSlot}
              range={range}
              onChange={(next) => send(slotToInstants(next ? withRange(fullSlot, next.from, next.to) : fullSlot))}
            />
          )}
        </Section>

        <Section title="¿En casa o fuera?" hint={scope === 'HOME' ? 'Los planes en casa no necesitan ubicación.' : undefined}>
          <View style={styles.chips}>
            {SCOPES.map((s) => (
              <OptionChip key={s.value} label={s.label} selected={scope === s.value} onPress={() => chooseScope(s.value)} />
            ))}
          </View>
        </Section>

        {scope !== 'HOME' && (
          <>
            <Section title="¿Dónde?">
              <View style={styles.chips}>
                <OptionChip label="Cerca de nosotros" selected={filters.zoneType === 'NEAR_US'} onPress={() => chooseZone('NEAR_US')} />
                <OptionChip
                  label={filters.zoneType === 'BOROUGH' && boroughName ? boroughName : 'En una alcaldía'}
                  selected={filters.zoneType === 'BOROUGH'}
                  onPress={() => chooseZone('BOROUGH')}
                />
                <OptionChip label="Sin preferencia" selected={filters.zoneType === 'NONE'} onPress={() => chooseZone('NONE')} />
              </View>
            </Section>

            {(filters.zoneType === 'NEAR_US' || filters.zoneType === 'BOROUGH') && (
              <DistanceChips
                radiusKm={filters.radiusKm ?? DEFAULT_RADIUS_KM}
                zoneType={filters.zoneType}
                onChange={(radiusKm) => send({ radiusKm })}
              />
            )}
          </>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Presupuesto por persona · {budget > 0 ? `hasta $${formatMxn(budget)}` : 'solo gratis'}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={MAX_COST_MXN}
            step={BUDGET_STEP}
            value={budget}
            onValueChange={(v) => setBudget(Math.round(v))}
            onSlidingComplete={(v) => send({ maxCostMxn: Math.round(v) })}
            minimumTrackTintColor={palette.primary}
            maximumTrackTintColor={palette.border}
            thumbTintColor={palette.primary}
            accessibilityLabel="Presupuesto por persona"
          />
          <View style={styles.scale}>
            <Text style={styles.scaleText}>$0</Text>
            <Text style={styles.scaleText}>${formatMxn(MAX_COST_MXN)}</Text>
          </View>
        </View>

        <Section title="Tipo de plan">
          <View style={styles.chips}>
            <OptionChip label="Cualquiera" selected={chosen.size === 0} onPress={() => send({ categories: [] })} />
            {categories.map((c) => (
              <OptionChip key={c.code} label={c.label} selected={chosen.has(c.code)} onPress={() => toggleCategory(c.code)} />
            ))}
          </View>
        </Section>

        <View style={styles.statusCard}>
          {[
            { label: 'Tú', isReady: view.me.ready },
            { label: partner, isReady: view.partner.ready },
          ].map((row) => (
            <View key={row.label} style={styles.statusRow}>
              <Ionicons
                name={row.isReady ? 'checkmark-circle-outline' : 'hourglass-outline'}
                size={20}
                color={row.isReady ? palette.success : palette.warning}
              />
              <Text style={styles.statusName}>{row.label}</Text>
              <Text style={[styles.statusValue, { color: row.isReady ? palette.success : palette.warning }]}>
                {row.isReady ? 'Terminó' : 'Ajustando…'}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {ready ? (
          <>
            <GradientButton title={`Esperando a que ${partner} esté listo`} onPress={() => {}} disabled />
            <TouchableOpacity onPress={onUnready} disabled={busy} accessibilityRole="button">
              <Text style={styles.link}>Cambiar algo</Text>
            </TouchableOpacity>
          </>
        ) : (
          <GradientButton title="Listo, buscar opciones" onPress={onReady} disabled={!canBeReady} loading={busy} />
        )}
      </View>

      <Modal visible={showBoroughs} transparent animationType="slide" onRequestClose={() => setShowBoroughs(false)}>
        <Pressable accessible={false} style={styles.sheetOverlay} onPress={() => setShowBoroughs(false)}>
          <Pressable accessible={false} style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Elige la alcaldía</Text>
            <ScrollView>
              {boroughs.map((b) => {
                const selected = filters.boroughCode === b.code;
                return (
                  <TouchableOpacity
                    key={b.code}
                    style={[styles.boroughRow, selected && styles.boroughRowSelected]}
                    onPress={() => {
                      setShowBoroughs(false);
                      send({ zoneType: 'BOROUGH', boroughCode: b.code });
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.boroughName, selected && styles.boroughNameSelected]}>{b.name}</Text>
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={selected ? palette.primary : palette.iconDisabled}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  members: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: palette.text },
  hint: { fontSize: 13, color: palette.textMuted, marginTop: -4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  empty: { fontSize: 14, color: palette.textSecondary },
  slider: { width: '100%', height: 40 },
  scale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -6 },
  scaleText: { fontSize: 12, color: palette.textMuted },
  statusCard: { gap: 12, padding: 16, borderRadius: 16, backgroundColor: palette.surface },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusName: { flex: 1, fontSize: 15, color: palette.text },
  statusValue: { fontSize: 13 },
  footer: { padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: palette.border, backgroundColor: palette.surface },
  link: { fontSize: 14, fontWeight: '600', color: palette.textAccent, textAlign: 'center' },
  sheetOverlay: { flex: 1, backgroundColor: palette.overlay, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '80%',
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: palette.border, marginTop: 10, marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: palette.text, marginBottom: 12 },
  boroughRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, borderRadius: 12 },
  boroughRowSelected: { backgroundColor: palette.primarySoft },
  boroughName: { fontSize: 15, color: palette.text },
  boroughNameSelected: { color: palette.textAccent, fontWeight: '600' },
});
