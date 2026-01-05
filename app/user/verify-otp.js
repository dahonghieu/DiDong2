import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import UserService from "../../services/UserService";
import { useNotificationModal } from "../../hooks/useNotificationModal";
import NotificationModal from "../../components/common/NotificationModal";

export default function VerifyOtpScreen() {
  const { modalProps, showSuccess, showError } = useNotificationModal();

  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!otp || !password || !confirm) {
      showError("Thiếu thông tin", "Vui lòng nhập đầy đủ các trường.", [
        { text: "OK" },
      ]);
      return;
    }
    if (password !== confirm) {
      showError("Lỗi", "Mật khẩu nhập lại không khớp", [
        { text: "OK" },
      ]);
      return;
    }

    setLoading(true);

    try {
      const res = await UserService.resetPasswordWithOtp({
        email,
        otp,
        password,
        password_confirmation: confirm,
      });

     showSuccess("Thành công", res.data.message, [
        { text: "OK", onPress: () => router.replace("/user/login") },
      ]);
    } catch (err) {
      console.log("Reset error:", err.response?.data || err.message);
      Alert.alert("Lỗi", err.response?.data?.message || "Không thể đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.inner}>
            <Ionicons name="shield-checkmark-outline" size={70} color="#FF5733" style={styles.icon} />
            <Text style={styles.title}>Xác nhận OTP</Text>
            <Text style={styles.subtitle}>
              Nhập mã OTP đã gửi tới{" "}
              <Text style={{ fontWeight: "bold", color: "#FF5733" }}>{email}</Text>
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Mã OTP (6 số)"
              placeholderTextColor="#95a5a6"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Mật khẩu mới"
              placeholderTextColor="#95a5a6"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TextInput
              style={styles.input}
              placeholder="Nhập lại mật khẩu"
              placeholderTextColor="#95a5a6"
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.disabledButton]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>

      </TouchableWithoutFeedback>
      <NotificationModal {...modalProps} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 25,
  },
  inner: {
    alignItems: "center",
  },
  icon: { marginBottom: 15 },
  title: { fontSize: 28, fontWeight: "800", color: "#2c3e50", marginBottom: 5 },
  subtitle: { color: "#7f8c8d", textAlign: "center", marginBottom: 25, fontSize: 15 },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    color: "#333",
  },
  button: {
    width: "100%",
    backgroundColor: "#FF5733",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
  },
  disabledButton: { backgroundColor: "#a5d0f5" },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
});
