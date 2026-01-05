import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert, // <-- THAY ĐỔI: Giữ lại Alert cho Action Sheet
  ActivityIndicator,
  Image,
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
import { imageUrl } from "../../services/config.js";
import { Ionicons } from "@expo/vector-icons";

// <-- THAY ĐỔI: Import hook và component modal
import { useNotificationModal } from "../../hooks/useNotificationModal";
import NotificationModal from "../../components/common/NotificationModal";

const COLORS = {
  primary: "#FF5733",
  background: "#F9F9F9",
  card: "#FFFFFF",
  text: "#212121",
  subtext: "#757575",
  border: "#E0E0E0",
  shadow: "rgba(0, 0, 0, 0.1)",
};

export default function EditProfileScreen() {
  // <-- THAY ĐỔI: Khởi tạo hook
  const { modalProps, showSuccess, showError } = useNotificationModal();

  const { user, login } = useContext(UserContext);
  const router = useRouter();

  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [avatar, setAvatar] = useState(
    user?.avatar ? { uri: imageUrl("user", user.avatar), mimeType: null } : null
  );
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    // <-- THAY ĐỔI: Giữ nguyên Alert này (Action Sheet)
    Alert.alert("Ảnh đại diện", "Chọn nguồn ảnh", [
      { text: "Chụp ảnh mới", onPress: async () => handlePick("camera") },
      { text: "Chọn từ thư viện", onPress: async () => handlePick("library") },
      { text: "Hủy", style: "cancel" },
    ]);
  };

  const handlePick = async (type) => {
    try {
      const permission =
        type === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.launchMediaLibraryAsync(); // (Sửa lại: dùng launchMediaLibraryAsync)

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
    } catch (err) {
      console.log(err); // <-- THAY ĐỔI: Log lỗi ra
      // <-- THAY ĐỔI: Dùng showError
      showError("Lỗi ảnh", "Không thể xử lý ảnh vừa chọn.", [{ text: "OK" }]);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      // <-- THAY ĐỔI: Dùng showError
      showError("Thiếu thông tin", "Vui lòng nhập đầy đủ các trường.", [
        { text: "OK" },
      ]);
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("phone", phone.trim());
    formData.append("address", address.trim());

    if (avatar?.uri && !avatar.uri.startsWith("http")) {
      formData.append("avatar", {
        uri: avatar.uri,
        name: `avatar_${Date.now()}.png`,
        type: "image/png",
      });
    }

    setIsLoading(true);
    try {
      const res = await UserService.update(email, formData);
      const updatedUser = res.data?.user || { ...user, name, phone, address };
      await login(updatedUser);

      // <-- THAY ĐỔI: Dùng showSuccess
      showSuccess("Thành công", "Cập nhật thông tin thành công!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      console.log("Lỗi cập nhật:", err?.response?.data || err?.message);
      // <-- THAY ĐỔI: Dùng showError
      showError(
        "Thất bại",
        err?.response?.data?.message || "Không thể cập nhật thông tin.",
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
            <Text style={styles.title}>Chỉnh sửa hồ sơ</Text>

            {/* Avatar Picker */}
            <TouchableOpacity onPress={pickImage} style={styles.avatarPicker}>
              {avatar?.uri ? (
                <Image source={{ uri: avatar.uri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.defaultAvatar}>
                  <Ionicons
                    name="camera-outline"
                    size={40}
                    color={COLORS.subtext}
                  />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={18} color={COLORS.card} />
              </View>
            </TouchableOpacity>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <Text style={styles.label}>Họ và tên</Text>
              <TextInput
                style={styles.input}
                placeholder="Họ và tên"
                placeholderTextColor={COLORS.subtext}
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Email (Không thể chỉnh sửa)</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                placeholder="Email"
                value={email}
                editable={false}
              />

              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại"
                placeholderTextColor={COLORS.subtext}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={styles.label}>Địa chỉ giao hàng</Text>
              <TextInput
                style={styles.input}
                placeholder="Địa chỉ chi tiết"
                placeholderTextColor={COLORS.subtext}
                value={address}
                onChangeText={setAddress}
                multiline={true}
                numberOfLines={4}
              />
            </View>

            {/* Button */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.disabledButton]}
              onPress={handleUpdate}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <ActivityIndicator size="small" color={COLORS.card} />
                  <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                    Đang lưu...
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Lưu thay đổi</Text>
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
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContainer: { paddingVertical: 20 },
  container: { paddingHorizontal: 20 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 30,
  },

  // --- Avatar Picker ---
  avatarPicker: {
    alignSelf: "center",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: COLORS.primary,
    marginBottom: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.card,
    overflow: "hidden",
    position: "relative",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
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

  // --- Form Fields ---
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
    marginLeft: 5,
  },
  input: {
    backgroundColor: COLORS.card,
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    color: COLORS.text,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  disabledInput: {
    backgroundColor: COLORS.border,
    color: COLORS.subtext,
  },

  // --- Button ---
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: "#D49695",
    shadowOpacity: 0.1,
    elevation: 2,
  },
  buttonText: {
    color: COLORS.card,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});