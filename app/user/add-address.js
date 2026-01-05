import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "react-native-vector-icons/Ionicons";
import { UserContext } from "../../contexts/UserContext";
import UserService from "../../services/UserService";

const COLORS = {
  primary: "#FF5733",
  background: "#F9F9F9",
  card: "#FFFFFF",
  text: "#333333",
  border: "#E0E0E0",
  subtext: "#888888",
};

export default function AddAddressScreen() {
  const { user } = useContext(UserContext);
  const router = useRouter();

  const [addressDetail, setAddressDetail] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!addressDetail.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập địa chỉ giao hàng.");
      return;
    }

    setSaving(true);
    try {
      const res = await UserService.addAddress(user.token, {
        address_detail: addressDetail,
      });

      if (res.data) {
        Alert.alert("Thành công", "Đã thêm địa chỉ mới!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      }
    } catch (err) {
      console.log("Add address error:", err.response?.data || err.message);
      Alert.alert("Lỗi", "Không thể thêm địa chỉ. Vui lòng thử lại sau.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: COLORS.background }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons
            name="add-circle-outline"
            size={26}
            color={COLORS.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.headerTitle}>Thêm địa chỉ mới</Text>
        </View>

        {/* Form nhập địa chỉ */}
        <View style={styles.card}>
          <Text style={styles.label}>Địa chỉ chi tiết</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 123 Nguyễn Trãi, Phường 5, Quận 5, TP.HCM"
            value={addressDetail}
            onChangeText={setAddressDetail}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.button, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>LƯU ĐỊA CHỈ</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    textAlignVertical: "top",
  },
  button: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
