import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from "../../context/AuthContext";
import eventService, { EventResponse } from "../../services/event.service";
import { RecurrenceModal } from "../components/RecurrenceModal";
import { RemindersModal, Reminder } from "../components/RemindersModal";
import { ConfirmModal } from "../components/ConfirmModal";

export default function EditEventScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const eventId = params.eventId as string;
  
  // Estados del formulario
  const [originalEvent, setOriginalEvent] = useState<EventResponse | null>(null);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [isAllDay, setIsAllDay] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [recurrenceConfig, setRecurrenceConfig] = useState<any>(null);
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#FF4F81');
  
  // Estados de UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const colors = [
    { name: 'Rosa', value: '#FF4F81' },
    { name: 'Violeta', value: '#8A2BE2' },
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Naranja', value: '#F59E0B' },
    { name: 'Rojo', value: '#EF4444' },
  ];

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const parseRecurrencePattern = (pattern: string): any | null => {
    try {
      const parts = pattern.split(';');
      const config: any = {
        interval: 1,
        weekDays: [],
        endDate: null,
      };

      parts.forEach(part => {
        const [key, value] = part.split('=');
        
        if (key === 'FREQ') {
          // Si es DAILY, WEEKLY, MONTHLY usar como type
          // Si no, considerar CUSTOM
          if (['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(value)) {
            config.type = value;
            if (value === 'YEARLY') {
              config.type = 'CUSTOM';
              config.customFrequency = 'YEARLY';
            }
          }
        } else if (key === 'INTERVAL') {
          config.interval = parseInt(value);
        } else if (key === 'BYDAY') {
          const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
          const dayValues = value.split(',');
          config.weekDays = dayValues.map(d => days.indexOf(d)).filter(i => i !== -1);
        } else if (key === 'BYMONTHDAY') {
          // Para eventos mensuales, crear una fecha con ese día
          const day = parseInt(value);
          const date = new Date();
          date.setDate(day);
          config.monthDay = date;
          if (config.type === 'MONTHLY' && config.interval > 1) {
            config.type = 'CUSTOM';
            config.customFrequency = 'MONTHLY';
          }
        } else if (key === 'BYMONTH') {
          config.month = parseInt(value);
        } else if (key === 'UNTIL') {
          // Formato: YYYYMMDD
          const year = parseInt(value.substring(0, 4));
          const month = parseInt(value.substring(4, 6)) - 1;
          const day = parseInt(value.substring(6, 8));
          config.endDate = new Date(year, month, day);
        }
      });

      // Si tiene BYMONTH y BYMONTHDAY, es YEARLY
      if (config.month && parts.some(p => p.startsWith('BYMONTHDAY'))) {
        const day = parseInt(parts.find(p => p.startsWith('BYMONTHDAY'))!.split('=')[1]);
        const date = new Date();
        date.setMonth(config.month - 1);
        date.setDate(day);
        config.yearDay = date;
        config.type = 'CUSTOM';
        config.customFrequency = 'YEARLY';
      }

      // Si interval > 1 y no es DAILY simple, es CUSTOM
      if (config.interval > 1 && config.type !== 'DAILY') {
        config.customFrequency = config.type;
        config.type = 'CUSTOM';
      }

      // Si tiene weekDays y es WEEKLY con interval > 1, es CUSTOM
      if (config.type === 'WEEKLY' && config.interval > 1 && config.weekDays.length > 0) {
        config.customFrequency = 'WEEKLY';
        config.type = 'CUSTOM';
      }

      return config;
    } catch (error) {
      console.error('Error parseando recurrence pattern:', error);
      return null;
    }
  };

  const loadEvent = async () => {
    if (!user?.userId || !eventId) {
      setErrorMessage('No se pudo cargar el evento');
      setShowErrorModal(true);
      router.back();
      return;
    }

    try {
      setLoading(true);
      const events = await eventService.getUserEvents(user.userId);
      const event = events.find(e => e.id === parseInt(eventId));
      
      if (!event) {
        setErrorMessage('Evento no encontrado');
        setShowErrorModal(true);
        router.back();
        return;
      }

      setOriginalEvent(event);
      
      // Cargar datos del evento
      setTitle(event.title);
      
      const start = new Date(event.startDateTime);
      const end = new Date(event.endDateTime);
      
      setStartDate(start);
      setEndDate(end);
      setStartTime(start);
      setEndTime(end);
      setStartDateSelected(true);
      setEndDateSelected(true);
      setStartTimeSelected(true);
      setEndTimeSelected(true);
      
      // Detectar si es todo el día
      const isAllDayEvent = start.getHours() === 0 && start.getMinutes() === 0 &&
                            end.getHours() === 23 && end.getMinutes() === 59;
      setIsAllDay(isAllDayEvent);
      
      setLocation(event.location || '');
      setCategory(event.category || '');
      setDescription(event.description || '');
      setSelectedColor(event.color || '#FF4F81');
      
      // Cargar recurrencia
      if (event.isRecurring && event.recurrencePattern) {
        setIsRecurring(true);
        const parsedConfig = parseRecurrencePattern(event.recurrencePattern);
        if (parsedConfig) {
          setRecurrenceConfig(parsedConfig);
        }
      }
      
      // Cargar recordatorios - priorizar array de reminders si existe
      if (event.reminders && event.reminders.length > 0) {
        const loadedReminders: Reminder[] = event.reminders.map((r, index) => ({
          id: `reminder-${r.minutesBefore}-${index}`,
          minutesBefore: r.minutesBefore,
          label: r.label || formatMinutesLabel(r.minutesBefore),
        }));
        setReminders(loadedReminders);
      } else if (event.reminderMinutes) {
        // Fallback para eventos antiguos con reminderMinutes
        const reminder: Reminder = {
          id: `reminder-${event.reminderMinutes}`,
          minutesBefore: event.reminderMinutes,
          label: formatMinutesLabel(event.reminderMinutes),
        };
        setReminders([reminder]);
      }
      
    } catch (error: any) {
      console.error('Error cargando evento:', error);
      setErrorMessage('No se pudo cargar el evento');
      setShowErrorModal(true);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const formatMinutesLabel = (minutes: number): string => {
    if (minutes === 0) return "Al momento del evento";
    if (minutes < 60) return `${minutes} minutos antes`;
    if (minutes === 60) return "1 hora antes";
    if (minutes < 1440) return `${Math.floor(minutes / 60)} horas antes`;
    if (minutes === 1440) return "1 día antes";
    return `${Math.floor(minutes / 1440)} días antes`;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'El título es obligatorio';
    } else if (title.length > 255) {
      newErrors.title = 'El título no puede exceder 255 caracteres';
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
    
    if (isRecurring && !recurrenceConfig) {
      newErrors.recurrence = 'Debes configurar la recurrencia';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveEvent = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.userId || !eventId) {
      setErrorMessage('No se pudo identificar el usuario o el evento');
      setShowErrorModal(true);
      return;
    }

    setSaving(true);
    
    try {
      // Combinar fecha y hora
      let startDateTime: Date;
      let endDateTime: Date;
      
      if (isAllDay) {
        startDateTime = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
          0,
          0,
          0
        );
        endDateTime = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate(),
          23,
          59,
          59
        );
      } else {
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

      // Construir patrón de recurrencia
      let recurrencePattern: string | undefined = undefined;
      if (isRecurring && recurrenceConfig) {
        const parts: string[] = [];
        const config = recurrenceConfig;
        
        if (config.type === 'CUSTOM') {
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
          
          if (config.customFrequency === 'YEARLY' && config.yearDay) {
            const month = config.yearDay.getMonth() + 1;
            const day = config.yearDay.getDate();
            parts.push(`BYMONTH=${month}`);
            parts.push(`BYMONTHDAY=${day}`);
          }
        } else {
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

      const eventData: any = {
        title: title.trim(),
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        location: location.trim() || undefined,
        category: category.trim() || undefined,
        description: description.trim() || undefined,
        reminderMinutes: reminders.length > 0 ? reminders[0].minutesBefore : undefined,
        isRecurring: isRecurring,
        recurrencePattern: recurrencePattern,
        color: selectedColor,
      };

      await eventService.updateEvent(parseInt(eventId), user.userId, eventData);
      
      setSuccessMessage('Los cambios han sido guardados y están pendientes de aprobación de tu pareja.');
      setShowSuccessModal(true);
      
    } catch (error: any) {
      console.error('Error actualizando evento:', error);
      const errMsg = error.message || 'Error al actualizar el evento. Inténtalo de nuevo.';
      setErrorMessage(errMsg);
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = () => {
    if (!user?.userId) {
      setErrorMessage('No se pudo identificar el usuario');
      setShowErrorModal(true);
      return;
    }

    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!user?.userId) return;
    
    try {
      setShowDeleteConfirm(false);
      setSaving(true);
      await eventService.deleteEvent(parseInt(eventId), user.userId);
      setSuccessMessage('El evento ha sido eliminado exitosamente');
      setShowSuccessModal(true);
    } catch (error) {
      setErrorMessage('No se pudo eliminar el evento');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const onStartDateChange = (event: any, date?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (date) {
      setStartDate(date);
      if (endDate < date) {
        setEndDate(date);
      }
    }
  };

  const onEndDateChange = (event: any, date?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (date) setEndDate(date);
  };

  const onStartTimeChange = (event: any, time?: Date) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (time) setStartTime(time);
  };

  const onEndTimeChange = (event: any, time?: Date) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (time) setEndTime(time);
  };

  const handleSaveRecurrence = (config: any) => {
    setRecurrenceConfig(config);
    setIsRecurring(true);
    setShowRecurrenceModal(false);
  };

  const handleSaveReminders = (newReminders: Reminder[]) => {
    setReminders(newReminders);
  };

  const formatDate = (date: Date, selected: boolean = true): string => {
    if (!selected) return 'Seleccionar fecha';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (date: Date, selected: boolean = true): string => {
    if (!selected) return 'Seleccionar hora';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF4F81" />
          <Text style={styles.loadingText}>Cargando evento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#FFF5F8", "#FFFFFF"]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Evento</Text>
          <TouchableOpacity onPress={handleDeleteEvent} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Título */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="create" size={20} color="#FF4F81" />
              <Text style={styles.label}>Título</Text>
            </View>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={title}
              onChangeText={setTitle}
              placeholder="Cita romántica, Aniversario..."
              placeholderTextColor="#1A1A1A66"
              maxLength={255}
              editable={!saving}
            />
            {errors.title && (
              <Text style={styles.errorText}>{errors.title}</Text>
            )}
          </View>

          {/* Todo el día */}
          <View style={styles.allDayContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="time-outline" size={20} color="#FF4F81" />
              <Text style={styles.label}>Todo el día</Text>
            </View>
            <TouchableOpacity
              style={[styles.switch, isAllDay && styles.switchActive]}
              onPress={() => setIsAllDay(!isAllDay)}
              activeOpacity={0.7}
              disabled={saving}
            >
              <View style={[styles.switchThumb, isAllDay && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>

          {/* Fecha y hora de inicio */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="calendar-outline" size={20} color="#FF4F81" />
              <Text style={styles.label}>Inicio</Text>
            </View>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.dateInput, styles.inputWrapper]}
                onPress={() => setShowStartDatePicker(true)}
                activeOpacity={0.7}
                disabled={saving}
              >
                <Text style={[styles.input, styles.dateText]}>
                  {formatDate(startDate)}
                </Text>
              </TouchableOpacity>
              {!isAllDay && (
                <TouchableOpacity
                  style={[styles.timeInput, styles.inputWrapper]}
                  onPress={() => setShowStartTimePicker(true)}
                  activeOpacity={0.7}
                  disabled={saving}
                >
                  <Text style={[styles.input, styles.dateText]}>
                    {formatTime(startTime)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Fecha y hora de fin */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="calendar-outline" size={20} color="#FF4F81" />
              <Text style={styles.label}>Fin</Text>
            </View>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.dateInput, styles.inputWrapper]}
                onPress={() => setShowEndDatePicker(true)}
                activeOpacity={0.7}
                disabled={saving}
              >
                <Text style={[styles.input, styles.dateText]}>
                  {formatDate(endDate)}
                </Text>
              </TouchableOpacity>
              {!isAllDay && (
                <TouchableOpacity
                  style={[styles.timeInput, styles.inputWrapper]}
                  onPress={() => setShowEndTimePicker(true)}
                  activeOpacity={0.7}
                  disabled={saving}
                >
                  <Text style={[styles.input, styles.dateText]}>
                    {formatTime(endTime)}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Ubicación */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="location" size={20} color="#FF4F81" />
              <Text style={styles.label}>Ubicación (opcional)</Text>
            </View>
            <TextInput
              style={[styles.input, errors.location && styles.inputError]}
              value={location}
              onChangeText={setLocation}
              placeholder="Restaurante favorito, Casa..."
              placeholderTextColor="#1A1A1A66"
              maxLength={500}
              editable={!saving}
            />
          </View>

          {/* Evento recurrente */}
          <View style={styles.allDayContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="repeat" size={20} color="#FF4F81" />
              <Text style={styles.label}>Evento recurrente</Text>
            </View>
            <TouchableOpacity
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
              disabled={saving}
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
              disabled={saving}
            >
              <View style={styles.recurrenceSummaryContent}>
                <Ionicons name="settings-outline" size={20} color="#8A2BE2" />
                <Text style={styles.recurrenceSummaryText}>
                  {recurrenceConfig.type === 'CUSTOM'
                    ? `${recurrenceConfig.customFrequency === 'WEEKLY' ? 'Semanal' : recurrenceConfig.customFrequency === 'MONTHLY' ? 'Mensual' : 'Anual'} personalizado`
                    : `${recurrenceConfig.type === 'DAILY' ? 'Diaria' : recurrenceConfig.type === 'WEEKLY' ? 'Semanal' : 'Mensual'}`}
                  {recurrenceConfig.endDate && ` hasta ${new Date(recurrenceConfig.endDate).toLocaleDateString('es-ES')}`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
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
                  disabled={saving}
                />
              ))}
            </View>
          </View>

          {/* Categoría */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="pricetag" size={20} color="#FF4F81" />
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
                  disabled={saving}
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
              <Ionicons name="document-text" size={20} color="#FF4F81" />
              <Text style={styles.label}>Descripción (opcional)</Text>
            </View>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              value={description}
              onChangeText={setDescription}
              placeholder="Añade detalles sobre el evento..."
              placeholderTextColor="#1A1A1A66"
              maxLength={2000}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!saving}
            />
          </View>

          {/* Recordatorios */}
          <View style={styles.inputGroup}>
            <View style={styles.labelContainer}>
              <Ionicons name="notifications" size={20} color="#FF4F81" />
              <Text style={styles.label}>Recordatorios (opcional)</Text>
            </View>
            <TouchableOpacity
              style={styles.remindersButton}
              onPress={() => setShowRemindersModal(true)}
              disabled={saving}
            >
              <Ionicons name="alarm" size={20} color="#FF4F81" />
              <Text style={styles.remindersButtonText}>
                {reminders.length === 0
                  ? 'Agregar recordatorios'
                  : `${reminders.length} recordatorio${reminders.length > 1 ? 's' : ''}`}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
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

          {/* Botones de acción */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveEvent}
              disabled={saving}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#FF4F81", "#8A2BE2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar cambios</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Date/Time Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onStartDateChange}
            accentColor="#FF4F81"
            textColor="#1A1A1A"
          />
        )}
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onEndDateChange}
            minimumDate={startDate}
            accentColor="#FF4F81"
            textColor="#1A1A1A"
          />
        )}
        {showStartTimePicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onStartTimeChange}
            accentColor="#FF4F81"
            textColor="#1A1A1A"
          />
        )}
        {showEndTimePicker && (
          <DateTimePicker
            value={endTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onEndTimeChange}
            accentColor="#FF4F81"
            textColor="#1A1A1A"
          />
        )}

        {/* Modals */}
        <RecurrenceModal
          visible={showRecurrenceModal}
          onCancel={() => setShowRecurrenceModal(false)}
          onSave={handleSaveRecurrence}
          initialConfig={recurrenceConfig}
        />

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
          title={successMessage.includes('eliminado') ? 'Evento Eliminado' : 'Evento Actualizado'}
          message={successMessage}
          confirmText="Ver Calendario"
          showCancel={false}
          onConfirm={() => {
            setShowSuccessModal(false);
            router.replace('/(tabs)/calendario');
          }}
        />

        {/* Modal de confirmación de eliminación */}
        <ConfirmModal
          visible={showDeleteConfirm}
          type="confirm"
          title="Eliminar Evento"
          message="¿Estás seguro de que deseas eliminar este evento?"
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          loading={saving}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 2,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    flex: 1,
    textAlign: "center",
  },
  deleteButton: {
    padding: 8,
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
    color: "#1A1A1A",
  },
  input: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 20,
    fontSize: 16,
    color: "#1A1A1A",
    justifyContent: "center",
  },
  inputWrapper: {
    height: 56,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 20,
    justifyContent: "center",
  },
  dateText: {
    fontSize: 16,
    color: "#1A1A1A",
    textAlign: "center",
    paddingVertical: 14,
  },
  placeholder: {
    color: "#1A1A1A66",
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
    backgroundColor: "#E0E0E0",
    padding: 2,
    justifyContent: "center",
  },
  switchActive: {
    backgroundColor: "#FF4F81",
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFF",
    shadowColor: "#000",
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
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 20,
    fontSize: 16,
    color: "#1A1A1A",
    minHeight: 120,
  },
  inputError: {
    borderColor: "#FF4F81",
  },
  errorText: {
    fontSize: 13,
    color: "#FF4F81",
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
    borderColor: "#FF4F8180",
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
    backgroundColor: "#F0F0F0",
    borderWidth: 2,
    borderColor: "#F0F0F0",
  },
  categoryChipActive: {
    backgroundColor: "#FF4F8115",
    borderColor: "#FF4F81",
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  categoryChipTextActive: {
    color: "#FF4F81",
  },
  recurrenceSummary: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#8A2BE2',
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
    color: '#8A2BE2',
    flex: 1,
  },
  remindersButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F5F5F5",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  remindersButtonText: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A1A",
  },
  remindersPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  reminderTag: {
    backgroundColor: "#FFF5F8",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFE0E9",
  },
  reminderTagText: {
    fontSize: 12,
    color: "#FF4F81",
  },
  remindersMore: {
    fontSize: 12,
    color: "#999",
    paddingVertical: 6,
  },
  actionButtons: {
    marginTop: 8,
  },
  saveButton: {
    height: 56,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#FF4F81",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
  bottomSpacer: {
    height: 20,
  },
});
