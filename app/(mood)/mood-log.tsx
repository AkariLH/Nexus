import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GradientButton } from '../components/ui/GradientButton';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import { emotionService } from '../../services/emotion.service';
import { MOODS, MoodOption } from '../../constants/moods';

/** RF-31 - Registro de estado emocional. Las opciones y su mapeo interno viven en constants/moods. */

const SAVED_PAUSE_MS = 1100;

export default function MoodLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selected, setSelected] = useState<MoodOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorModal, setErrorModal] = useState(false);

  // Tras la confirmacion breve, regresa solo a donde venia la persona.
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => router.back(), SAVED_PAUSE_MS);
    return () => clearTimeout(timer);
  }, [saved, router]);

  const choose = (mood: MoodOption) => {
    Haptics.selectionAsync().catch(() => {});
    setSelected(mood);
  };

  const handleSave = async () => {
    if (!user || !selected) return;
    setSaving(true);
    try {
      await emotionService.logEmotion(user.userId, {
        valence: selected.valence,
        activation: selected.activation,
        label: selected.label,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSaved(true);
    } catch (error) {
      setErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  if (saved && selected) {
    return (
      <View style={[styles.container, styles.savedContainer]}>
        <MotiView
          from={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          <Text style={styles.savedEmoji}>{selected.emoji}</Text>
        </MotiView>
        <MotiView
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 300, delay: 150 }}
        >
          <Text style={styles.savedTitle}>Guardado</Text>
          <Text style={styles.savedSubtitle}>Gracias por contarnos cómo estuvo tu día.</Text>
        </MotiView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Regresar"
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => router.push('/(mood)/mood-history')}
          accessibilityRole="button"
          accessibilityLabel="Ver mi historial"
        >
          <Ionicons name="time-outline" size={18} color="#FF4F81" />
          <Text style={styles.historyButtonText}>Historial</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}
      >
        <Text style={styles.question} accessibilityRole="header">
          ¿Cómo estuvo tu día?
        </Text>
        <View style={styles.privacyRow}>
          <Ionicons name="lock-closed" size={13} color="#6B7280" />
          <Text style={styles.privacyText}>Solo tú puedes verlo</Text>
        </View>

        <View style={styles.grid} accessibilityRole="radiogroup">
          {MOODS.map((mood) => {
            const isSelected = selected?.label === mood.label;
            const dimmed = selected !== null && !isSelected;
            return (
              <Pressable
                key={mood.label}
                onPress={() => choose(mood)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={mood.label}
                style={({ pressed }) => [
                  styles.moodCard,
                  isSelected && styles.moodCardSelected,
                  dimmed && styles.moodCardDimmed,
                  pressed && styles.moodCardPressed,
                ]}
              >
                <MotiView
                  animate={{ scale: isSelected ? 1.18 : 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 220 }}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                </MotiView>
                <Text style={[styles.moodLabel, isSelected && styles.moodLabelSelected]}>
                  {mood.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <AnimatePresence>
        {selected && (
          <MotiView
            key="save"
            from={{ translateY: 120 }}
            animate={{ translateY: 0 }}
            exit={{ translateY: 120 }}
            transition={{ type: 'timing', duration: 260 }}
            style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}
          >
            <GradientButton title="Guardar" onPress={handleSave} loading={saving} />
          </MotiView>
        )}
      </AnimatePresence>

      <ConfirmModal
        visible={errorModal}
        type="error"
        title="No se pudo guardar"
        message="Revisa tu conexión e inténtalo de nuevo. Tu selección sigue aquí."
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
    paddingBottom: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#FFF0F5',
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF4F81',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  question: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 8,
    marginBottom: 32,
  },
  privacyText: {
    fontSize: 13,
    color: '#6B7280',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  moodCard: {
    width: '48%',
    alignItems: 'center',
    paddingTop: 22,
    paddingBottom: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  moodCardSelected: {
    borderColor: '#FF4F81',
    backgroundColor: '#FFF0F5',
    shadowColor: '#FF4F81',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  moodCardDimmed: {
    opacity: 0.55,
  },
  moodCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  moodEmoji: {
    fontSize: 52,
    marginBottom: 10,
  },
  moodLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
  },
  moodLabelSelected: {
    color: '#FF4F81',
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  savedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  savedEmoji: {
    fontSize: 96,
    textAlign: 'center',
    marginBottom: 16,
  },
  savedTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  savedSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },
});
