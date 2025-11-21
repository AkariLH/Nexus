import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ActionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  actions: {
    label: string;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
    destructive?: boolean;
  }[];
}

export function ActionModal({ visible, onClose, title, actions }: ActionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <Text style={styles.title}>{title}</Text>
              
              <View style={styles.actionsContainer}>
                {actions.map((action, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.actionButton,
                      action.destructive && styles.destructiveButton,
                    ]}
                    onPress={() => {
                      action.onPress();
                      onClose();
                    }}
                    activeOpacity={0.7}
                  >
                    {action.icon && (
                      <Ionicons
                        name={action.icon}
                        size={20}
                        color={action.destructive ? "#FF4757" : "#1A1A1A"}
                        style={styles.actionIcon}
                      />
                    )}
                    <Text
                      style={[
                        styles.actionText,
                        action.destructive && styles.destructiveText,
                      ]}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 20,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  destructiveButton: {
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#FFE5E5",
  },
  actionIcon: {
    marginRight: 4,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  destructiveText: {
    color: "#FF4757",
  },
  cancelButton: {
    alignItems: "center",
    padding: 16,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
});
