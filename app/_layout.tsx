import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Grupo de autenticación */}
        <Stack.Screen name="(auth)" />
        {/* Grupo principal de tabs */}
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthProvider>
  );
}
