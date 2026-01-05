import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import UserService from "../../services/UserService";
import { UserContext } from "../../contexts/UserContext";
import { useRouter } from "expo-router";

const COLORS = {
  primary: "#E53935",
  background: "#F9F9F9",
  card: "#FFFFFF",
  text: "#212121",
  subtext: "#757575",
  price: "#E53935",
  border: "#E0E0E0",
  shadow: "rgba(0, 0, 0, 0.1)",
  status_delivered: "#28A745",
  status_paid: "#28A745",
  status_default: "#757575",
};

const formatCurrency = (amount) =>
  Number(amount).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

const getHistoryStatusInfo = (item) => {
  if (item.payment_status?.toLowerCase() === "paid") {
    return { text: "Đã thanh toán", color: COLORS.status_paid };
  }
  if (
    item.status?.toLowerCase() === "completed" ||
    item.status?.toLowerCase() === "delivered"
  ) {
    return { text: "Đã giao hàng", color: COLORS.status_delivered };
  }
  return { text: "Đã hoàn tất", color: COLORS.status_default };
};

export default function OrderHistoryScreen() {
  const { user } = useContext(UserContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await UserService.getCompletedOrders(user.token);
        const sortedOrders = res.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setOrders(sortedOrders);
      } catch (err) {
        console.log("❌ Lỗi lấy danh sách đơn hàng:", err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user?.token) fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.subtext }}>
          Đang tải lịch sử đơn hàng...
        </Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="archive-outline" size={60} color={COLORS.border} />
        <Text style={styles.emptyText}>Chưa có đơn hàng đã hoàn tất.</Text>
        <TouchableOpacity
          style={styles.buyNowButton}
          onPress={() => router.push("/(tabs)")}
        >
          <Text style={styles.buyNowText}>Bắt đầu mua sắm</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderOrderItem = ({ item }) => {
    const statusInfo = getHistoryStatusInfo(item);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/order/${item.id}`)}
        activeOpacity={0.9}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={styles.orderId}>Mã đơn hàng: #{item.id}</Text>
          <View
            style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}
          >
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>
        </View>

        {/* Ngày hoàn tất */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ngày hoàn tất:</Text>
          <Text style={styles.infoValue}>
            {new Date(item.created_at).toLocaleDateString("vi-VN")}
          </Text>
        </View>

        {/* Phương thức thanh toán */}
        {item.payment_method && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Thanh toán:</Text>
            <Text style={styles.infoValue}>
              {item.payment_method?.toUpperCase() === "COD"
                ? "Thanh toán khi nhận hàng"
                : "Chuyển khoản"}
            </Text>
          </View>
        )}

        {/* Tổng cộng */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalValue}>{formatCurrency(item.total)}</Text>
        </View>

        {/* 🔁 Nút Mua lại */}
        <TouchableOpacity
          style={styles.reorderButton}
          onPress={() => {
            console.log("🔁 Mua lại đơn hàng:", item.id);
            router.push({
              pathname: "/cart/checkout",
              params: { reorder: true, order_id: item.id },
            });
          }}
        >
          <Ionicons
            name="cart-outline"
            size={18}
            color={COLORS.card}
            style={{ marginRight: 6 }}
          />
          <Text style={styles.reorderText}>Mua lại</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderOrderItem}
      contentContainerStyle={styles.flatListContent}
    />
  );
}

const styles = StyleSheet.create({
  flatListContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 20,
  },
  orderCard: {
    backgroundColor: COLORS.card,
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  orderId: {
    fontWeight: "700",
    fontSize: 16,
    color: COLORS.text,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  statusText: {
    color: COLORS.card,
    fontSize: 13,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.subtext,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 18,
    color: COLORS.price,
    fontWeight: "800",
  },
  reorderButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
  },
  reorderText: {
    color: COLORS.card,
    fontWeight: "700",
    fontSize: 15,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.subtext,
    marginVertical: 20,
    fontWeight: "500",
  },
  buyNowButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    elevation: 3,
  },
  buyNowText: {
    color: COLORS.card,
    fontWeight: "700",
    fontSize: 16,
  },
});
