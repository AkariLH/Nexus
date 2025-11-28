import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { QuestionnaireProvider } from "../context/QuestionnaireContext";
import notificationService from "../services/firebase.service";

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
  return (
    <AuthProvider>
      <QuestionnaireProvider>
        <RootNavigator />
      </QuestionnaireProvider>
    </AuthProvider>
  );
}
