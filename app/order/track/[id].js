import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Image,
} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
// import { useRouter } from "expo-router"; // Đã xoá vì không còn dùng nút back

const { width, height } = Dimensions.get("window");

export default function TrackOrderScreen() {
    // const router = useRouter(); // Đã xoá

    const userLocation = { latitude: 10.762622, longitude: 106.660172 };
    const orderLocation = { latitude: 10.7757, longitude: 106.7004 }; // Vị trí shipper
    const path = [
        { latitude: 10.762622, longitude: 106.660172 },
        { latitude: 10.770622, longitude: 106.678172 },
        { latitude: 10.7757, longitude: 106.7004 },
    ];

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: 10.77,
                    longitude: 106.68,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                {/* Đường đi của shipper */}
                <Polyline
                    coordinates={path}
                    strokeColor={COLORS.primary}
                    strokeWidth={5}
                />

                {/* Vị trí của bạn (user) */}
                <Marker coordinate={userLocation}>
                    <Image
                        source={{
                            uri: "https://cdn-icons-png.flaticon.com/512/854/854866.png", // Icon nhà
                        }}
                        style={{ width: 40, height: 40 }}
                    />
                </Marker>

                {/* Vị trí của shipper (đã đổi icon) */}
                <Marker coordinate={orderLocation}>
                    <Image
                        source={{
                            // Icon shipper xe máy
                            uri: "https://cdn-icons-png.flaticon.com/512/2972/2972185.png",
                        }}
                        style={{ width: 45, height: 45 }}
                    />
                </Marker>
            </MapView>

            {/* Thẻ thông tin chi tiết */}
            <View style={styles.bottomCard}>
                <View style={styles.statusContainer}>
                    <Text style={styles.status}>Đơn hàng đang trên đường</Text>
                    <Text style={styles.subText}>Dự kiến giao: 15:30</Text>
                </View>

                {/* Thanh tiến trình */}
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar} />
                </View>

                {/* Thông tin tài xế chi tiết */}
                <View style={styles.driverInfo}>
                    <Image
                        source={{
                            uri: "https://cdn-icons-png.flaticon.com/512/219/219969.png",
                        }}
                        style={styles.avatar}
                    />
                    <View style={styles.driverDetails}>
                        <Text style={styles.driverName}>Nguyễn Văn Tài</Text>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={14} color={COLORS.star} />
                            <Text style={styles.ratingText}>4.9 (1.2k đánh giá)</Text> 
                        </View>
                    </View>
                    <View style={styles.vehicleInfo}>
                        <Text style={styles.vehicleText}>Honda Wave</Text>
                        <Text style={styles.vehiclePlate}>59-T2 123.45</Text>
                    </View>
                </View>

                {/* Các nút hành động */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.actionBtn, styles.messageBtn]}>
                        <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
                        <Text style={[styles.actionText, styles.messageText]}>Nhắn tin</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.callBtn]}>
                        <Ionicons name="call-outline" size={20} color="#fff" />
                        <Text style={[styles.actionText, styles.callText]}>Gọi điện</Text>
                    </TouchableOpacity>
                </View>

                {/* Nút Back đã được xoá */}
            </View>
        </View>
    );
}

const COLORS = {
    primary: "#E74C3C", // Đỏ
    secondary: "#ECF0F1", // Xám nhạt
    bgCard: "#FFFFFF",
    textDark: "#2C3E50",
    textGray: "#7F8C8D",
    star: "#F39C12", // Vàng
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { width, height },
    bottomCard: {
        position: "absolute",
        bottom: 20,
        backgroundColor: COLORS.bgCard,
        width: width * 0.92,
        alignSelf: "center",
        borderRadius: 20,
        padding: 20,
        elevation: 8,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    statusContainer: {
        alignItems: "center",
        marginBottom: 10,
    },
    status: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.textDark,
    },
    subText: {
        color: COLORS.textGray,
        fontSize: 15,
        marginTop: 4,
    },
    progressContainer: {
        height: 8,
        backgroundColor: COLORS.secondary,
        borderRadius: 4,
        overflow: "hidden",
        marginVertical: 15,
    },
    progressBar: {
        height: "100%",
        width: "70%", // Giả sử đơn hàng đi được 70%
        backgroundColor: COLORS.primary,
        borderRadius: 4,
    },
    driverInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    driverDetails: {
        flex: 1,
    },
    driverName: {
        fontWeight: "700",
        fontSize: 16,
        color: COLORS.textDark,
    },
    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    ratingText: {
        color: COLORS.textGray,
        fontSize: 13,
        marginLeft: 4,
    },
    vehicleInfo: {
        alignItems: "flex-end",
    },
    vehicleText: {
        fontWeight: "600",
        color: COLORS.textDark,
    },
    vehiclePlate: {
        color: COLORS.textGray,
        fontSize: 13,
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
    },
    actionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderRadius: 10,
    },
    messageBtn: {
        backgroundColor: COLORS.secondary,
        marginRight: 8,
    },
    callBtn: {
        backgroundColor: COLORS.primary,
        marginLeft: 8,
    },
    actionText: {
        marginLeft: 8,
        fontWeight: "600",
        fontSize: 15,
    },
    messageText: {
        color: COLORS.primary,
    },
    callText: {
        color: "#fff",
    },
});