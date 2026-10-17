import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette, gradients } from '../../constants/colors';

/** Pastilla "Quedan 11 h 52 min para decidir" (Figma "Tiempo restante"). */
export function TimeLeftPill({ text }: { text: string }) {
  return (
    <View style={styles.pill}>
      <Ionicons name="time-outline" size={16} color={palette.textAccent} />
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

interface ChatAccessProps {
  partnerName: string;
  subtitle: string;
  unread: number;
  onPress: () => void;
}

/** Barra "Chat con Sam" con contador de nuevos (Figma "Acceso al chat"). */
export function ChatAccess({ partnerName, subtitle, unread, onPress }: ChatAccessProps) {
  return (
    <TouchableOpacity style={styles.chat} onPress={onPress} accessibilityRole="button" activeOpacity={0.8}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chatIcon}>
        <Ionicons name="chatbubble-outline" size={20} color={palette.onPrimary} />
      </LinearGradient>
      <View style={styles.chatText}>
        <Text style={styles.chatTitle}>Chat con {partnerName}</Text>
        <Text style={styles.chatSubtitle}>{subtitle}</Text>
      </View>
      {unread > 0 && (
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badge}>
          <Text style={styles.badgeText}>{unread} {unread === 1 ? 'nuevo' : 'nuevos'}</Text>
        </LinearGradient>
      )}
      <Ionicons name="chevron-forward" size={20} color={palette.text} />
    </TouchableOpacity>
  );
}

interface AvatarProps {
  name: string;
  label: string;
  status: string;
  tone: 'online' | 'waiting' | 'offline';
  pending?: boolean;
}

/** Avatar con inicial, punto de estado y texto (Figma "Avatar"). */
export function MemberAvatar({ name, label, status, tone, pending }: AvatarProps) {
  const dot = tone === 'online' ? palette.success : tone === 'waiting' ? palette.warning : palette.iconDisabled;
  const statusColor = tone === 'online' ? palette.success : tone === 'waiting' ? palette.warning : palette.textMuted;
  return (
    <View style={styles.member}>
      <View>
        {pending ? (
          <View style={[styles.avatar, styles.avatarPending]}>
            <Text style={[styles.avatarText, styles.avatarTextPending]}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        ) : (
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
        )}
        <View style={[styles.dot, { backgroundColor: dot }]} />
      </View>
      <Text style={styles.memberName}>{label}</Text>
      <Text style={[styles.memberStatus, { color: statusColor }]}>{status}</Text>
    </View>
  );
}

/** Linea "Sam cambió el presupuesto a $1,500" (Figma "Aviso de actividad"). */
export function ActivityLine({ text }: { text: string }) {
  return (
    <View style={styles.activity}>
      <View style={styles.activityDot} />
      <Text style={styles.activityText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: palette.secondarySoft,
  },
  pillText: { fontSize: 13, fontWeight: '600', color: palette.textAccent },
  chat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.primaryBorder,
    backgroundColor: palette.primarySoft,
  },
  chatIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  chatText: { flex: 1, gap: 2 },
  chatTitle: { fontSize: 15, fontWeight: '600', color: palette.text },
  chatSubtitle: { fontSize: 12, color: palette.textSecondary },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 12, fontWeight: '600', color: palette.onPrimary },
  member: { alignItems: 'center', gap: 4, minWidth: 90 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarPending: { backgroundColor: palette.surfaceMuted, borderWidth: 1, borderStyle: 'dashed', borderColor: palette.iconDisabled },
  avatarText: { fontSize: 18, fontWeight: '700', color: palette.onPrimary },
  avatarTextPending: { color: palette.textMuted },
  dot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: palette.surface,
  },
  memberName: { fontSize: 15, fontWeight: '600', color: palette.text },
  memberStatus: { fontSize: 12 },
  activity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.primary },
  activityText: { flex: 1, fontSize: 13, color: palette.textSecondary },
});
