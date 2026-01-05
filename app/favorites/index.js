import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router"; // <-- Thêm useFocusEffect
import { UserContext } from "../../contexts/UserContext";
import FavoriteService from "../../services/FavoriteService";
import { imageUrl } from "../../services/config";
import { useNotificationModal } from "../../hooks/useNotificationModal"; // <-- Import
import NotificationModal from "../../components/common/NotificationModal"; // <-- Import

const { width } = Dimensions.get("window");
const screenPadding = 16;
const cardSpacing = 12;
const cardWidth = (width - screenPadding * 2 - cardSpacing) / 2;

// --- Cập nhật COLORS ---
const COLORS = {
  primaryRed: "#E53935",
  secondaryOrange: "#F39C12",
  background: "#F5F7FA",
  cardBackground: "#FFFFFF",
  productImageBackground: "#FAFAFA",
  textDark: "#1A237E",
  textGray: "#78909C",
  shadow: "rgba(0, 0, 0, 0.1)",
};

export default function FavoriteScreen() {
  const router = useRouter();
  const { user } = useContext(UserContext);
  const { modalProps, showWarning } = useNotificationModal(); // <-- Hook thông báo

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Dùng useFocusEffect để fetch lại data mỗi khi vào màn hình ---
  useFocusEffect(
    useCallback(() => {
      const fetchFavorites = async () => {
        if (!user) {
          setFavorites([]); // Xóa danh sách nếu user đăng xuất
          setLoading(false);
          return;
        }
        setLoading(true);
        try {
          const res = await FavoriteService.getFavorites(user.token);
          setFavorites(res.data);
        } catch (err) {
          console.log("❌ Lỗi lấy danh sách yêu thích:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchFavorites();
    }, [user]) // Chỉ re-run nếu user thay đổi (đăng nhập/đăng xuất)
  );

  // --- Cập nhật hàm xóa: Thêm bước xác nhận ---
  const handleRemoveFavorite = (productId, productName) => {
    showWarning(
      "Xác nhận xóa",
      `Bạn có chắc muốn xóa "${productName}" khỏi danh sách yêu thích?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              await FavoriteService.removeFavorite(user.token, productId);
              setFavorites((prev) =>
                prev.filter((item) => item.id !== productId)
              );
            } catch (err) {
              console.log("❌ Lỗi xóa yêu thích:", err);
              // (Bạn có thể thêm showError ở đây nếu muốn)
            }
          },
        },
      ]
    );
  };

  // --- Component Card (Viết lại) ---
  const FavoriteProductCard = ({ item }) => (
    <View style={styles.productCardWrapper}>
      <TouchableOpacity
        style={styles.productCard}
        activeOpacity={0.9}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl("product", item.image_url) }}
            style={styles.productImage}
          />
          {/* Badge % SALE */}
          {item.price_discount && item.price !== item.price_discount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{Math.round(((item.price - item.price_discount) / item.price) * 100)}%
              </Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>
              {(item.price_discount || item.price).toLocaleString()}
            </Text>
            {item.price_discount && item.price !== item.price_discount && (
              <Text style={styles.originalPrice}>
                {item.price.toLocaleString()}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Nút Xóa (thay thế nút tim) */}
      <TouchableOpacity
        style={styles.removeButtonOnImage}
        onPress={() => handleRemoveFavorite(item.id, item.name)}
      >
        <Ionicons name="trash-outline" size={20} color={COLORS.primaryRed} />
      </TouchableOpacity>
    </View>
  );

  // --- Các trạng thái (Loading, Not Logged In, Empty) ---
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primaryRed} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Ionicons name="heart-outline" size={50} color={COLORS.primaryRed} />
        <Text style={styles.loginText}>
          Vui lòng đăng nhập để xem sản phẩm yêu thích.
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/user/login")}
        >
          <Text style={styles.loginButtonText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons
          name="heart-broken-outline"
          size={60}
          color={COLORS.textGray}
        />
        <Text style={styles.emptyText}>Chưa có sản phẩm yêu thích nào.</Text>
      </View>
    );
  }

  // --- Giao diện chính ---
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>❤️ Sản phẩm yêu thích của bạn</Text>

      <View style={styles.productGrid}>
        {favorites.map((item) => (
          <FavoriteProductCard key={item.id} item={item} />
        ))}
      </View>
      <View style={{ height: 20 }} />

      {/* Render Modal (nằm trong ScrollView) */}
      <NotificationModal {...modalProps} />
    </ScrollView>
  );
}

// --- StyleSheet (Cập nhật) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 20,
    marginVertical: 20,
    paddingHorizontal: screenPadding,
    color: COLORS.textDark,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondaryOrange,
    paddingLeft: 8,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: screenPadding,
    justifyContent: "space-between",
  },
  productCardWrapper: {
    width: cardWidth,
    marginBottom: cardSpacing,
    position: 'relative',
  },
  productCard: {
    width: '100%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: COLORS.productImageBackground,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: "90%",
    height: "90%",
    resizeMode: "contain",
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.primaryRed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  discountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold'
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textDark,
    marginBottom: 6,
    height: 40,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline'
  },
  originalPrice: {
    fontSize: 12,
    color: COLORS.textGray,
    textDecorationLine: "line-through",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primaryRed,
    marginRight: 8,
  },
  removeButtonOnImage: {
    position: "absolute",
    top: 5,
    right: 5,
    zIndex: 2,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 20,
    padding: 5, // Tăng padding 1 chút cho nút Xóa
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 20,
  },
  emptyText: {
    color: COLORS.textGray,
    fontSize: 16,
    marginTop: 10,
  },
  loginText: {
    color: COLORS.textDark,
    fontSize: 16,
    marginVertical: 10,
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: COLORS.primaryRed,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});