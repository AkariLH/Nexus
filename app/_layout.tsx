import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Grupo de autenticación */}
      <Stack.Screen name="(auth)" />
      {/* Grupo principal de tabs */}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
