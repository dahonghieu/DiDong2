import React, { useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { UserContext } from "../../contexts/UserContext";
import UserService from "../../services/UserService";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNotificationModal } from "../../hooks/useNotificationModal";
import NotificationModal from "../../components/common/NotificationModal";

const COLORS = {
  primary: "#FF5733",
  background: "#F9F9F9",
  card: "#FFFFFF",
  text: "#333333",
  subtext: "#888888",
  border: "#E0E0E0",
  active: "#FFF3EF",
  shadow: "rgba(0, 0, 0, 0.08)",
  danger: "#e74c3c",
};

export default function AddressListScreen() {
  const { modalProps, showSuccess, showError } = useNotificationModal();
  const { user, updateUser } = useContext(UserContext);
  const router = useRouter();
  const isFocused = useIsFocused();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // === LẤY DANH SÁCH ĐỊA CHỈ ===
  const fetchAddresses = async () => {
    try {
      const res = await UserService.getAddresses(user.token);
      let list = res.data || [];

      // ✅ Thêm địa chỉ chính từ bảng user (userContext)
      if (user?.address) {
        const exists = list.some(
          (item) => item.address_detail.trim() === user.address.trim()
        );
        if (!exists) {
          list.unshift({
            id: "user_address",
            address_detail: user.address,
            is_default: true,
          });
        }
      }

      setAddresses(list);
    } catch (err) {
      console.log("❌ Fetch address error:", err.response?.data || err.message);
      showError("Lỗi", "Không thể tải danh sách địa chỉ.", [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
  };

  // === Reload khi quay lại ===
  useFocusEffect(
    useCallback(() => {
      if (isFocused && user?.token) fetchAddresses();
    }, [isFocused, user?.token])
  );

  // === Chọn địa chỉ mặc định ===
  const handleSelectAddress = (address) => {
    try {
      updateUser({
        address: address.address_detail,
        selectedAddressId: address.id,
      });
      showSuccess("Thành công", "Đã chọn địa chỉ này làm mặc định.");
    } catch (err) {
      console.log("❌ Update address error:", err);
      showError("Lỗi", "Không thể cập nhật địa chỉ người dùng.", [
        { text: "OK" },
      ]);
    }
  };

  // === Sửa địa chỉ hiện tại ===
  const handleEditCurrent = () => {
    if (!user?.address) {
      showError("Thông báo", "Chưa có địa chỉ nào đang được áp dụng.", [
        { text: "OK" },
      ]);
      return;
    }

    const matched = addresses.find(
      (a) => a.address_detail.trim() === user.address.trim()
    );

    if (matched && matched.id !== "user_address") {
      router.push(`/user/edit-address?id=${matched.id}`);
    } else {
      router.push(`/user/edit-main-address`);
    }
  };

  // === Xóa địa chỉ ===
  const handleDeleteAddress = async (id, detail) => {
    if (id === "user_address") {
      showError("Không thể xóa", "Không thể xóa địa chỉ chính trong hồ sơ.", [
        { text: "OK" },
      ]);
      return;
    }

    if (id === user?.selectedAddressId) {
      showError("Không thể xóa", "Địa chỉ này đang được sử dụng.", [
        { text: "OK" },
      ]);
      return;
    }

    Alert.alert(
      "Xác nhận",
      `Bạn có chắc muốn xóa địa chỉ:\n${detail}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await UserService.deleteAddress(user.token, id);
              showSuccess("Thành công", "Đã xóa địa chỉ.");
              fetchAddresses(); // reload danh sách
            } catch (err) {
              console.log(
                "❌ Delete address error:",
                err.response?.data || err.message
              );
              showError("Lỗi", "Không thể xóa địa chỉ.", [{ text: "OK" }]);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // === Thêm mới ===
  const handleAddNew = () => {
    router.push("/user/add-address");
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons
          name="location-outline"
          size={24}
          color={COLORS.primary}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.headerTitle}>Địa chỉ của tôi</Text>
      </View>

      {/* ĐỊA CHỈ ĐANG ÁP DỤNG */}
      {user?.address ? (
        <View style={styles.currentAddressBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.currentLabel}>Địa chỉ đang áp dụng:</Text>
            <Text style={styles.currentText}>{user.address}</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditCurrent}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.editButtonText}>Sửa</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.emptyCurrent}>Chưa có địa chỉ nào được áp dụng</Text>
      )}

      {/* DANH SÁCH */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          {addresses.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có địa chỉ nào</Text>
          ) : (
            addresses.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.addressCard,
                  item.address_detail.trim() === user?.address?.trim() &&
                  styles.activeCard,
                ]}
              >
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => handleSelectAddress(item)}
                >
                  <Text style={styles.addressText}>{item.address_detail}</Text>
                </TouchableOpacity>

                {item.address_detail.trim() === user?.address?.trim() && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color={COLORS.primary}
                    style={{ marginRight: 10 }}
                  />
                )}

                {/* Nút xóa */}
                <TouchableOpacity
                  onPress={() =>
                    handleDeleteAddress(item.id, item.address_detail)
                  }
                >
                  <Ionicons
                    name="trash-outline"
                    size={22}
                    color={COLORS.danger}
                  />
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* Nút thêm địa chỉ mới */}
          <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.addText}>Thêm địa chỉ mới</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <NotificationModal {...modalProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text },

  currentAddressBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  currentLabel: {
    fontSize: 14,
    color: COLORS.subtext,
    marginBottom: 4,
  },
  currentText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  editButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
  },
  emptyCurrent: {
    fontStyle: "italic",
    color: COLORS.subtext,
    marginBottom: 10,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { textAlign: "center", color: COLORS.subtext, marginTop: 30 },
  addressCard: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  activeCard: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.active,
  },
  addressText: { fontSize: 15, color: COLORS.text, fontWeight: "500" },
  addButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  addText: {
    color: COLORS.card,
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 6,
  },
});
