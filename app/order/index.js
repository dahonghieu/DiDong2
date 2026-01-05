import React, { useEffect, useState, useContext, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import UserService from "../../services/UserService";
import { UserContext } from "../../contexts/UserContext";
import { useRouter, useFocusEffect } from "expo-router";

const COLORS = {
    primary: "#E53935",
    background: "#F9F9F9",
    card: "#FFFFFF",
    text: "#212121",
    subtext: "#757575",
    price: "#E53935",
    border: "#E0E0E0",
    shadow: "rgba(0, 0, 0, 0.1)",

    status_pending: "#FFC107",
    status_processing: "#007BFF",
    status_shipped: "#17A2B8",
    status_delivered: "#28A745",
    status_cancelled: "#DC3545",
};

const formatCurrency = (amount) =>
    Number(amount).toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
    });

const getStatusInfo = (status) => {
    const lower = status?.toLowerCase();
    switch (lower) {
        case "pending":
            return { text: "Chờ xác nhận", color: COLORS.status_pending };
        case "processing":
            return { text: "Đang xử lý", color: COLORS.status_processing };
        case "shipping":
            return { text: "Đang vận chuyển", color: COLORS.status_shipped };
        case "completed":
            return { text: "Đã giao hàng", color: COLORS.status_delivered };
        case "cancelled":
            return { text: "Đã hủy", color: COLORS.status_cancelled };
        default:
            return { text: "Không rõ", color: COLORS.subtext };
    }
};

export default function OrderScreen() {
    const { user } = useContext(UserContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            const fetchOrders = async () => {
                try {
                    const res = await UserService.getOrders(user.token);
                    const sorted = res.data.sort(
                        (a, b) => new Date(b.created_at) - new Date(a.created_at)
                    );
                    setOrders(sorted);
                } catch (err) {
                    console.log("Lỗi lấy danh sách đơn hàng:", err);
                } finally {
                    setLoading(false);
                }
            };

            if (user?.token) {
                fetchOrders();
            }

            // cleanup (optional)
            return () => { };
        }, [user?.token])
    );


    const filteredOrders =
        filter === "all"
            ? orders
            : orders.filter(
                (o) => o.status?.toLowerCase() === filter.toLowerCase()
            );

    const renderOrderItem = ({ item }) => {
        const statusInfo = getStatusInfo(item.status);
        const paymentMethodText =
            item.payment_method?.toUpperCase() === "COD"
                ? "Thanh toán khi nhận hàng"
                : "Chuyển khoản ngân hàng";

        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => router.push(`/order/${item.id}`)}
            >
                <View style={styles.headerRow}>
                    <Text style={styles.orderId}>Mã đơn hàng: #{item.id}</Text>
                    <View
                        style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}
                    >
                        <Text style={styles.statusText}>{statusInfo.text}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Ngày đặt:</Text>
                    <Text style={styles.infoValue}>
                        {new Date(item.created_at).toLocaleDateString("vi-VN")}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Hình thức thanh toán:</Text>
                    <Text
                        style={[styles.infoValue, { fontWeight: "700", color: COLORS.primary }]}
                    >
                        {paymentMethodText}
                    </Text>
                </View>

                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tổng cộng:</Text>
                    <Text style={styles.totalValue}>{formatCurrency(item.total)}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 10, color: COLORS.subtext }}>
                    Đang tải danh sách đơn hàng...
                </Text>
            </View>
        );
    }

    if (orders.length === 0) {
        return (
            <View style={styles.center}>
                <Ionicons name="receipt-outline" size={60} color={COLORS.border} />
                <Text style={styles.emptyText}>Bạn chưa có đơn hàng nào.</Text>
                <TouchableOpacity
                    style={styles.buyNowButton}
                    onPress={() => router.push("/(tabs)")}
                >
                    <Text style={styles.buyNowText}>Bắt đầu mua sắm</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
            {/* Thanh lọc cố định */}
            <View style={styles.filterWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContainer}
                >
                    {[
                        { key: "all", label: "Tất cả" },
                        { key: "processing", label: "Đang xử lý" },
                        { key: "shipping", label: "Đang vận chuyển" },
                        { key: "completed", label: "Đã giao" },
                        { key: "cancelled", label: "Đã hủy" },
                    ].map((item) => (
                        <TouchableOpacity
                            key={item.key}
                            style={[
                                styles.filterButton,
                                filter === item.key && styles.activeFilterButton,
                            ]}
                            onPress={() => setFilter(item.key)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    filter === item.key && styles.activeFilterText,
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Danh sách đơn hàng */}
            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderOrderItem}
                contentContainerStyle={[
                    styles.flatListContent,
                    filteredOrders.length === 0 && { flex: 1 },
                ]}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={{ color: COLORS.subtext }}>Không có đơn hàng phù hợp</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    filterWrapper: {
        backgroundColor: COLORS.card,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        zIndex: 10,
    },
    filterContainer: {
        paddingVertical: 10,
        paddingHorizontal: 10,
        alignItems: "center",
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: COLORS.background,
    },
    activeFilterButton: {
        backgroundColor: COLORS.primary,
        elevation: 3,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
    },
    filterText: {
        fontSize: 14,
        fontWeight: "600",
        color: COLORS.subtext,
    },
    activeFilterText: {
        color: COLORS.card,
        fontWeight: "700",
    },

    flatListContent: {
        paddingHorizontal: 15,
        paddingTop: 8,
        paddingBottom: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
        paddingHorizontal: 20,
    },
    orderCard: {
        backgroundColor: COLORS.card,
        padding: 18,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        marginBottom: 8,
        paddingBottom: 8,
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
        fontWeight: "700",
    },
    totalValue: {
        fontSize: 18,
        color: COLORS.price,
        fontWeight: "800",
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
