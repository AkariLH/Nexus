import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OptionChip } from '../components/ui/OptionChip';
import { Card, MetaLine, Pill } from '../../components/ui/Surface';
import { useAuth } from '../../context/AuthContext';
import { ideaService, IdeaCategory, IdeaResponse } from '../../services/idea.service';
import { formatDuration, priceLabel, proposalParams } from '../../utils/ideaFormat';
import { costLabel } from '../../utils/recommendationFormat';
import { palette } from '../../constants/colors';
import { ScreenHeader } from '../components/layout/ScreenHeader';

/**
 * RF-34 - Banco de ideas de citas, por dimension del bienestar. RF-35 - "Proponer a mi pareja" prellena
 * Crear evento; la aprobacion es la de siempre (RF-30). RN-29: sin vinculo el backend responde 403.
 */

type LoadState = 'loading' | 'ready' | 'error' | 'no-link';

export default function IdeaBankScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [categories, setCategories] = useState<IdeaCategory[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<IdeaResponse[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    ideaService
      .getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const loadIdeas = useCallback(async () => {
    if (!user) return;
    try {
      setIdeas(await ideaService.getIdeas(user.userId, category ?? undefined));
      setState('ready');
    } catch (error: any) {
      setState(error?.status === 403 ? 'no-link' : 'error');
    }
  }, [user, category]);

  useEffect(() => {
    setState('loading');
    loadIdeas();
  }, [loadIdeas]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIdeas();
    setRefreshing(false);
  };

  const propose = (idea: IdeaResponse) => {
    router.push({ pathname: '/(events)/create-event', params: proposalParams(idea) });
  };

  const header = <ScreenHeader title="Banco de ideas" onBack={() => router.back()} />;

  const listHeader = (
    <View style={styles.listHeader}>
      <Text style={styles.subtitle}>Encuentren su próxima cita y propónganla en un toque.</Text>
      <View style={styles.chips}>
        {[{ code: null as string | null, label: 'Todas' }, ...categories].map((c) => (
          <OptionChip key={c.code ?? 'ALL'} label={c.label} selected={category === c.code} onPress={() => setCategory(c.code)} />
        ))}
      </View>
    </View>
  );

  if (state === 'no-link') {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.centered}>
          <View style={styles.stateIcon}>
            <Ionicons name="link-outline" size={44} color={palette.icon} />
          </View>
          <Text style={styles.stateTitle}>Primero vincúlate con tu pareja</Text>
          <Text style={styles.stateSubtitle}>El banco de ideas es para planear juntos, así que necesita un vínculo activo.</Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/(tabs)/link')}>
            <Text style={styles.secondaryButtonText}>Ir a Vínculo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {header}
      <FlatList
        data={state === 'ready' ? ideas : []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          state === 'loading' ? (
            <View style={styles.listState}>
              <ActivityIndicator size="large" color={palette.primary} />
            </View>
          ) : state === 'error' ? (
            <View style={styles.listState}>
              <View style={styles.stateIcon}>
                <Ionicons name="cloud-offline-outline" size={44} color={palette.icon} />
              </View>
              <Text style={styles.stateTitle}>No pudimos cargar las ideas</Text>
              <Text style={styles.stateSubtitle}>Revisa tu conexión e inténtalo de nuevo.</Text>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setState('loading');
                  loadIdeas();
                }}
              >
                <Text style={styles.secondaryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.listState}>
              <Text style={styles.stateTitle}>Aún no hay ideas aquí</Text>
              <Text style={styles.stateSubtitle}>Prueben con otra categoría.</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const cost = item.costPerPersonMxn != null ? costLabel(item.costPerPersonMxn) : priceLabel(item.priceBand);
          return (
            <Card style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Pill label={item.categoryLabel} />
              </View>
              <View style={styles.metaRow}>
                {item.durationMinutes ? <MetaLine icon="time-outline" text={formatDuration(item.durationMinutes)} /> : null}
                {cost ? <MetaLine icon="cash-outline" text={cost} /> : null}
                <MetaLine
                  icon={item.atHome ? 'home-outline' : item.outdoor ? 'sunny-outline' : 'business-outline'}
                  text={item.atHome ? 'En casa' : item.outdoor ? 'Al aire libre' : 'En la ciudad'}
                />
              </View>
              {!!item.description && <Text style={styles.cardDescription}>{item.description}</Text>}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => propose(item)}
                accessibilityRole="button"
                accessibilityLabel={`Proponer ${item.title} a mi pareja`}
              >
                <Text style={styles.secondaryButtonText}>Proponer a mi pareja</Text>
              </TouchableOpacity>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: 16, flexGrow: 1 },
  listHeader: { gap: 16, marginBottom: 16 },
  subtitle: { fontSize: 14, lineHeight: 20, color: palette.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { gap: 10, marginBottom: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: palette.text },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6 },
  cardDescription: { fontSize: 14, lineHeight: 20, color: palette.textSecondary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  listState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 12 },
  stateIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stateTitle: { fontSize: 20, fontWeight: '600', color: palette.text, textAlign: 'center', marginBottom: 8 },
  stateSubtitle: { fontSize: 14, color: palette.textSecondary, textAlign: 'center', marginBottom: 24 },
  secondaryButton: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '600', color: palette.textAccent },
});
