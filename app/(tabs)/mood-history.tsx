import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { emotionService, EmotionLogResponse } from '../../services/emotion.service';

/** RF-32 - Historial emocional. Privado (RN-28): solo lo ve el propio usuario. */
export default function MoodHistoryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [entries, setEntries] = useState<EmotionLogResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const history = await emotionService.getHistory(user.userId);
      setEntries(history);
    } catch (error) {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#11181C" />
        </TouchableOpacity>
        <Text style={styles.title}>Tu historial emocional</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#667eea" />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="happy-outline" size={48} color="#c7ccd6" />
          <Text style={styles.emptyText}>Todavía no registras ningún estado de ánimo.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.entry}>
              <Text style={styles.entryLabel}>{item.label || 'Estado de ánimo'}</Text>
              <Text style={styles.entryDate}>{formatDate(item.loggedAt)}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600', color: '#11181C' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { marginTop: 12, color: '#687076', textAlign: 'center' },
  list: { padding: 16 },
  entry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  entryLabel: { fontSize: 16, color: '#11181C', fontWeight: '500' },
  entryDate: { fontSize: 13, color: '#687076' },
});
