import AsyncStorage from '@react-native-async-storage/async-storage';

/** [primeros-pasos] Pantallas con guía de primera visita (U6). */
export type GuideScreen = 'home' | 'link' | 'calendars' | 'schedule' | 'recommend';

const SCREENS: GuideScreen[] = ['home', 'link', 'calendars', 'schedule', 'recommend'];

const key = (userId: number, screen: GuideScreen) => `@nexus_guide_${screen}_${userId}`;

/**
 * Si esta cuenta ya vio (o saltó) la guía de la pantalla. Si el almacenamiento falla se toma
 * como vista: es mejor no mostrar una guía que mostrarla cada vez (F-16).
 */
export async function wasSeen(userId: number, screen: GuideScreen): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(key(userId, screen))) === '1';
  } catch {
    return true;
  }
}

export async function markSeen(userId: number, screen: GuideScreen): Promise<void> {
  try {
    await AsyncStorage.setItem(key(userId, screen), '1');
  } catch {
    // Sin almacenamiento la guía podría volver a salir; no es motivo para fallar.
  }
}

/** «Ver tutorial» (U7): vuelve a mostrar todas las guías de esta cuenta. */
export async function resetAll(userId: number): Promise<void> {
  try {
    await AsyncStorage.multiRemove(SCREENS.map(screen => key(userId, screen)));
  } catch {
    // Igual que arriba: sin almacenamiento no hay nada que borrar.
  }
}
