import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ResultModal } from '../../app/components/ResultModal';
import { palette } from '../../constants/colors';
import type { PlanningView, VoteValue } from '../../services/planning.service';
import { timeLeftToDecide } from '../../utils/planningFormat';
import { DEFAULT_RADIUS_KM, relaxedMessage } from '../../utils/recommendationParams';
import { GradientButton } from '../../app/components/ui/GradientButton';
import { JointOptionCard } from './JointOptionCard';
import { ChatAccess, TimeLeftPill } from './SessionBits';

interface OptionsViewProps {
  view: PlanningView;
  now: Date;
  busy: boolean;
  onVote: (recommendationId: number, vote: VoteValue) => void;
  onPropose: (recommendationId: number) => void;
  onMore: () => void;
  onAdjust: () => void;
  onOpenChat: () => void;
}

/**
 * Figma B3 y B7 - Opciones para los dos: cada quien vota; si a los dos les gusta, coinciden y
 * cualquiera la propone. Agotadas las opciones guardadas, se invita a ajustar filtros (sin decir
 * cuantas habia).
 */
export function OptionsView({ view, now, busy, onVote, onPropose, onMore, onAdjust, onOpenChat }: OptionsViewProps) {
  const [askAdjust, setAskAdjust] = useState(false);
  const partner = view.partner.name;
  const notice = relaxedMessage(view.relaxedFilters);
  // [rango-distancia] Figma J3: sin opciones y con poca distancia, ajustar filtros para ampliarla.
  const radiusKm = view.filters?.radiusKm ?? DEFAULT_RADIUS_KM;
  const zone = view.filters?.zoneType;
  const narrowRadius = (zone === 'NEAR_US' || zone === 'BOROUGH') && radiusKm < DEFAULT_RADIUS_KM;

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <TimeLeftPill text={timeLeftToDecide(view.sessionExpiresAt, now)} />
        <ChatAccess
          partnerName={partner}
          subtitle={view.unreadMessages > 0 ? `${partner} te escribió` : 'Escríbanse mientras eligen'}
          unread={view.unreadMessages}
          onPress={onOpenChat}
        />

        <View style={styles.hint}>
          <Ionicons name="sparkles-outline" size={16} color={palette.textAccent} />
          <Text style={styles.hintText}>{notice ?? 'Voten por las opciones que les gusten'}</Text>
        </View>

        {view.options.length === 0 && narrowRadius && (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={40} color={palette.primary} />
            <Text style={styles.emptyTitle}>No encontramos planes a {radiusKm} km</Text>
            <Text style={styles.emptyText}>Con una distancia mayor suelen salir más opciones.</Text>
            <GradientButton title="Prueba con más distancia" onPress={onAdjust} disabled={busy} style={styles.emptyButton} />
          </View>
        )}

        {view.options.map((option) => (
          <JointOptionCard
            key={option.item.id}
            option={option}
            partnerName={partner}
            now={now}
            mode="vote"
            busy={busy}
            onVote={(vote) => onVote(option.item.id, vote)}
            onPropose={() => onPropose(option.item.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.outline}
          onPress={() => (view.hasMore ? onMore() : setAskAdjust(true))}
          disabled={busy}
          accessibilityRole="button"
        >
          <Text style={styles.outlineText}>Buscar más opciones</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onAdjust} disabled={busy} accessibilityRole="button">
          <Text style={styles.link}>Ajustar filtros</Text>
        </TouchableOpacity>
      </View>

      <ResultModal
        visible={askAdjust}
        icon="refresh-outline"
        tone="soft"
        title="¿Quieren ver más opciones?"
        subtitle="Ajusten los filtros para ver más planes."
        primary={{
          label: 'Ajustar filtros',
          onPress: () => {
            setAskAdjust(false);
            onAdjust();
          },
        }}
        onRequestClose={() => setAskAdjust(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 24 },
  empty: { alignItems: 'center', gap: 10, padding: 20, borderRadius: 16, backgroundColor: palette.surface },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: palette.text, textAlign: 'center' },
  emptyText: { fontSize: 14, color: palette.textSecondary, textAlign: 'center' },
  emptyButton: { alignSelf: 'stretch' },
  hint: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  hintText: { flex: 1, fontSize: 13, color: palette.textSecondary },
  footer: { padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: palette.border, backgroundColor: palette.surface },
  outline: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineText: { fontSize: 16, fontWeight: '700', color: palette.textAccent },
  link: { fontSize: 14, fontWeight: '600', color: palette.textAccent, textAlign: 'center' },
});
