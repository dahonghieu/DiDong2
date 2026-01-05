import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  // Alert, // <-- THAY ĐỔI: Không dùng Alert nữa
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { UserContext } from "../../contexts/UserContext";
import UserService from "../../services/UserService";

// <-- THAY ĐỔI: Import hook và component modal
import { useNotificationModal } from "../../hooks/useNotificationModal";
import NotificationModal from "../../components/common/NotificationModal";

export default function ChangePasswordScreen() {
  // <-- THAY ĐỔI: Khởi tạo hook
  const { modalProps, showSuccess, showError } = useNotificationModal();

  const { user } = useContext(UserContext);
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (isLoading) return;

    // <-- THAY ĐỔI: Dùng showError cho validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      showError("Thiếu thông tin", "Vui lòng nhập đầy đủ các trường.", [
        { text: "OK" },
      ]);
      return;
    }

    if (newPassword.length < 6) {
      showError("Mật khẩu yếu", "Mật khẩu mới phải có ít nhất 6 ký tự.", [
        { text: "OK" },
      ]);
      return;
    }

    if (newPassword !== confirmPassword) {
      showError("Lỗi", "Mật khẩu xác nhận không khớp.", [{ text: "OK" }]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await UserService.changePassword(user.email, {
        old_password: oldPassword,
        new_password: newPassword,
      });

      // <-- THAY ĐỔI: Dùng showSuccess
      showSuccess("Thành công", "Đổi mật khẩu thành công!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.log("Lỗi đổi mật khẩu:", err?.response?.data || err?.message);
      // <-- THAY ĐỔI: Dùng showError
      showError(
        "Thất bại",
        err?.response?.data?.message ||
        "Không thể đổi mật khẩu. Vui lòng kiểm tra lại.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text style={styles.title}>Đổi mật khẩu</Text>

            <TextInput
              style={styles.input}
              placeholder="Mật khẩu hiện tại"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Mật khẩu mới"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Nhập lại mật khẩu mới"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleChangePassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                    Đang xử lý...
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Đổi mật khẩu</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* <-- THAY ĐỔI: Thêm Modal vào đây --> */}
        <NotificationModal {...modalProps} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollContainer: { paddingBottom: 40 },
  container: { paddingHorizontal: 30, paddingVertical: 40 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 25,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    backgroundColor: "#fff",
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 18,
  },
  primaryButton: {
    backgroundColor: "#FF5733",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  disabledButton: { backgroundColor: "#f8c471" },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});