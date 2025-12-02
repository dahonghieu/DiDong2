import React, { useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
    primaryRed: "#E74C3C",
    textGray: "#7F8C8D",
};

const BurstHeartButton = ({ isFavorited, onPress, size = 22 }) => {
    // 1. Khởi tạo các giá trị Animation
    const scaleValue = useRef(new Animated.Value(1)).current; // Scale của trái tim
    const ringScale = useRef(new Animated.Value(0)).current;   // Scale của vòng tròn burst
    const ringOpacity = useRef(new Animated.Value(0)).current; // Độ mờ của vòng tròn

    const handlePress = () => {
        // Nếu đang chuẩn bị favorite (tức là hiện tại chưa favorited) thì chạy hiệu ứng burst
        if (!isFavorited) {
            // Reset lại vòng tròn về trạng thái ban đầu
            ringScale.setValue(0.5);
            ringOpacity.setValue(1);

            Animated.parallel([
                // Animation 1: Trái tim nảy (Bounce)
                Animated.sequence([
                    Animated.timing(scaleValue, { toValue: 0.8, duration: 100, useNativeDriver: true }),
                    Animated.spring(scaleValue, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
                ]),
                // Animation 2: Vòng tròn lan ra và mờ dần (Burst ring)
                Animated.timing(ringScale, {
                    toValue: 2,      // Lan rộng gấp đôi
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(ringOpacity, {
                    toValue: 0,      // Mờ dần về 0
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Nếu unlike thì chỉ cần hiệu ứng thu nhỏ nhẹ
            Animated.sequence([
                Animated.timing(scaleValue, { toValue: 0.8, duration: 100, useNativeDriver: true }),
                Animated.spring(scaleValue, { toValue: 1, friction: 5, useNativeDriver: true }),
            ]).start();
        }

        // Gọi hàm onPress gốc (để xử lý logic API)
        onPress && onPress();
    };

    return (
        <TouchableOpacity
            activeOpacity={1}
            onPress={handlePress}
            // Giảm số nhân từ 2 xuống 1.3 hoặc 1.4 tùy ý bạn
            style={[styles.container, { width: size * 1.5, height: size * 1.5 }]}
        >
            {/* Vòng tròn Burst (nằm dưới trái tim) */}
            <Animated.View
                style={[
                    styles.burstRing,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: COLORS.primaryRed, // Màu của vòng nổ
                        opacity: ringOpacity,
                        transform: [{ scale: ringScale }],
                    },
                ]}
            />

            {/* Icon trái tim */}
            <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
                <Ionicons
                    name={isFavorited ? "heart" : "heart-outline"}
                    size={size}
                    color={isFavorited ? COLORS.primaryRed : COLORS.textGray}
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: 'rgba(0,0,0,0.05)', // Bật cái này lên để debug vùng bấm
    },
    burstRing: {
        position: 'absolute',
        // zIndex: -1, // Đảm bảo nó nằm dưới icon
    },
});

export default BurstHeartButton;