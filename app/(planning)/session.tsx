import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FiltersView } from "../../components/planning/FiltersView";
import { OptionsView } from "../../components/planning/OptionsView";
import { ProposalView } from "../../components/planning/ProposalView";
import { WaitingView } from "../../components/planning/WaitingView";
import { palette } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { usePlanningSession } from "../../hooks/usePlanningSession";
import planningService, { PlanningView } from "../../services/planning.service";
import { markSeen, wasSeen } from "../../utils/planningSeen";
import { remainingLabel } from "../../utils/planningFormat";
import { costLabel, placeLabel, slotLabel } from "../../utils/recommendationFormat";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { PlanSummaryCard } from "../components/PlanSummaryCard";
import { ResultModal } from "../components/ResultModal";

const TITLES: Record<string, string> = {
  INVITED: "Planear en pareja",
  FILTERS: "Planear en pareja",
  OPTIONS: "Opciones para los dos",
  PROPOSAL: "Propuesta de cita",
};

/**
 * RF-38 / RF-39 - Planeacion en pareja (Figma B1-B5, B7). Una sola pantalla que cambia segun la
 * fase; la pareja ve los cambios en unos segundos. Se puede salir y volver sin perder nada.
 */
export default function PlanningSessionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { view, loading, act } = usePlanningSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedNotice, setAgreedNotice] = useState<{ view: PlanningView; byMe: boolean } | null>(null);
  const [adjustNotice, setAdjustNotice] = useState(false);
  const proposalByMe = useRef<boolean | null>(null);
  const now = new Date();

  // Recuerda quien propuso, para el texto de "¡Cita confirmada!" cuando llegue el acuerdo.
  useEffect(() => {
    if (view?.proposal) proposalByMe.current = view.proposal.byMe;
  }, [view?.proposal]);

  useEffect(() => {
    if (!view || !user?.userId) return;
    if (view.phase === "AGREED") {
      wasSeen(user.userId, view.id, "AGREED").then((seen) => {
        if (!seen) setAgreedNotice({ view, byMe: proposalByMe.current ?? false });
      });
    } else if (!["INVITED", "FILTERS", "OPTIONS", "PROPOSAL"].includes(view.phase)) {
      router.replace("/(tabs)");
    }
    if (view.phase === "FILTERS" && view.adjustingByPartner) {
      wasSeen(user.userId, view.id, "ADJUSTING").then((seen) => setAdjustNotice(!seen));
    }
  }, [view, user?.userId, router]);

  useEffect(() => {
    if (!loading && !view) router.replace("/(tabs)");
  }, [loading, view, router]);

  const run = async (action: Parameters<typeof act>[0]) => {
    setBusy(true);
    try {
      await act(action);
    } catch (e: any) {
      setError(e?.message || "No se pudo completar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const ready = async () => {
    if (view?.filters?.zoneType !== "NEAR_US") {
      await run((u, s) => planningService.ready(u, s));
      return;
    }
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setError("Comparte tu ubicación o elijan una alcaldía.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await run((u, s) =>
        planningService.ready(u, s, { lat: position.coords.latitude, lon: position.coords.longitude }),
      );
    } catch {
      setError("No pudimos obtener tu ubicación. Pueden elegir una alcaldía.");
    }
  };

  const closeAgreed = async (then: () => void) => {
    if (agreedNotice && user?.userId) await markSeen(user.userId, agreedNotice.view.id, "AGREED");
    setAgreedNotice(null);
    then();
  };

  const openChat = () =>
    view &&
    router.push({
      pathname: "/(planning)/chat",
      params: { sessionId: String(view.id), expiresAt: view.sessionExpiresAt ?? "", partner: view.partner.name },
    });

  if (loading || !view) {
    return (
      <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
        <ScreenHeader title="Planear en pareja" onBack={() => router.back()} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const agreed = agreedNotice?.view.agreed?.item;
  const partner = view.partner.name;

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScreenHeader title={TITLES[view.phase] ?? "Planear en pareja"} onBack={() => router.back()} />

      {view.phase === "INVITED" && view.role === "INVITER" && (
        <WaitingView
          view={view}
          now={now}
          busy={busy}
          onCancel={() => run((u, s) => planningService.cancel(u, s))}
          onPlanAlone={async () => {
            await run((u, s) => planningService.cancel(u, s));
            router.replace("/(recommend)/request");
          }}
        />
      )}

      {view.phase === "FILTERS" && (
        <FiltersView
          view={view}
          now={now}
          busy={busy}
          onChange={(filters) => run((u, s) => planningService.updateFilters(u, s, filters))}
          onReady={ready}
          onUnready={() => run((u, s) => planningService.unready(u, s))}
          onOpenChat={openChat}
        />
      )}

      {view.phase === "OPTIONS" && (
        <OptionsView
          view={view}
          now={now}
          busy={busy}
          onVote={(id, vote) => run((u, s) => planningService.vote(u, s, id, vote))}
          onPropose={(id) => run((u, s) => planningService.propose(u, s, id))}
          onMore={() => run((u, s) => planningService.more(u, s))}
          onAdjust={() => run((u, s) => planningService.adjust(u, s))}
          onOpenChat={openChat}
        />
      )}

      {view.phase === "PROPOSAL" && (
        <ProposalView
          view={view}
          now={now}
          busy={busy}
          onWithdraw={() => run((u, s) => planningService.withdraw(u, s))}
          onAccept={() => run((u, s) => planningService.acceptProposal(u, s))}
          onKeepLooking={() => run((u, s) => planningService.rejectProposal(u, s))}
          onOpenChat={openChat}
        />
      )}

      <ResultModal
        visible={view.phase === "INVITED" && view.role === "PARTNER"}
        icon="people-outline"
        title={`${partner} te invita a planear una cita`}
        subtitle="Elijan juntos los detalles y Nexus les sugerirá planes."
        badge={`La invitación vence en ${remainingLabel(view.inviteExpiresAt, now)}`}
        primary={{ label: "Unirme", onPress: () => run((u, s) => planningService.accept(u, s)), loading: busy }}
        secondary={{ label: "Ahora no", onPress: () => router.replace("/(tabs)") }}
        onRequestClose={() => router.replace("/(tabs)")}
      />

      <ResultModal
        visible={adjustNotice}
        icon="refresh-outline"
        tone="soft"
        title="¿Quieren ver más opciones?"
        subtitle={`${partner} está ajustando los filtros.`}
        primary={{
          label: "Ver filtros",
          onPress: async () => {
            if (user?.userId) await markSeen(user.userId, view.id, "ADJUSTING");
            setAdjustNotice(false);
          },
        }}
        onRequestClose={() => setAdjustNotice(false)}
      />

      <ResultModal
        visible={agreedNotice !== null}
        icon="heart-outline"
        title="¡Cita confirmada!"
        subtitle={agreedNotice?.byMe ? `${partner} aceptó tu propuesta.` : `Aceptaste la propuesta de ${partner}.`}
        note="La cita ya está en el calendario de los dos."
        primary={{ label: "Ver en el calendario", onPress: () => closeAgreed(() => router.replace("/(tabs)/calendario")) }}
        secondary={{ label: "Cerrar", onPress: () => closeAgreed(() => router.replace("/(tabs)")) }}
        onRequestClose={() => closeAgreed(() => router.replace("/(tabs)"))}
      >
        {agreed && (
          <PlanSummaryCard
            title={agreed.title}
            when={slotLabel(agreed.startsAt, agreed.endsAt, now)}
            place={placeLabel(agreed)}
            cost={costLabel(agreed.costPerPersonMxn)}
          />
        )}
      </ResultModal>

      <ResultModal
        visible={error !== null}
        icon="alert-circle-outline"
        tone="warning"
        title="No se pudo completar"
        subtitle={error ?? undefined}
        primary={{ label: "Entendido", onPress: () => setError(null) }}
        onRequestClose={() => setError(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
