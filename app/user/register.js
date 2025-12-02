import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert, // <-- THAY ĐỔI: Vẫn giữ Alert để dùng cho Action Sheet
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useRouter } from "expo-router";
import { UserContext } from "../../contexts/UserContext";
import UserService from "../../services/UserService";
import { Ionicons } from "@expo/vector-icons";
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

export default function RegisterScreen() {
  const { modalProps, showSuccess, showError } = useNotificationModal();

  const { login } = useContext(UserContext); // Vẫn giữ login nếu logic của bạn là auto-login
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v);
  const isPhoneVN = (v) => /^(0|\+84)(\d{9})$/.test(v.replace(/\s/g, ""));

  const pickImage = async () => {
    // <-- THAY ĐỔI: Giữ nguyên Alert này vì đây là Action Sheet
    Alert.alert("Ảnh đại diện", "Chọn nguồn ảnh", [
      {
        text: "Chụp ảnh mới",
        onPress: async () => handlePick("camera"),
      },
      {
        text: "Chọn từ thư viện",
        onPress: async () => handlePick("library"),
      },
      { text: "Hủy", style: "cancel" },
    ]);
  };

  const handlePick = async (type) => {
    try {
      const permission =
        type === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permission.status !== "granted") {
        // <-- THAY ĐỔI: Dùng showError
        showError("Từ chối quyền", "Không thể truy cập ảnh.", [{ text: "OK" }]);
        return;
      }

      const result =
        type === "camera"
          ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
          })
          : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
          });

      if (!result.canceled) {
        const manipulated = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [],
          { compress: 0.9, format: ImageManipulator.SaveFormat.PNG }
        );
        setAvatar({ uri: manipulated.uri, mimeType: "image/png" });
      }
    } catch {
      // <-- THAY ĐỔI: Dùng showError
      showError("Lỗi ảnh", "Không thể xử lý ảnh được chọn.", [{ text: "OK" }]);
    }
  };

  const handleRegister = async () => {
    if (isLoading) return;

    const _name = name.trim();
    const _email = email.trim().toLowerCase();
    const _phone = phone.trim();
    const _address = address.trim();

    // <-- THAY ĐỔI: Toàn bộ validation dùng showError -->
    if (
      !_name ||
      !_email ||
      !_phone ||
      !_address ||
      !password ||
      !confirmPassword
    ) {
      showError("Thiếu thông tin", "Vui lòng nhập đầy đủ các trường.", [
        { text: "OK" },
      ]);
      return;
    }
    if (!isEmail(_email)) {
      showError("Email sai", "Vui lòng nhập đúng định dạng email.", [
        { text: "OK" },
      ]);
      return;
    }

    if (password.length < 6) {
      showError("Mật khẩu yếu", "Mật khẩu phải có ít nhất 6 ký tự.", [
        { text: "OK" },
      ]);
      return;
    }
    if (password !== confirmPassword) {
      showError("Lỗi", "Mật khẩu xác nhận không khớp.", [{ text: "OK" }]);
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("name", _name);
    formData.append("email", _email);
    formData.append("phone", _phone);
    formData.append("address", _address);
    formData.append("password", password);

    if (avatar) {
      formData.append("avatar", {
        uri: avatar.uri,
        name: `avatar_${Date.now()}.png`,
        type: "image/png",
      });
    }

    try {
      const res = await UserService.register(formData);
      // const { user, token } = res.data || {}; // (Nếu bạn muốn auto-login)
      // await login({ ...user, token }); // (Nếu bạn muốn auto-login)

      // <-- THAY ĐỔI: Dùng showSuccess có nút điều hướng
      showSuccess(
        "Đăng ký thành công!",
        "Tài khoản của bạn đã được tạo. Vui lòng đăng nhập.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/user/login"),
          },
        ]
      );
    } catch (err) {
      console.log("Đăng ký lỗi:", err?.response?.data || err?.message);
      // <-- THAY ĐỔI: Dùng showError
      showError(
        "Đăng ký thất bại",
        err?.response?.data?.message ||
        "Không thể đăng ký. Vui lòng kiểm tra lại.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text style={styles.title}>Tạo tài khoản mới</Text>
            <Text style={styles.subTitle}>Chào mừng bạn đến với cửa hàng!</Text>

            {/* Avatar Picker */}
            <TouchableOpacity onPress={pickImage} style={styles.avatarPicker}>
              {avatar ? (
                <Image source={{ uri: avatar.uri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.defaultAvatar}>
                  <Ionicons
                    name="person-outline"
                    size={50}
                    color={COLORS.subtext}
                  />
                  <Text style={styles.avatarText}>Chọn ảnh</Text>
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={18} color={COLORS.card} />
              </View>
            </TouchableOpacity>

            {/* Form Fields */}
            <TextInput
              style={styles.input}
              placeholder="Họ và tên"
              placeholderTextColor={COLORS.subtext}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={COLORS.subtext}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Số điện thoại"
              placeholderTextColor={COLORS.subtext}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            <TextInput
              style={styles.input}
              placeholder="Địa chỉ"
              placeholderTextColor={COLORS.subtext}
              value={address}
              onChangeText={setAddress}
            />

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.inputField}
                placeholder="Mật khẩu (ít nhất 6 ký tự)"
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

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.inputField}
                placeholder="Xác nhận mật khẩu"
                placeholderTextColor={COLORS.subtext}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={
                    showConfirmPassword ? "eye-off-outline" : "eye-outline"
                  }
                  size={20}
                  color={COLORS.subtext}
                />
              </TouchableOpacity>
            </View>

            {/* Button */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <ActivityIndicator size="small" color={COLORS.card} />
                  <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                    Đang xử lý...
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Đăng ký tài khoản</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Đã có tài khoản?</Text>
              <TouchableOpacity onPress={() => router.replace("/user/login")}>
                <Text style={styles.loginLink}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        {/* <-- THAY ĐỔI: Thêm Modal vào đây --> */}
        <NotificationModal {...modalProps} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: COLORS.background, // Nền xám nhạt
  },
  container: {
    paddingHorizontal: 30,
    paddingVertical: 40,
    backgroundColor: COLORS.card,
    marginHorizontal: 15,
    borderRadius: 12,
    // Shadow nhẹ để tạo cảm giác Card
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 5,
  },
  subTitle: {
    fontSize: 16,
    color: COLORS.subtext,
    textAlign: "center",
    marginBottom: 35,
  },

  // --- Avatar Picker ---
  avatarPicker: {
    alignSelf: "center",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: COLORS.primary, // Viền màu nhấn chính
    marginBottom: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.card,
    overflow: "hidden",
    position: "relative",
  },
  avatarImage: { width: "100%", height: "100%" },
  defaultAvatar: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.border,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    padding: 6,
    borderWidth: 2,
    borderColor: COLORS.card,
    zIndex: 1,
  },
  avatarText: { color: COLORS.subtext, fontSize: 14, fontWeight: "600" },

  // --- Input Fields ---
  input: {
    backgroundColor: COLORS.background, // Nền xám nhạt
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 15,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  showPasswordButton: {
    padding: 5,
  },

  // --- Button ---
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12, // Bo góc lớn hơn
    alignItems: "center",
    marginTop: 20,
    marginBottom: 25,
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
    letterSpacing: 0.5,
  },

  // --- Login Link ---
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 10,
  },
  loginText: { color: COLORS.subtext, fontSize: 16, marginRight: 5 },
  loginLink: { color: COLORS.primary, fontSize: 16, fontWeight: "bold" },
});