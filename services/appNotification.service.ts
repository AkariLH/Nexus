import { API_CONFIG } from '../config/api.config';
import { apiClient } from './api.client';

/** B9 - Aviso dentro de la app (planeacion en pareja). */
export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface AppNotificationList {
  items: AppNotification[];
  unread: number;
}

const paths = API_CONFIG.ENDPOINTS.APP_NOTIFICATIONS;

const appNotificationService = {
  list: async (userId: number): Promise<AppNotificationList> =>
    (await apiClient.get(paths.LIST.replace(':userId', String(userId)))).data,

  markAllRead: async (userId: number): Promise<void> => {
    await apiClient.post(paths.READ.replace(':userId', String(userId)));
  },

  /** [ux-ajustes] D8 - Borra los avisos ya leidos; devuelve cuantos se fueron. */
  clearRead: async (userId: number): Promise<number> =>
    (await apiClient.delete(paths.READ.replace(':userId', String(userId)))).data.removed,
};

export default appNotificationService;
export { appNotificationService };
