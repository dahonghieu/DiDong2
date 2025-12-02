import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Modal from "react-native-modal";
import { Ionicons } from "@expo/vector-icons"; // Giữ lại Ionicons

// Bảng màu (giữ nguyên)
const COLORS = {
  success: "#28a745",
  danger: "#D32F2F",
  warning: "#FF5733",
  card: "#FFFFFF",
  text: "#333333",
  subtext: "#888888",
  primary: "#FF5733",
  secondary: "#333333",
  border: "#EEEEEE",
};

// <-- THAY ĐỔI: Cập nhật MODAL_CONFIG
const MODAL_CONFIG = {
  success: {
    icon: "checkmark-sharp", // Icon cho success
    color: COLORS.success,
    renderType: "icon", // Kiểu render là 'icon'
  },
  error: {
    icon: "😱", // Emoji cho error
    renderType: "emoji", // Kiểu render là 'emoji'
  },
  warning: {
    icon: "🤔", // Emoji cho warning
    renderType: "emoji", // Kiểu render là 'emoji'
  },
};

const NotificationModal = ({
  isVisible,
  type = "success",
  title,
  message,
  buttons = [],
  onClose,
}) => {
  const currentConfig = MODAL_CONFIG[type] || MODAL_CONFIG.warning;
  const canCloseOnBackdrop = buttons.length === 0;

  return (
    <Modal
      isVisible={isVisible}
      animationIn="zoomIn"
      animationOut="zoomOut"
      backdropOpacity={0.4}
      onBackdropPress={canCloseOnBackdrop ? onClose : null}
      onBackButtonPress={canCloseOnBackdrop ? onClose : null}
    >
      <View style={styles.modalContainer}>

        {/* <-- THAY ĐỔI: Thêm logic render có điều kiện --> */}
        {currentConfig.renderType === "icon" ? (
          // Nếu là 'icon' (cho success)
          <View
            style={[
              styles.modalIconWrapper,
              { backgroundColor: currentConfig.color },
            ]}
          >
            <Ionicons name={currentConfig.icon} size={40} color="#FFFFFF" />
          </View>
        ) : (
          // Nếu là 'emoji' (cho error/warning)
          <Text style={styles.modalEmoji}>{currentConfig.icon}</Text>
        )}

        {/* Tiêu đề */}
        <Text style={styles.modalTitle}>{title}</Text>

        {/* Nội dung */}
        <Text style={styles.modalMessage}>{message}</Text>

        {/* Khu vực render nút bấm (giữ nguyên) */}
        {buttons.length > 0 && (
          <View style={styles.modalButtonContainer}>
            {buttons.map((button, index) => {
              const isCancel = button.style === "cancel";
              const buttonStyle = isCancel
                ? styles.modalCancelButton
                : styles.modalConfirmButton;
              const textStyle = isCancel
                ? styles.modalCancelButtonText
                : styles.modalConfirmButtonText;

              const containerStyle = [
                styles.modalButton,
                buttonStyle,
                buttons.length > 1 && isCancel && { marginRight: 10 },
              ];

              return (
                <TouchableOpacity
                  key={index}
                  style={containerStyle}
                  onPress={() => {
                    onClose();
                    if (button.onPress) {
                      setTimeout(button.onPress, 100);
                    }
                  }}
                >
                  <Text style={textStyle}>{button.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </Modal>
  );
};

// <-- THAY ĐỔI: Cập nhật StyleSheet
const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: COLORS.card,
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Giữ lại style này cho 'success'
  modalIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  // <-- THAY ĐỔI: Thêm style này cho 'error' và 'warning'
  modalEmoji: {
    fontSize: 70,
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: COLORS.text,
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.subtext,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },

  // Các style cho nút (giữ nguyên)
  modalButtonContainer: {
    flexDirection: "row",
    marginTop: 25,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: COLORS.border,
  },
  modalCancelButtonText: {
    color: COLORS.secondary,
    fontWeight: "600",
    fontSize: 16,
  },
  modalConfirmButton: {
    backgroundColor: COLORS.primary,
  },
  modalConfirmButtonText: {
    color: COLORS.card,
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default NotificationModal;