import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Image, ScrollView, SafeAreaView } from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter, useFocusEffect } from "expo-router";
import { MotiView } from "moti";
import linkService from "../../services/link.service";
import { ActionModal } from "../components/ActionModal";
import { ErrorModal } from "../components/ErrorModal";
import { SuccessModal } from "../components/SuccessModal";
import { useQuestionnaireGuard } from "../../hooks/useQuestionnaireGuard";

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
  useQuestionnaireGuard();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [linkStatus, setLinkStatus] = useState<LinkStatusData | null>(null);
  const [userPhotoError, setUserPhotoError] = useState(false);
  const [partnerPhotoError, setPartnerPhotoError] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const checkLinkStatus = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const response = await fetch(`http://192.168.1.95:8080/api/link/status/${user.userId}`);
      
      if (response.ok) {
        const data: LinkStatusData = await response.json();
        setLinkStatus(data);
        // Resetear estados de error de imágenes al obtener nuevos datos
        setUserPhotoError(false);
        setPartnerPhotoError(false);
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

  const handleUnlink = () => {
    setShowUnlinkModal(true);
  };

  const confirmUnlink = async () => {
    if (!user?.userId) return;
    
    setShowUnlinkModal(false);
    setIsUnlinking(true);

    try {
      const response = await linkService.deleteLink(user.userId);
      
      if (response.success) {
        const partnerName = response.partnerName || linkStatus?.partner?.displayName || 'tu pareja';
        let message = `Te has desvinculado de ${partnerName}`;
        
        // Agregar nota si la notificación no se envió
        if (!response.notificationSent) {
          message += `.\n\nNota: ${partnerName} verá el cambio cuando abra o recargue la app.`;
        }
        
        setSuccessMessage(message);
        // Actualizar el estado del vínculo
        await checkLinkStatus();
      } else {
        setErrorMessage(response.message || 'No se pudo eliminar el vínculo');
      }
    } catch (error: any) {
      console.error('Error al desvincular:', error);
      setErrorMessage(error.message || 'Ocurrió un error al intentar desvincular');
    } finally {
      setIsUnlinking(false);
    }
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
          <ActivityIndicator size="large" color="#FF4F81" />
        </View>
      </View>
    );
  }

  const isLinked = linkStatus?.hasActiveLink && linkStatus?.partner;
  
  if (!isLinked) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainerWrapper}>
          <View style={styles.emptyContainer}>
          <Ionicons name="heart-dislike-outline" size={80} color="#FF4F81" style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Aún no estás vinculado</Text>
          <Text style={styles.emptyText}>
            Para conectar con tu pareja, pueden usar cualquiera de estas opciones:
          </Text>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleGenerateCode}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#FF4F81", "#8A2BE2"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Ionicons name="qr-code-outline" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Generar mi código</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleEnterCode}
            activeOpacity={0.8}
          >
            <View style={styles.outlineButton}>
              <Ionicons name="keypad-outline" size={20} color="#FF4F81" />
              <Text style={styles.outlineButtonText}>Ingresar código</Text>
            </View>
          </TouchableOpacity>
        </View>
        </View>
      </SafeAreaView>
    );
  }

  // Usuario tiene vínculo activo - mostrar detalles completos
  const partnerName = linkStatus.partner?.displayName || linkStatus.partner?.nickname || "tu pareja";
  const partnerInitial = partnerName.charAt(0).toUpperCase();
  const daysTogether = getDaysTogether();
  
  const userName = user?.displayName || user?.nickname || user?.email?.split('@')[0] || "Usuario";
  const userInitial = userName.charAt(0).toUpperCase();
  // Agregar timestamp para forzar recarga de imágenes
  const timestamp = Date.now();
  const userPhoto = user?.userId ? `http://192.168.1.95:8080/api/profile/${user.userId}/avatar?t=${timestamp}` : null;
  const partnerPhoto = linkStatus.partner?.profilePhoto ? `${linkStatus.partner.profilePhoto}?t=${timestamp}` : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Estado del vínculo</Text>

      {/* Connection visual */}
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", delay: 100 }}
        style={styles.connectionContainer}
      >
        <View style={styles.connectionVisual}>
          <MotiView
            from={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{
              type: "timing",
              duration: 2000,
              loop: true,
            }}
          >
            <LinearGradient
              colors={["#FF4F81", "#8A2BE2"]}
              style={styles.avatar}
            >
              {userPhoto && !userPhotoError ? (
                <Image 
                  source={{ uri: userPhoto }} 
                  style={styles.avatarImage}
                  onError={() => setUserPhotoError(true)}
                />
              ) : (
                <Text style={styles.avatarText}>{userInitial}</Text>
              )}
            </LinearGradient>
          </MotiView>

          <MotiView
            from={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{
              type: "timing",
              duration: 1500,
              loop: true,
            }}
          >
            <Ionicons name="heart" size={48} color="#FF4F81" />
          </MotiView>

          <MotiView
            from={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{
              type: "timing",
              duration: 2000,
              loop: true,
              delay: 500,
            }}
          >
            <LinearGradient
              colors={["#8A2BE2", "#FF4F81"]}
              style={styles.avatar}
            >
              {partnerPhoto && !partnerPhotoError ? (
                <Image 
                  source={{ uri: partnerPhoto }} 
                  style={styles.avatarImage}
                  onError={() => setPartnerPhotoError(true)}
                />
              ) : (
                <Text style={styles.avatarText}>{partnerInitial}</Text>
              )}
            </LinearGradient>
          </MotiView>
        </View>
      </MotiView>

      {/* Partner info */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", delay: 300 }}
      >
        <LinearGradient
          colors={["#FF4F8110", "#8A2BE210"]}
          style={styles.infoCard}
        >
          <Text style={styles.connectedTitle}>Conectado con {partnerName}</Text>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.dateText}>Desde {formatLinkDate()}</Text>
          </View>
        </LinearGradient>
      </MotiView>

      {/* Stats */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", delay: 500 }}
        style={styles.statsContainer}
      >
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{daysTogether}</Text>
          <Text style={styles.statLabel}>Días juntos</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.statNumberSecondary]}>0</Text>
          <Text style={styles.statLabel}>Eventos compartidos</Text>
        </View>
      </MotiView>

      {/* Actions */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", delay: 700 }}
        style={styles.actionsContainer}
      >
        <TouchableOpacity
          style={styles.unlinkButton}
          onPress={handleUnlink}
          activeOpacity={0.8}
          disabled={isUnlinking}
        >
          <View style={styles.unlinkContent}>
            <View>
              <Text style={styles.unlinkTitle}>Desvincular</Text>
              <Text style={styles.unlinkSubtitle}>
                Terminar conexión con {partnerName}
              </Text>
            </View>
            {isUnlinking ? (
              <ActivityIndicator size="small" color="#FF4757" />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#FF4757" />
            )}
          </View>
        </TouchableOpacity>
      </MotiView>

      {/* Unlink Confirmation Modal */}
      <ActionModal
        visible={showUnlinkModal}
        onClose={() => setShowUnlinkModal(false)}
        title={`¿Desvincular de ${partnerName}?`}
        actions={[
          {
            label: 'Desvincular',
            icon: 'unlink-outline',
            onPress: confirmUnlink,
            destructive: true,
          },
        ]}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={!!errorMessage}
        message={errorMessage || ''}
        onClose={() => setErrorMessage(null)}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={!!successMessage}
        message={successMessage || ''}
        onClose={() => setSuccessMessage(null)}
      />
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FFF",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: { 
    fontSize: 30, 
    fontWeight: "700", 
    color: "#1A1A1A", 
    marginBottom: 24,
  },
  emptyContainerWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkCard: { 
    borderRadius: 24, 
    padding: 24,
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  linkHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 16 
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    elevation: 4,
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  linkInfo: {
    flex: 1,
  },
  subText: { 
    color: "#666", 
    fontSize: 14,
    marginBottom: 4,
  },
  partner: { 
    color: "#1A1A1A", 
    fontSize: 20, 
    fontWeight: "700" 
  },
  details: { 
    color: "#FF4F81", 
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyIcon: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  actionButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#FF4F81',
    borderRadius: 16,
    backgroundColor: '#FFF',
  },
  outlineButtonText: {
    color: '#FF4F81',
    fontSize: 16,
    fontWeight: '700',
  },
  connectionContainer: {
    marginBottom: 48,
  },
  connectionVisual: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#FF4F81",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "600",
    color: "#FFF",
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  infoCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
  },
  connectedTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
    textAlign: "center",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#666",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#F5F5F5",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FF4F81",
    marginBottom: 4,
  },
  statNumberSecondary: {
    color: "#8A2BE2",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  actionsContainer: {
    gap: 12,
  },
  unlinkButton: {
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#FFE5E5",
    borderRadius: 20,
    padding: 16,
  },
  unlinkContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  unlinkTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF4757",
    marginBottom: 4,
  },
  unlinkSubtitle: {
    fontSize: 13,
    color: "#666",
  },
});
