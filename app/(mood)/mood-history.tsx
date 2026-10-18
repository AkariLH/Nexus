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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { emotionService, EmotionLogResponse } from '../../services/emotion.service';
import { MoodFace } from '../../components/MoodFace';
import { Card } from '../../components/ui/Surface';
import { groupByDay, lastSevenDays } from '../../utils/moodHistory';
import { palette } from '../../constants/colors';
import { GradientButton } from '../components/ui/GradientButton';
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
              <TouchableOpacity accessibilityRole="button" style={styles.secondaryButton} onPress={retry}>
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
                      day.label ?? 'sin registro'
                    }`}
                  >
                    {day.label ? <MoodFace label={day.label} size={36} /> : <View style={styles.weekEmpty} />}
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
        renderItem={({ item }) => (
          <Card style={styles.entryRow}>
            <MoodFace label={item.label || 'En calma'} size={40} />
            <View style={styles.entryText}>
              <Text style={styles.entryLabel} numberOfLines={1}>
                {item.label || 'Estado de ánimo'}
              </Text>
              <Text style={styles.entryTime}>{formatTime(item.loggedAt)}</Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyFace}>
              <MoodFace label="En calma" size={72} />
            </View>
            <Text style={styles.stateTitle}>Aún no hay registros</Text>
            <Text style={styles.stateSubtitle}>
              Cuéntanos cómo estuvo tu día y aquí verás cómo te has sentido.
            </Text>
            <GradientButton title="Registrar mi día" onPress={goToLog} style={styles.emptyButton} />
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
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
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
  weekEmpty: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: palette.iconDisabled,
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
    gap: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  entryText: {
    flex: 1,
    gap: 2,
  },
  entryLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: palette.text,
  },
  entryTime: {
    fontSize: 12,
    color: palette.textMuted,
  },
  emptyFace: {
    marginBottom: 16,
  },
  emptyButton: {
    alignSelf: 'stretch',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 80,
  },
});
