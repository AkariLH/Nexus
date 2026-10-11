import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { QuestionnaireProvider } from "../context/QuestionnaireContext";
import { AvailabilityProvider } from "../context/AvailabilityContext";
import notificationService from "../services/firebase.service";
import { externalCalendarIntegration } from "../services/externalCalendar.integration.service";

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Manejar autenticación y redirección inicial
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // No autenticado, enviar a login
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup && hasCheckedAuth) {
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
        (partnerName) => {
          console.log('🎉 Vínculo establecido con:', partnerName);
          router.replace({
            pathname: '/(link)/link-success',
            params: { partnerName },
          });
        },
        (partnerName) => {
          console.log('💔 Vínculo eliminado por:', partnerName);
          router.push('/(tabs)/link');
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
    if (!user?.userId) return;

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
