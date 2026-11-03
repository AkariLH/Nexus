import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Href, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, ActivityIndicator, DeviceEventEmitter } from "react-native";
import { Card, GradientIcon, MetaLine, SectionLabel } from "../../components/ui/Surface";
import { findMutualAvailability } from "../../services/availabilityService";
import { freeSlotCount } from "../../utils/calendarLayout";
import { cleanWindows, FreeWindow, proposalsOf } from "../../utils/freeProposals";
import { planParams, reserveParams } from "../../utils/planFromWindow";
import { ProposalSheet } from "../../components/calendar/ProposalSheet";
import { FreeTogetherCard } from "../../components/home/FreeTogetherCard";
import { homeHighlight } from "../../components/home/homeHighlight";
import { linkedSubtitle, listLabel } from "../../utils/linkFormat";
import { GradientButton } from "../components/ui/GradientButton";
import { useAuth } from "../../context/AuthContext";
import { useQuestionnaireGuard } from "../../hooks/useQuestionnaireGuard";
import { useQuestionnaire } from "../../context/QuestionnaireContext";
import { takePendingLinkCode } from "../../utils/pendingLinkCode";
import eventService, { EventResponse } from "../../services/event.service";
import linkService from "../../services/link.service";
import { syncEventReminders } from "../../services/localReminders";
import { palette, gradients } from "../../constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loadTracked, nextNotice, Notice, settle } from "../../utils/inviteTracker";
import { costLabel, dayPhrase, placeLabel, slotLabel } from "../../utils/recommendationFormat";
import { ResultModal } from "../components/ResultModal";
import { PlanSummaryCard } from "../components/PlanSummaryCard";
import planningService, { PlanningView } from "../../services/planning.service";
import appNotificationService from "../../services/appNotification.service";
import ratingService from "../../services/rating.service";
import { markSeen, PlanningNotice, wasSeen } from "../../utils/planningSeen";
import { closedNotice, remainingLabel } from "../../utils/planningFormat";
import { NOTICES_EVENT } from "../../utils/pushRoute";
import { bellCount } from "../../utils/noticeFormat";

const OPEN_PHASES = ["INVITED", "FILTERS", "OPTIONS", "PROPOSAL"];

/** Aviso de la planeacion en pareja que Inicio debe mostrar (B1 de la pareja, B5, B8a, B8b). */
function planningNoticeOf(view: PlanningView): PlanningNotice | null {
  if (view.phase === "INVITED" && view.role === "PARTNER") return "INVITE";
  if (view.phase === "AGREED") return "AGREED";
  if (view.phase === "EXPIRED") return "EXPIRED";
  if (view.phase === "CLOSED") return "CLOSED";
  return null;
}

interface LinkStatus {
  hasActiveLink: boolean;
  partner?: {
    userId: number;
    displayName: string;
    nickname: string;
    linkedAt: string;
  };
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  useQuestionnaireGuard();
  const router = useRouter();
  const { user } = useAuth();
  // Figma D5: al terminar el cuestionario se llega aqui con ?questionnaire=done.
  // Figma H7: al vincularse se llega con ?linked=<nombre de la pareja>.
  const { questionnaire, linked } = useLocalSearchParams<{ questionnaire?: string; linked?: string }>();
  const [linkStatus, setLinkStatus] = useState<LinkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvites, setPendingInvites] = useState<EventResponse[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventResponse[]>([]);

  const fetchLinkStatus = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const data: LinkStatus = await linkService.getLinkStatus(user.userId);
      setLinkStatus(data);
    } catch (error) {
      console.error("Error al obtener estado del vínculo:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  const loadPendingCount = useCallback(async () => {
    if (!user?.userId) return;

    try {
      const pendingEvents = await eventService.getPendingApprovalEvents(user.userId);
      setPendingInvites(pendingEvents);
    } catch (error: any) {
      // Si hay error (por ejemplo, sin vínculo activo), establecer contador en 0
      setPendingInvites([]);
    }
  }, [user?.userId]);

  const loadUpcomingEvents = useCallback(async () => {
    if (!user?.userId || !linkStatus?.hasActiveLink) {
      setUpcomingEvents([]);
      return;
    }

    try {
      console.log('📅 Cargando próximos eventos...');
      const allEvents = await eventService.getUserEvents(user.userId);
      syncEventReminders(allEvents);

      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const upcoming = allEvents
        .filter(e => e.fullyApproved)
        .filter(e => {
          const start = new Date(e.startDateTime);
          return start >= now && start <= sevenDaysFromNow;
        })
        .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
        .slice(0, 5); // Limitar a 5 eventos
      
      console.log(`✅ ${upcoming.length} eventos próximos encontrados`);
      setUpcomingEvents(upcoming);
    } catch (error) {
      console.error('❌ Error cargando próximos eventos:', error);
      setUpcomingEvents([]);
    }
  }, [user?.userId, linkStatus?.hasActiveLink]);

  // RF-38: planeacion en pareja abierta o recien terminada, y el aviso que toca mostrar.
  const [planning, setPlanning] = useState<PlanningView | null>(null);
  const [planningNotice, setPlanningNotice] = useState<PlanningNotice | null>(null);
  const [unreadNotices, setUnreadNotices] = useState(0);

  const checkPlanning = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const [view, notices] = await Promise.all([
        planningService.current(user.userId),
        appNotificationService.list(user.userId),
      ]);
      setPlanning(view);
      setUnreadNotices(notices.unread);
      const notice = view ? planningNoticeOf(view) : null;
      setPlanningNotice(notice && view && !(await wasSeen(user.userId, view.id, notice)) ? notice : null);
    } catch {
      // Sin red o sin las tablas nuevas, Inicio sigue igual.
    }
  }, [user?.userId]);

  const closePlanningNotice = async (then?: () => void) => {
    if (planning && planningNotice && user?.userId) await markSeen(user.userId, planning.id, planningNotice);
    setPlanningNotice(null);
    then?.();
  };

  const planTogether = async () => {
    if (!user?.userId) return;
    try {
      await planningService.invite(user.userId);
    } catch {
      // Si ya hay una abierta, se abre esa.
    }
    router.push("/(planning)/session");
  };

  // A7-A9: aviso de una invitacion enviada desde una recomendacion (enviada, aceptada o rechazada).
  const [inviteNotice, setInviteNotice] = useState<Notice | null>(null);

  const checkInviteNotice = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const tracked = await loadTracked(user.userId);
      if (tracked.length === 0) return;
      const needsEvents = tracked.some((t) => t.stage === 'waiting');
      const events = needsEvents ? await eventService.getUserEvents(user.userId) : [];
      const notice = nextNotice(tracked, events);
      if (notice?.kind === 'gone') {
        await settle(user.userId, notice.invite.eventId, 'gone');
        return;
      }
      setInviteNotice(notice);
    } catch {
      // Sin red el aviso espera a la siguiente vez que se abra Inicio.
    }
  }, [user?.userId]);

  const closeInviteNotice = async (then?: () => void) => {
    const notice = inviteNotice;
    setInviteNotice(null);
    if (notice && user?.userId) {
      await settle(user.userId, notice.invite.eventId, notice.kind);
    }
    then?.();
  };

  // CU42: citas que aun se pueden calificar (48 h despues de terminar).
  const [ratingsDue, setRatingsDue] = useState(0);

  const checkRatings = useCallback(async () => {
    if (!user?.userId) return;
    try {
      setRatingsDue((await ratingService.pending(user.userId)).length);
    } catch {
      // Sin red o sin la tabla nueva, Inicio sigue igual.
      setRatingsDue(0);
    }
  }, [user?.userId]);

  // Verificar cada vez que el tab obtiene foco
  useFocusEffect(
    useCallback(() => {
      console.log('📍 Tab de inicio enfocado - verificando estado...');
      fetchLinkStatus();
      loadPendingCount();
      loadUpcomingEvents();
      checkInviteNotice();
      checkPlanning();
      checkRatings();
    }, [fetchLinkStatus, loadPendingCount, loadUpcomingEvents, checkInviteNotice, checkPlanning, checkRatings])
  );

  // [push-avisos] Llegó una push con la app abierta: la campanita sube sin salir de Inicio.
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(NOTICES_EVENT, () => {
      loadPendingCount();
      checkPlanning();
    });
    return () => subscription.remove();
  }, [loadPendingCount, checkPlanning]);

  // QR de vínculo escaneado sin sesión: ya con el cuestionario hecho y sin pareja, se abre
  // "Escribir el código" con el código puesto; si pasaron 15 min (RN-09), se avisa que venció.
  const { isCompleted: questionnaireDone, isLoading: questionnaireLoading } = useQuestionnaire();
  const [expiredScan, setExpiredScan] = useState(false);
  useEffect(() => {
    if (!linkStatus || questionnaireLoading || questionnaireDone !== true) return;
    takePendingLinkCode().then((pending) => {
      if (!pending || linkStatus.hasActiveLink) return;
      if (pending.expired) setExpiredScan(true);
      else router.push({ pathname: "/(link)/enter-link-code", params: { code: pending.code } });
    });
  }, [linkStatus, questionnaireDone, questionnaireLoading]);

  const isLinked = linkStatus?.hasActiveLink || false;
  const partnerName = linkStatus?.partner?.displayName || linkStatus?.partner?.nickname || "";
  const partnerLabel = partnerName || "Tu pareja";
  const invite = inviteNotice?.invite;
  const now = new Date();
  const inviteCard = invite && (
    <PlanSummaryCard
      title={invite.title}
      when={slotLabel(invite.startsAt, invite.endsAt, now)}
      place={invite.place}
      cost={costLabel(invite.costPerPersonMxn)}
      pendingLabel={inviteNotice?.kind === 'sent' ? `Pendiente de ${partnerLabel}` : undefined}
    />
  );

  // B8b: la opcion que quedo al vencer la planeacion (propuesta sin responder o coincidencia).
  const leftover = planningNotice === "CLOSED" ? planning?.leftover?.option ?? null : null;
  const closed = planning && planningNotice === "CLOSED"
    ? closedNotice(
        planning.leftover ? { kind: planning.leftover.kind, startsAt: planning.leftover.option.item.startsAt } : null,
        planning.partner.name,
        now,
      )
    : null;
  const [sendingLeftover, setSendingLeftover] = useState(false);
  const [leftoverError, setLeftoverError] = useState<string | null>(null);

  const sendLeftover = async () => {
    if (!user?.userId || !planning) return;
    setSendingLeftover(true);
    setLeftoverError(null);
    try {
      await planningService.inviteLeftover(user.userId, planning.id);
      closePlanningNotice(() => router.push("/(events)/my-events"));
    } catch (error: any) {
      setLeftoverError(error?.response?.data?.message ?? "No se pudo enviar. Inténtalo de nuevo.");
    } finally {
      setSendingLeftover(false);
    }
  };

  // H7: cuantos horarios libres tienen los dos esta semana (si no se puede saber, no se dice).
  const [freeCount, setFreeCount] = useState<number | null>(null);
  // [libres-juntos] Figma K1: las propuestas de la semana (null = no se pudo saber).
  const [proposals, setProposals] = useState<FreeWindow[] | null>(null);
  const [picked, setPicked] = useState<FreeWindow | null>(null);
  const partnerId = linkStatus?.partner?.userId;
  useEffect(() => {
    if (!user?.userId || !partnerId) return;
    let alive = true;
    findMutualAvailability(user.userId, partnerId, 7)
      .then((mutual) => {
        if (!alive) return;
        const now = new Date();
        setFreeCount(freeSlotCount(mutual, now));
        setProposals(proposalsOf(cleanWindows(mutual.mutualAvailability ?? [], now)));
      })
      .catch(() => {
        if (!alive) return;
        setFreeCount(null);
        setProposals(null);
      });
    return () => {
      alive = false;
    };
  }, [linked, user?.userId, partnerId]);
  const highlight = isLinked ? homeHighlight(upcomingEvents, proposals, new Date()) : null;

  // El nombre se guarda para que el modal no quede sin el mientras se desvanece al cerrarse.
  const [linkedName, setLinkedName] = useState("");
  useEffect(() => {
    if (linked) setLinkedName(linked);
  }, [linked]);

  const closeLinked = (then?: () => void) => {
    router.setParams({ linked: undefined });
    then?.();
  };

  // D5 -> H6: si al terminar el cuestionario todavia no hay vinculo, se ofrece conectar.
  const finishQuestionnaire = () => {
    router.setParams({ questionnaire: undefined });
    if (linkStatus && !linkStatus.hasActiveLink) router.push("/(link)/connect");
  };

  const displayName = user?.displayName || user?.nickname || "Usuario";
  // [ux-ajustes] D1: las invitaciones que ya pasaron no cuentan.
  const badgeCount = bellCount(pendingInvites, unreadNotices, now);
  const quickActions: { icon: keyof typeof Ionicons.glyphMap; label: string; route: Href; needsLink: boolean }[] = [
    { icon: "list-outline", label: "Mis eventos", route: "/(events)/my-events", needsLink: true },
    { icon: "add", label: "Crear evento", route: "/(events)/create-event", needsLink: true },
    { icon: "happy-outline", label: "¿Cómo estuvo tu día?", route: "/(mood)/mood-log", needsLink: false },
    { icon: "bulb-outline", label: "Banco de ideas", route: "/(ideas)/idea-bank", needsLink: true },
  ];
  const lockedLabels = isLinked ? [] : quickActions.filter((q) => q.needsLink).map((q) => q.label);

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Hola, {displayName}</Text>
          <Text style={styles.subtitle}>{isLinked ? `Conectado con ${partnerName}` : "Te damos la bienvenida"}</Text>
        </View>
        <TouchableOpacity
          style={styles.bell}
          onPress={() => router.push("/(events)/notifications")}
          accessibilityRole="button"
          accessibilityLabel="Notificaciones"
        >
          <Ionicons name="notifications-outline" size={24} color={palette.text} />
          {badgeCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badgeCount > 9 ? "9+" : badgeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : (
        <>
          {/* [libres-juntos] Figma K1: lo primero es cuando se ven */}
          {highlight && (
            <FreeTogetherCard
              highlight={highlight}
              onOpenProposal={setPicked}
              onSeeMore={() => router.push({ pathname: "/(tabs)/calendario", params: { freeTogether: "1" } })}
              onOpenEvent={() => router.push("/(tabs)/calendario")}
            />
          )}

          {/* RF-37: entrada principal para pedir una recomendacion */}
          {isLinked && (
            <TouchableOpacity
              onPress={() => router.push("/(recommend)/mode")}
              activeOpacity={0.9}
              accessibilityRole="button"
              style={styles.heroWrap}
            >
              <LinearGradient colors={gradients.onTextReversed} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.hero}>
                <View style={styles.heroIcon}>
                  <Ionicons name="sparkles-outline" size={24} color={palette.onPrimary} />
                </View>
                <View style={styles.heroText}>
                  <Text style={styles.heroTitle}>Pedir recomendación</Text>
                  <Text style={styles.heroSubtitle}>Nexus les sugiere planes para su próxima cita.</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color={palette.onPrimary} />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* CU42: hay citas por calificar (no esta en Figma; mismo estilo que la planeacion) */}
          {isLinked && ratingsDue > 0 && (
            <TouchableOpacity
              style={styles.planningBanner}
              onPress={() => router.push("/(rating)/pending-ratings")}
              accessibilityRole="button"
            >
              <GradientIcon name="happy-outline" />
              <View style={styles.planningText}>
                <Text style={styles.planningTitle}>Califica tu cita</Text>
                <Text style={styles.planningSubtitle}>
                  {ratingsDue === 1 ? "Tienes 1 cita por calificar" : `Tienes ${ratingsDue} citas por calificar`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.icon} />
            </TouchableOpacity>
          )}

          {/* Volver a una planeacion en pareja abierta (se puede salir y volver sin perder nada) */}
          {planning && OPEN_PHASES.includes(planning.phase) && planningNotice !== "INVITE" && (
            <TouchableOpacity
              style={styles.planningBanner}
              onPress={() => router.push("/(planning)/session")}
              accessibilityRole="button"
            >
              <GradientIcon name="people-outline" />
              <View style={styles.planningText}>
                <Text style={styles.planningTitle}>Planeación con {planning.partner.name}</Text>
                <Text style={styles.planningSubtitle}>
                  {planning.phase === "INVITED"
                    ? `Esperando a que ${planning.partner.name} se una`
                    : `Quedan ${remainingLabel(planning.sessionExpiresAt, now)} para decidir`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.icon} />
            </TouchableOpacity>
          )}

          {/* H8: sin vinculo, lo primero es conectar */}
          {!isLinked && (
            <View style={styles.connectCard}>
              <View style={styles.connectHead}>
                <GradientIcon name="people-outline" />
                <View style={styles.connectText}>
                  <Text style={styles.connectTitle}>Conecta con tu pareja para empezar</Text>
                  <Text style={styles.connectSubtitle}>
                    El calendario, las ideas y las citas se comparten entre los dos.
                  </Text>
                </View>
              </View>
              <GradientButton compact title="Invitar a mi pareja" onPress={() => router.push("/(link)/my-link-code")} />
              <TouchableOpacity
                style={styles.connectSecondary}
                onPress={() => router.push("/(link)/enter-link-code")}
                accessibilityRole="button"
              >
                <Text style={styles.connectSecondaryText}>Mi pareja me invitó</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <SectionLabel>Accesos rápidos</SectionLabel>
            <View style={styles.grid}>
              {quickActions.map((q) => {
                const locked = q.needsLink && !isLinked;
                return (
                  <TouchableOpacity
                    key={q.label}
                    style={[styles.quick, locked && styles.quickLocked]}
                    onPress={() => router.push(q.route)}
                    disabled={locked}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: locked }}
                  >
                    <GradientIcon name={q.icon} />
                    <Text style={[styles.quickLabel, locked && styles.quickLabelLocked]}>{q.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {lockedLabels.length > 0 && (
              <Text style={styles.lockedNote}>{listLabel(lockedLabels)} se abren al vincularse.</Text>
            )}
          </View>

          {isLinked && upcomingEvents.length > 0 && (
            <View style={styles.section}>
              <SectionLabel>Próximos eventos</SectionLabel>
              {upcomingEvents.map((event, index) => {
                const start = new Date(event.startDateTime);
                const end = new Date(event.endDateTime);
                const time = (d: Date) => d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
                return (
                  <TouchableOpacity
                    key={`${event.id}-${index}`}
                    onPress={() => router.push("/(tabs)/calendario")}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                  >
                    <Card style={styles.eventCard}>
                      <View style={styles.dateBadge}>
                        <Text style={styles.dateSmall}>
                          {start.toLocaleDateString("es-MX", { weekday: "short" }).replace(".", "").toUpperCase()}
                        </Text>
                        <Text style={styles.dateNumber}>{start.getDate()}</Text>
                        <Text style={styles.dateSmall}>
                          {start.toLocaleDateString("es-MX", { month: "short" }).replace(".", "").toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.eventInfo}>
                        <Text style={styles.eventTitle} numberOfLines={2}>{event.title}</Text>
                        <MetaLine icon="time-outline" text={`${time(start)} – ${time(end)}`} />
                        {event.location ? <MetaLine icon="location-outline" text={event.location} /> : null}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={palette.icon} />
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </>
      )}

      <ResultModal
        visible={expiredScan}
        icon="time-outline"
        tone="warning"
        title="La invitación venció"
        subtitle="Las invitaciones duran 15 minutos. Pídele a tu pareja una nueva."
        primary={{ label: 'Unirme a mi pareja', onPress: () => { setExpiredScan(false); router.push('/(link)/enter-link-code'); } }}
        secondary={{ label: 'Cerrar', onPress: () => setExpiredScan(false) }}
        onRequestClose={() => setExpiredScan(false)}
      />

      <ResultModal
        visible={inviteNotice?.kind === 'sent'}
        icon="send-outline"
        title="Invitación enviada"
        subtitle={`Te avisaremos cuando ${partnerLabel} responda.`}
        primary={{ label: 'Ver mis eventos', onPress: () => closeInviteNotice(() => router.push('/(events)/my-events')) }}
        secondary={{ label: 'Cerrar', onPress: () => closeInviteNotice() }}
        onRequestClose={() => closeInviteNotice()}
      >
        {inviteCard}
      </ResultModal>

      <ResultModal
        visible={inviteNotice?.kind === 'accepted'}
        icon="heart-outline"
        title={`¡${partnerLabel} aceptó!`}
        subtitle={invite ? `Ya tienen cita ${dayPhrase(invite.startsAt, now)}.` : undefined}
        note="La cita ya está en el calendario de los dos."
        primary={{ label: 'Ver en el calendario', onPress: () => closeInviteNotice(() => router.push('/(tabs)/calendario')) }}
        onRequestClose={() => closeInviteNotice()}
      >
        {inviteCard}
      </ResultModal>

      <ResultModal
        visible={inviteNotice?.kind === 'rejected'}
        icon="close"
        tone="danger"
        title={`${partnerLabel} rechazó la invitación`}
        subtitle="Pueden buscar otra opción o planearla juntos."
        primary={{
          label: 'Buscar otra recomendación',
          onPress: () => closeInviteNotice(() => router.push('/(recommend)/request')),
        }}
        secondary={{ label: 'Planear juntos', onPress: () => closeInviteNotice(planTogether) }}
        onRequestClose={() => closeInviteNotice()}
      />

      {/* B1 (vista de la pareja): invitacion a planear juntos */}
      <ResultModal
        visible={planningNotice === 'INVITE'}
        icon="people-outline"
        title={`${planning?.partner.name ?? partnerLabel} te invita a planear una cita`}
        subtitle="Elijan juntos los detalles y Nexus les sugerirá planes."
        badge={planning ? `La invitación vence en ${remainingLabel(planning.inviteExpiresAt, now)}` : undefined}
        primary={{
          label: 'Unirme',
          onPress: () =>
            closePlanningNotice(async () => {
              if (user?.userId && planning) await planningService.accept(user.userId, planning.id).catch(() => null);
              router.push('/(planning)/session');
            }),
        }}
        secondary={{ label: 'Ahora no', onPress: () => closePlanningNotice() }}
        onRequestClose={() => closePlanningNotice()}
      />

      {/* B5: cita confirmada, si no se vio dentro de la planeacion */}
      <ResultModal
        visible={planningNotice === 'AGREED'}
        icon="heart-outline"
        title="¡Cita confirmada!"
        subtitle={planning?.agreed ? `Ya tienen cita ${dayPhrase(planning.agreed.item.startsAt, now)}.` : undefined}
        note="La cita ya está en el calendario de los dos."
        primary={{ label: 'Ver en el calendario', onPress: () => closePlanningNotice(() => router.push('/(tabs)/calendario')) }}
        secondary={{ label: 'Cerrar', onPress: () => closePlanningNotice() }}
        onRequestClose={() => closePlanningNotice()}
      >
        {planning?.agreed && (
          <PlanSummaryCard
            title={planning.agreed.item.title}
            when={slotLabel(planning.agreed.item.startsAt, planning.agreed.item.endsAt, now)}
            place={placeLabel(planning.agreed.item)}
            cost={costLabel(planning.agreed.item.costPerPersonMxn)}
          />
        )}
      </ResultModal>

      {/* D5: cuestionario completado */}
      <ResultModal
        visible={questionnaire === 'done'}
        icon="checkmark-circle-outline"
        animateIcon
        title="¡Listo!"
        subtitle="Ya conocemos tus gustos."
        primary={{ label: 'Continuar', onPress: finishQuestionnaire }}
        onRequestClose={finishQuestionnaire}
      />

      {/* H7: recien vinculados */}
      <ResultModal
        visible={!!linked && !questionnaire}
        header={<LinkedAvatars me={displayName} partner={linkedName} />}
        title="¡Ya están vinculados!"
        subtitle={linkedSubtitle(displayName, linkedName, freeCount)}
        primary={{
          label: 'Ver horarios libres juntos',
          onPress: () => closeLinked(() => router.push({ pathname: '/(tabs)/calendario', params: { freeTogether: '1' } })),
        }}
        secondary={{ label: 'Ir al inicio', onPress: () => closeLinked() }}
        onRequestClose={() => closeLinked()}
      />

      {/* B8a: la invitacion vencio */}
      <ResultModal
        visible={planningNotice === 'EXPIRED'}
        icon="hourglass-outline"
        tone="warning"
        title={planning?.role === 'INVITER'
          ? `${planning.partner.name} no aceptó a tiempo`
          : `La invitación de ${planning?.partner.name ?? partnerLabel} venció`}
        subtitle={planning?.role === 'INVITER' ? 'La invitación venció.' : undefined}
        primary={planning?.role === 'INVITER'
          ? { label: 'Planear de forma individual', onPress: () => closePlanningNotice(() => router.push('/(recommend)/request')) }
          : { label: 'Cerrar', onPress: () => closePlanningNotice() }}
        secondary={planning?.role === 'INVITER'
          ? { label: 'Invitar de nuevo', onPress: () => closePlanningNotice(planTogether) }
          : undefined}
        onRequestClose={() => closePlanningNotice()}
      />

      {/* B8b: se acabaron las 12 horas. Si quedo una propuesta o una coincidencia, no se pierde:
          se puede mandar como invitacion o volver a planear. */}
      <ResultModal
        visible={planningNotice === 'CLOSED'}
        icon="hourglass-outline"
        tone="warning"
        title="Se les fue el tiempo"
        subtitle={closed?.subtitle}
        note={leftoverError ?? closed?.note}
        primary={closed?.canInvite
          ? { label: 'Enviar como invitación', onPress: sendLeftover, loading: sendingLeftover }
          : { label: 'Planear de nuevo', onPress: () => closePlanningNotice(planTogether) }}
        secondary={closed?.canInvite
          ? { label: 'Planear de nuevo', onPress: () => closePlanningNotice(planTogether) }
          : { label: 'Cerrar', onPress: () => closePlanningNotice() }}
        onRequestClose={() => closePlanningNotice()}
      >
        {leftover && (
          <PlanSummaryCard
            title={leftover.item.title}
            when={slotLabel(leftover.item.startsAt, leftover.item.endsAt, now)}
            place={placeLabel(leftover.item)}
            cost={costLabel(leftover.item.costPerPersonMxn)}
          />
        )}
      </ResultModal>

      {/* [libres-juntos] Figma K3 */}
      <ProposalSheet
        visible={picked !== null}
        window={picked}
        onPlan={() => {
          const w = picked;
          setPicked(null);
          if (w) router.push({ pathname: "/(recommend)/mode", params: planParams(w) });
        }}
        onReserve={() => {
          const w = picked;
          setPicked(null);
          if (w) router.push({ pathname: "/(events)/create-event", params: reserveParams(w) });
        }}
        onClose={() => setPicked(null)}
      />
    </ScrollView>
  );
}

/** H7: los dos avatares con el corazon en medio. */
function LinkedAvatars({ me, partner }: { me: string; partner: string }) {
  const avatar = (name: string) => (
    <View>
      <LinearGradient colors={gradients.onText} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
        <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
      </LinearGradient>
      <View style={styles.avatarDot} />
    </View>
  );
  return (
    <View style={styles.avatars} accessible accessibilityLabel={`${me} y ${partner}`}>
      {avatar(me)}
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarHeart}>
        <Ionicons name="heart-outline" size={18} color={palette.onPrimary} />
      </LinearGradient>
      {avatar(partner)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 24 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerText: { flex: 1, gap: 4 },
  greeting: { fontSize: 24, fontWeight: "700", color: palette.text },
  subtitle: { fontSize: 14, color: palette.textSecondary },
  bell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.surface,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: palette.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: palette.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: palette.onPrimary },
  loadingContainer: { paddingVertical: 48, alignItems: "center" },
  heroWrap: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: palette.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  hero: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 18 },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: palette.onPrimaryFaint,
    justifyContent: "center",
    alignItems: "center",
  },
  heroText: { flex: 1, gap: 4 },
  heroTitle: { fontSize: 16, fontWeight: "700", color: palette.onPrimary },
  heroSubtitle: { fontSize: 14, color: palette.onPrimarySoft },
  planningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.primaryBorder,
    backgroundColor: palette.primarySoft,
  },
  planningText: { flex: 1, gap: 2 },
  planningTitle: { fontSize: 15, fontWeight: "600", color: palette.text },
  planningSubtitle: { fontSize: 12, color: palette.textSecondary },
  section: { gap: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quick: {
    width: "47.5%",
    minHeight: 120,
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: palette.surface,
    shadowColor: palette.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  quickLocked: { opacity: 0.55 },
  quickLabel: { fontSize: 14, fontWeight: "500", color: palette.text },
  quickLabelLocked: { color: palette.textSecondary },
  lockedNote: { fontSize: 12, lineHeight: 17, color: palette.textSecondary },
  connectCard: {
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.primaryBorder,
    backgroundColor: palette.primarySoft,
  },
  connectHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  connectText: { flex: 1, gap: 2 },
  connectTitle: { fontSize: 15, fontWeight: "700", color: palette.text },
  connectSubtitle: { fontSize: 13, lineHeight: 18, color: palette.textSecondary },
  connectSecondary: {
    height: 44,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    backgroundColor: palette.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  connectSecondaryText: { fontSize: 15, fontWeight: "700", color: palette.textAccent },
  avatars: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 20, fontWeight: "700", color: palette.onPrimary },
  avatarDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: palette.surface,
    backgroundColor: palette.success,
  },
  avatarHeart: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  eventCard: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingLeft: 12 },
  dateBadge: {
    width: 52,
    height: 60,
    borderRadius: 12,
    backgroundColor: palette.secondarySoft,
    justifyContent: "center",
    alignItems: "center",
  },
  dateSmall: { fontSize: 11, fontWeight: "600", color: palette.textAccent },
  dateNumber: { fontSize: 20, fontWeight: "700", color: palette.textAccent },
  eventInfo: { flex: 1, gap: 4 },
  eventTitle: { fontSize: 15, fontWeight: "500", color: palette.text },
});
