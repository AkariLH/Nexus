import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { gradients, palette } from "../../constants/colors";
import { codeFromScannedQr } from "../../utils/pendingLinkCode";
import { GradientButton } from "../components/ui/GradientButton";
import { ScreenHeader } from "../components/layout/ScreenHeader";

/**
 * [qr-escaner] Figma S2/S3: lee el QR de «Invitar a mi pareja» con la cámara y vuelve a «Únete a tu
 * pareja» con el código puesto para conectar solo. Sin permiso de cámara muestra S3.
 */
const FRAME = 240;
const CORNER = 40;
const NOT_NEXUS_MS = 2500;

export default function ScanLinkQrScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [notNexus, setNotNexus] = useState(false);
  const handled = useRef(false);
  const lastRejected = useRef<{ data: string; at: number } | null>(null);

  useEffect(() => {
    if (!notNexus) return;
    const t = setTimeout(() => setNotNexus(false), NOT_NEXUS_MS);
    return () => clearTimeout(t);
  }, [notNexus]);

  const onScanned = ({ data }: BarcodeScanningResult) => {
    if (handled.current) return;
    const code = codeFromScannedQr(data);
    if (!code) {
      // El mismo QR ajeno se lee muchas veces por segundo: el aviso se repite solo si pasó un rato.
      const now = Date.now();
      if (lastRejected.current?.data === data && now - lastRejected.current.at < NOT_NEXUS_MS) return;
      lastRejected.current = { data, at: now };
      setNotNexus(true);
      return;
    }
    handled.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.replace({ pathname: "/(link)/enter-link-code", params: { code, auto: "1" } });
  };

  const writeCode = () => router.back();

  if (!permission) {
    return (
      <View style={[styles.center, { backgroundColor: palette.surface }]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    const allow = async () => {
      if (permission.canAskAgain) {
        await requestPermission();
      } else {
        Linking.openSettings().catch(() => {});
      }
    };
    return (
      <View style={[styles.container, { backgroundColor: palette.surface }]}>
        <ScreenHeader title="Escanear QR" onBack={writeCode} />
        <View style={styles.askContent}>
          <LinearGradient colors={gradients.soft} style={styles.askIcon}>
            <Ionicons name="camera-outline" size={48} color={palette.primary} />
          </LinearGradient>
          <Text style={styles.askTitle}>Activa la cámara</Text>
          <Text style={styles.askText}>
            La usamos solo para leer el QR de tu pareja. No tomamos ni guardamos fotos.
          </Text>
          <GradientButton title="Activar cámara" onPress={allow} style={styles.fullWidth} />
          <TouchableOpacity accessibilityRole="button" onPress={writeCode} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Escribir el código</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={onScanned}
      />
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={writeCode}
          style={[styles.close, { top: insets.top + 16 }]}
        >
          <Ionicons name="close" size={24} color={palette.onPrimary} />
        </TouchableOpacity>

        <View style={[styles.top, { paddingTop: insets.top + 80 }]}>
          <Text style={styles.title}>Apunta la cámara al QR de tu pareja</Text>
          <Text style={styles.subtitle}>Se lee solo, no hace falta tomar foto.</Text>
        </View>

        <View style={styles.frame} pointerEvents="none">
          <Corner style={{ top: 0, left: 0 }} h="left" v="top" />
          <Corner style={{ top: 0, right: 0 }} h="right" v="top" />
          <Corner style={{ bottom: 0, left: 0 }} h="left" v="bottom" />
          <Corner style={{ bottom: 0, right: 0 }} h="right" v="bottom" />
        </View>

        <Text style={styles.hint}>
          {notNexus ? "Este QR no es de Nexus." : "Tu pareja lo encuentra en Pareja › Invitar a mi pareja."}
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={writeCode}
          style={[styles.manual, { bottom: insets.bottom + 40 }]}
        >
          <Text style={styles.manualText}>Escribir el código</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Corner({ style, h, v }: { style: object; h: "left" | "right"; v: "top" | "bottom" }) {
  const bar = { position: "absolute" as const, borderRadius: 3 };
  return (
    <View style={[{ position: "absolute", width: CORNER, height: CORNER }, style]}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[bar, { height: 5, width: CORNER, [v]: 0, left: 0 }]}
      />
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[bar, { width: 5, height: CORNER, top: 0, [h]: 0 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  cameraContainer: { flex: 1, backgroundColor: "#15121C" },
  close: {
    position: "absolute",
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  top: { alignItems: "center", paddingHorizontal: 30 },
  title: { color: palette.onPrimary, fontSize: 20, fontWeight: "600", textAlign: "center" },
  subtitle: { color: palette.onPrimary, opacity: 0.85, fontSize: 14, marginTop: 6, textAlign: "center" },
  frame: {
    alignSelf: "center",
    width: FRAME,
    height: FRAME,
    marginTop: 56,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  hint: {
    color: palette.onPrimary,
    opacity: 0.9,
    fontSize: 14,
    textAlign: "center",
    marginTop: 40,
    paddingHorizontal: 30,
  },
  manual: {
    position: "absolute",
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  manualText: { color: palette.onPrimary, fontSize: 15, fontWeight: "500" },
  askContent: { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: 96, gap: 16 },
  askIcon: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center" },
  askTitle: { fontSize: 20, fontWeight: "600", color: palette.text, textAlign: "center" },
  askText: { fontSize: 14, color: palette.textSecondary, textAlign: "center", lineHeight: 20, paddingHorizontal: 16 },
  fullWidth: { alignSelf: "stretch" },
  secondaryButton: {
    alignSelf: "stretch",
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    alignItems: "center",
  },
  secondaryText: { color: palette.textAccent, fontSize: 16, fontWeight: "600" },
});
