import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { apiClient } from './api.client';
import { PushTarget, routeForPush } from '../utils/pushRoute';

// Configurar cómo se deben manejar las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {

  /**
   * Solicitar permisos de notificación al usuario
   */
  async requestPermission(): Promise<boolean> {
    try {
      console.log('🔍 Verificando dispositivo...');
      console.log('📱 Device.isDevice:', Device.isDevice);
      console.log('📱 Platform.OS:', Platform.OS);
      
      if (!Device.isDevice) {
        console.log('⚠️ Las notificaciones push solo funcionan en dispositivos físicos');
        console.log('⚠️ Estás en un emulador/simulador');
        return false;
      }

      console.log('✅ Dispositivo físico detectado');
      console.log('🔔 Verificando permisos existentes...');
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('📋 Estado de permisos actual:', existingStatus);
      
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('🔔 Solicitando permisos de notificación...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('📋 Respuesta del usuario:', status);
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Permisos de notificación denegados');
        console.log('⚠️ Por favor, ve a la configuración del dispositivo y habilita las notificaciones para Expo Go');
        return false;
      }

      console.log('✅ Permisos de notificación concedidos');
      return true;
    } catch (error) {
      console.error('❌ Error solicitando permisos:', error);
      return false;
    }
  }

  /**
   * Obtener el Expo Push Token del dispositivo
   */
  async getPushToken(): Promise<string | null> {
    try {
      console.log('🔍 Verificando dispositivo para obtener token...');
      console.log('📱 Device.isDevice:', Device.isDevice);
      
      if (!Device.isDevice) {
        console.log('⚠️ Dispositivo simulador/emulador detectado, no se puede obtener token');
        return null;
      }

      console.log('✅ Dispositivo físico confirmado');

      // Configurar canal de notificación para Android
      if (Platform.OS === 'android') {
        console.log('🤖 Configurando canal de notificación para Android...');
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
        console.log('✅ Canal de notificación configurado');
      }

      console.log('📱 Solicitando Expo Push Token...');
      console.log('📱 Esto puede tardar unos segundos...');
      
      // Obtener el projectId desde Constants si está disponible
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      console.log('📋 Project ID:', projectId || 'No definido, usando experienceId del slug');
      
      // En Expo Go, usar el experienceId basado en el slug
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId || undefined,
      });
      const token = tokenData.data;
      
      console.log('🔑 Expo Push Token obtenido exitosamente!');
      console.log('🔑 Token:', token.substring(0, 50) + '...');
      
      await AsyncStorage.setItem('push_token', token);
      console.log('💾 Token guardado en AsyncStorage');
      
      return token;
    } catch (error: any) {
      console.error('❌ Error obteniendo Push token:', error.message || error);
      console.error('📋 Detalles del error:', error);
      return null;
    }
  }

  /**
   * Registrar el Push token en el backend
   */
  async registerTokenWithBackend(userId: number, token: string): Promise<boolean> {
    try {
      console.log(`📤 Registrando token Push para usuario ${userId}`);
      console.log(`📤 Token: ${token.substring(0, 30)}...`);
      
      await apiClient.post(`/profile/${userId}/fcm-token`, { fcmToken: token });

      console.log('✅ Token Push registrado exitosamente en el backend');
      return true;
    } catch (error) {
      console.error('❌ Error registrando token en backend:', error);
      return false;
    }
  }

  /**
   * [push-avisos] U9: al cerrar sesión el teléfono deja de recibir los avisos de esta cuenta.
   */
  async unregister(userId: number): Promise<void> {
    if (Platform.OS === 'web') return;
    await apiClient.delete(`/profile/${userId}/fcm-token`);
    await AsyncStorage.removeItem('push_token');
  }

  /**
   * Registra el token del teléfono y escucha las push de todos los avisos de la campanita
   * ([push-avisos] U8). `onOpen` recibe la pantalla a abrir cuando se toca una push (también si
   * la app estaba cerrada) y `onReceive`, los datos de una push que llega con la app abierta.
   * En web y en Expo Go no hay push nativa: no registra nada (R10).
   */
  async initialize(
    userId: number,
    onOpen: (target: PushTarget) => void,
    onReceive?: (data: Record<string, unknown>) => void
  ): Promise<(() => void) | undefined> {
    const isExpoGo = Constants.appOwnership === 'expo';
    if (Platform.OS === 'web' || isExpoGo) {
      console.log('ℹ️ Sin notificaciones push en web ni en Expo Go');
      return undefined;
    }
    try {
      if (await this.requestPermission()) {
        const token = await this.getPushToken();
        if (token) await this.registerTokenWithBackend(userId, token);
      }

      const open = (response: Notifications.NotificationResponse) => {
        const id = response.notification.request.identifier;
        if (id === lastOpenedId) return;
        lastOpenedId = id;
        const target = routeForPush(response.notification.request.content.data);
        if (target) onOpen(target);
      };

      const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
        onReceive?.(notification.request.content.data ?? {});
      });
      const responseSubscription = Notifications.addNotificationResponseReceivedListener(open);

      // La app estaba cerrada y se abrió tocando una push: initialize corre ya con sesión (R9).
      const last = await Notifications.getLastNotificationResponseAsync();
      if (last) open(last);

      return () => {
        receivedSubscription.remove();
        responseSubscription.remove();
      };
    } catch (error) {
      console.error('❌ Error inicializando notificaciones:', error);
      return undefined;
    }
  }
}

/** La última push que se abrió, para no abrirla otra vez si initialize vuelve a correr. */
let lastOpenedId: string | null = null;

export default new NotificationService();
