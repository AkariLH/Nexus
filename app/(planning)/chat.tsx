import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TimeLeftPill } from "../../components/planning/SessionBits";
import { palette, gradients } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import planningService, { PlanningMessage } from "../../services/planning.service";
import { timeLeftToDecide } from "../../utils/planningFormat";
import { ScreenHeader } from "../components/layout/ScreenHeader";

const POLL_MS = 3000;
const MAX_LENGTH = 500;

const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });

/**
 * Figma B6 - Mensajes de la planeacion. Nexus no los lee y se borran al terminar la sesion; los
 * limites (20 por hora por persona, 140 por chat) no se muestran: solo se avisa si se alcanzan.
 */
export default function PlanningChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ sessionId: string; expiresAt?: string }>();
  const sessionId = Number(params.sessionId);
  const [messages, setMessages] = useState<PlanningMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    if (!user?.userId) return;
    try {
      setMessages(await planningService.messages(user.userId, sessionId));
    } catch {
      // Se reintenta en la siguiente vuelta.
    }
  }, [user?.userId, sessionId]);

  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(load, POLL_MS);
      return () => clearInterval(timer);
    }, [load]),
  );

  const send = async () => {
    const body = draft.trim();
    if (!body || !user?.userId) return;
    setSending(true);
    setNotice(null);
    try {
      setMessages(await planningService.send(user.userId, sessionId, body));
      setDraft("");
    } catch (e: any) {
      setNotice(e?.message || "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScreenHeader title="Mensajes" onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          ref={scroll}
          contentContainerStyle={styles.content}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        >
          {params.expiresAt ? <TimeLeftPill text={timeLeftToDecide(params.expiresAt, new Date())} /> : null}
          <View style={styles.lock}>
            <Ionicons name="lock-closed-outline" size={20} color={palette.textAccent} />
            <Text style={styles.lockText}>Estos mensajes se borran al terminar la sesión.</Text>
          </View>

          {messages.map((m) => (
            <View key={m.id} style={[styles.bubble, m.mine ? styles.mine : styles.theirs]}>
              <Text style={styles.body}>{m.body}</Text>
              <Text style={styles.meta}>
                {m.mine ? "Tú" : m.senderName} · {clock(m.createdAt)}
              </Text>
            </View>
          ))}
        </ScrollView>

        {notice && <Text style={styles.notice}>{notice}</Text>}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Escribe un mensaje…"
            placeholderTextColor={palette.textMuted}
            maxLength={MAX_LENGTH}
            multiline
            accessibilityLabel="Mensaje"
          />
          <TouchableOpacity
            onPress={send}
            disabled={sending || !draft.trim()}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensaje"
            style={[styles.sendWrap, (sending || !draft.trim()) && styles.sendDisabled]}
          >
            <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.send}>
              <Ionicons name="paper-plane-outline" size={20} color={palette.onPrimary} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  flex: { flex: 1 },
  content: { padding: 16, gap: 12 },
  lock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: palette.secondarySoft,
  },
  lockText: { flex: 1, fontSize: 14, color: palette.textSecondary },
  bubble: { maxWidth: "80%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, gap: 4 },
  mine: { alignSelf: "flex-end", backgroundColor: palette.secondarySoft },
  theirs: { alignSelf: "flex-start", backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border },
  body: { fontSize: 15, color: palette.text },
  meta: { fontSize: 12, color: palette.textMuted },
  notice: { paddingHorizontal: 16, paddingBottom: 6, fontSize: 13, color: palette.warning },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    backgroundColor: palette.surface,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    fontSize: 15,
    color: palette.text,
  },
  sendWrap: { borderRadius: 22, overflow: "hidden" },
  sendDisabled: { opacity: 0.5 },
  send: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
});
