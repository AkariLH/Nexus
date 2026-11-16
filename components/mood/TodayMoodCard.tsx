import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MoodFace } from '../MoodFace';
import { Card } from '../ui/Surface';
import { GradientButton } from '../../app/components/ui/GradientButton';
import { MOODS, MoodOption } from '../../constants/moods';
import { palette } from '../../constants/colors';
import { emotionService } from '../../services/emotion.service';

const time = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

interface Props {
  userId: number;
  /** El registro de hoy, si ya hay. */
  today: { label?: string | null; loggedAt: string } | null;
  /** Se guardó: el historial se vuelve a cargar. */
  onSaved: () => void;
}

/**
 * [animo-historial] Figma R1/R1b: registrar el ánimo del día desde Mi historial (antes el botón
 * regresaba a Perfil). Sin registro de hoy muestra las caritas; con registro, lo dice y deja
 * registrar otra vez (RN-38: el backend reemplaza el del día).
 */
export function TodayMoodCard({ userId, today, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<MoodOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  if (today && !editing) {
    const label = today.label || 'En calma';
    return (
      <Card style={styles.card}>
        <View style={styles.todayRow}>
          <MoodFace label={label} size={40} />
          <View style={styles.todayText}>
            <Text style={styles.todayTitle}>Hoy te sentiste {label}</Text>
            <Text style={styles.todayTime}>A las {time(today.loggedAt)}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setEditing(true)} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.link}>Registrar otra vez</Text>
        </TouchableOpacity>
      </Card>
    );
  }

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setFailed(false);
    try {
      await emotionService.logEmotion(userId, {
        valence: selected.valence,
        activation: selected.activation,
        label: selected.label,
      });
      setEditing(false);
      setSelected(null);
      onSaved();
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>¿Cómo estuvo tu día?</Text>
      <View style={styles.grid}>
        {MOODS.map((mood) => {
          const isSelected = selected?.label === mood.label;
          return (
            <TouchableOpacity
              key={mood.label}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setSelected(mood);
              }}
              accessibilityRole="button"
              accessibilityLabel={mood.label}
              accessibilityState={{ selected: isSelected }}
            >
              <MoodFace label={mood.label} size={32} />
              <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]} numberOfLines={1} adjustsFontSizeToFit>
                {mood.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {failed && <Text style={styles.error}>No se pudo guardar. Inténtalo de nuevo.</Text>}
      <GradientButton title="Guardar" onPress={save} loading={saving} disabled={!selected} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '700', color: palette.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  option: {
    width: '23.5%',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  optionSelected: { borderColor: palette.primary, borderWidth: 2, backgroundColor: palette.primarySoft },
  optionLabel: { fontSize: 11, color: palette.text },
  optionLabelSelected: { color: palette.textAccent, fontWeight: '600' },
  error: { fontSize: 13, color: palette.error },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  todayText: { flex: 1, gap: 2 },
  todayTitle: { fontSize: 15, fontWeight: '500', color: palette.text },
  todayTime: { fontSize: 12, color: palette.textSecondary },
  link: { fontSize: 14, fontWeight: '500', color: palette.textAccent },
});
