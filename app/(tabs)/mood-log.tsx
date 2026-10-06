import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Chip } from '../../components/Chip';
import { GradientButton } from '../components/ui/GradientButton';
import { ConfirmModal } from '../components/ConfirmModal';
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

const QUADRANTS: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  options: MoodOption[];
}[] = [
  {
    title: 'Positiva / Alta activación',
    icon: 'sunny-outline',
    options: [
      { label: 'Feliz', valence: 0.8, activation: 0.5 },
      { label: 'Emocionado/a', valence: 0.7, activation: 0.9 },
    ],
  },
  {
    title: 'Positiva / Baja activación',
    icon: 'leaf-outline',
    options: [
      { label: 'Tranquilo/a', valence: 0.6, activation: -0.5 },
      { label: 'En calma', valence: 0.5, activation: -0.7 },
    ],
  },
  {
    title: 'Negativa / Baja activación',
    icon: 'rainy-outline',
    options: [
      { label: 'Triste', valence: -0.7, activation: -0.4 },
      { label: 'Cansado/a', valence: -0.4, activation: -0.7 },
    ],
  },
  {
    title: 'Negativa / Alta activación',
    icon: 'thunderstorm-outline',
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
        <Text style={styles.question}>¿Cómo te sientes ahora?</Text>
        <Text style={styles.subtitle}>
          Elige la opción que mejor te describa. Solo tú puedes ver este registro.
        </Text>

        {QUADRANTS.map((quadrant) => (
          <View key={quadrant.title} style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Ionicons name={quadrant.icon} size={18} color="#FF4F81" />
              <Text style={styles.cardTitle}>{quadrant.title}</Text>
            </View>
            <View style={styles.chipsRow}>
              {quadrant.options.map((option) => (
                <Chip
                  key={option.label}
                  label={option.label}
                  color="#FF4F81"
                  selected={selected?.label === option.label}
                  onPress={() => setSelected(option)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <GradientButton
          title="Guardar"
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
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});
