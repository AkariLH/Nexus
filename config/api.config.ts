import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Detectar automáticamente la URL correcta según la plataforma
const getBaseUrl = () => {
  // IP de tu computadora en la red local (cambiar si tu IP cambia)
  const LOCAL_NETWORK_IP = '10.100.79.237';
  
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
      VERIFY_EMAIL: '/auth/verify-email',
      RESEND_VERIFICATION: '/auth/resend-verification',
      FORGOT_PASSWORD: '/auth/forgot-password',
      VERIFY_RESET_CODE: '/auth/verify-reset-code',
      RESEND_RESET_CODE: '/auth/resend-reset-code',
      RESET_PASSWORD: '/auth/reset-password',
      HEALTH: '/auth/health',
    },
    PROFILE: {
      UPDATE: '/profile/:userId',
      UPDATE_AVATAR: '/profile/:userId/avatar',
      GET_AVATAR: '/profile/:userId/avatar',
      DELETE_AVATAR: '/profile/:userId/avatar',
      DELETE: '/profile/:userId',
    },
    LINK: {
      GENERATE_CODE: '/link/generate/:userId',
      ESTABLISH_LINK: '/link/establish/:userId',
      GET_STATUS: '/link/status/:userId',
      DELETE_LINK: '/link/:userId',
    },
    PREFERENCES: {
      GET_STATUS: '/preferences/status/:userId',
      GET_CATEGORIES: '/preferences/categories',
      SAVE: '/preferences/:userId',
      GET_USER_PREFERENCES: '/preferences/:userId',
    },
    EVENTS: {
      CREATE: '/events/create/:userId',
      GET_USER_EVENTS: '/events/user/:userId',
      GET_PENDING_APPROVAL: '/events/user/:userId/pending-approval',
      APPROVE: '/events/:eventId/approve/:userId',
      REJECT: '/events/:eventId/reject/:userId',
      UPDATE: '/events/:eventId/user/:userId',
      DELETE: '/events/:eventId/user/:userId',
    },
    EXTERNAL_CALENDARS: {
      LINK: '/calendars/external/link/:userId',
      UNLINK: '/calendars/external/unlink/:userId/:deviceCalendarId',
      GET_USER_CALENDARS: '/calendars/external/:userId',
      UPDATE_SETTINGS: '/calendars/external/:userId/:deviceCalendarId',
      SYNC_EVENTS: '/calendars/external/sync/:userId',
      GET_EVENTS: '/calendars/external/events/:userId',
      GET_AVAILABILITY: '/calendars/external/availability/:userId',
      GET_MUTUAL_AVAILABILITY: '/calendars/external/mutual-availability',
      HEALTH: '/calendars/external/health',
    },
  },
  
  TIMEOUT: 30000, // 30 segundos para dar tiempo al envío de email
};
