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
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Regresar"
      >
        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>
      <Text style={styles.headerTitle} accessibilityRole="header">
        Mi historial
      </Text>
      <View style={styles.headerButton} />
    </View>
  );

  if (state !== 'ready') {
    return (
      <View style={styles.container}>
        {header}
        <View style={styles.centered}>
          {state === 'loading' ? (
            <ActivityIndicator size="large" color="#FF4F81" />
          ) : (
            <>
              <View style={styles.stateIcon}>
                <Ionicons name="cloud-offline-outline" size={44} color="#9CA3AF" />
              </View>
              <Text style={styles.stateTitle}>No pudimos cargar tu historial</Text>
              <Text style={styles.stateSubtitle}>Revisa tu conexión e inténtalo de nuevo.</Text>
              <TouchableOpacity style={styles.secondaryButton} onPress={retry}>
                <Ionicons name="refresh" size={18} color="#FF4F81" />
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF4F81" />
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
                colors={['#FF4F81', '#8A2BE2']}
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
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
  weekCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 14,
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
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  weekBubbleToday: {
    borderColor: '#FF4F81',
    backgroundColor: '#FFF0F5',
  },
  weekEmoji: {
    fontSize: 22,
  },
  weekEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  weekInitial: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  weekInitialToday: {
    color: '#FF4F81',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 4,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  entryRowFirst: {
    borderTopWidth: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  entryRowLast: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  entryEmoji: {
    fontSize: 30,
  },
  entryLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  entryTime: {
    fontSize: 14,
    color: '#6B7280',
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
    height: 52,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
