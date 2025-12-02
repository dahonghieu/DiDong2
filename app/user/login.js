import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  // Alert, // <-- THAY ĐỔI: Không dùng Alert nữa
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { UserContext } from "../../contexts/UserContext";
import UserService from "../../services/UserService";
import { useNotificationModal } from "../../hooks/useNotificationModal";
import NotificationModal from "../../components/common/NotificationModal";

// --- Bảng màu nhất quán ---
const COLORS = {
  primary: "#FF5733",
  background: "#F9F9F9",
  card: "#FFFFFF",
  text: "#212121",
  subtext: "#757575",
  border: "#E0E0E0",
  shadow: "rgba(0, 0, 0, 0.1)",
};

export default function LoginScreen() {
  const { modalProps, showSuccess, showError } = useNotificationModal();

  const { login } = useContext(UserContext);
  const router = useRouter();

  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!loginValue || !password) {
      // <-- THAY ĐỔI: Truyền mảng button vào showError
      showError(
        "Thiếu thông tin",
        "Vui lòng nhập email/số điện thoại và mật khẩu.",
        [{ text: "OK" }] // Thêm nút này modal sẽ không tự tắt
      );
      return;
    }

    setIsLoading(true);

    try {
      // Gọi API login Laravel
      const res = await UserService.login({
        login: loginValue,
        password: password,
      });

      console.log("Mới đăng nhập nè:", res.data);

      const { user, token } = res.data;

      if (user && token) {
        const userData = { ...user, token };
        await login(userData);
        router.replace("/(tabs)/user");
      } else {
        // <-- THAY ĐỔI: Thay Alert bằng showError
        showError("Lỗi", "Không nhận được dữ liệu người dùng.", [
          { text: "OK" },
        ]);
      }
    } catch (error) {
      console.log("Login error:", error.response?.data || error.message);
      // <-- THAY ĐỔI: Thay Alert bằng showError
      showError(
        "Đăng nhập thất bại",
        error.response?.data?.message ||
          "Sai thông tin đăng nhập. Vui lòng kiểm tra lại.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    router.push("/user/register");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.card }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header */}
            <Ionicons
              name="person-circle-outline"
              size={100}
              color={COLORS.primary}
              style={styles.headerIcon}
            />
            <Text style={styles.greetingTitle}>Đăng nhập</Text>
            <Text style={styles.subtitle}>Chào mừng bạn trở lại cửa hàng.</Text>

            {/* Input Field: Email/Phone */}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.subtext}
                style={styles.icon}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Email hoặc số điện thoại"
                placeholderTextColor={COLORS.subtext}
                value={loginValue}
                onChangeText={setLoginValue}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Input Field: Password */}
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.subtext}
                style={styles.icon}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Mật khẩu"
                placeholderTextColor={COLORS.subtext}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={COLORS.subtext}
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push("/user/forgot-password")}
            >
              <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.card} />
              ) : (
                <Text style={styles.buttonText}>Đăng nhập</Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Chưa có tài khoản?</Text>
              <TouchableOpacity onPress={handleRegister}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <NotificationModal {...modalProps} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: COLORS.card,
  },
  container: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: "center",
    paddingVertical: 50,
  },
  // --- HEADER ---
  headerIcon: {
    alignSelf: "center",
    marginBottom: 15,
  },
  greetingTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.subtext,
    textAlign: "center",
    marginBottom: 50,
  },
  // --- INPUT FIELD ---
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background, // Nền input xám nhạt
    height: 55,
    borderRadius: 12, // Bo góc hiện đại
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border, // Viền nhẹ
    // Shadow nhẹ
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  icon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  showPasswordButton: {
    padding: 5,
  },
  // --- FORGOT PASSWORD ---
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 40,
  },
  forgotPasswordText: {
    color: COLORS.subtext, // Màu subtext cho hành động phụ
    fontSize: 15,
    fontWeight: "600",
  },
  // --- BUTTON ---
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18, // Tăng padding
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    // Shadow nổi bật
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#D49695", // Màu xám cho nút disabled
    shadowOpacity: 0.1,
    elevation: 2,
  },
  buttonText: {
    color: COLORS.card,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },
  // --- REGISTER LINK ---
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border, // Đường phân cách mỏng
  },
  registerText: {
    color: COLORS.subtext,
    fontSize: 15,
    marginRight: 5,
  },
  registerLink: {
    color: COLORS.primary, // Màu nhấn
    fontSize: 15,
    fontWeight: "bold",
  },
});