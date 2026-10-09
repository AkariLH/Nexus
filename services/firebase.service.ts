import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { apiClient } from './api.client';

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
   * Inicializar notificaciones y configurar todos los listeners
   */
  async initialize(
    userId: number, 
    onLinkEstablished: (partnerName: string) => void,
    onLinkDeleted?: (partnerName: string) => void
  ) {
    try {
      console.log('🚀 Iniciando sistema de notificaciones...');
      console.log('⚠️ NOTA: Expo Go no soporta notificaciones push desde SDK 53');
      console.log('ℹ️ Para usar notificaciones push reales, necesitas crear un Development Build');
      console.log('ℹ️ Por ahora, la app funcionará sin notificaciones push automáticas');
      
      // Intentar registrar token solo si no estamos en Expo Go con SDK 53+
      const isExpoGo = Constants.appOwnership === 'expo';
      
      if (!isExpoGo) {
        // Solo intentar obtener token si NO estamos en Expo Go
        console.log('✅ No estás en Expo Go, intentando obtener push token...');
        
        // 1. Solicitar permisos
        const granted = await this.requestPermission();
        if (!granted) {
          console.log('⚠️ Sin permisos de notificación');
        } else {
          // 2. Intentar obtener token
          try {
            const token = await this.getPushToken();
            if (token) {
              console.log('✅ Token obtenido exitosamente');
              // 3. Registrar token en backend
              await this.registerTokenWithBackend(userId, token);
            }
          } catch (tokenError) {
            console.error('⚠️ Error al obtener token:', tokenError);
          }
        }
      } else {
        console.log('⚠️ Estás usando Expo Go - las notificaciones push no están disponibles');
        console.log('💡 La app seguirá funcionando, pero deberás refrescar manualmente para ver cambios');
      }

      // 4. Listener para notificaciones recibidas cuando la app está en primer plano
      const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
        console.log('📬 Notificación recibida en primer plano:', notification);
        const data = notification.request.content.data;
        
        if (data?.type === 'LINK_ESTABLISHED') {
          const partnerName = (data.partnerName as string) || 'tu pareja';
          onLinkEstablished(partnerName);
        } else if (data?.type === 'LINK_DELETED' && onLinkDeleted) {
          const partnerName = (data.partnerName as string) || 'tu pareja';
          console.log('💔 Notificación de desvinculación recibida de:', partnerName);
          onLinkDeleted(partnerName);
        }
      });

      // 5. Listener para cuando el usuario toca una notificación
      const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('📱 Notificación tocada por el usuario:', response);
        const data = response.notification.request.content.data;
        
        if (data?.type === 'LINK_ESTABLISHED') {
          const partnerName = (data.partnerName as string) || 'tu pareja';
          onLinkEstablished(partnerName);
        } else if (data?.type === 'LINK_DELETED' && onLinkDeleted) {
          const partnerName = (data.partnerName as string) || 'tu pareja';
          console.log('💔 Usuario tocó notificación de desvinculación de:', partnerName);
          onLinkDeleted(partnerName);
        }
      });

      console.log('🎉 Sistema de notificaciones inicializado');
      if (isExpoGo) {
        console.log('ℹ️ Modo Expo Go: sin notificaciones push automáticas');
      }

      // Retornar función para limpiar listeners
      return () => {
        foregroundSubscription.remove();
        responseSubscription.remove();
      };
    } catch (error) {
      console.error('❌ Error inicializando notificaciones:', error);
      console.log('⚠️ La app continuará funcionando sin notificaciones');
    }
  }
}

export default new NotificationService();
