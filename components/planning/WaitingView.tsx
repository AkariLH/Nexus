import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../../constants/colors';
import type { PlanningView } from '../../services/planning.service';
import { remainingLabel } from '../../utils/planningFormat';
import { MemberAvatar } from './SessionBits';

interface WaitingViewProps {
  view: PlanningView;
  now: Date;
  busy: boolean;
  onCancel: () => void;
  onPlanAlone: () => void;
}

/** Figma B1 Ana - Invitacion enviada: cuenta regresiva de las 24 h para que la pareja se una. */
export function WaitingView({ view, now, busy, onCancel, onPlanAlone }: WaitingViewProps) {
  const partner = view.partner.name;
  return (
    <>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.members}>
          <MemberAvatar name={view.me.name} label="Tú" status="En la sesión" tone="online" />
          <MemberAvatar name={partner} label={partner} status="Invitación enviada" tone="waiting" pending />
        </View>

        <View style={styles.countdown}>
          <Ionicons name="hourglass-outline" size={28} color={palette.textAccent} />
          <Text style={styles.time}>{remainingLabel(view.inviteExpiresAt, now)}</Text>
          <Text style={styles.caption}>para que {partner} acepte la invitación</Text>
        </View>

        <View style={styles.notice}>
          <Ionicons name="alert-circle-outline" size={20} color={palette.textAccent} />
          <Text style={styles.noticeText}>Te avisaremos cuando {partner} se una.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.outline} onPress={onCancel} disabled={busy} accessibilityRole="button">
          <Text style={styles.outlineText}>Cancelar invitación</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onPlanAlone} disabled={busy} accessibilityRole="button">
          <Text style={styles.link}>Mejor planear yo y enviar invitación</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  members: { flexDirection: 'row', justifyContent: 'center', gap: 24 },
  countdown: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 24,
    borderRadius: 16,
    backgroundColor: palette.surface,
    shadowColor: palette.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  time: { fontSize: 32, fontWeight: '700', color: palette.text },
  caption: { fontSize: 14, color: palette.textSecondary },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: palette.secondarySoft,
  },
  noticeText: { flex: 1, fontSize: 14, color: palette.textSecondary },
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
