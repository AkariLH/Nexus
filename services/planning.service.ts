import { API_CONFIG } from '../config/api.config';
import { apiClient } from './api.client';
import type { RecommendationItem, Scope, ZoneType } from './recommendation.service';

export type PlanningPhase =
  | 'INVITED'
  | 'FILTERS'
  | 'OPTIONS'
  | 'PROPOSAL'
  | 'AGREED'
  | 'EXPIRED'
  | 'CLOSED'
  | 'CANCELLED';

export type VoteValue = 'LIKE' | 'DISLIKE';

/** B2 - Filtros compartidos. Sin coordenadas: la ubicacion solo viaja al tocar "Listo" (RN-30). */
export interface PlanningFilters {
  zoneType?: ZoneType | null;
  boroughCode?: string | null;
  scope?: Scope | null;
  maxCostMxn?: number | null;
  categories?: string[];
  slotStart?: string | null;
  slotEnd?: string | null;
  /** [rango-distancia] 1, 3, 5, 10 o 15 km; vacio = 15. */
  radiusKm?: number | null;
}

export interface PlanningMember {
  userId: number;
  name: string;
  online: boolean;
  ready: boolean;
}

export interface PlanningOption {
  item: RecommendationItem;
  myVote: VoteValue | null;
  partnerVote: VoteValue | null;
}

export interface PlanningView {
  id: number;
  status: string;
  phase: PlanningPhase;
  role: 'INVITER' | 'PARTNER';
  me: PlanningMember;
  partner: PlanningMember;
  inviteExpiresAt: string;
  sessionExpiresAt: string | null;
  filters: PlanningFilters | null;
  activity: string[];
  options: PlanningOption[];
  hasMore: boolean;
  relaxedFilters: string[];
  adjustingByPartner: boolean;
  proposal: { option: PlanningOption; byMe: boolean } | null;
  agreed: PlanningOption | null;
  eventId: number | null;
  unreadMessages: number;
  /** Con CLOSED: la propuesta sin responder o la opcion en la que coincidieron. */
  leftover: { option: PlanningOption; kind: LeftoverKind } | null;
}

export type LeftoverKind = 'MY_PROPOSAL' | 'THEIR_PROPOSAL' | 'MATCH';

export interface PlanningMessage {
  id: number;
  mine: boolean;
  senderName: string;
  body: string;
  createdAt: string;
}

const paths = API_CONFIG.ENDPOINTS.PLANNING;

const session = (userId: number, sessionId: number, action: string): string =>
  `${paths.SESSION.replace(':userId', String(userId)).replace(':sessionId', String(sessionId))}/${action}`;

/**
 * RF-38 / RF-39 - Planeacion en pareja. Todo por apiClient (lleva la sesion).
 */
const planningService = {
  /** [libres-juntos] Con `slot`, la planeacion empieza con ese horario ya puesto. */
  invite: async (userId: number, slot?: { slotStart: string; slotEnd: string }): Promise<PlanningView> => {
    const url = paths.INVITE.replace(':userId', String(userId));
    const response = slot ? await apiClient.post(url, slot) : await apiClient.post(url);
    return response.data;
  },

  /** La planeacion abierta o recien terminada; null si no hay (204). */
  current: async (userId: number): Promise<PlanningView | null> => {
    const response = await apiClient.get(paths.CURRENT.replace(':userId', String(userId)));
    return response.status === 204 || !response.data ? null : response.data;
  },

  accept: async (userId: number, sessionId: number): Promise<PlanningView> =>
    (await apiClient.post(session(userId, sessionId, 'accept'))).data,

  cancel: async (userId: number, sessionId: number): Promise<PlanningView> =>
    (await apiClient.post(session(userId, sessionId, 'cancel'))).data,

  updateFilters: async (userId: number, sessionId: number, filters: PlanningFilters): Promise<PlanningView> =>
    (await apiClient.put(session(userId, sessionId, 'filters'), filters)).data,

  ready: async (userId: number, sessionId: number, location?: { lat: number; lon: number }): Promise<PlanningView> =>
    (await apiClient.post(session(userId, sessionId, 'ready'), location ?? {})).data,

  unready: async (userId: number, sessionId: number): Promise<PlanningView> =>
    (await apiClient.post(session(userId, sessionId, 'unready'))).data,

  adjust: async (userId: number, sessionId: number): Promise<PlanningView> =>
    (await apiClient.post(session(userId, sessionId, 'adjust'))).data,

  more: async (userId: number, sessionId: number): Promise<PlanningView> =>
    (await apiClient.post(session(userId, sessionId, 'options/more'))).data,

  vote: async (userId: number, sessionId: number, recommendationId: number, vote: VoteValue): Promise<PlanningView> =>
    (await apiClient.post(session(userId, sessionId, `options/${recommendationId}/vote`), { vote })).data,

  propose: async (userId: number, sessionId: number, recommendationId: number): Promise<PlanningView> =>
    (await apiClient.post(session(userId, sessionId, `options/${recommendationId}/propose`))).data,

  withdraw: async (userId: number, sessionId: number): Promise<PlanningView> =>
    (await apiClient.post(session(userId, sessionId, 'proposal/withdraw'))).data,

  acceptProposal: async (userId: number, sessionId: number): Promise<PlanningView> =>
    (await apiClient.post(session(userId, sessionId, 'proposal/accept'))).data,

  rejectProposal: async (userId: number, sessionId: number): Promise<PlanningView> =>
    (await apiClient.post(session(userId, sessionId, 'proposal/reject'))).data,

  /** Al terminar sin acuerdo: manda la opcion que quedo como invitacion a la pareja. */
  inviteLeftover: async (userId: number, sessionId: number): Promise<PlanningView> =>
    (await apiClient.post(session(userId, sessionId, 'leftover/invite'))).data,

  messages: async (userId: number, sessionId: number): Promise<PlanningMessage[]> =>
    (await apiClient.get(session(userId, sessionId, 'messages'))).data,

  send: async (userId: number, sessionId: number, body: string): Promise<PlanningMessage[]> =>
    (await apiClient.post(session(userId, sessionId, 'messages'), { body })).data,
};

export default planningService;
export { planningService };
