import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GradientButton } from '../../app/components/ui/GradientButton';
import { palette, gradients } from '../../constants/colors';
import type { PlanningView } from '../../services/planning.service';
import { timeLeftToDecide } from '../../utils/planningFormat';
import { JointOptionCard } from './JointOptionCard';
import { ChatAccess, TimeLeftPill } from './SessionBits';

interface ProposalViewProps {
  view: PlanningView;
  now: Date;
  busy: boolean;
  onWithdraw: () => void;
  onAccept: () => void;
  onKeepLooking: () => void;
  onOpenChat: () => void;
}

/** Figma B4 - Propuesta de cita a pantalla completa: quien propone espera; la pareja acepta o sigue buscando. */
export function ProposalView({ view, now, busy, onWithdraw, onAccept, onKeepLooking, onOpenChat }: ProposalViewProps) {
  const proposal = view.proposal;
  if (!proposal) return null;
  const partner = view.partner.name;

  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <TimeLeftPill text={timeLeftToDecide(view.sessionExpiresAt, now)} />
        <ChatAccess
          partnerName={partner}
          subtitle={view.unreadMessages > 0 ? `${partner} te escribió` : 'Escríbanse mientras deciden'}
          unread={view.unreadMessages}
          onPress={onOpenChat}
        />

        <View style={styles.hero}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.icon}>
            <Ionicons name={proposal.byMe ? 'paper-plane-outline' : 'heart-outline'} size={34} color={palette.onPrimary} />
          </LinearGradient>
          <Text style={styles.title}>{proposal.byMe ? 'Propusiste esta cita' : `${partner} te propone esta cita`}</Text>
          {proposal.byMe && (
            <View style={styles.waiting}>
              <Ionicons name="hourglass-outline" size={14} color={palette.warning} />
              <Text style={styles.waitingText}>Esperando a {partner}</Text>
            </View>
          )}
        </View>

        <JointOptionCard option={proposal.option} partnerName={partner} now={now} mode="summary" />
      </ScrollView>

      <View style={styles.footer}>
        {proposal.byMe ? (
          <TouchableOpacity style={styles.outline} onPress={onWithdraw} disabled={busy} accessibilityRole="button">
            <Text style={styles.outlineText}>Retirar propuesta</Text>
          </TouchableOpacity>
        ) : (
          <>
            <GradientButton title="Aceptar cita" onPress={onAccept} loading={busy} />
            <TouchableOpacity style={styles.outline} onPress={onKeepLooking} disabled={busy} accessibilityRole="button">
              <Text style={styles.outlineText}>Seguir buscando</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 24 },
  hero: { alignItems: 'center', gap: 10 },
  icon: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: palette.text, textAlign: 'center' },
  waiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: palette.warningSoft,
  },
  waitingText: { fontSize: 12, fontWeight: '600', color: palette.warning },
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
});
