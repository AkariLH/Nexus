import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
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
import { todayEntry } from '../../utils/moodHistory';
import { MOOD_ROW_GAP, moodRows, moodSizing } from '../../utils/moodLayout';
import { palette } from '../../constants/colors';
import { ScreenHeader } from '../components/layout/ScreenHeader';

/**
 * RF-31 - Registro de estado emocional del dia. Las opciones y su mapeo interno viven en
 * constants/moods. RN-38: un registro por dia; si ya hay uno hoy, se muestra y se puede cambiar
 * (el backend reemplaza el anterior).
 *
 * Todas las opciones caben en una pantalla, sin desplazamiento: la cuadricula ocupa el alto que
 * queda entre el titulo y el boton, y las caritas se ajustan a ese alto (utils/moodLayout).
 */

const SAVED_PAUSE_MS = 1100;
const MOOD_ROWS = moodRows(MOODS);

export default function MoodLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selected, setSelected] = useState<MoodOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [registeredToday, setRegisteredToday] = useState<MoodOption | null>(null);
  const [gridHeight, setGridHeight] = useState(0);
  const { emojiSize, labelSize } = moodSizing(gridHeight, MOOD_ROWS.length);

  // RN-38: si ya registro hoy, arranca con esa carita seleccionada.
  useEffect(() => {
    if (!user) return;
    emotionService
      .getHistory(user.userId)
      .then((history) => {
        const mood = MOODS.find((m) => m.label === todayEntry(history)?.label) ?? null;
        setRegisteredToday(mood);
        setSelected((current) => current ?? mood);
      })
      .catch(() => {});
  }, [user]);

  const unchanged = registeredToday !== null && selected?.label === registeredToday.label;

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
      <ScreenHeader
        title="Mi ánimo"
        onBack={() => router.back()}
        right={
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/(mood)/mood-history')}
            accessibilityRole="button"
            accessibilityLabel="Ver mi historial"
          >
            <Ionicons name="time-outline" size={24} color={palette.primary} />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        <Text style={styles.question}>
          ¿Cómo estuvo tu día?
        </Text>
        <View style={styles.privacyRow}>
          <Ionicons name="lock-closed" size={13} color={palette.textSecondary} />
          <Text style={styles.privacyText}>Solo tú puedes verlo</Text>
        </View>
        {registeredToday && (
          <View style={styles.todayNote}>
            <Ionicons name="information-circle" size={20} color={palette.secondary} />
            <Text style={styles.todayNoteText}>
              Ya registraste tu día · puedes cambiarlo si quieres
            </Text>
          </View>
        )}

        <View
          style={styles.grid}
          accessibilityRole="radiogroup"
          onLayout={(event) => setGridHeight(event.nativeEvent.layout.height)}
        >
          {MOOD_ROWS.map((row) => (
            <View key={row[0].label} style={styles.gridRow}>
              {row.map((mood) => {
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
                      animate={{ scale: isSelected ? 1.12 : 1 }}
                      transition={{ type: 'spring', damping: 10, stiffness: 220 }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={[styles.moodEmoji, { fontSize: emojiSize }]}
                      >
                        {mood.emoji}
                      </Text>
                    </MotiView>
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[
                        styles.moodLabel,
                        { fontSize: labelSize },
                        isSelected && styles.moodLabelSelected,
                      ]}
                    >
                      {mood.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* El espacio del boton esta siempre reservado: la cuadricula no salta al elegir. */}
      <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
        <AnimatePresence>
          {selected && !unchanged && (
            <MotiView
              key="save"
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: 12 }}
              transition={{ type: 'timing', duration: 220 }}
            >
              <GradientButton
                title={registeredToday ? 'Actualizar' : 'Guardar'}
                onPress={handleSave}
                loading={saving}
              />
            </MotiView>
          )}
        </AnimatePresence>
      </View>

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
    flex: 1,
    padding: 16,
  },
  question: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.text,
    textAlign: 'center',
  },
  todayNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: palette.secondarySoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    marginBottom: 16,
  },
  todayNoteText: {
    flex: 1,
    fontSize: 13,
    color: palette.text,
    lineHeight: 20,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  privacyText: {
    fontSize: 14,
    color: palette.textSecondary,
  },
  grid: {
    flex: 1,
    gap: MOOD_ROW_GAP,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  moodCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    backgroundColor: palette.surface,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  moodCardSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.primarySoft,
  },
  moodCardDimmed: {
    opacity: 0.55,
  },
  moodCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  moodEmoji: {
    marginBottom: 4,
  },
  moodLabel: {
    fontWeight: '500',
    color: palette.textSecondary,
  },
  moodLabelSelected: {
    color: palette.textAccent,
    fontWeight: '600',
  },
  footer: {
    minHeight: 88,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
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
    fontSize: 20,
    fontWeight: '600',
    color: palette.text,
    textAlign: 'center',
  },
  savedSubtitle: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
