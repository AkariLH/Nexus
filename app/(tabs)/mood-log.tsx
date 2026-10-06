import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '../components/ui/GradientButton';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { emotionService } from '../../services/emotion.service';
import { MOODS, MoodOption } from '../../constants/moods';

/** RF-31 - Registro de estado emocional. Las opciones y su mapeo interno viven en constants/moods. */
export default function MoodLogScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [selected, setSelected] = useState<MoodOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorModal, setErrorModal] = useState(false);

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
      setErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Ánimo</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.push('/(tabs)/mood-history')}
        >
          <Ionicons name="time-outline" size={24} color="#FF4F81" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.question}>¿Cómo te sientes hoy?</Text>
        <Text style={styles.subtitle}>Solo tú puedes ver lo que registres aquí.</Text>

        <View style={styles.grid}>
          {MOODS.map((mood) => {
            const isSelected = selected?.label === mood.label;
            return (
              <TouchableOpacity
                key={mood.label}
                style={[styles.moodCard, isSelected && styles.moodCardSelected]}
                onPress={() => setSelected(mood)}
                activeOpacity={0.8}
              >
                <Text style={[styles.moodEmoji, isSelected && styles.moodEmojiSelected]}>
                  {mood.emoji}
                </Text>
                <Text style={[styles.moodLabel, isSelected && styles.moodLabelSelected]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title={selected ? `Guardar: ${selected.label}` : 'Elige cómo te sientes'}
          onPress={handleSave}
          disabled={!selected}
          loading={saving}
        />
      </View>

      <ConfirmModal
        visible={errorModal}
        type="error"
        title="Error"
        message="No se pudo guardar tu estado de ánimo. Intenta de nuevo."
        confirmText="Entendido"
        showCancel={false}
        onConfirm={() => setErrorModal(false)}
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
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  moodCardSelected: {
    borderColor: '#FF4F81',
    backgroundColor: '#FFF0F5',
  },
  moodEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  moodEmojiSelected: {
    transform: [{ scale: 1.15 }],
  },
  moodLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  moodLabelSelected: {
    color: '#FF4F81',
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});
