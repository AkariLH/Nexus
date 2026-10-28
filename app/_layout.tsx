import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Href, Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { QuestionnaireProvider } from "../context/QuestionnaireContext";
import { AvailabilityProvider } from "../context/AvailabilityContext";
import notificationService from "../services/firebase.service";
import { externalCalendarIntegration } from "../services/externalCalendar.integration.service";
import { DeviceEventEmitter, Platform } from "react-native";
import { NOTICES_EVENT } from "../utils/pushRoute";

const CHANGE_PASSWORD_ROUTES = ["forgot-password", "reset-password"];

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Manejar autenticación y redirección inicial
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    // La pantalla de inicio (y la ruta raiz que lleva a ella) se muestra siempre completa; al
    // terminar su animacion ella misma decide a donde ir. Sin esto, la redireccion de aqui le
    // ganaba y la animacion no se veia.
    const route = segments as string[];
    if (route.length === 0 || route[1] === "splash") return;

    if (!user && !inAuthGroup) {
      // No autenticado, enviar a login
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup && hasCheckedAuth && !CHANGE_PASSWORD_ROUTES.includes(route[1])) {
      // Con sesion, las pantallas de cambio de contrasena si se pueden abrir (Perfil > Cambiar contrasena).
      // Ya autenticado y en pantallas de auth, ir a tabs
      // El QuestionnaireProvider manejará la lógica del cuestionario
      router.replace("/(tabs)");
    }

    if (!hasCheckedAuth && user) {
      setHasCheckedAuth(true);
    }
  }, [user, segments, isLoading, hasCheckedAuth]);

  // Inicializar sistema de notificaciones
  useEffect(() => {
    if (!user?.userId) return;

    const initNotifications = async () => {
      const unsubscribe = await notificationService.initialize(
        user.userId,
        // [push-avisos] Al tocar una push se abre la pantalla de su aviso.
        (target) => router.push(target as Href),
        (data) => {
          // Avisa a Inicio que hay un aviso nuevo en la campanita.
          DeviceEventEmitter.emit(NOTICES_EVENT);
          // Con la app abierta, al vincularse o desvincularse se cambia de pantalla como antes.
          const partnerName = typeof data.partnerName === 'string' ? data.partnerName : 'tu pareja';
          if (data.type === 'LINK_ESTABLISHED') {
            // Figma H7: Inicio con el modal "¡Ya están vinculados!"
            router.replace({ pathname: '/(tabs)', params: { linked: partnerName } });
          } else if (data.type === 'LINK_DELETED') {
            router.push('/(tabs)/link');
          }
        }
      );

      return unsubscribe;
    };

    const cleanup = initNotifications();

    return () => {
      cleanup.then((unsub) => unsub?.());
    };
  }, [user?.userId, router]);

  // Sincronización automática de calendarios externos al abrir la app
  useEffect(() => {
    // En web no hay calendario del dispositivo: solo llenaba la consola de errores de permisos.
    if (!user?.userId || Platform.OS === "web") return;

    const syncCalendars = async () => {
      try {
        console.log('🔄 Sincronizando calendarios externos al iniciar...');
        await externalCalendarIntegration.performPeriodicSync(user.userId);
        console.log('✅ Sincronización inicial completada');
      } catch (error) {
        console.error('❌ Error en sincronización inicial:', error);
        // No mostrar error al usuario, es un proceso en segundo plano
      }
    };

    // Ejecutar sincronización después de un breve delay para no bloquear la carga inicial
    const timeoutId = setTimeout(() => {
      syncCalendars();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [user?.userId]);

  // Mostrar null mientras carga (Expo Router maneja la pantalla de carga)
  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Grupo de autenticación */}
      <Stack.Screen name="(auth)" />
      {/* Grupo principal de tabs */}
      <Stack.Screen name="(tabs)" />
      {/* Grupo de vinculación */}
      <Stack.Screen name="(link)" />
    </Stack>
  );
}

export default function RootLayout() {
  // Las fuentes de iconos se cargan antes de pintar; sin esto, en web salen cuadros vacios
  // durante los primeros segundos.
  const [fontsLoaded, fontError] = useFonts({ ...Ionicons.font, ...MaterialCommunityIcons.font });
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <QuestionnaireProvider>
        <AvailabilityProvider>
          <RootNavigator />
        </AvailabilityProvider>
      </QuestionnaireProvider>
    </AuthProvider>
  );
}
