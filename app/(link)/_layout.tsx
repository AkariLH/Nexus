import { Stack } from "expo-router";

export default function LinkLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="my-link-code" />
      <Stack.Screen name="enter-link-code" />
      <Stack.Screen name="scan-link-qr" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="link-status" />
    </Stack>
  );
}
