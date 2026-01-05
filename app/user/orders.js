import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import UserService from "../../services/UserService";
import { UserContext } from "../../contexts/UserContext";
import { useRouter } from "expo-router";
export default function OrderScreen() {
    const { user } = useContext(UserContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await UserService.getOrders(user.token);
                setOrders(res.data);
                console.log("Lấy đơn hàng:", res.data);
            } catch (err) {
                console.log("Lỗi lấy danh sách đơn hàng:", err);
            } finally {
                setLoading(false);
            }
        };
        if (user?.token) fetchOrders();
    }, [user]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#e74c3c" />
            </View>
        );
    }

    if (orders.length === 0) {
        return (
            <View style={styles.center}>
                <Text>Không có đơn hàng nào.</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={orders}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <TouchableOpacity
                    style={styles.orderCard}
                    onPress={() => router.push(`/orders/${item.id}`)} // bấm vào để qua trang chi tiết
                >
                    <Text style={styles.orderId}>Đơn hàng #{item.id}</Text>
                    <Text>Tổng tiền: {Number(item.total).toLocaleString()}₫</Text>
                    <Text>Trạng thái: {item.payment_status}</Text>
                    <Text>Ngày đặt: {item.created_at}</Text>
                </TouchableOpacity>
            )}
        />
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    orderCard: {
        backgroundColor: "#fff",
        margin: 10,
        padding: 15,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orderId: {
        fontWeight: "bold",
        fontSize: 16,
        marginBottom: 5,
    },
});
