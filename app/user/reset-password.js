import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import UserService from "../../services/UserService";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token, email: emailParam } = useLocalSearchParams(); // lấy token và email từ link
  const [email, setEmail] = useState(emailParam || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Thiếu thông tin", "Điền đầy đủ email và mật khẩu mới.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu nhập lại không khớp.");
      return;
    }

    setLoading(true);
    try {
      const res = await UserService.resetPassword({
        token,
        email,
        password,
        password_confirmation: confirmPassword,
      });
      Alert.alert("Thành công", res.data.message);
      router.replace("/user/login");
    } catch (err) {
      console.log("Reset password error:", err.response?.data || err.message);
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Không thể đặt lại mật khẩu, thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="lock-closed-outline" size={70} color="#3a86ff" />
      <Text style={styles.title}>Đặt lại mật khẩu</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu mới"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Nhập lại mật khẩu"
        placeholderTextColor="#aaa"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handleReset}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Xác nhận</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#2c3e50",
    marginBottom: 25,
    marginTop: 10,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: "#333",
    marginBottom: 15,
  },
  button: {
    width: "100%",
    backgroundColor: "#3a86ff",
    paddingVertical: 15,
    borderRadius: 10,
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
});
