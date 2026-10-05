import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Chip } from '../../components/Chip';
import { useAuth } from '../../context/AuthContext';
import { emotionService } from '../../services/emotion.service';

/**
 * RF-31 - Registro de estado emocional.
 *
 * Selector de 8 opciones mapeadas al modelo circunflejo del afecto (2.7.1, Russell 1980):
 * cada una es una coordenada (valencia, activación), agrupadas por cuadrante. Se guarda la
 * coordenada, no solo la etiqueta — la etiqueta es solo para que la persona elija algo legible.
 */
interface MoodOption {
  label: string;
  valence: number;
  activation: number;
}

const QUADRANTS: { title: string; options: MoodOption[] }[] = [
  {
    title: 'Positiva / Alta activación',
    options: [
      { label: 'Feliz', valence: 0.8, activation: 0.5 },
      { label: 'Emocionado/a', valence: 0.7, activation: 0.9 },
    ],
  },
  {
    title: 'Positiva / Baja activación',
    options: [
      { label: 'Tranquilo/a', valence: 0.6, activation: -0.5 },
      { label: 'En calma', valence: 0.5, activation: -0.7 },
    ],
  },
  {
    title: 'Negativa / Baja activación',
    options: [
      { label: 'Triste', valence: -0.7, activation: -0.4 },
      { label: 'Cansado/a', valence: -0.4, activation: -0.7 },
    ],
  },
  {
    title: 'Negativa / Alta activación',
    options: [
      { label: 'Enojado/a', valence: -0.7, activation: 0.7 },
      { label: 'Estresado/a', valence: -0.5, activation: 0.8 },
    ],
  },
];

export default function MoodLogScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selected, setSelected] = useState<MoodOption | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !selected) return;
    setSaving(true);
    try {
      await emotionService.logEmotion(user.userId, {
        valence: selected.valence,
        activation: selected.activation,
        label: selected.label,
      });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar tu estado de ánimo. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#11181C" />
        </TouchableOpacity>
        <Text style={styles.title}>¿Cómo te sientes?</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/mood-history')} style={styles.backButton}>
          <Ionicons name="time-outline" size={24} color="#11181C" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {QUADRANTS.map((quadrant) => (
          <View key={quadrant.title} style={styles.quadrant}>
            <Text style={styles.quadrantTitle}>{quadrant.title}</Text>
            <View style={styles.chipsRow}>
              {quadrant.options.map((option) => (
                <Chip
                  key={option.label}
                  label={option.label}
                  selected={selected?.label === option.label}
                  onPress={() => setSelected(option)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, !selected && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!selected || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>
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
  content: { padding: 16 },
  quadrant: { marginBottom: 20 },
  quadrantTitle: { fontSize: 13, color: '#687076', marginBottom: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  saveButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: { backgroundColor: '#c7ccd6' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
