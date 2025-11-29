import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import { ConfirmModal } from "./ConfirmModal";

export interface Reminder {
  id: string;
  minutesBefore: number;
  label: string;
}

interface RemindersModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (reminders: Reminder[]) => void;
  initialReminders?: Reminder[];
  eventStartDate?: Date;
}

const PRESET_REMINDERS = [
  { minutesBefore: 0, label: "Al momento del evento" },
  { minutesBefore: 10, label: "10 minutos antes" },
  { minutesBefore: 30, label: "30 minutos antes" },
  { minutesBefore: 60, label: "1 hora antes" },
  { minutesBefore: 120, label: "2 horas antes" },
  { minutesBefore: 1440, label: "1 día antes" },
  { minutesBefore: 10080, label: "1 semana antes" },
];

export function RemindersModal({
  visible,
  onClose,
  onSave,
  initialReminders = [],
  eventStartDate,
}: RemindersModalProps) {
  const [selectedReminders, setSelectedReminders] = useState<Reminder[]>([]);
  const [customMinutes, setCustomMinutes] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  // Estados para modales de confirmación
  const [errorModal, setErrorModal] = useState<{visible: boolean, message: string}>({visible: false, message: ""});
  const [confirmNoReminders, setConfirmNoReminders] = useState(false);

  useEffect(() => {
    if (visible && initialReminders.length > 0) {
      setSelectedReminders(initialReminders);
    } else if (visible) {
      setSelectedReminders([]);
    }
  }, [visible, initialReminders]);

  const toggleReminder = (minutesBefore: number, label: string) => {
    const exists = selectedReminders.find(r => r.minutesBefore === minutesBefore);
    
    if (exists) {
      setSelectedReminders(prev => prev.filter(r => r.minutesBefore !== minutesBefore));
    } else {
      // Validar que el recordatorio sea antes del evento
      if (eventStartDate) {
        const reminderTime = new Date(eventStartDate.getTime() - minutesBefore * 60000);
        if (reminderTime < new Date()) {
          setErrorModal({visible: true, message: "El recordatorio ocurriría antes de la hora actual. Por favor selecciona otro."});
          return;
        }
      }
      
      const newReminder: Reminder = {
        id: `reminder-${Date.now()}-${minutesBefore}`,
        minutesBefore,
        label,
      };
      setSelectedReminders(prev => [...prev, newReminder]);
    }
  };

  const addCustomReminder = () => {
    const minutes = parseInt(customMinutes);
    
    if (isNaN(minutes) || minutes < 0) {
      setErrorModal({visible: true, message: "Por favor ingresa un número válido de minutos"});
      return;
    }

    if (minutes > 20160) { // 2 semanas
      setErrorModal({visible: true, message: "El recordatorio no puede ser mayor a 2 semanas (20160 minutos)"});
      return;
    }

    // Validar que no sea antes de ahora
    if (eventStartDate) {
      const reminderTime = new Date(eventStartDate.getTime() - minutes * 60000);
      if (reminderTime < new Date()) {
        setErrorModal({visible: true, message: "El recordatorio ocurriría antes de la hora actual."});
        return;
      }
    }

    // Verificar que no exista ya
    const exists = selectedReminders.find(r => r.minutesBefore === minutes);
    if (exists) {
      setErrorModal({visible: true, message: "Ya existe un recordatorio con este tiempo"});
      return;
    }

    const label = formatMinutesLabel(minutes);
    const newReminder: Reminder = {
      id: `reminder-${Date.now()}-${minutes}`,
      minutesBefore: minutes,
      label,
    };

    setSelectedReminders(prev => [...prev, newReminder]);
    setCustomMinutes("");
    setShowCustomInput(false);
  };

  const formatMinutesLabel = (minutes: number): string => {
    if (minutes === 0) return "Al momento del evento";
    if (minutes < 60) return `${minutes} minutos antes`;
    if (minutes === 60) return "1 hora antes";
    if (minutes < 1440) return `${Math.floor(minutes / 60)} horas antes`;
    if (minutes === 1440) return "1 día antes";
    return `${Math.floor(minutes / 1440)} días antes`;
  };

  const handleSave = () => {
    if (selectedReminders.length === 0) {
      setConfirmNoReminders(true);
      return;
    }

    // Ordenar por tiempo (más cercano al evento primero)
    const sorted = [...selectedReminders].sort((a, b) => a.minutesBefore - b.minutesBefore);
    onSave(sorted);
    onClose();
  };

  const removeReminder = (id: string) => {
    setSelectedReminders(prev => prev.filter(r => r.id !== id));
  };

  const isSelected = (minutesBefore: number) => {
    return selectedReminders.some(r => r.minutesBefore === minutesBefore);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Recordatorios</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1A1A1A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Recordatorios predefinidos */}
            <Text style={styles.sectionTitle}>Opciones rápidas</Text>
            <View style={styles.presetsContainer}>
              {PRESET_REMINDERS.map((preset) => (
                <TouchableOpacity
                  key={preset.minutesBefore}
                  style={[
                    styles.presetChip,
                    isSelected(preset.minutesBefore) && styles.presetChipSelected,
                  ]}
                  onPress={() => toggleReminder(preset.minutesBefore, preset.label)}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      isSelected(preset.minutesBefore) && styles.presetChipTextSelected,
                    ]}
                  >
                    {preset.label}
                  </Text>
                  {isSelected(preset.minutesBefore) && (
                    <Ionicons name="checkmark-circle" size={18} color="#FFF" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Recordatorio personalizado */}
            <Text style={styles.sectionTitle}>Personalizado</Text>
            {!showCustomInput ? (
              <TouchableOpacity
                style={styles.addCustomButton}
                onPress={() => setShowCustomInput(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FF4F81" />
                <Text style={styles.addCustomText}>Agregar tiempo personalizado</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.customInputContainer}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Minutos antes"
                  keyboardType="number-pad"
                  value={customMinutes}
                  onChangeText={setCustomMinutes}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addCustomReminder}
                >
                  <Ionicons name="checkmark" size={20} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowCustomInput(false);
                    setCustomMinutes("");
                  }}
                >
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}

            {/* Recordatorios seleccionados */}
            {selectedReminders.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  Seleccionados ({selectedReminders.length})
                </Text>
                <View style={styles.selectedContainer}>
                  {selectedReminders
                    .sort((a, b) => a.minutesBefore - b.minutesBefore)
                    .map((reminder) => (
                      <View key={reminder.id} style={styles.selectedItem}>
                        <Ionicons name="notifications" size={18} color="#FF4F81" />
                        <Text style={styles.selectedItemText}>{reminder.label}</Text>
                        <TouchableOpacity onPress={() => removeReminder(reminder.id)}>
                          <Ionicons name="trash-outline" size={18} color="#FF4F81" />
                        </TouchableOpacity>
                      </View>
                    ))}
                </View>
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelFooterButton}
              onPress={onClose}
            >
              <Text style={styles.cancelFooterButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>
                Guardar {selectedReminders.length > 0 && `(${selectedReminders.length})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Modal de error */}
      <ConfirmModal
        visible={errorModal.visible}
        type="error"
        title="Error"
        message={errorModal.message}
        confirmText="Entendido"
        showCancel={false}
        onConfirm={() => setErrorModal({visible: false, message: ""})}
      />
      
      {/* Modal de confirmación sin recordatorios */}
      <ConfirmModal
        visible={confirmNoReminders}
        type="info"
        title="Sin recordatorios"
        message="No has seleccionado ningún recordatorio. ¿Deseas continuar sin recordatorios?"
        confirmText="Continuar"
        cancelText="Cancelar"
        onConfirm={() => {
          setConfirmNoReminders(false);
          onSave([]);
          onClose();
        }}
        onCancel={() => setConfirmNoReminders(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "90%",
    paddingTop: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 16,
    marginBottom: 12,
  },
  presetsContainer: {
    gap: 8,
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F5F5",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  presetChipSelected: {
    backgroundColor: "#FF4F81",
    borderColor: "#FF4F81",
  },
  presetChipText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  presetChipTextSelected: {
    color: "#FFF",
  },
  checkIcon: {
    marginLeft: 8,
  },
  addCustomButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FF4F81",
    borderStyle: "dashed",
  },
  addCustomText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#FF4F81",
  },
  customInputContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  customInput: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 15,
    color: "#1A1A1A",
  },
  addButton: {
    backgroundColor: "#FF4F81",
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedContainer: {
    gap: 8,
    marginBottom: 16,
  },
  selectedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF5F8",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE0E9",
  },
  selectedItemText: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A1A",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  cancelFooterButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  cancelFooterButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#FF4F81",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
});
