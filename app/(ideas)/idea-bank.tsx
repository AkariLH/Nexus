import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientButton } from '../components/ui/GradientButton';
import { useAuth } from '../../context/AuthContext';
import { ideaService, IdeaCategory, IdeaResponse } from '../../services/idea.service';
import { formatDuration, priceLabel, proposalParams } from '../../utils/ideaFormat';

/**
 * RF-34 - Banco de ideas de citas, por categoria. RF-35 - "Proponer a mi pareja" prellena
 * Crear evento; la aprobacion es la de siempre (RF-30). RN-29: sin vinculo el backend responde 403.
 */

type LoadState = 'loading' | 'ready' | 'error' | 'no-link';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  COMER_Y_BEBER: 'restaurant',
  CULTURA: 'film',
  AIRE_LIBRE: 'leaf',
  DEPORTE: 'bicycle',
  APRENDER: 'school',
  JUEGOS_Y_RELAX: 'game-controller',
  OTRAS: 'sparkles',
};

const iconFor = (category: string) => CATEGORY_ICONS[category] ?? 'sparkles';

export default function IdeaBankScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [categories, setCategories] = useState<IdeaCategory[]>([]);
  const [category, setCategory] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<IdeaResponse[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
    setExpandedId(null);
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

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Regresar"
      >
        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>
    </View>
  );

  const chips = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
      style={styles.chipsScroll}
    >
      {[{ code: null as string | null, label: 'Todas' }, ...categories].map((c) => {
        const active = category === c.code;
        return (
          <TouchableOpacity
            key={c.code ?? 'ALL'}
            onPress={() => setCategory(c.code)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            {c.code && (
              <Ionicons name={iconFor(c.code)} size={15} color={active ? '#FFFFFF' : '#FF4F81'} />
            )}
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const intro = (
    <View style={styles.intro}>
      <Text style={styles.title} accessibilityRole="header">
        Banco de ideas
      </Text>
      <Text style={styles.subtitle}>Encuentren su próxima cita y propónganla en un toque.</Text>
    </View>
  );

  if (state === 'no-link') {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.centered}>
          <View style={styles.stateIcon}>
            <Ionicons name="link-outline" size={44} color="#9CA3AF" />
          </View>
          <Text style={styles.stateTitle}>Primero vincúlate con tu pareja</Text>
          <Text style={styles.stateSubtitle}>
            El banco de ideas es para planear juntos, así que necesita un vínculo activo.
          </Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/(tabs)/link')}>
            <Ionicons name="link" size={18} color="#FF4F81" />
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF4F81" />
        }
        ListHeaderComponent={
          <>
            {intro}
            {chips}
          </>
        }
        ListEmptyComponent={
          state === 'loading' ? (
            <View style={styles.listState}>
              <ActivityIndicator size="large" color="#FF4F81" />
            </View>
          ) : state === 'error' ? (
            <View style={styles.listState}>
              <View style={styles.stateIcon}>
                <Ionicons name="cloud-offline-outline" size={44} color="#9CA3AF" />
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
                <Ionicons name="refresh" size={18} color="#FF4F81" />
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
          const expanded = expandedId === item.id;
          const meta = [
            formatDuration(item.durationMinutes),
            priceLabel(item.priceBand),
            item.atHome ? 'En casa' : 'En la ciudad',
          ].filter(Boolean);
          return (
            <Pressable
              onPress={() => setExpandedId(expanded ? null : item.id)}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              accessibilityHint={expanded ? 'Contrae la idea' : 'Muestra detalles y opción de proponer'}
            >
              <View style={styles.cardRow}>
                <View style={styles.cardIcon}>
                  <Ionicons name={iconFor(item.category)} size={22} color="#FF4F81" />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardMeta}>{meta.join('  ·  ')}</Text>
                </View>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#9CA3AF"
                />
              </View>

              {expanded && (
                <MotiView
                  from={{ opacity: 0, translateY: -6 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 220 }}
                  style={styles.cardDetail}
                >
                  {!!item.description && (
                    <Text style={styles.cardDescription}>{item.description}</Text>
                  )}
                  <View style={styles.tagsRow}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{item.categoryLabel}</Text>
                    </View>
                    {item.outdoor && (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>Al aire libre</Text>
                      </View>
                    )}
                  </View>
                  <GradientButton title="Proponer a mi pareja" onPress={() => propose(item)} />
                </MotiView>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  intro: {
    marginTop: 4,
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 4,
  },
  chipsScroll: {
    marginHorizontal: -20,
    marginBottom: 16,
  },
  chipsRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F3D1DC',
  },
  chipActive: {
    backgroundColor: '#FF4F81',
    borderColor: '#FF4F81',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFF0F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardMeta: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardDetail: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 14,
  },
  cardDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  listState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 12,
  },
  stateIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  stateSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 28,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: '#FFF0F5',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4F81',
  },
});
