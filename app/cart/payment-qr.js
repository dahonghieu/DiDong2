import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  // Alert, // <-- THAY ĐỔI: Không dùng Alert nữa
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import UserService from "../../services/UserService";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { UserContext } from "../../contexts/UserContext";
// <-- THAY ĐỔI: Import hook và component modal
import { useNotificationModal } from "../../hooks/useNotificationModal";
import NotificationModal from "../../components/common/NotificationModal";

// --- Bảng màu nhất quán ---
const COLORS = {
  primary: "#FF5733",
  secondary: "#1ABC9C",
  background: "#F9F9F9",
  card: "#FFFFFF",
  text: "#333333",
  subtext: "#888888",
  success: "#34C759",
  border: "#EEEEEE",
  shadow: "rgba(0, 0, 0, 0.1)",
};

export default function PaymentQRScreen() {
  const { user } = useContext(UserContext);
  const router = useRouter();
  const { order_id, total } = useLocalSearchParams();

  // <-- THAY ĐỔI: Khởi tạo hook
  const { modalProps, showSuccess, showError } = useNotificationModal();

  const [isChecking, setIsChecking] = useState(false);
  const [manualConfirming, setManualConfirming] = useState(false);

  const formatCurrency = (amount) =>
    Number(amount).toLocaleString("vi-VN", {
      style: "currency", 
      currency: "VND",
    });

  // --- Thông tin QR ---


  // --- Logic kiểm tra tự động ---
  useEffect(() => {
    setIsChecking(true);
    const interval = setInterval(async () => {
      try {
       
        const res = await UserService.getOrderDetail( user.token ,order_id ); 
        
        if (res.data.payment_status === 'paid') {
         
          showSuccess(
            "Thanh toán thành công 🎉",
            "Đơn hàng sẽ sớm được giao đến bạn.",
            [
              {
                text: "Về trang chủ",
                onPress: () => router.replace("/"),
                style: "cancel",
              },
              {
                text: "Xem đơn hàng",
                onPress: () => router.push("/order"),
              },
            ]
          );
          clearInterval(interval);
          setIsChecking(false);
        }
      } catch (e) {
        console.log("Kiểm tra trạng thái lỗi:", e);
        // (Bạn có thể thêm showError ở đây nếu muốn, nhưng có thể hơi phiền)
        // showError("Lỗi", "Không thể kiểm tra trạng thái đơn hàng.", [{ text: "OK" }]);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      setIsChecking(false);
    };
  }, []);

  // --- Xử lý xác nhận thủ công (nút) ---
  const handleManualConfirm = async () => {
    setManualConfirming(true);
    try {
     
      await UserService.confirmPayment(order_id);
      
     
      showSuccess(
        "Xác nhận đã gửi",
        "Hệ thống sẽ kiểm tra giao dịch của bạn trong vòng 5 phút. Cảm ơn!",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(tabs)/orders"),
          },
        ]
      );
    } catch (err) {
      console.log(err);
      // <-- THAY ĐỔI: Dùng showError thay cho Alert
      showError(
        "Lỗi",
        "Không thể gửi yêu cầu xác nhận. Vui lòng thử lại sau.",
        [{ text: "OK" }]
      );
    } finally {
      setManualConfirming(false);
    }
  };

  return (
    // <-- THAY ĐỔI: Bọc ScrollView trong 1 View để chứa Modal
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView>
        <View style={styles.container}>
          <View style={styles.header}>
            <MaterialCommunityIcons
              name="qrcode-scan"
              size={35}
              color={COLORS.primary}
            />
            <Text style={styles.title}>Quét mã để thanh toán</Text>
            <Text style={styles.subtitle}>
              Sử dụng ứng dụng ngân hàng quét mã QR dưới đây
            </Text>
          </View>

          {/* Khung chứa QR Code nổi bật */}
          <View style={styles.qrCodeContainer}>
            <Image
              source={{ uri: qrUrl }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>

          {/* Trạng thái kiểm tra */}
          {isChecking && (
            <View style={styles.checkingStatus}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.checkingText}>
                Đang chờ xác nhận giao dịch tự động...
              </Text>
            </View>
          )}

          {/* Khung chứa thông tin chi tiết */}
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Thông tin chuyển khoản</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ngân hàng</Text>
              <Text style={styles.detailValue}>Vietinbank (ICB)</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Chủ tài khoản</Text>
              <Text style={styles.detailValue}>{accountName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Số tài khoản</Text>
              <Text style={styles.detailValue}>{accountNo}</Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nội dung</Text>
              <Text style={styles.detailValue}>{content}</Text>
            </View>

            <View style={[styles.detailRow, styles.amountRow]}>
              <Text style={styles.amountLabel}>Tổng tiền</Text>
              <Text style={styles.amountValue}>{formatCurrency(amount)}</Text>
            </View>
          </View>

          {/* Nút Xác nhận thủ công */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleManualConfirm}
            disabled={manualConfirming}
          >
            {manualConfirming ? (
              <ActivityIndicator size="small" color={COLORS.card} />
            ) : (
              <Text style={styles.confirmButtonText}>
                Tôi đã chuyển khoản xong
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* <-- THAY ĐỔI: Thêm Modal vào đây --> */}
      <NotificationModal {...modalProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: "center",
    backgroundColor: COLORS.background,
  },

  // --- Header ---
  header: {
    alignItems: "center",
    marginBottom: 20,
    marginTop: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    textAlign: "center",
    marginTop: 5,
  },

  // --- QR Code Container ---
  qrCodeContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    elevation: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  qrImage: {
    width: 260,
    height: 260,
  },

  // --- Trạng thái kiểm tra ---
  checkingStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: "100%",
    justifyContent: "center",
  },
  checkingText: {
    marginLeft: 8,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "500",
  },

  // --- Details Card ---
  detailsCard: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: COLORS.subtext,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "600",
    textAlign: "right",
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.background,
    marginVertical: 8,
  },
  amountRow: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 15,
  },
  amountLabel: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: "700",
  },
  amountValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
  },

  // --- Buttons ---
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    width: "100%",
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 5,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  confirmButtonText: {
    color: COLORS.card,
    fontSize: 17,
    fontWeight: "700",
  },
  cancelButton: {
    paddingVertical: 10,
    marginBottom: 20,
  },
  cancelText: {
    color: COLORS.subtext,
    fontSize: 15,
    fontWeight: "600",
  },
});