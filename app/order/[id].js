import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router"; // <-- Thêm
import { Ionicons } from "@expo/vector-icons";
import UserService from "../../services/UserService";
import ProductService from "../../services/ProductService";
import FavoriteService from "../../services/FavoriteService"; // <-- Thêm
import { imageUrl } from "../../services/config";
import { UserContext } from "../../contexts/UserContext";
import { useNotificationModal } from "../../hooks/useNotificationModal";
import NotificationModal from "../../components/common/NotificationModal";
import BurstHeartButton from "../../components/common/BurstHeartButton"; // <-- Thêm

const { width } = Dimensions.get("window");
const screenPadding = 16;
const cardSpacing = 12;
const cardWidth = (width - screenPadding * 2 - cardSpacing) / 2;

// --- Cập nhật COLORS ---
const COLORS = {
  primary: "#E53935", // Đổi tên primaryRed -> primary
  secondary: "#F39C12",
  background: "#F5F7FA",
  card: "#FFFFFF",
  productImageBackground: "#FFFFFF", // Thêm
  text: "#000002ff", // Đổi tên textDark -> text
  subtext: "#78909C", // Đổi tên textGray -> subtext
  border: "#E0E0E0",
  shadow: "rgba(0, 0, 0, 0.1)",
  price: "#E53935",
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
    case "shipping":
      return { text: "Đang vận chuyển", color: COLORS.status_shipped };
    case "processing":
      return { text: "Đang xử lý", color: COLORS.status_processing };
    case "completed":
      return { text: "Đã giao", color: COLORS.status_delivered };
    case "cancelled":
      return { text: "Đã hủy", color: COLORS.status_cancelled };
    case "pending":
      return { text: "Chờ xác nhận", color: COLORS.status_pending };
    default:
      return { text: "Không rõ", color: COLORS.subtext };
  }
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useContext(UserContext);
  const router = useRouter();
  const { modalProps, showSuccess, showError } = useNotificationModal();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [recommended, setRecommended] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState([]); // <-- Thêm state favorites

  const fetchDetail = async () => {
    try {
      if (!user?.token) return;
      setLoading(true);
      const res = await UserService.getOrderDetail(user.token, id);
      setOrder(res.data || res);
    } catch (err) {
      console.log("❌ Lỗi lấy chi tiết đơn hàng:", err.message);
      showError("Lỗi", "Không thể tải chi tiết đơn hàng.", [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommended = async () => {
    try {
      setLoadingProducts(true);
      const res = await ProductService.featured(6);
      const products = res.data || res;
      // Trộn và lấy 6 sản phẩm ngẫu nhiên
      const shuffled = products.sort(() => 0.5 - Math.random());
      setRecommended(shuffled.slice(0, 6));
    } catch (err) {
      console.log("❌ Lỗi lấy sản phẩm gợi ý:", err.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  // --- Thêm: Fetch favorites khi focus ---
  useFocusEffect(
    useCallback(() => {
      const fetchFavorites = async () => {
        if (user?.token) {
          try {
            const favRes = await FavoriteService.getFavorites(user.token);
            setFavoriteIds(favRes.data.map((p) => p.id));
          } catch (err) {
            console.log("❌ Lỗi lấy favorites:", err);
          }
        } else {
          setFavoriteIds([]);
        }
      };
      fetchFavorites();
    }, [user])
  );

  useEffect(() => {
    fetchDetail();
    fetchRecommended();
  }, [id, user?.token]);

  // --- Thêm: Logic Toggle Favorite ---
  const toggleFavorite = async (productId) => {
    if (!user) {
      showError(
        "Yêu cầu đăng nhập",
        "Bạn cần đăng nhập để thêm sản phẩm vào yêu thích.",
        [
          { text: "Hủy", style: "cancel" },
          { text: "Đăng nhập", onPress: () => router.push("/user/login") },
        ]
      );
      return;
    }

    const isCurrentlyFavorited = favoriteIds.includes(productId);
    setFavoriteIds((prev) =>
      isCurrentlyFavorited
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );

    try {
      if (isCurrentlyFavorited) {
        await FavoriteService.removeFavorite(user.token, productId);
      } else {
        await FavoriteService.addFavorite(user.token, productId);
      }
    } catch (err) {
      console.log("❌ Lỗi toggle yêu thích:", err);
      // Revert state
      setFavoriteIds((prev) =>
        isCurrentlyFavorited
          ? [...prev, productId]
          : prev.filter((id) => id !== productId)
      );
      showError("Lỗi", "Không thể cập nhật yêu thích.");
    }
  };

  const handleCancelOrder = async (reason) => {
    try {
      setIsCancelling(true);
      const res = await UserService.cancelOrder(user.token, order.id, reason);

      if (res.status === 200) {
        showSuccess("Thành công", "Đơn hàng đã được hủy.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        showError("Lỗi", "Không thể hủy đơn hàng.", [{ text: "OK" }]);
      }
    } catch (err) {
      console.log("❌ Lỗi hủy đơn:", err.message);
      showError("Lỗi", "Có lỗi xảy ra khi hủy đơn hàng.", [{ text: "OK" }]);
    } finally {
      setShowModal(false);
      setIsCancelling(false);
    }
  };

  // --- Thêm: Component Card Gợi ý ---
  const RecommendedProductCard = ({ item }) => {
    const isFavorited = favoriteIds.includes(item.id);

    return (
      <View style={styles.productCardWrapperRecommended}>
        <TouchableOpacity
          style={styles.productCardRecommended}
          activeOpacity={0.9}
          onPress={() => router.push(`/product/${item.id}`)}
        >
          <View style={styles.imageContainerRecommended}>
            <Image
              source={{ uri: imageUrl("product", item.image_url) }}
              style={styles.productImageRecommended}
            />
            {item.price_discount && item.price !== item.price_discount && (
              <View style={styles.discountBadgeRecommended}>
                <Text style={styles.discountTextRecommended}>
                  -{Math.round(((item.price - item.price_discount) / item.price) * 100)}%
                </Text>
              </View>
            )}
            <View style={styles.heartButtonOnImageRecommended}>
              <BurstHeartButton
                isFavorited={!!user && isFavorited}
                onPress={() => toggleFavorite(item.id)}
                size={20}
              />
            </View>
          </View>
          <View style={styles.productInfoRecommended}>
            <Text style={styles.productNameRecommended} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.priceContainerRecommended}>
              <Text style={styles.productPriceRecommended}>
                {(item.price_discount || item.price).toLocaleString()}
              </Text>
              {item.price_discount && item.price !== item.price_discount && (
                <Text style={styles.originalPriceRecommended}>
                  {item.price.toLocaleString()}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={{ color: COLORS.subtext }}>Không tìm thấy đơn hàng.</Text>
      </View>
    );
  }

  const statusInfo = getStatusInfo(order.status);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* HEADER */}
        <View style={styles.headerBox}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Đơn hàng #{order.id}</Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}
            >
              <Text style={styles.statusText}>{statusInfo.text}</Text>
            </View>
          </View>
          <Text style={styles.dateText}>
            Ngày đặt: {new Date(order.created_at).toLocaleDateString("vi-VN")}
          </Text>
        </View>

        {/* INFO BOX */}
        <View style={styles.infoBox}>
          <View style={styles.infoHeader}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoTitle}>Thông tin giao hàng</Text>
          </View>
          <Text style={styles.infoTextBold}>{order.user_name}</Text>
          <Text style={styles.infoText}>{order.phone}</Text>
          <Text style={styles.infoText}>{order.address}</Text>
        </View>

        {/* PAYMENT INFO */}
        <View style={styles.infoBox}>
          <View style={styles.infoHeader}>
            <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoTitle}>Chi tiết thanh toán</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Hình thức thanh toán:</Text>
            <Text style={styles.value}>
              {order.payment_method === "COD"
                ? "Thanh toán khi nhận hàng"
                : "Chuyển khoản ngân hàng"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Tổng tiền hàng:</Text>
            <Text style={styles.value}>
              {formatCurrency(order.total - (order.shipping_fee || 0))}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Phí vận chuyển:</Text>
            <Text style={styles.value}>
              {formatCurrency(order.shipping_fee || 0)}
            </Text>
          </View>
          <View style={styles.finalRow}>
            <Text style={styles.finalLabel}>Tổng cộng:</Text>
            <Text style={styles.finalValue}>{formatCurrency(order.total)}</Text>
          </View>
        </View>

        {/* ORDER DETAILS */}
        <Text style={styles.sectionTitle}>Sản phẩm trong đơn hàng</Text>
        {order.details.map((item, index) => (
          <View key={index} style={styles.productCard}>
            <Image
              source={{ uri: imageUrl("product", item.image_url) }}
              style={styles.productImage}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.productName} numberOfLines={2}>
                {item.product_name}
              </Text>
              <Text style={styles.productQty}>Số lượng: {item.quantity}</Text>
              <Text style={styles.productPrice}>
                {formatCurrency(item.price)}
              </Text>
            </View>
            <Text style={styles.productTotal}>
              {formatCurrency(item.price * item.quantity)}
            </Text>
          </View>
        ))}

        {/* ACTION BUTTONS */}
        {order.status !== "cancelled" && order.status !== "completed" && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.trackButton}
              onPress={() => router.push(`/order/track/${order.id}`)}
            >
              <Ionicons name="map-outline" size={18} color="#fff" />
              <Text style={styles.trackButtonText}>Theo dõi đơn hàng</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.cancelButtonText}>Hủy đơn</Text>
            </TouchableOpacity>
          </View>
        )}


        {/* RECOMMENDED PRODUCTS (Cập nhật) */}
        <View style={{ marginTop: 30 }}>
          <Text style={styles.sectionTitle}>Có thể bạn cũng thích</Text>
          {loadingProducts ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <View style={styles.productGrid}>
              {recommended.map((item) => (
                <RecommendedProductCard key={item.id} item={item} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* CANCEL MODAL */}
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Chọn lý do hủy đơn</Text>
            {[
              "Đặt nhầm sản phẩm",
              "Muốn đổi địa chỉ giao hàng",
              "Tìm thấy nơi khác rẻ hơn",
              "Không còn nhu cầu mua",
              "Khác",
            ].map((reason, i) => (
              <TouchableOpacity
                key={i}
                style={styles.reasonItem}
                onPress={() => handleCancelOrder(reason)}
                disabled={isCancelling}
              >
                <Text style={styles.reasonText}>{reason}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.modalClose}
            >
              <Text style={styles.modalCloseText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <NotificationModal {...modalProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  container: { padding: screenPadding, backgroundColor: COLORS.background },
  headerBox: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: { color: COLORS.card, fontWeight: "600" },
  dateText: { fontSize: 14, color: COLORS.subtext },
  infoBox: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  infoTitle: { fontWeight: "600", fontSize: 16, marginLeft: 6, color: COLORS.text },
  infoText: { color: COLORS.subtext, fontSize: 14, marginBottom: 2 },
  infoTextBold: { color: COLORS.text, fontWeight: "600", fontSize: 15 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  label: { color: COLORS.subtext },
  value: { color: COLORS.text, fontWeight: "500" },
  finalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 8,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  finalLabel: { fontWeight: "700", fontSize: 16, color: COLORS.text },
  finalValue: { fontWeight: "800", fontSize: 18, color: COLORS.price },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 8,
    color: COLORS.text,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
    paddingLeft: 8,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  productImage: { width: 70, height: 70, borderRadius: 8, marginRight: 15, backgroundColor: COLORS.productImageBackground },
  productName: { fontWeight: "600", fontSize: 15, color: COLORS.text },
  productQty: { fontSize: 13, color: COLORS.subtext },
  productPrice: { fontSize: 14, color: COLORS.subtext },
  productTotal: { color: COLORS.price, fontWeight: "700" },
  cancelButton: {
    backgroundColor: COLORS.status_cancelled,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  cancelButtonText: {
    color: COLORS.card,
    fontWeight: "700",
    fontSize: 16,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10, // cách đều 2 nút
  },

  trackButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.status_shipped,
    paddingVertical: 14,
    borderRadius: 10,
  },

  trackButtonText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 6,
  },

  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.status_cancelled,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    width: "80%",
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    color: COLORS.text,
  },
  reasonItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reasonText: { fontSize: 15, color: COLORS.text },
  modalClose: {
    backgroundColor: COLORS.subtext,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  modalCloseText: { color: COLORS.card, fontWeight: "600" },

  // --- Gợi ý sản phẩm (Style mới) ---
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  productCardWrapperRecommended: {
    width: cardWidth,
    marginBottom: cardSpacing,
    position: 'relative',
  },
  productCardRecommended: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainerRecommended: {
    position: 'relative',
    backgroundColor: COLORS.productImageBackground,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageRecommended: { width: "90%", height: "90%", resizeMode: "contain" },
  discountBadgeRecommended: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1,
  },
  discountTextRecommended: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  heartButtonOnImageRecommended: {
    position: "absolute",
    top: 5,
    right: 5,
    zIndex: 2,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 20,
    padding: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfoRecommended: { padding: 12 },
  productNameRecommended: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 6,
    height: 40, // Giữ 2 dòng
  },
  priceContainerRecommended: { flexDirection: 'row', alignItems: 'baseline' },
  productPriceRecommended: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    marginRight: 8,
  },
  originalPriceRecommended: {
    fontSize: 12,
    color: COLORS.subtext,
    textDecorationLine: "line-through",
  },
});