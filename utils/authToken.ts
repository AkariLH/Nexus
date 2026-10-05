import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Persistencia del JWT de sesion, separada de AuthContext/STORAGE_KEY (que guarda el perfil,
 * no credenciales). api.client.ts lee de aqui en el interceptor de requests; AuthContext escribe
 * aqui en login()/logout(). Ver .annie.md §10.
 */
const TOKEN_STORAGE_KEY = '@nexus_auth_token';

interface StoredAuthToken {
  token: string;
  expiresAt?: string;
}

export async function getAuthToken(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: StoredAuthToken = JSON.parse(raw);
    return parsed.token ?? null;
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string, expiresAt?: string): Promise<void> {
  const value: StoredAuthToken = { token, expiresAt };
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(value));
}

export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
}
