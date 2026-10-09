import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, clearAuthToken, getAuthToken } from '../utils/authToken';
import { isSessionExpired, onSessionExpired } from '../utils/session';

interface UserData {
  userId: number;
  email: string;
  displayName: string;
  nickname?: string;
  linkCode: string;
  emailConfirmed: boolean;
  profilePhoto?: string;
}

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: UserData, token: string, tokenExpiresAt?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = '@nexus_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar usuario al iniciar la app
  useEffect(() => {
    loadUser();
  }, []);

  // El servidor rechazo la sesion (401) a media app: se cierra y el layout raiz lleva al login.
  useEffect(
    () =>
      onSessionExpired(() => {
        logout().catch(() => {});
      }),
    []
  );

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEY);
      if (userData) {
        // Una sesion guardada con el token vencido (dura 24 h) no se restaura: cada peticion
        // seria rechazada y la app se quedaria cargando.
        const token = await getAuthToken();
        if (token && !isSessionExpired(token)) {
          setUser(JSON.parse(userData));
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
          await clearAuthToken();
        }
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: UserData, token: string, tokenExpiresAt?: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      await setAuthToken(token, tokenExpiresAt);
      setUser(userData);
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await clearAuthToken();
      setUser(null);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  };

  const updateUser = async (updates: Partial<UserData>) => {
    try {
      if (!user) return;
      
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
