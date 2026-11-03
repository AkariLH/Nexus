import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Image, ScrollView } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter, useFocusEffect } from "expo-router";
import eventService from "../../services/event.service";
import { Card, ListCard, ListRow, TabTitle } from "../../components/ui/Surface";
import linkService from "../../services/link.service";
import { ErrorModal } from "../components/ErrorModal";
import { SuccessModal } from "../components/SuccessModal";
import { GradientButton } from "../components/ui/GradientButton";
import { useQuestionnaireGuard } from "../../hooks/useQuestionnaireGuard";
import { profileService } from "../../services/profile.service";
import { palette, gradients } from "../../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface LinkStatusData {
  hasActiveLink: boolean;
  partner?: {
    userId: number;
    displayName: string;
    nickname: string;
    linkedAt: string;
    profilePhoto?: string;
  };
}

export default function LinkScreen() {
  const insets = useSafeAreaInsets();
  useQuestionnaireGuard();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [linkStatus, setLinkStatus] = useState<LinkStatusData | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [partnerPhoto, setPartnerPhoto] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sharedEvents, setSharedEvents] = useState(0);

  const checkLinkStatus = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const data: LinkStatusData = await linkService.getLinkStatus(user.userId);
      setLinkStatus(data);
      if (data.hasActiveLink) {
        eventService.getUserEvents(user.userId)
          .then((events) => setSharedEvents(events.filter((e) => e.fullyApproved).length))
          .catch(() => setSharedEvents(0));
      }
      // Las fotos exigen sesion: se piden por apiClient (un <Image uri> recibia 401)
      profileService.fetchAvatar(user.userId).then(setUserPhoto);
      if (data.partner?.profilePhoto) {
        profileService.fetchAvatar(data.partner.userId).then(setPartnerPhoto);
      } else {
        setPartnerPhoto(null);
      }
    } catch (error) {
      console.error('Error verificando estado del vínculo:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  // Verificar cuando el componente se monta
  useEffect(() => {
    checkLinkStatus();
  }, [checkLinkStatus]);

  // Verificar cada vez que el tab obtiene foco
  useFocusEffect(
    useCallback(() => {
      console.log('📍 Tab de vínculo enfocado - verificando estado...');
      checkLinkStatus();
    }, [checkLinkStatus])
  );

  const handleGenerateCode = () => {
    router.push('/(link)/my-link-code');
  };

  const handleEnterCode = () => {
    router.push('/(link)/enter-link-code');
  };

  const getDaysTogether = () => {
    if (!linkStatus?.partner?.linkedAt) return 0;
    const linkDate = new Date(linkStatus.partner.linkedAt);
    const now = new Date();
    const diff = now.getTime() - linkDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const formatLinkDate = () => {
    if (!linkStatus?.partner?.linkedAt) return "";
    const linkDate = new Date(linkStatus.partner.linkedAt);
    return linkDate.toLocaleDateString("es", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </View>
    );
  }

  const isLinked = linkStatus?.hasActiveLink && linkStatus?.partner;

  // Figma F2b - sin vinculo: dos caminos para conectarse.
  if (!isLinked) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>
        <TabTitle>Vínculo</TabTitle>
        <View style={styles.emptyHero}>
          <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.emptyIcon}>
            <Ionicons name="link-outline" size={40} color={palette.onPrimary} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>Aún no estás vinculado</Text>
          <Text style={styles.emptyText}>Conecta con tu pareja para planear juntos.</Text>
        </View>
        <Card>
          <ListRow icon="qr-code-outline" title="Invitar a mi pareja" subtitle="Le compartes un QR para que lo escanee" onPress={handleGenerateCode} />
        </Card>
        <Card>
          <ListRow icon="keypad-outline" title="Unirme a mi pareja" subtitle="Escanea su QR o escribe lo que te compartió" onPress={handleEnterCode} />
        </Card>
      </ScrollView>
    );
  }

  // Figma F2 - con vinculo.
  const partnerName = linkStatus.partner?.displayName || linkStatus.partner?.nickname || "tu pareja";
  const userName = user?.displayName || user?.nickname || user?.email?.split("@")[0] || "Usuario";

  const avatar = (photo: string | null, name: string, onError: () => void) => (
    <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.avatarImage} onError={onError} />
      ) : (
        <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
      )}
    </LinearGradient>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>
      <TabTitle>Vínculo</TabTitle>

      <Card style={styles.connection}>
        <View style={styles.pair}>
          {avatar(userPhoto, userName, () => setUserPhoto(null))}
          <View style={styles.heart}>
            <Ionicons name="heart-outline" size={20} color={palette.primary} />
          </View>
          {avatar(partnerPhoto, partnerName, () => setPartnerPhoto(null))}
        </View>
        <Text style={styles.names}>
          {userName} y {partnerName}
        </Text>
        <Text style={styles.since}>Juntos desde el {formatLinkDate()}</Text>
      </Card>

      <View style={styles.stats}>
        <Card style={styles.stat}>
          <Text style={styles.statNumber}>{getDaysTogether()}</Text>
          <Text style={styles.statLabel}>Días juntos</Text>
        </Card>
        {/* [pulido-critica] D5 (Figma M5): un "0" se leia como reproche; sin eventos, invita a planear. */}
        {sharedEvents > 0 ? (
          <Card style={styles.stat}>
            <Text style={styles.statNumber}>{sharedEvents}</Text>
            <Text style={styles.statLabel}>Eventos compartidos</Text>
          </Card>
        ) : (
          <Card style={styles.stat}>
            <Text style={styles.firstDate}>Su primera cita</Text>
            <GradientButton title="Planear" compact onPress={() => router.push("/(recommend)/mode")} style={styles.firstDateButton} />
          </Card>
        )}
      </View>

      <ListCard>
        <ListRow
          icon="calendar-outline"
          title="Horarios libres juntos"
          subtitle="Cuándo tienen tiempo los dos"
          onPress={() => router.push({ pathname: "/(tabs)/calendario", params: { freeTogether: "1" } })}
        />
        <ListRow
          icon="people-outline"
          title="Planear en pareja"
          subtitle="Elijan juntos su próxima cita"
          onPress={() => router.push("/(recommend)/mode")}
        />
      </ListCard>

      <ErrorModal visible={!!errorMessage} message={errorMessage || ""} onClose={() => setErrorMessage(null)} />

      <SuccessModal visible={!!successMessage} message={successMessage || ""} onClose={() => setSuccessMessage(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 20 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyHero: { alignItems: "center", gap: 12, paddingTop: 24, paddingBottom: 8 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "600", color: palette.text, textAlign: "center" },
  emptyText: { fontSize: 14, color: palette.textSecondary, textAlign: "center" },
  connection: { alignItems: "center", gap: 12, paddingVertical: 24 },
  pair: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  avatarImage: { width: 72, height: 72 },
  avatarText: { fontSize: 24, fontWeight: "700", color: palette.onPrimary },
  heart: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.primarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  names: { fontSize: 20, fontWeight: "600", color: palette.text },
  since: { fontSize: 12, color: palette.textSecondary },
  stats: { flexDirection: "row", gap: 12 },
  stat: { flex: 1, alignItems: "center", gap: 4 },
  statNumber: { fontSize: 24, fontWeight: "700", color: palette.textAccent },
  statLabel: { fontSize: 12, color: palette.textSecondary },
  firstDate: { fontSize: 16, fontWeight: "600", color: palette.textAccent },
  firstDateButton: { alignSelf: "stretch" },
});
