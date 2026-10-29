import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GradientButton } from '../../app/components/ui/GradientButton';
import { OptionChip } from '../../app/components/ui/OptionChip';
import { gradients, palette } from '../../constants/colors';
import type { ZoneType } from '../../services/recommendation.service';
import {
  defaultRange,
  hoursQuestion,
  keepEnd,
  RADIUS_OPTIONS_KM,
  radiusHint,
  rangeEnds,
  rangeStarts,
  rangeSummary,
  SlotOption,
} from '../../utils/recommendationParams';

export type HoursRange = { from: string; to: string } | null;

interface HoursCardProps {
  /** El hueco libre completo que eligieron. */
  slot: SlotOption;
  /** La parte elegida; null = todo el horario. */
  range: HoursRange;
  onChange: (range: HoursRange) => void;
}

const minutesOf = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/**
 * [rango-distancia] Figma J1 / J1c - Usar todo el hueco libre o solo unas horas. Con "Solo unas
 * horas" aparecen "Empieza" y "Termina" (cada uno abre la lista de horas), una barra con la parte
 * elegida dentro del hueco y el resumen.
 */
export function HoursCard({ slot, range, onChange }: HoursCardProps) {
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const whole = minutesOf(slot.end) - minutesOf(slot.start);
  const canSplit = whole > 60;

  const pick = (time: string) => {
    if (!range) return;
    onChange(picking === 'from' ? { from: time, to: keepEnd(slot, time, range.to) } : { from: range.from, to: time });
  };

  const options = range ? (picking === 'from' ? rangeStarts(slot) : rangeEnds(slot, range.from)) : [];
  const selected = range ? (picking === 'from' ? range.from : range.to) : undefined;
  const left = range ? ((minutesOf(range.from) - minutesOf(slot.start)) / whole) * 100 : 0;
  const width = range ? ((minutesOf(range.to) - minutesOf(range.from)) / whole) * 100 : 100;

  return (
    <View style={styles.card}>
      <Text style={styles.question}>{hoursQuestion(slot)}</Text>
      <View style={styles.chips}>
        <OptionChip label="Todo el horario" selected={!range} onPress={() => onChange(null)} />
        <OptionChip
          label="Solo unas horas"
          selected={Boolean(range)}
          disabled={!canSplit}
          onPress={() => onChange(range ?? defaultRange(slot))}
        />
      </View>

      {range && (
        <>
          <View style={styles.fields}>
            <TimeField label="Empieza" value={range.from} onPress={() => setPicking('from')} />
            <TimeField label="Termina" value={range.to} onPress={() => setPicking('to')} />
          </View>
          <View style={styles.track} accessible={false}>
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.fill, { left: `${left}%`, width: `${width}%` }]}
            />
          </View>
          <View style={styles.limits}>
            <Text style={styles.limit}>{slot.start}</Text>
            <Text style={styles.limit}>{slot.end}</Text>
          </View>
          <Text style={styles.summary}>{rangeSummary(range.from, range.to)}</Text>
        </>
      )}

      <Modal visible={picking !== null} transparent animationType="slide" onRequestClose={() => setPicking(null)}>
        <Pressable accessible={false} style={styles.overlay} onPress={() => setPicking(null)}>
          <Pressable accessible={false} style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{picking === 'from' ? '¿A qué hora empiezan?' : '¿A qué hora terminan?'}</Text>
            <Text style={styles.sheetHint}>
              Dentro de su horario libre ({slot.start} a {slot.end}). Termina al menos 1 hora después.
            </Text>
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {options.map((time) => {
                const isSelected = time === selected;
                return (
                  <TouchableOpacity
                    key={time}
                    style={[styles.row, isSelected && styles.rowSelected]}
                    onPress={() => pick(time)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                  >
                    <Text style={[styles.rowText, isSelected && styles.rowTextSelected]}>{time}</Text>
                    {isSelected && <Ionicons name="checkmark-circle-outline" size={20} color={palette.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <GradientButton title="Listo" onPress={() => setPicking(null)} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const TimeField = ({ label, value, onPress }: { label: string; value: string; onPress: () => void }) => (
  <TouchableOpacity
    style={styles.field}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`${label} a las ${value}. Cambiar`}
  >
    <Ionicons name="time-outline" size={18} color={palette.textAccent} />
    <View style={styles.fieldText}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
    <Ionicons name="chevron-down" size={16} color={palette.textMuted} />
  </TouchableOpacity>
);

interface DistanceChipsProps {
  radiusKm: number;
  zoneType?: ZoneType | null;
  onChange: (km: number) => void;
}

/** [rango-distancia] Figma J1 - "Distancia maxima": 1, 3, 5, 10 o 15 km. */
export function DistanceChips({ radiusKm, zoneType, onChange }: DistanceChipsProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Distancia máxima</Text>
      <Text style={styles.hint}>{radiusHint(radiusKm, zoneType ?? undefined)}</Text>
      <View style={styles.chips}>
        {RADIUS_OPTIONS_KM.map((km) => (
          <OptionChip key={km} label={`${km} km`} selected={radiusKm === km} onPress={() => onChange(km)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  question: { fontSize: 15, fontWeight: '600', color: palette.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fields: { flexDirection: 'row', gap: 10 },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  fieldText: { flex: 1 },
  fieldLabel: { fontSize: 12, color: palette.textMuted },
  fieldValue: { fontSize: 16, fontWeight: '600', color: palette.text },
  track: { height: 6, borderRadius: 3, backgroundColor: palette.border, overflow: 'hidden' },
  fill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 3 },
  limits: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -6 },
  limit: { fontSize: 12, color: palette.textMuted },
  summary: { fontSize: 13, color: palette.textAccent },
  section: { gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: palette.text },
  hint: { fontSize: 13, color: palette.textMuted, marginTop: -4 },
  overlay: { flex: 1, backgroundColor: palette.overlay, justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '80%',
    gap: 8,
    backgroundColor: palette.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: palette.border, marginTop: 10, marginBottom: 8 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: palette.text },
  sheetHint: { fontSize: 13, color: palette.textMuted },
  list: { marginVertical: 8 },
  listContent: { gap: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  rowSelected: { backgroundColor: palette.primarySoft, borderColor: palette.primary },
  rowText: { fontSize: 16, fontWeight: '600', color: palette.text },
  rowTextSelected: { color: palette.textAccent },
});
