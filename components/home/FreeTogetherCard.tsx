import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../../constants/colors';
import type { EventResponse } from '../../services/event.service';
import { detailWhen } from '../../utils/eventDetailFormat';
import { FreeWindow, proposalLabel } from '../../utils/freeProposals';
import { ProposalCard } from '../calendar/ProposalCard';
import { SectionLabel } from '../ui/Surface';
import type { HomeHighlight } from './homeHighlight';

interface FreeTogetherCardProps {
  highlight: HomeHighlight;
  onOpenProposal: (window: FreeWindow) => void;
  onSeeMore: () => void;
  onOpenEvent: (event: EventResponse) => void;
}

/**
 * [libres-juntos] Figma K1 - Lo primero en Inicio: «Su próxima cita» (K1b), la mejor propuesta (K1)
 * o el aviso de que esta semana no coinciden (K1c).
 */
export function FreeTogetherCard({ highlight, onOpenProposal, onSeeMore, onOpenEvent }: FreeTogetherCardProps) {
  const seeMore = (label: string) => (
    <TouchableOpacity onPress={onSeeMore} accessibilityRole="button" style={styles.more}>
      <Text style={styles.moreText}>{label}</Text>
    </TouchableOpacity>
  );

  if (highlight.kind === 'date') {
    const { event } = highlight;
    const when = detailWhen(new Date(event.startDateTime), new Date(event.endDateTime), false);
    return (
      <View style={styles.section}>
        <SectionLabel>Su próxima cita</SectionLabel>
        <ProposalCard
          icon="calendar-outline"
          title={event.title}
          subtitle={event.location ? `${when} · ${event.location}` : when}
          onPress={() => onOpenEvent(event)}
        />
        {seeMore('Ver más horarios libres')}
      </View>
    );
  }

  if (highlight.kind === 'proposal') {
    const w = highlight.window;
    const { when, length } = proposalLabel(w, new Date());
    return (
      <View style={styles.section}>
        <SectionLabel>Libres juntos</SectionLabel>
        <ProposalCard
          title={when}
          subtitle={`${w.start} – ${w.end} · ${length}`}
          accessibilityLabel={`${when}, de ${w.start} a ${w.end}, ${length}`}
          onPress={() => onOpenProposal(w)}
        />
        {seeMore('Ver más horarios')}
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <SectionLabel>Libres juntos</SectionLabel>
      <ProposalCard title="Esta semana sus horarios no coinciden" subtitle="Les avisamos cuando tengan tiempo para los dos." />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  more: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  moreText: { fontSize: 14, fontWeight: '600', color: palette.textAccent },
});
