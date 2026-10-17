import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette, gradients } from '../../constants/colors';
import type { PlanningOption, VoteValue } from '../../services/planning.service';
import { formatDuration } from '../../utils/ideaFormat';
import { agreementOf, voteLine } from '../../utils/planningFormat';
import { costLabel, placeLabel, slotLabel } from '../../utils/recommendationFormat';

interface JointOptionCardProps {
  option: PlanningOption;
  partnerName: string;
  now: Date;
  /** Con horario (B4) o con botones de voto (B3). */
  mode: 'vote' | 'summary';
  busy?: boolean;
  onVote?: (vote: VoteValue) => void;
  onPropose?: () => void;
}

const Meta = ({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) => (
  <View style={styles.meta}>
    <Ionicons name={icon} size={16} color={palette.icon} />
    <Text style={styles.metaText}>{text}</Text>
  </View>
);

/**
 * Figma "Tarjeta conjunta" (Sin votar / Votaste / Coinciden / No coinciden): mismos datos que la
 * individual, con los votos de los dos en lugar del horario.
 */
export function JointOptionCard({ option, partnerName, now, mode, busy, onVote, onPropose }: JointOptionCardProps) {
  const { item, myVote, partnerVote } = option;
  const agreement = agreementOf(myVote, partnerVote);

  return (
    <View style={[styles.card, agreement === 'match' && styles.cardMatch]}>
      {agreement === 'match' && (
        <View style={[styles.banner, styles.bannerMatch]}>
          <Ionicons name="heart-outline" size={16} color={palette.success} />
          <Text style={[styles.bannerText, { color: palette.success }]}>¡Coinciden! A los dos les gusta</Text>
        </View>
      )}
      {agreement === 'mismatch' && (
        <View style={[styles.banner, styles.bannerMismatch]}>
          <Ionicons name="chatbubble-outline" size={16} color={palette.warning} />
          <Text style={[styles.bannerText, { color: palette.warning }]}>No coinciden: platíquenlo en el chat</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{item.categoryLabel}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Meta icon="location-outline" text={placeLabel(item)} />
        <Meta icon="time-outline" text={formatDuration(item.durationMinutes)} />
        <Meta icon="cash-outline" text={costLabel(item.costPerPersonMxn)} />
      </View>

      {item.reason ? <Text style={styles.reason}>{item.reason}</Text> : null}

      {mode === 'summary' && (
        <View style={styles.strip}>
          <Ionicons name="calendar-outline" size={16} color={palette.textAccent} />
          <Text style={styles.stripText}>{slotLabel(item.startsAt, item.endsAt, now)}</Text>
        </View>
      )}

      <View style={styles.strip}>
        <Ionicons name="people-outline" size={16} color={palette.textAccent} />
        <Text style={styles.stripText}>{voteLine(myVote, partnerVote, partnerName)}</Text>
      </View>

      {mode === 'vote' && agreement === 'match' && (
        <TouchableOpacity onPress={onPropose} disabled={busy} accessibilityRole="button" style={styles.gradientWrap}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
            <Text style={styles.gradientText}>Proponer esta cita</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {mode === 'vote' && agreement !== 'match' && (
        <>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.outline, myVote === 'DISLIKE' && styles.outlineSelected]}
              onPress={() => onVote?.('DISLIKE')}
              disabled={busy}
              accessibilityRole="button"
              accessibilityState={{ selected: myVote === 'DISLIKE' }}
              accessibilityLabel={`No me convence ${item.title}`}
            >
              <Text style={styles.outlineText}>{myVote === 'DISLIKE' ? 'No te convence ✓' : 'No me convence'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.gradientWrapFlex}
              onPress={() => onVote?.('LIKE')}
              disabled={busy}
              accessibilityRole="button"
              accessibilityState={{ selected: myVote === 'LIKE' }}
              accessibilityLabel={`Me gusta ${item.title}`}
            >
              <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.voteButton}>
                <Text style={styles.gradientText}>{myVote === 'LIKE' ? 'Te gusta ✓' : 'Me gusta'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          {myVote === 'LIKE' && (
            <TouchableOpacity onPress={onPropose} disabled={busy} accessibilityRole="button">
              <Text style={styles.link}>Proponer esta cita</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: palette.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardMatch: { borderColor: palette.success },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  bannerMatch: { backgroundColor: palette.successSoft },
  bannerMismatch: { backgroundColor: palette.warningSoft },
  bannerText: { fontSize: 13, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontSize: 17, fontWeight: '600', color: palette.text },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: palette.secondarySoft },
  tagText: { fontSize: 12, fontWeight: '600', color: palette.textAccent },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: palette.textSecondary },
  reason: { fontSize: 14, lineHeight: 20, color: palette.textSecondary },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: palette.secondarySoft,
  },
  stripText: { fontSize: 13, color: palette.text },
  actions: { flexDirection: 'row', gap: 12 },
  outline: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineSelected: { backgroundColor: palette.secondarySoft },
  outlineText: { fontSize: 14, fontWeight: '600', color: palette.textAccent },
  gradientWrap: { borderRadius: 20, overflow: 'hidden' },
  gradientWrapFlex: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  gradientButton: { height: 40, justifyContent: 'center', alignItems: 'center' },
  voteButton: { height: 40, justifyContent: 'center', alignItems: 'center' },
  gradientText: { fontSize: 14, fontWeight: '600', color: palette.onPrimary },
  link: { fontSize: 15, fontWeight: '600', color: palette.textAccent, textAlign: 'center' },
});
