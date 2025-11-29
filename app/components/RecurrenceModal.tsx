import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';

interface RecurrenceConfig {
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  customFrequency?: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: string;
  weekDays: number[];
  monthDay: Date | null;
  yearMonth: string;
  yearDay: Date | null;
  endDate: Date | null;
}

interface RecurrenceModalProps {
  visible: boolean;
  onSave: (config: RecurrenceConfig) => void;
  onCancel: () => void;
  initialConfig?: RecurrenceConfig;
}

export function RecurrenceModal({
  visible,
  onSave,
  onCancel,
  initialConfig,
}: RecurrenceModalProps) {
  const [type, setType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM'>(
    initialConfig?.type || 'DAILY'
  );
  const [customFrequency, setCustomFrequency] = useState<'WEEKLY' | 'MONTHLY' | 'YEARLY'>(
    initialConfig?.customFrequency || 'WEEKLY'
  );
  const [interval, setInterval] = useState(initialConfig?.interval || '1');
  const [weekDays, setWeekDays] = useState<number[]>(initialConfig?.weekDays || []);
  const [monthDay, setMonthDay] = useState<Date | null>(initialConfig?.monthDay || null);
  const [yearMonth, setYearMonth] = useState(initialConfig?.yearMonth || '1');
  const [yearDay, setYearDay] = useState<Date | null>(initialConfig?.yearDay || null);
  const [endDate, setEndDate] = useState<Date | null>(initialConfig?.endDate || null);

  const [showMonthDayPicker, setShowMonthDayPicker] = useState(false);
  const [showYearDayPicker, setShowYearDayPicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const toggleWeekDay = (day: number) => {
    if (weekDays.includes(day)) {
      setWeekDays(weekDays.filter((d) => d !== day));
    } else {
      setWeekDays([...weekDays, day].sort());
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Seleccionar fecha';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSave = () => {
    onSave({
      type,
      customFrequency,
      interval,
      weekDays,
      monthDay,
      yearMonth,
      yearDay,
      endDate,
    });
  };

  const onMonthDayChange = (event: any, date?: Date) => {
    setShowMonthDayPicker(Platform.OS === 'ios');
    if (date) {
      setMonthDay(date);
    }
  };

  const onYearDayChange = (event: any, date?: Date) => {
    setShowYearDayPicker(Platform.OS === 'ios');
    if (date) {
      setYearDay(date);
    }
  };

  const onEndDateChange = (event: any, date?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (date) {
      setEndDate(date);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
              <Ionicons name="close" size={24} color="#1A1A1A" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Configurar recurrencia</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Tipo de recurrencia */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipo de recurrencia</Text>
              <View style={styles.chipContainer}>
                {[
                  { label: 'Diaria', value: 'DAILY' as const },
                  { label: 'Semanal', value: 'WEEKLY' as const },
                  { label: 'Mensual', value: 'MONTHLY' as const },
                  { label: 'Personalizada', value: 'CUSTOM' as const },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.chip, type === item.value && styles.chipActive]}
                    onPress={() => setType(item.value)}
                  >
                    <Text style={[styles.chipText, type === item.value && styles.chipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Configuración personalizada */}
            {type === 'CUSTOM' && (
              <>
                {/* Frecuencia personalizada */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Frecuencia</Text>
                  <View style={styles.chipContainer}>
                    {[
                      { label: 'Semanal', value: 'WEEKLY' as const },
                      { label: 'Mensual', value: 'MONTHLY' as const },
                      { label: 'Anual', value: 'YEARLY' as const },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        style={[styles.chip, customFrequency === item.value && styles.chipActive]}
                        onPress={() => setCustomFrequency(item.value)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            customFrequency === item.value && styles.chipTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Intervalo */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Repetir cada {customFrequency === 'WEEKLY' ? 'semana(s)' : customFrequency === 'MONTHLY' ? 'mes(es)' : 'año(s)'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={interval}
                    onChangeText={setInterval}
                    placeholder="1"
                    placeholderTextColor="#1A1A1A66"
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>

                {/* Días de la semana */}
                {customFrequency === 'WEEKLY' && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Días de la semana</Text>
                    <View style={styles.weekDaysContainer}>
                      {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.weekDayButton,
                            weekDays.includes(index) && styles.weekDayButtonActive,
                          ]}
                          onPress={() => toggleWeekDay(index)}
                        >
                          <Text
                            style={[
                              styles.weekDayText,
                              weekDays.includes(index) && styles.weekDayTextActive,
                            ]}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Día del mes */}
                {customFrequency === 'MONTHLY' && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Día del mes</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowMonthDayPicker(true)}
                    >
                      <Ionicons name="calendar" size={20} color="#FF4F81" />
                      <Text style={[styles.dateButtonText, !monthDay && styles.placeholder]}>
                        {formatDate(monthDay)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Fecha del año (para anual) */}
                {customFrequency === 'YEARLY' && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Fecha del año (día y mes)</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowYearDayPicker(true)}
                    >
                      <Ionicons name="calendar" size={20} color="#FF4F81" />
                      <Text style={[styles.dateButtonText, !yearDay && styles.placeholder]}>
                        {formatDate(yearDay)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Fecha de finalización */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Finaliza el</Text>
                  <View style={styles.dateRow}>
                    <TouchableOpacity
                      style={[styles.dateButton, styles.dateButtonFlex]}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <Ionicons name="flag" size={20} color="#FF4F81" />
                      <Text style={[styles.dateButtonText, !endDate && styles.placeholder]}>
                        {formatDate(endDate)}
                      </Text>
                    </TouchableOpacity>
                    {endDate && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => setEndDate(null)}
                      >
                        <Ionicons name="close-circle" size={24} color="#FF4F81" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </>
            )}

            {/* Intervalo para opciones predefinidas */}
            {type !== 'CUSTOM' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Repetir cada {type === 'DAILY' ? 'día(s)' : type === 'WEEKLY' ? 'semana(s)' : 'mes(es)'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={interval}
                  onChangeText={setInterval}
                  placeholder="1"
                  placeholderTextColor="#1A1A1A66"
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            )}

            {/* Días de la semana para semanal predefinido */}
            {type === 'WEEKLY' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Días de la semana</Text>
                <View style={styles.weekDaysContainer}>
                  {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.weekDayButton,
                        weekDays.includes(index) && styles.weekDayButtonActive,
                      ]}
                      onPress={() => toggleWeekDay(index)}
                    >
                      <Text
                        style={[
                          styles.weekDayText,
                          weekDays.includes(index) && styles.weekDayTextActive,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Fecha de término para opciones predefinidas */}
            {type !== 'CUSTOM' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Termina el (opcional)</Text>
                <View style={styles.dateRow}>
                  <TouchableOpacity
                    style={[styles.dateButton, styles.dateButtonFlex]}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Ionicons name="flag" size={20} color="#FF4F81" />
                    <Text style={[styles.dateButtonText, !endDate && styles.placeholder]}>
                      {formatDate(endDate)}
                    </Text>
                  </TouchableOpacity>
                  {endDate && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => setEndDate(null)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF4F81" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Botones */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButtonWrapper} onPress={handleSave}>
              <LinearGradient
                colors={['#FF4F81', '#8A2BE2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Date Pickers */}
          {showMonthDayPicker && (
            <DateTimePicker
              value={monthDay || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onMonthDayChange}
              accentColor="#FF4F81"
              textColor="#1A1A1A"
            />
          )}

          {showYearDayPicker && (
            <DateTimePicker
              value={yearDay || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onYearDayChange}
              accentColor="#FF4F81"
              textColor="#1A1A1A"
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onEndDateChange}
              minimumDate={new Date()}
              accentColor="#FF4F81"
              textColor="#1A1A1A"
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '90%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  chipActive: {
    backgroundColor: '#FF4F8115',
    borderColor: '#FF4F81',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  chipTextActive: {
    color: '#FF4F81',
  },
  input: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 20,
    fontSize: 16,
    color: '#1A1A1A',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  weekDayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayButtonActive: {
    backgroundColor: '#FF4F8115',
    borderColor: '#FF4F81',
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  weekDayTextActive: {
    color: '#FF4F81',
  },
  dateButton: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateButtonFlex: {
    flex: 1,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  placeholder: {
    color: '#1A1A1A66',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearButton: {
    padding: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 2,
    borderTopColor: '#F0F0F0',
  },
  cancelButton: {
    flex: 1,
    height: 56,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#F7F7F7',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#1A1A1A',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButtonWrapper: {
    flex: 1,
  },
  saveButton: {
    height: 56,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
