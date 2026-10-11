import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from "../../context/AuthContext";
import eventService, { CreateEventRequest } from "../../services/event.service";
import { RecurrenceModal } from "../components/RecurrenceModal";
import { RemindersModal, Reminder } from "../components/RemindersModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { endFromDuration } from "../../utils/ideaFormat";
import { palette, gradients } from "../../constants/colors";
import { ScreenHeader } from "../components/layout/ScreenHeader";

export default function CreateEventScreen() {
  const router = useRouter();
  const { user } = useAuth();
  // RF-35: al proponer una idea del banco, llega prellenado (ver utils/ideaFormat.proposalParams).
  const { ideaTitle, ideaDescription, ideaDuration } = useLocalSearchParams<{
    ideaTitle?: string;
    ideaDescription?: string;
    ideaDuration?: string;
  }>();

  // Estados del formulario
  const [title, setTitle] = useState(ideaTitle ?? '');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [isAllDay, setIsAllDay] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [recurrenceConfig, setRecurrenceConfig] = useState<any>(null);
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState(ideaTitle ? 'Cita' : '');
  const [description, setDescription] = useState(ideaDescription ?? '');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(palette.primary);
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [startDateSelected, setStartDateSelected] = useState(false);
  const [endDateSelected, setEndDateSelected] = useState(false);
  const [startTimeSelected, setStartTimeSelected] = useState(false);
  const [endTimeSelected, setEndTimeSelected] = useState(false);
  
  // Estados para modales de confirmación
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const colors = [
    { name: 'Rosa', value: '#FF4F81' },
    { name: 'Violeta', value: '#8A2BE2' },
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Naranja', value: '#F59E0B' },
    { name: 'Rojo', value: '#EF4444' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'El título es obligatorio';
    } else if (title.length > 255) {
      newErrors.title = 'El título no puede exceder 255 caracteres';
    }
    
    if (!startDateSelected) {
      newErrors.startDate = 'La fecha de inicio es obligatoria';
    }
    
    if (!endDateSelected) {
      newErrors.endDate = 'La fecha de fin es obligatoria';
    }
    
    if (!isAllDay && !startTimeSelected) {
      newErrors.startTime = 'La hora de inicio es obligatoria';
    }
    
    if (!isAllDay && !endTimeSelected) {
      newErrors.endTime = 'La hora de fin es obligatoria';
    }
    
    if (location && location.length > 500) {
      newErrors.location = 'La ubicación no puede exceder 500 caracteres';
    }
    
    if (category && category.length > 100) {
      newErrors.category = 'La categoría no puede exceder 100 caracteres';
    }
    
    if (description && description.length > 2000) {
      newErrors.description = 'La descripción no puede exceder 2000 caracteres';
    }
    
    if (isRecurring) {
      if (!recurrenceConfig) {
        newErrors.recurrence = 'Debes configurar la recurrencia';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.userId) {
      setErrorMessage('No se pudo identificar el usuario');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    
    try {
      // Combinar fecha y hora
      let startDateTime: Date;
      let endDateTime: Date;
      
      if (isAllDay) {
        // Todo el día: crear fechas en UTC directamente para evitar conversión de zona horaria
        // Backend espera: 2025-12-14T00:00:00.000Z para el 14 de diciembre
        startDateTime = new Date(Date.UTC(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
          0,
          0,
          0,
          0
        ));
        endDateTime = new Date(Date.UTC(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
          23,
          59,
          59,
          999
        ));
      } else {
        // Con hora específica: usar conversión normal (local -> UTC)
        startDateTime = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
          startTime.getHours(),
          startTime.getMinutes()
        );
        endDateTime = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
          endTime.getHours(),
          endTime.getMinutes()
        );
      }

      // Construir patrón de recurrencia si aplica
      let recurrencePattern: string | undefined = undefined;
      if (isRecurring && recurrenceConfig) {
        const parts: string[] = [];
        const config = recurrenceConfig;
        
        if (config.type === 'CUSTOM') {
          // Personalizada: usar la frecuencia custom
          parts.push(`FREQ=${config.customFrequency}`);
          parts.push(`INTERVAL=${config.interval}`);
          
          if (config.customFrequency === 'WEEKLY' && config.weekDays.length > 0) {
            const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
            const byday = config.weekDays.map((d: number) => days[d]).join(',');
            parts.push(`BYDAY=${byday}`);
          }
          
          if (config.customFrequency === 'MONTHLY' && config.monthDay) {
            const day = config.monthDay.getDate();
            parts.push(`BYMONTHDAY=${day}`);
          }
          
          if (config.customFrequency === 'YEARLY') {
            if (config.yearDay) {
              const month = config.yearDay.getMonth() + 1; // getMonth() retorna 0-11
              const day = config.yearDay.getDate();
              parts.push(`BYMONTH=${month}`);
              parts.push(`BYMONTHDAY=${day}`);
            }
          }
        } else {
          // Predefinida: usar el tipo directo
          parts.push(`FREQ=${config.type}`);
          parts.push(`INTERVAL=${config.interval}`);
          
          if (config.type === 'WEEKLY' && config.weekDays.length > 0) {
            const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
            const byday = config.weekDays.map((d: number) => days[d]).join(',');
            parts.push(`BYDAY=${byday}`);
          }
        }
        
        if (config.endDate) {
          const endDateStr = config.endDate.toISOString().split('T')[0].replace(/-/g, '');
          parts.push(`UNTIL=${endDateStr}`);
        }
        
        recurrencePattern = parts.join(';');
      }

      const eventData: CreateEventRequest = {
        title: title.trim(),
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        location: location.trim() || undefined,
        category: category.trim() || undefined,
        description: description.trim() || undefined,
        reminderMinutes: reminders.length > 0 ? reminders[0].minutesBefore : undefined, // Compatibilidad
        reminders: reminders.map(r => ({ minutesBefore: r.minutesBefore, label: r.label })),
        isRecurring: isRecurring,
        recurrencePattern: recurrencePattern,
        color: selectedColor,
      };

      console.log('📝 Enviando evento al backend:', {
        ...eventData,
        isRecurring: eventData.isRecurring,
        recurrencePattern: eventData.recurrencePattern,
        typeOfIsRecurring: typeof eventData.isRecurring,
        typeOfPattern: typeof eventData.recurrencePattern,
      });

      const response = await eventService.createEvent(user.userId, eventData);
      
      setSuccessMessage(response.message || 'El evento ha sido creado exitosamente y está pendiente de aprobación de tu pareja.');
      setShowSuccessModal(true);
      
    } catch (error: any) {
      console.error('Error creando evento:', error);
      const errMsg = error.message || 'Error al crear el evento. Inténtalo de nuevo.';
      setErrorMessage(errMsg);
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const onStartDateChange = (event: any, date?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (date) {
      setStartDate(date);
      setStartDateSelected(true);
      // Auto-ajustar fecha fin si es antes de la fecha inicio
      if (!endDateSelected || endDate < date) {
        setEndDate(date);
        setEndDateSelected(true);
      }
    }
  };

  const onEndDateChange = (event: any, date?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (date) {
      setEndDate(date);
      setEndDateSelected(true);
    }
  };

  const onStartTimeChange = (event: any, time?: Date) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (time) {
      setStartTime(time);
      setStartTimeSelected(true);
      // RF-35: si viene de una idea y aun no se eligio fin, sugiere inicio + duracion de la idea.
      if (ideaDuration && !endTimeSelected) {
        setEndTime(endFromDuration(time, ideaDuration));
        setEndTimeSelected(true);
      }
    }
  };

  const onEndTimeChange = (event: any, time?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (time) {
      setEndTime(time);
      setEndTimeSelected(true);
    }
  };

  const handleSaveRecurrence = (config: any) => {
    setRecurrenceConfig(config);
    setIsRecurring(true);
    setShowRecurrenceModal(false);
  };

  const handleSaveReminders = (newReminders: Reminder[]) => {
    setReminders(newReminders);
  };

  const formatDate = (date: Date | null, selected: boolean): string => {
    if (!selected || !date) return 'DD/MM/YYYY';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (time: Date | null, selected: boolean): string => {
    if (!selected || !time) return 'HH:MM';
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      {/* Header estilo Figma */}
      <ScreenHeader
        title="Nuevo evento"
        onBack={() => router.back()}
        backDisabled={loading}
        right={
          <TouchableOpacity
            onPress={handleCreateEvent}
            disabled={!title || !startDateSelected || !endDateSelected || (!isAllDay && (!startTimeSelected || !endTimeSelected)) || loading}
            style={styles.headerAction}
            accessibilityRole="button"
          >
            <Text style={[
              styles.headerActionText,
              (!title || !startDateSelected || !endDateSelected || (!isAllDay && (!startTimeSelected || !endTimeSelected)) || loading) && styles.headerActionDisabled
            ]}>
              Crear
            </Text>
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView style={styles.keyboardAvoider} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Título */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Ionicons name="text" size={20} color={palette.primary} />
            <Text style={styles.label}>Título del evento</Text>
          </View>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={title}
            onChangeText={setTitle}
            placeholder="Cita romántica, Aniversario..."
            placeholderTextColor={palette.textMuted}
            maxLength={255}
            editable={!loading}
          />
          {errors.title && (
            <Text style={styles.errorText}>{errors.title}</Text>
          )}
        </View>

        {/* Todo el día */}
        <View style={styles.allDayContainer}>
          <View style={styles.labelContainer}>
            <Ionicons name="time-outline" size={20} color={palette.primary} />
            <Text style={styles.label}>Todo el día</Text>
          </View>
          <TouchableOpacity accessibilityRole="switch" accessibilityLabel="Todo el día" accessibilityState={{ checked: isAllDay }}
            style={[styles.switch, isAllDay && styles.switchActive]}
            onPress={() => setIsAllDay(!isAllDay)}
            activeOpacity={0.7}
          >
            <View style={[styles.switchThumb, isAllDay && styles.switchThumbActive]} />
          </TouchableOpacity>
        </View>

        {/* Fecha y hora de inicio */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Ionicons name="calendar-outline" size={20} color={palette.primary} />
            <Text style={styles.label}>Inicio</Text>
          </View>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.dateInput, styles.inputWrapper, errors.startDate && styles.inputError]}
              onPress={() => setShowStartDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.input, styles.dateText, !startDateSelected && styles.placeholder]}>
                {formatDate(startDate, startDateSelected)}
              </Text>
            </TouchableOpacity>
            {!isAllDay && (
              <TouchableOpacity
                style={[styles.timeInput, styles.inputWrapper, errors.startTime && styles.inputError]}
                onPress={() => setShowStartTimePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.input, styles.dateText, !startTimeSelected && styles.placeholder]}>
                  {formatTime(startTime, startTimeSelected)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {(errors.startDate || errors.startTime) && (
            <Text style={styles.errorText}>{errors.startDate || errors.startTime}</Text>
          )}
        </View>

        {/* Fecha y hora de fin */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Ionicons name="calendar-outline" size={20} color={palette.primary} />
            <Text style={styles.label}>Fin</Text>
          </View>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.dateInput, styles.inputWrapper, errors.endDate && styles.inputError]}
              onPress={() => setShowEndDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.input, styles.dateText, !endDateSelected && styles.placeholder]}>
                {formatDate(endDate, endDateSelected)}
              </Text>
            </TouchableOpacity>
            {!isAllDay && (
              <TouchableOpacity
                style={[styles.timeInput, styles.inputWrapper, errors.endTime && styles.inputError]}
                onPress={() => setShowEndTimePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.input, styles.dateText, !endTimeSelected && styles.placeholder]}>
                  {formatTime(endTime, endTimeSelected)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {(errors.endDate || errors.endTime) && (
            <Text style={styles.errorText}>{errors.endDate || errors.endTime}</Text>
          )}
        </View>

        {/* Ubicación */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Ionicons name="location" size={20} color={palette.primary} />
            <Text style={styles.label}>Ubicación (opcional)</Text>
          </View>
          <TextInput
            style={[styles.input, errors.location && styles.inputError]}
            value={location}
            onChangeText={setLocation}
            placeholder="Restaurante favorito, Casa..."
            placeholderTextColor={palette.textMuted}
            maxLength={500}
            editable={!loading}
          />
        </View>

        {/* Evento recurrente */}
        <View style={styles.allDayContainer}>
          <View style={styles.labelContainer}>
            <Ionicons name="repeat" size={20} color={palette.primary} />
            <Text style={styles.label}>Evento recurrente</Text>
          </View>
          <TouchableOpacity accessibilityRole="switch" accessibilityLabel="Evento recurrente" accessibilityState={{ checked: isRecurring }}
            style={[styles.switch, isRecurring && styles.switchActive]}
            onPress={() => {
              if (!isRecurring) {
                setShowRecurrenceModal(true);
              } else {
                setIsRecurring(false);
                setRecurrenceConfig(null);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.switchThumb, isRecurring && styles.switchThumbActive]} />
          </TouchableOpacity>
        </View>

        {/* Configuración de recurrencia */}
        {isRecurring && recurrenceConfig && (
          <TouchableOpacity
            style={styles.recurrenceSummary}
            onPress={() => setShowRecurrenceModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.recurrenceSummaryContent}>
              <Ionicons name="settings-outline" size={20} color={palette.secondary} />
              <Text style={styles.recurrenceSummaryText}>
                {recurrenceConfig.type === 'CUSTOM'
                  ? `${recurrenceConfig.customFrequency === 'WEEKLY' ? 'Semanal' : recurrenceConfig.customFrequency === 'MONTHLY' ? 'Mensual' : 'Anual'} personalizado`
                  : `${recurrenceConfig.type === 'DAILY' ? 'Diaria' : recurrenceConfig.type === 'WEEKLY' ? 'Semanal' : 'Mensual'}`}
                {recurrenceConfig.endDate && ` hasta ${new Date(recurrenceConfig.endDate).toLocaleDateString('es-ES')}`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={palette.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Color picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Color del evento</Text>
          <View style={styles.colorGrid}>
            {colors.map((color) => (
              <TouchableOpacity
                key={color.value}
                onPress={() => setSelectedColor(color.value)}
                style={[
                  styles.colorButton,
                  { backgroundColor: color.value },
                  selectedColor === color.value && styles.colorButtonActive,
                ]}
                disabled={loading}
              />
            ))}
          </View>
        </View>

        {/* Categoría */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Ionicons name="pricetag" size={20} color={palette.primary} />
            <Text style={styles.label}>Categoría (opcional)</Text>
          </View>
          <View style={styles.categoryContainer}>
            {['Romántica', 'Diversión', 'Especial', 'Cita'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === cat && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Descripción */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Ionicons name="document-text" size={20} color={palette.primary} />
            <Text style={styles.label}>Descripción (opcional)</Text>
          </View>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            value={description}
            onChangeText={setDescription}
            placeholder="Añade detalles sobre el evento..."
            placeholderTextColor={palette.textMuted}
            maxLength={2000}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>

        {/* Recordatorios */}
        <View style={styles.inputGroup}>
          <View style={styles.labelContainer}>
            <Ionicons name="notifications" size={20} color={palette.primary} />
            <Text style={styles.label}>Recordatorios (opcional)</Text>
          </View>
          <TouchableOpacity
            style={styles.remindersButton}
            onPress={() => setShowRemindersModal(true)}
            disabled={loading}
          >
            <Ionicons name="alarm" size={20} color={palette.primary} />
            <Text style={styles.remindersButtonText}>
              {reminders.length === 0
                ? 'Agregar recordatorios'
                : `${reminders.length} recordatorio${reminders.length > 1 ? 's' : ''}`}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={palette.icon} />
          </TouchableOpacity>

          {reminders.length > 0 && (
            <View style={styles.remindersPreview}>
              {reminders.slice(0, 3).map((reminder) => (
                <View key={reminder.id} style={styles.reminderTag}>
                  <Text style={styles.reminderTagText}>{reminder.label}</Text>
                </View>
              ))}
              {reminders.length > 3 && (
                <Text style={styles.remindersMore}>+{reminders.length - 3} más</Text>
              )}
            </View>
          )}
        </View>

        {/* Botón crear (móvil) */}
        <TouchableOpacity
          style={[styles.createButton, (!title || !startDateSelected || !endDateSelected || (!isAllDay && (!startTimeSelected || !endTimeSelected)) || loading) && styles.createButtonDisabled]}
          onPress={handleCreateEvent}
          disabled={!title || !startDateSelected || !endDateSelected || (!isAllDay && (!startTimeSelected || !endTimeSelected)) || loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color={palette.onPrimary} size="small" />
            ) : (
              <Text style={styles.createButtonText}>Crear evento</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Date/Time Pickers Nativos */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartDateChange}
          minimumDate={new Date()}
          accentColor={palette.primary}
          textColor={palette.text}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndDateChange}
          minimumDate={startDate}
          accentColor={palette.primary}
          textColor={palette.text}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartTimeChange}
          is24Hour={true}
          accentColor={palette.primary}
          textColor={palette.text}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndTimeChange}
          is24Hour={true}
          accentColor={palette.primary}
          textColor={palette.text}
        />
      )}

      {/* Modal de recurrencia */}
      <RecurrenceModal
        visible={showRecurrenceModal}
        onSave={handleSaveRecurrence}
        onCancel={() => setShowRecurrenceModal(false)}
        initialConfig={recurrenceConfig}
      />

      {/* Modal de recordatorios */}
      <RemindersModal
        visible={showRemindersModal}
        onClose={() => setShowRemindersModal(false)}
        onSave={handleSaveReminders}
        initialReminders={reminders}
        eventStartDate={startDate}
      />

      {/* Modal de error */}
      <ConfirmModal
        visible={showErrorModal}
        type="error"
        title="Error"
        message={errorMessage}
        confirmText="OK"
        showCancel={false}
        onConfirm={() => setShowErrorModal(false)}
      />

      {/* Modal de éxito */}
      <ConfirmModal
        visible={showSuccessModal}
        type="success"
        title="Evento Creado"
        message={successMessage}
        confirmText="Ver Calendario"
        cancelText="Crear Otro"
        onConfirm={() => {
          setShowSuccessModal(false);
          router.replace('/(tabs)/calendario');
        }}
        onCancel={() => {
          setShowSuccessModal(false);
          // Limpiar el formulario para crear otro evento
          setTitle('');
          setLocation('');
          setCategory('');
          setDescription('');
          setReminders([]);
          setIsRecurring(false);
          setRecurrenceConfig(null);
          setStartDate(new Date());
          setEndDate(new Date());
          setStartTime(new Date());
          setEndTime(new Date());
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoider: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  headerAction: {
    padding: 8,
  },
  headerActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.textAccent,
  },
  headerActionDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: palette.text,
  },
  input: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 20,
    fontSize: 16,
    color: palette.text,
    justifyContent: "center",
  },
  inputWrapper: {
    height: 56,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 20,
    justifyContent: "center",
  },
  dateText: {
    fontSize: 16,
    color: palette.text,
    textAlign: "center",
    paddingVertical: 14,
  },
  placeholder: {
    color: palette.textMuted,
  },
  allDayContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.border,
    padding: 2,
    justifyContent: "center",
  },
  switchActive: {
    backgroundColor: palette.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.surface,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateInput: {
    flex: 2,
  },
  timeInput: {
    flex: 1,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: palette.surfaceMuted,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 20,
    fontSize: 16,
    color: palette.text,
    minHeight: 120,
  },
  inputError: {
    borderColor: palette.primary,
  },
  errorText: {
    fontSize: 13,
    color: palette.textAccent,
    fontWeight: "500",
    marginTop: 4,
  },
  colorGrid: {
    flexDirection: "row",
    gap: 12,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 0,
  },
  colorButtonActive: {
    borderWidth: 4,
    borderColor: palette.primaryBorder,
    transform: [{ scale: 1.1 }],
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: palette.divider,
    borderWidth: 2,
    borderColor: palette.divider,
  },
  categoryChipActive: {
    backgroundColor: palette.primarySoft,
    borderColor: palette.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.textSecondary,
  },
  categoryChipTextActive: {
    color: palette.textAccent,
  },
  remindersButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: palette.surfaceMuted,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  remindersButtonText: {
    flex: 1,
    fontSize: 15,
    color: palette.text,
  },
  remindersPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  reminderTag: {
    backgroundColor: palette.primarySoft,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.primaryBorder,
  },
  reminderTagText: {
    fontSize: 12,
    color: palette.textAccent,
  },
  remindersMore: {
    fontSize: 12,
    color: palette.textMuted,
    paddingVertical: 6,
  },
  recurrenceSummary: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: palette.surfaceMuted,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: palette.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recurrenceSummaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recurrenceSummaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.textAccent,
    flex: 1,
  },
  createButton: {
    height: 56,
    borderRadius: 24,
    overflow: "hidden",
    marginTop: 8,
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  createButtonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  createButtonText: {
    color: palette.onPrimary,
    fontSize: 17,
    fontWeight: "700",
  },
  bottomSpacer: {
    height: 20,
  },
});
