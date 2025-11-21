import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import notificationService from "../services/firebase.service";

function RootNavigator() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user?.userId) return;

    // Inicializar sistema de notificaciones y configurar listeners
    const initNotifications = async () => {
      const unsubscribe = await notificationService.initialize(
        user.userId,
        (partnerName) => {
          // Callback cuando se establece un vínculo
          console.log('🎉 Vínculo establecido con:', partnerName);
          router.replace({
            pathname: '/(link)/link-success',
            params: { partnerName },
          });
        },
        (partnerName) => {
          // Callback cuando se elimina un vínculo
          console.log('💔 Vínculo eliminado por:', partnerName);
          // Redirigir al tab de vínculo para que vea el estado actualizado
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
      <RootNavigator />
    </AuthProvider>
  );
}
