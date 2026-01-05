import React, { useEffect, useState, useContext } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    // Alert, // <-- THAY ĐỔI: Không dùng Alert nữa
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { UserContext } from "../../contexts/UserContext";
import UserService from "../../services/UserService";

// <-- THAY ĐỔI: Import hook và component modal
import { useNotificationModal } from "../../hooks/useNotificationModal";
import NotificationModal from "../../components/common/NotificationModal";

const COLORS = {
    primary: "#FF5733",
    background: "#F9F9F9",
    card: "#FFFFFF",
    text: "#333333",
    subtext: "#888888",
    border: "#E0E0E0",
    shadow: "rgba(0, 0, 0, 0.08)",
};

export default function EditAddressScreen() {
    const { id } = useLocalSearchParams();
    const { user, updateUser } = useContext(UserContext);
    const router = useRouter();

    // <-- THAY ĐỔI: Khởi tạo hook
    const { modalProps, showSuccess, showError } = useNotificationModal();

    const [addressDetail, setAddressDetail] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchAddress = async () => {
            try {
                const res = await UserService.getAddresses(user.token);
                const target = res.data.find((a) => a.id == id);
                if (target) {
                    setAddressDetail(target.address_detail);
                } else {
                    // <-- THAY ĐỔI: Dùng showError và thêm nút điều hướng
                    showError("Lỗi", "Không tìm thấy địa chỉ cần sửa", [
                        { text: "OK", onPress: () => router.back() },
                    ]);
                }
            } catch (err) {
                console.log("Fetch address error:", err.message);
                // <-- THAY ĐỔI: Dùng showError
                showError("Lỗi", "Không thể tải địa chỉ này", [{ text: "OK" }]);
            } finally {
                setLoading(false);
            }
        };
        fetchAddress();
    }, [id]);

    const handleSave = async () => {
        if (!addressDetail.trim()) {
            // <-- THAY ĐỔI: Dùng showError
            showError("Cảnh báo", "Vui lòng nhập địa chỉ đầy đủ", [{ text: "OK" }]);
            return;
        }
        try {
            setSaving(true);
            await UserService.updateAddress(user.token, id, {
                address_detail: addressDetail,
            });

            // ✅ Nếu đang sửa địa chỉ hiện tại -> cập nhật luôn context
            if (user.selectedAddressId == id) {
                await updateUser({ address: addressDetail });
            }

            // <-- THAY ĐỔI: Dùng showSuccess và thêm nút điều hướng
            showSuccess("Thành công", "Đã cập nhật địa chỉ", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (err) {
            console.log("Save error:", err.response?.data || err.message);
            // <-- THAY ĐỔI: Dùng showError
            showError("Lỗi", "Không thể lưu địa chỉ.", [{ text: "OK" }]);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sửa địa chỉ</Text>

            <TextInput
                style={styles.input}
                placeholder="Nhập địa chỉ chi tiết..."
                placeholderTextColor={COLORS.subtext}
                value={addressDetail}
                onChangeText={setAddressDetail}
                multiline
            />

            <TouchableOpacity
                style={[styles.saveButton, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
            >
                <Text style={styles.saveButtonText}>
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </Text>
            </TouchableOpacity>

            {/* <-- THAY ĐỔI: Thêm Modal vào đây --> */}
            <NotificationModal {...modalProps} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 15,
    },
    input: {
        backgroundColor: COLORS.card,
        borderColor: COLORS.border,
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        color: COLORS.text,
        minHeight: 100,
        textAlignVertical: "top",
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        marginTop: 20,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
        elevation: 4,
    },
    saveButtonText: {
        color: COLORS.card,
        fontWeight: "700",
        fontSize: 16,
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});