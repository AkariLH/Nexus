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
import { palette } from '../../constants/colors';
import { ScreenHeader } from '../components/layout/ScreenHeader';

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
    <ScreenHeader title="Banco de ideas" onBack={() => router.back()} />
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
              <Ionicons name={iconFor(c.code)} size={15} color={active ? palette.surface : palette.secondary} />
            )}
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const intro = (
    <View style={styles.intro}>
      <Ionicons name="bulb" size={20} color={palette.secondary} />
      <Text style={styles.subtitle}>Encuentren su próxima cita y propónganla en un toque.</Text>
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
          <Text style={styles.stateSubtitle}>
            El banco de ideas es para planear juntos, así que necesita un vínculo activo.
          </Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/(tabs)/link')}>
            <Ionicons name="link" size={18} color={palette.secondary} />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
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
                <Ionicons name="refresh" size={18} color={palette.secondary} />
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
                  <Ionicons name={iconFor(item.category)} size={22} color={palette.primary} />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardMeta}>{meta.join('  ·  ')}</Text>
                </View>
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={palette.icon}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.text,
  },
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: palette.surface,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: palette.secondarySoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    marginBottom: 16,
  },
  subtitle: {
    flex: 1,
    fontSize: 13,
    color: palette.text,
    lineHeight: 20,
  },
  chipsScroll: {
    marginHorizontal: -16,
    marginBottom: 16,
  },
  chipsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  chipActive: {
    backgroundColor: palette.secondary,
    borderColor: palette.secondary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.textAccent,
  },
  chipTextActive: {
    color: palette.onPrimary,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
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
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.text,
  },
  cardMeta: {
    fontSize: 14,
    color: palette.textSecondary,
  },
  cardDetail: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: palette.divider,
    gap: 14,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: palette.surfaceMuted,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textSecondary,
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  stateSubtitle: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.textAccent,
  },
});
