import { Stack } from 'expo-router';

/** [terminos-en-app] Términos y aviso de privacidad: se abren con o sin sesión. */
export default function LegalLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
