import React, { useState, useContext } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    // Alert, // <-- THAY ĐỔI: Không dùng Alert nữa
} from "react-native";
import { useRouter } from "expo-router";
import { UserContext } from "../../contexts/UserContext";
import UserService from "../../services/UserService";

// <-- THAY ĐỔI: Import hook và component modal
import { useNotificationModal } from "../../hooks/useNotificationModal";
import NotificationModal from "../../components/common/NotificationModal";

const COLORS = {
    primary: "#FF5733",
    text: "#333",
    border: "#ccc",
    background: "#fff",
};

export default function EditMainAddressScreen() {
    // <-- THAY ĐỔI: Khởi tạo hook
    const { modalProps, showSuccess, showError } = useNotificationModal();

    const { user, updateUser } = useContext(UserContext);
    const [address, setAddress] = useState(user?.address || "");
    const router = useRouter();

    const handleSave = async () => {
        if (!address.trim()) {
            // <-- THAY ĐỔI: Dùng showError
            showError("Lỗi", "Vui lòng nhập địa chỉ hợp lệ", [{ text: "OK" }]);
            return;
        }

        try {
            const res = await UserService.updateMainAddress(user.token, address.trim());
            if (res.status === 200) {
                updateUser({ address });
                // <-- THAY ĐỔI: Dùng showSuccess
                showSuccess("Thành công", "Cập nhật địa chỉ chính thành công", [
                    { text: "OK", onPress: () => router.back() },
                ]);
            }
        } catch (err) {
            console.log("❌ Update main address error:", err.message);
            // <-- THAY ĐỔI: Dùng showError
            showError("Lỗi", "Không thể cập nhật địa chỉ chính.", [{ text: "OK" }]);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Địa chỉ hiện tại:</Text>
            <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Nhập địa chỉ mới"
            />
            <TouchableOpacity style={styles.button} onPress={handleSave}>
                <Text style={styles.buttonText}>Lưu thay đổi</Text>
            </TouchableOpacity>

            {/* <-- THAY ĐỔI: Thêm Modal vào đây --> */}
            <NotificationModal {...modalProps} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: COLORS.background },
    label: { fontSize: 16, color: COLORS.text, marginBottom: 8 },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 10,
        marginBottom: 20,
        color: COLORS.text,
    },
    button: {
        backgroundColor: COLORS.primary,
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});