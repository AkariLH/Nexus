import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Detectar automáticamente la URL correcta según la plataforma
const getBaseUrl = () => {
  // IP de tu computadora en la red local (cambiar si tu IP cambia)
  const LOCAL_NETWORK_IP = '192.168.0.208';
  
  // Para Expo Go, siempre usar la IP de red local
  const expoConfig = Constants.expoConfig;
  
  if (Platform.OS === 'web') {
    return 'http://localhost:8080';
  }
  
  // Para dispositivos móviles (físicos o emuladores con Expo Go)
  // usar la IP de red local
  return `http://${LOCAL_NETWORK_IP}:8080`;
};

export const API_CONFIG = {
  BASE_URL: `${getBaseUrl()}/api`,
  
  ENDPOINTS: {
    AUTH: {
      REGISTER: '/auth/register',
      LOGIN: '/auth/login',
      HEALTH: '/auth/health',
    },
  },
  
  TIMEOUT: 30000, // 30 segundos para dar tiempo al envío de email
};
