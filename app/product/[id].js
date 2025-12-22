import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { UserContext } from "../../contexts/UserContext";
import ProductService from "../../services/ProductService";
import UserService from "../../services/UserService";
import { imageUrl } from "../../services/config";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNotificationModal } from "../../hooks/useNotificationModal";
import NotificationModal from "../../components/common/NotificationModal";

const COLORS = {
  primary: "#FF5733",
  secondary: "#FFD166",
  background: "#F4F7F6",
  cardBackground: "#FFFFFF",
  textDark: "#2B2B2B",
  textGray: "#CC0000",
  textOnPrimary: "#FFFFFF",
  border: "#E8ECEF",
  mota: "#6C757D",
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useContext(UserContext);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // <-- THAY ĐỔI: Khởi tạo hook
  const { modalProps, showSuccess, showError } = useNotificationModal();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await ProductService.show(id);
        setProduct(res.data);
      } catch (err) {
        console.log("Lỗi lấy chi tiết sản phẩm:", err);
        // <-- THAY ĐỔI: Gọi hàm showError từ hook
        showError("Lỗi", "Không thể tải chi tiết sản phẩm.");
      } finally {
        setLoading(false);
      }
    };
    setProduct(null);
    fetchProduct();
  }, [id]);



  const handleAddToCart = async () => {
    if (!user) {
      showError(
        "Yêu cầu đăng nhập",
        "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng.",
        [
          {
            text: "Hủy",
            style: "cancel", // <-- Thêm cái này để có màu xám
          },
          {
            text: "Đăng nhập",
            onPress: () => router.push("/user/login"),
            // Không cần style, tự động dùng màu cam (primary)
          },
        ]
      );
      return;
    }
    if (!product) return;

    try {
      setAdding(true);
      await UserService.addToCart(user.token, {
        product_id: product.id,
        quantity: 1,
      });
      // <-- THAY ĐỔI: Gọi hàm showSuccess từ hook
      showSuccess("Thành công!", "Đã thêm sản phẩm vào giỏ hàng.");
    } catch (err) {
      console.log("Add to cart error:", err);
      // <-- THAY ĐỔI: Gọi hàm showError từ hook
      showError("Lỗi", "Thêm vào giỏ hàng thất bại.");
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      showError(
        "Yêu cầu đăng nhập",
        "Bạn cần đăng nhập để tiến hành mua sản phẩm.",
        [
          {
            text: "Hủy",
            style: "cancel",
          },
          {
            text: "Đăng nhập",
            onPress: () => router.push("/user/login"),

          },
        ]
      );
      return;
    }
    if (!product) return;

    router.push({
      pathname: "/cart/checkout",
      params: {
        single: true,
        product_id: product.id,
        name: product.name,
        price:
          product.price_discount && product.price_discount > 0
            ? product.price_discount
            : product.price,
        image_url: product.image_url,
        quantity: 1,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.textGray }}>Không tìm thấy sản phẩm.</Text>
      </View>
    );
  }

  const hasDiscount = product.price_discount && product.price_discount > 0;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: imageUrl("product", product.image_url) }}
              style={styles.image}
            />
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.name}>{product.name}</Text>

            {hasDiscount ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  flexWrap: "wrap",
                }}
              >
                <Text style={styles.discountPrice}>
                  {Number(product.price_discount).toLocaleString()}₫
                </Text>
                <Text style={styles.originalPrice}>
                  {Number(product.price).toLocaleString()}₫
                </Text>
              </View>
            ) : (
              <Text style={styles.discountPrice}>
                {Number(product.price).toLocaleString()}₫
              </Text>
            )}

            <View style={styles.divider} />
            <Text style={styles.label}>Mô tả sản phẩm:</Text>
            <Text style={styles.description}>
              {product.content || "Không có mô tả chi tiết."}
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* ActionBar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          disabled={adding}
        >
          <Text style={styles.addToCartText}>
            {adding ? "Đang thêm..." : "Thêm vào giỏ"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyNowButton}
          onPress={handleBuyNow}
          disabled={!product}
        >
          <Text style={styles.buyNowText}>Mua ngay</Text>
        </TouchableOpacity>
      </View>

      {/* <-- THAY ĐỔI: Thay thế 2 modal cũ bằng component NotificationModal --> */}
      <NotificationModal {...modalProps} />

    </SafeAreaView>
  );
}

// <-- THAY ĐỔI: Chỉ giữ lại các style cần thiết, xóa bớt style modal cũ
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.cardBackground },
  scrollContent: { paddingBottom: 10 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  imageWrapper: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    margin: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: {
    width: "100%",
    height: 350,
    resizeMode: "contain",
  },
  infoContainer: {
    paddingHorizontal: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: COLORS.textDark,
  },
  discountPrice: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.primary,
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 18,
    color: COLORS.textGray,
    textDecorationLine: "line-through",
    alignSelf: "flex-end",
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: COLORS.textDark,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.mota,
  },
  actionBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    backgroundColor: COLORS.cardBackground,
  },
  addToCartButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: "transparent",
  },
  addToCartText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  buyNowButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    elevation: 5,
  },
  buyNowText: {
    color: COLORS.textOnPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },


});