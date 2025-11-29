import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";

interface DateTimePickerProps {
  visible: boolean;
  mode: "date" | "time" | "datetime";
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

export default function DateTimePicker({
  visible,
  mode,
  value,
  onConfirm,
  onCancel,
  minimumDate,
  maximumDate,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState(value);

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  const updateDate = (type: "year" | "month" | "day", delta: number) => {
    const newDate = new Date(selectedDate);
    if (type === "year") newDate.setFullYear(newDate.getFullYear() + delta);
    if (type === "month") newDate.setMonth(newDate.getMonth() + delta);
    if (type === "day") newDate.setDate(newDate.getDate() + delta);

    if (minimumDate && newDate < minimumDate) return;
    if (maximumDate && newDate > maximumDate) return;

    setSelectedDate(newDate);
  };

  const updateTime = (type: "hour" | "minute", delta: number) => {
    const newDate = new Date(selectedDate);
    if (type === "hour") newDate.setHours(newDate.getHours() + delta);
    if (type === "minute") newDate.setMinutes(newDate.getMinutes() + delta);
    setSelectedDate(newDate);
  };

  const renderDatePicker = () => (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerLabel}>Selecciona la fecha</Text>
      
      {/* Año */}
      <View style={styles.wheelContainer}>
        <Text style={styles.wheelLabel}>Año</Text>
        <View style={styles.wheel}>
          <TouchableOpacity
            style={styles.wheelButton}
            onPress={() => updateDate("year", 1)}
          >
            <Ionicons name="chevron-up" size={24} color="#FF4F81" />
          </TouchableOpacity>
          <View style={styles.wheelValue}>
            <Text style={styles.wheelValueText}>{selectedDate.getFullYear()}</Text>
          </View>
          <TouchableOpacity
            style={styles.wheelButton}
            onPress={() => updateDate("year", -1)}
          >
            <Ionicons name="chevron-down" size={24} color="#FF4F81" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mes */}
      <View style={styles.wheelContainer}>
        <Text style={styles.wheelLabel}>Mes</Text>
        <View style={styles.wheel}>
          <TouchableOpacity
            style={styles.wheelButton}
            onPress={() => updateDate("month", 1)}
          >
            <Ionicons name="chevron-up" size={24} color="#FF4F81" />
          </TouchableOpacity>
          <View style={styles.wheelValue}>
            <Text style={styles.wheelValueText}>
              {selectedDate.toLocaleString("es", { month: "long" })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.wheelButton}
            onPress={() => updateDate("month", -1)}
          >
            <Ionicons name="chevron-down" size={24} color="#FF4F81" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Día */}
      <View style={styles.wheelContainer}>
        <Text style={styles.wheelLabel}>Día</Text>
        <View style={styles.wheel}>
          <TouchableOpacity
            style={styles.wheelButton}
            onPress={() => updateDate("day", 1)}
          >
            <Ionicons name="chevron-up" size={24} color="#FF4F81" />
          </TouchableOpacity>
          <View style={styles.wheelValue}>
            <Text style={styles.wheelValueText}>{selectedDate.getDate()}</Text>
          </View>
          <TouchableOpacity
            style={styles.wheelButton}
            onPress={() => updateDate("day", -1)}
          >
            <Ionicons name="chevron-down" size={24} color="#FF4F81" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTimePicker = () => (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerLabel}>Selecciona la hora</Text>
      
      {/* Hora */}
      <View style={styles.wheelContainer}>
        <Text style={styles.wheelLabel}>Hora</Text>
        <View style={styles.wheel}>
          <TouchableOpacity
            style={styles.wheelButton}
            onPress={() => updateTime("hour", 1)}
          >
            <Ionicons name="chevron-up" size={24} color="#FF4F81" />
          </TouchableOpacity>
          <View style={styles.wheelValue}>
            <Text style={styles.wheelValueText}>
              {selectedDate.getHours().toString().padStart(2, "0")}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.wheelButton}
            onPress={() => updateTime("hour", -1)}
          >
            <Ionicons name="chevron-down" size={24} color="#FF4F81" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Minutos */}
      <View style={styles.wheelContainer}>
        <Text style={styles.wheelLabel}>Minutos</Text>
        <View style={styles.wheel}>
          <TouchableOpacity
            style={styles.wheelButton}
            onPress={() => updateTime("minute", 15)}
          >
            <Ionicons name="chevron-up" size={24} color="#FF4F81" />
          </TouchableOpacity>
          <View style={styles.wheelValue}>
            <Text style={styles.wheelValueText}>
              {selectedDate.getMinutes().toString().padStart(2, "0")}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.wheelButton}
            onPress={() => updateTime("minute", -15)}
          >
            <Ionicons name="chevron-down" size={24} color="#FF4F81" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {mode === "date" ? "Fecha" : mode === "time" ? "Hora" : "Fecha y Hora"}
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {(mode === "date" || mode === "datetime") && renderDatePicker()}
            {(mode === "time" || mode === "datetime") && renderTimePicker()}
          </ScrollView>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <LinearGradient
                colors={["#FF4F81", "#8A2BE2"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.confirmButtonGradient}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 16,
    textAlign: "center",
  },
  wheelContainer: {
    marginBottom: 16,
  },
  wheelLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  wheel: {
    alignItems: "center",
  },
  wheelButton: {
    padding: 8,
  },
  wheelValue: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center",
  },
  wheelValueText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  confirmButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  confirmButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
