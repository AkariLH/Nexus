import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback, useRef } from "react";
import { CoachMark } from "../../components/onboarding/CoachMark";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Switch,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuth } from "../../context/AuthContext";
import { getUserSchedule, saveUserSchedule, AvailabilityScheduleDTO } from "../../services/availabilityService";
import { palette, switchColors } from "../../constants/colors";
import { ScreenHeader } from "../components/layout/ScreenHeader";
import { ResultModal } from "../components/ResultModal";
import { GradientButton } from "../components/ui/GradientButton";
import { OptionChip } from "../components/ui/OptionChip";
import { Card, SectionLabel } from "../../components/ui/Surface";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DaySchedule {
  day: string;
  dayName: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

type QuickOption = 'all' | 'weekdays' | 'weekends';

const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "22:00";
const WEEKEND = ['SATURDAY', 'SUNDAY'];

/** Que opcion rapida coincide con los dias activos (para marcar el chip). */
function quickOptionOf(schedule: DaySchedule[]): QuickOption | null {
  const on = schedule.filter((d) => d.enabled).map((d) => d.day);
  if (on.length === 7) return 'all';
  if (on.length === 5 && on.every((d) => !WEEKEND.includes(d))) return 'weekdays';
  if (on.length === 2 && on.every((d) => WEEKEND.includes(d))) return 'weekends';
  return null;
}

/**
 * Horarios en los que Nexus puede sugerir planes (no bloquean eventos). Con el estilo de F/G:
 * texto corto, chips de opciones rapidas y un dia por fila.
 */
export default function AvailabilityScheduleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { day: 'MONDAY', dayName: 'Lunes', enabled: true, startTime: DEFAULT_START_TIME, endTime: DEFAULT_END_TIME },
    { day: 'TUESDAY', dayName: 'Martes', enabled: true, startTime: DEFAULT_START_TIME, endTime: DEFAULT_END_TIME },
    { day: 'WEDNESDAY', dayName: 'Miércoles', enabled: true, startTime: DEFAULT_START_TIME, endTime: DEFAULT_END_TIME },
    { day: 'THURSDAY', dayName: 'Jueves', enabled: true, startTime: DEFAULT_START_TIME, endTime: DEFAULT_END_TIME },
    { day: 'FRIDAY', dayName: 'Viernes', enabled: true, startTime: DEFAULT_START_TIME, endTime: DEFAULT_END_TIME },
    { day: 'SATURDAY', dayName: 'Sábado', enabled: true, startTime: DEFAULT_START_TIME, endTime: DEFAULT_END_TIME },
    { day: 'SUNDAY', dayName: 'Domingo', enabled: true, startTime: DEFAULT_START_TIME, endTime: DEFAULT_END_TIME },
  ]);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // [primeros-pasos] Guía de primera visita.
  const quickRef = useRef<View>(null);
  const daysRef = useRef<View>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados para el DateTimePicker
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerDayIndex, setPickerDayIndex] = useState<number | null>(null);
  const [pickerField, setPickerField] = useState<'startTime' | 'endTime'>('startTime');
  const [pickerTime, setPickerTime] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      loadSchedule();
    }, [user?.userId])
  );

  const loadSchedule = async () => {
    if (!user?.userId) return;

    try {
      setLoading(true);
      const saved: AvailabilityScheduleDTO[] = await getUserSchedule(user.userId);
      if (saved && saved.length > 0) {
        const mapped = schedule.map(d => {
          const found = saved.find(s => s.day === d.day);
          return found ? { ...d, enabled: found.enabled, startTime: found.startTime, endTime: found.endTime } : d;
        });
        setSchedule(mapped);
      }
    } catch (error) {
      console.error('Error cargando horarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index].enabled = !newSchedule[index].enabled;
    setSchedule(newSchedule);
  };

  const openTimePicker = (index: number, field: 'startTime' | 'endTime') => {
    const [hours, minutes] = schedule[index][field].split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    setPickerDayIndex(index);
    setPickerField(field);
    setPickerTime(date);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate && pickerDayIndex !== null) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const newSchedule = [...schedule];
      newSchedule[pickerDayIndex][pickerField] = `${hours}:${minutes}`;
      setSchedule(newSchedule);
      if (Platform.OS === 'ios') {
        setPickerTime(selectedDate);
      }
    }
  };

  const closeTimePicker = () => {
    setShowTimePicker(false);
    setPickerDayIndex(null);
  };

  const handleSave = async () => {
    if (!user?.userId) return;

    try {
      setSaving(true);
      for (const d of schedule) {
        if (d.enabled) {
          const [sh, sm] = d.startTime.split(':').map(Number);
          const [eh, em] = d.endTime.split(':').map(Number);
          if (eh * 60 + em <= sh * 60 + sm) {
            setErrorMessage(`El ${d.dayName.toLowerCase()} termina antes de empezar: cambia la hora "Hasta".`);
            setSaving(false);
            return;
          }
        }
      }
      await saveUserSchedule(user.userId, schedule.map(d => ({
        day: d.day,
        enabled: d.enabled,
        startTime: d.startTime,
        endTime: d.endTime,
      })));
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error guardando horarios:', error);
      setErrorMessage('No se pudieron guardar tus horarios. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const setQuickOption = (option: QuickOption) => {
    setSchedule(schedule.map(day => ({
      ...day,
      enabled: option === 'all' ? true : option === 'weekdays' ? !WEEKEND.includes(day.day) : WEEKEND.includes(day.day),
    })));
  };

  const quick = quickOptionOf(schedule);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Horarios permitidos" onBack={() => router.back()} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 24 + insets.bottom }]}>
          <Text style={styles.intro}>
            Cuándo puede Nexus sugerirles planes. Tus eventos no cambian.
          </Text>

          <View style={styles.section} ref={quickRef} collapsable={false}>
            <SectionLabel>Días</SectionLabel>
            <View style={styles.chips}>
              <OptionChip label="Todos los días" selected={quick === 'all'} onPress={() => setQuickOption('all')} />
              <OptionChip label="Entre semana" selected={quick === 'weekdays'} onPress={() => setQuickOption('weekdays')} />
              <OptionChip label="Fines de semana" selected={quick === 'weekends'} onPress={() => setQuickOption('weekends')} />
            </View>
          </View>

          <View ref={daysRef} collapsable={false}>
          <Card style={styles.card}>
            {schedule.map((day, index) => (
              <View key={day.day}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.dayRow}>
                  <Text style={[styles.dayName, !day.enabled && styles.dayOff]}>{day.dayName}</Text>
                  {day.enabled ? (
                    <View style={styles.times}>
                      <TouchableOpacity
                        style={styles.time}
                        onPress={() => openTimePicker(index, 'startTime')}
                        accessibilityRole="button"
                        accessibilityLabel={`${day.dayName}, desde las ${day.startTime}`}
                      >
                        <Text style={styles.timeValue}>{day.startTime}</Text>
                      </TouchableOpacity>
                      <Text style={styles.dash}>–</Text>
                      <TouchableOpacity
                        style={styles.time}
                        onPress={() => openTimePicker(index, 'endTime')}
                        accessibilityRole="button"
                        accessibilityLabel={`${day.dayName}, hasta las ${day.endTime}`}
                      >
                        <Text style={styles.timeValue}>{day.endTime}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.offLabel}>Sin planes</Text>
                  )}
                  <Switch
                    value={day.enabled}
                    onValueChange={() => toggleDay(index)}
                    accessibilityLabel={`Sugerir planes el ${day.dayName.toLowerCase()}`}
                    {...switchColors}
                  />
                </View>
              </View>
            ))}
          </Card>
          </View>

          <GradientButton title="Guardar" onPress={handleSave} loading={saving} />
        </ScrollView>
      )}

      {showTimePicker && (
        Platform.OS === 'ios' ? (
          <View style={styles.iosPickerContainer}>
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity onPress={closeTimePicker} accessibilityRole="button">
                <Text style={styles.iosPickerButton}>Listo</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker value={pickerTime} mode="time" is24Hour display="spinner" onChange={handleTimeChange} style={styles.iosPicker} />
          </View>
        ) : (
          <DateTimePicker value={pickerTime} mode="time" is24Hour display="default" onChange={handleTimeChange} />
        )
      )}

      <CoachMark
        screen="schedule"
        enabled={!loading && !showTimePicker && !showSuccessModal && errorMessage === null}
        steps={[
          {
            target: quickRef,
            title: 'Elige tus días',
            text: 'Marca todos los días, entre semana o fines de semana.',
          },
          {
            target: daysRef,
            title: 'Ajusta cada día',
            text: 'Toca una hora para cambiarla o apaga el día. Al terminar, toca «Guardar».',
          },
        ]}
      />

      <ResultModal
        visible={showSuccessModal}
        icon="checkmark-circle-outline"
        title="Horarios guardados"
        subtitle="Nexus los usará en las próximas sugerencias."
        primary={{ label: 'Listo', onPress: () => { setShowSuccessModal(false); router.back(); } }}
        onRequestClose={() => setShowSuccessModal(false)}
      />
      <ResultModal
        visible={errorMessage !== null}
        icon="alert-circle-outline"
        tone="danger"
        title="Revisa tus horarios"
        subtitle={errorMessage ?? undefined}
        primary={{ label: 'Entendido', onPress: () => setErrorMessage(null) }}
        onRequestClose={() => setErrorMessage(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, gap: 24 },
  intro: { fontSize: 14, lineHeight: 20, color: palette.textSecondary },
  section: { gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { gap: 0 },
  divider: { height: 1, backgroundColor: palette.divider, marginVertical: 10 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 },
  dayName: { width: 84, fontSize: 15, fontWeight: '500', color: palette.text },
  dayOff: { color: palette.textSecondary },
  times: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  time: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
  },
  timeValue: { fontSize: 14, fontWeight: '600', color: palette.text },
  dash: { fontSize: 14, color: palette.textSecondary },
  offLabel: { flex: 1, fontSize: 13, color: palette.textSecondary },
  iosPickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: palette.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  iosPickerButton: { fontSize: 16, fontWeight: '600', color: palette.textAccent },
  iosPicker: { backgroundColor: palette.surface },
});
