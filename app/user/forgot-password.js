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
import { useRouter } from "expo-router";
import UserService from "../../services/UserService";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập email.");
      return;
    }

    setLoading(true);
    try {
      const res = await UserService.sendOtp({ email });
      console.log("✅ Gửi OTP thành công:", res.data);

      // ✅ Bỏ Alert, chuyển luôn qua màn verify
      router.push(`/user/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.log("❌ Send OTP error:", err.response?.data || err.message);
      Alert.alert("Lỗi", err.response?.data?.message || "Không gửi được mã OTP.");
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
            <Ionicons name="key-outline" size={70} color="#FF5733" style={styles.icon} />
            <Text style={styles.title}>Quên mật khẩu</Text>
            <Text style={styles.subtitle}>Nhập email đã đăng ký tài khoản trước đó.</Text>

            <TextInput
              style={styles.input}
              placeholder="Email của bạn"
              placeholderTextColor="#95a5a6"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.disabledButton]}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Gửi mã OTP</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backText}>← Quay lại đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
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
  icon: {
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2c3e50",
    marginBottom: 5,
  },
  subtitle: {
    color: "#7f8c8d",
    textAlign: "center",
    marginBottom: 25,
    fontSize: 15,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 20,
    color: "#333",
  },
  button: {
    width: "100%",
    backgroundColor: "#FF5733",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#a5d0f5",
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  backText: {
    color: "#3498db",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 25,
  },
});
