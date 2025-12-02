import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import * as NavigationBar from 'expo-navigation-bar';
import { useEffect } from 'react';
import { Tabs } from 'expo-router';
// Nhập các icon từ @expo/vector-icons
import { FontAwesome5, Feather, Ionicons } from '@expo/vector-icons';

// Thiết lập màu sắc chung cho Tab Bar
const TAB_BAR_OPTIONS = {
  tabBarActiveTintColor: '#f0530bff', // Màu xanh dương nổi bật khi được chọn
  tabBarInactiveTintColor: '#A0A0A0', // Màu xám đậm khi không được chọn
  tabBarStyle: {
    backgroundColor: '#FFFFFF', // Nền Tab Bar trắng
    height: 80, // Chiều cao Tab Bar lớn hơn
    paddingBottom: 5, // Đẩy icon và chữ lên một chút

    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1', // Đường viền trên mờ
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '600',
  }
};

export default function RootLayout() {
   useEffect(() => {
    // Ẩn thanh điều hướng Android
    NavigationBar.setVisibilityAsync("hidden");

    // Hoặc immersive để vuốt mới hiện
    NavigationBar.setBehaviorAsync("overlay-swipe");
  }, []);
  return (
    <Tabs screenOptions={TAB_BAR_OPTIONS}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          headerShown: false,
          tabBarIcon: ({ color }) => <FontAwesome5 name="home" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="product"
        options={{
          title: 'Sản phẩm',
          headerShown: false,
          tabBarIcon: ({ color }) => <Feather name="shopping-bag" size={22} color={color} />,
        }}
      />
        <Tabs.Screen
        name="cart"
        options={{
          title: "Giỏ hàng",
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="shopping-cart" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: 'Tôi',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}