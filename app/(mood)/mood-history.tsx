import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { emotionService, EmotionLogResponse } from '../../services/emotion.service';
import { moodEmoji } from '../../constants/moods';
import { groupByDay, lastSevenDays } from '../../utils/moodHistory';
import { palette, gradients } from '../../constants/colors';
import { ScreenHeader } from '../components/layout/ScreenHeader';

/** RF-32 - Historial emocional. Privado (RN-28): solo lo ve el propio usuario. */

type LoadState = 'loading' | 'ready' | 'error';

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

export default function MoodHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [entries, setEntries] = useState<EmotionLogResponse[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    try {
      const history = await emotionService.getHistory(user.userId);
      setEntries(history);
      setState('ready');
    } catch (error) {
      setState('error');
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const retry = () => {
    setState('loading');
    loadHistory();
  };

  const goToLog = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(mood)/mood-log');
  };

  const sections = useMemo(() => groupByDay(entries), [entries]);
  const week = useMemo(() => lastSevenDays(entries), [entries]);

  const header = (
    <ScreenHeader title="Mi historial" onBack={() => router.back()} />
  );

  if (state !== 'ready') {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.centered}>
          {state === 'loading' ? (
            <ActivityIndicator size="large" color={palette.primary} />
          ) : (
            <>
              <View style={styles.stateIcon}>
                <Ionicons name="cloud-offline-outline" size={44} color={palette.icon} />
              </View>
              <Text style={styles.stateTitle}>No pudimos cargar tu historial</Text>
              <Text style={styles.stateSubtitle}>Revisa tu conexión e inténtalo de nuevo.</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={retry}>
                <Ionicons name="refresh" size={18} color={palette.secondary} />
                <Text style={styles.secondaryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {header}
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
        }
        ListHeaderComponent={
          entries.length > 0 ? (
            <View style={styles.weekCard}>
              <Text style={styles.weekTitle}>Últimos 7 días</Text>
              <View style={styles.weekRow}>
                {week.map((day) => (
                  <View
                    key={day.key}
                    style={styles.weekDay}
                    accessible
                    accessibilityLabel={`${day.isToday ? 'Hoy' : day.initial}: ${
                      day.emoji ? 'con registro' : 'sin registro'
                    }`}
                  >
                    <View style={[styles.weekBubble, day.isToday && styles.weekBubbleToday]}>
                      {day.emoji ? (
                        <Text style={styles.weekEmoji}>{day.emoji}</Text>
                      ) : (
                        <View style={styles.weekEmpty} />
                      )}
                    </View>
                    <Text style={[styles.weekInitial, day.isToday && styles.weekInitialToday]}>
                      {day.initial}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{section.title}</Text>
        )}
        renderItem={({ item, index, section }) => (
          <View
            style={[
              styles.entryRow,
              index === 0 && styles.entryRowFirst,
              index === section.data.length - 1 && styles.entryRowLast,
            ]}
          >
            <Text style={styles.entryEmoji}>{moodEmoji(item.label)}</Text>
            <Text style={styles.entryLabel} numberOfLines={1}>
              {item.label || 'Estado de ánimo'}
            </Text>
            <Text style={styles.entryTime}>{formatTime(item.loggedAt)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🙂</Text>
            <Text style={styles.stateTitle}>Aún no hay registros</Text>
            <Text style={styles.stateSubtitle}>
              Cuéntanos cómo estuvo tu día y aquí verás cómo te has sentido.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={goToLog}>
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>Registrar mi día</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
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
  weekCard: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.text,
    marginBottom: 12,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    alignItems: 'center',
    gap: 6,
  },
  weekBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  weekBubbleToday: {
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  weekEmoji: {
    fontSize: 22,
  },
  weekEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.border,
  },
  weekInitial: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.textMuted,
  },
  weekInitialToday: {
    color: palette.textAccent,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.text,
    marginTop: 24,
    marginBottom: 12,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: palette.surface,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: palette.divider,
  },
  entryRowFirst: {
    borderTopWidth: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  entryRowLast: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  entryEmoji: {
    fontSize: 30,
  },
  entryLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: palette.text,
  },
  entryTime: {
    fontSize: 14,
    color: palette.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  primaryButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.onPrimary,
  },
});
