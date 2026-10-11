import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
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
import { ConfirmModal } from "../components/ConfirmModal";
import { palette, gradients, switchColors } from "../../constants/colors";
import { ScreenHeader } from "../components/layout/ScreenHeader";

interface DaySchedule {
  day: string;
  dayName: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "22:00";

export default function AvailabilityScheduleScreen() {
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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
          return found ? {
            ...d,
            enabled: found.enabled,
            startTime: found.startTime,
            endTime: found.endTime,
          } : d;
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
    const timeStr = schedule[index][field];
    const [hours, minutes] = timeStr.split(':').map(Number);
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
      const timeStr = `${hours}:${minutes}`;
      
      const newSchedule = [...schedule];
      newSchedule[pickerDayIndex][pickerField] = timeStr;
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
      
      // Validaciones
      for (const d of schedule) {
        if (d.enabled) {
          const startParts = d.startTime.split(':').map(Number);
          const endParts = d.endTime.split(':').map(Number);
          if ((endParts[0] * 60 + endParts[1]) <= (startParts[0] * 60 + startParts[1])) {
            setErrorMessage(`En ${d.dayName} la hora fin debe ser mayor que inicio`);
            setShowErrorModal(true);
            setSaving(false);
            return;
          }
        }
      }

      const payload: AvailabilityScheduleDTO[] = schedule.map(d => ({
        day: d.day,
        enabled: d.enabled,
        startTime: d.startTime,
        endTime: d.endTime,
      }));
      
      await saveUserSchedule(user.userId, payload);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error guardando horarios:', error);
      setErrorMessage(error.message || 'No se pudo guardar la configuración');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const setQuickOption = (option: 'all' | 'weekdays' | 'weekends') => {
    const newSchedule = schedule.map(day => {
      if (option === 'all') {
        return { ...day, enabled: true };
      } else if (option === 'weekdays') {
        return { 
          ...day, 
          enabled: !['SATURDAY', 'SUNDAY'].includes(day.day) 
        };
      } else {
        return { 
          ...day, 
          enabled: ['SATURDAY', 'SUNDAY'].includes(day.day) 
        };
      }
    });
    setSchedule(newSchedule);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Horarios permitidos" onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader title="Horarios permitidos" onBack={() => router.back()} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Descripción */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={palette.secondary} />
          <Text style={styles.infoText}>
            Configura los horarios en los que prefieres recibir recomendaciones de disponibilidad mutua. 
            Estos horarios NO bloquean eventos, solo indican cuándo estás disponible para nuevas actividades.
          </Text>
        </View>

        {/* Opciones rápidas */}
        <View style={styles.quickOptions}>
          <Text style={styles.sectionTitle}>Opciones rápidas</Text>
          <View style={styles.quickButtonsRow}>
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => setQuickOption('all')}
            >
              <Ionicons name="calendar" size={18} color={palette.secondary} />
              <Text style={styles.quickButtonText}>Todos los días</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => setQuickOption('weekdays')}
            >
              <Ionicons name="briefcase" size={18} color={palette.secondary} />
              <Text style={styles.quickButtonText}>Entre semana</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.quickButton}
              onPress={() => setQuickOption('weekends')}
            >
              <Ionicons name="sunny" size={18} color={palette.secondary} />
              <Text style={styles.quickButtonText}>Fines de semana</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de días */}
        <View style={styles.daysSection}>
          <Text style={styles.sectionTitle}>Configuración por día</Text>
          
          {schedule.map((day, index) => (
            <View key={day.day} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day.dayName}</Text>
                <Switch
                  value={day.enabled}
                  onValueChange={() => toggleDay(index)}
                  {...switchColors}
                />
              </View>
              
              {day.enabled && (
                <View style={styles.timeRow}>
                  <TouchableOpacity 
                    style={styles.timeInput}
                    onPress={() => openTimePicker(index, 'startTime')}
                  >
                    <Ionicons name="time-outline" size={16} color={palette.textSecondary} />
                    <Text style={styles.timeLabel}>Desde</Text>
                    <Text style={styles.timeValue}>{day.startTime}</Text>
                    <Ionicons name="chevron-down" size={16} color={palette.textSecondary} />
                  </TouchableOpacity>
                  
                  <Ionicons name="arrow-forward" size={16} color={palette.textSecondary} />
                  
                  <TouchableOpacity 
                    style={styles.timeInput}
                    onPress={() => openTimePicker(index, 'endTime')}
                  >
                    <Ionicons name="time-outline" size={16} color={palette.textSecondary} />
                    <Text style={styles.timeLabel}>Hasta</Text>
                    <Text style={styles.timeValue}>{day.endTime}</Text>
                    <Ionicons name="chevron-down" size={16} color={palette.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Botón guardar */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            {saving ? (
              <ActivityIndicator color={palette.onPrimary} size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={palette.onPrimary} />
                <Text style={styles.saveButtonText}>Guardar configuración</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* DateTimePicker */}
      {showTimePicker && (
        <>
          {Platform.OS === 'ios' ? (
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosPickerHeader}>
                <TouchableOpacity onPress={closeTimePicker}>
                  <Text style={styles.iosPickerButton}>Listo</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={pickerTime}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={handleTimeChange}
                style={styles.iosPicker}
              />
            </View>
          ) : (
            <DateTimePicker
              value={pickerTime}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </>
      )}

      {/* Modales */}
      <ConfirmModal
        visible={showSuccessModal}
        type="success"
        title="¡Guardado!"
        message="Tu horario permitido ha sido actualizado correctamente"
        confirmText="Aceptar"
        showCancel={false}
        onConfirm={() => {
          setShowSuccessModal(false);
          router.back();
        }}
      />

      <ConfirmModal
        visible={showErrorModal}
        type="error"
        title="Error"
        message={errorMessage}
        confirmText="Aceptar"
        showCancel={false}
        onConfirm={() => setShowErrorModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: palette.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: palette.secondarySoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.secondaryBorder,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: palette.text,
    lineHeight: 20,
  },
  quickOptions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.text,
    marginBottom: 12,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: palette.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  quickButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.textAccent,
  },
  daysSection: {
    marginBottom: 24,
  },
  dayCard: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: palette.border,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.text,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.divider,
  },
  timeInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: palette.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: palette.border,
  },
  timeLabel: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.text,
    flex: 1,
  },
  saveButton: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.onPrimary,
  },
  bottomSpacer: {
    height: 40,
  },
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
  iosPickerButton: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.textAccent,
  },
  iosPicker: {
    backgroundColor: palette.surface,
  },
});
