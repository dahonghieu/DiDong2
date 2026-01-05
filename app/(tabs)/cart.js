import React, { useContext, useCallback, useState } from "react"; // <-- THAY ĐỔI: Xóa 'useEffect' vì hook 'useNotificationModal' đã quản lý
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
} from "react-native";
import { UserContext } from "../../contexts/UserContext";
import UserService from "../../services/UserService";
import { imageUrl } from "../../services/config";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Modal from "react-native-modal";

// <-- THAY ĐỔI: Import hook và component modal mới
import { useNotificationModal } from "../../hooks/useNotificationModal";
import NotificationModal from "../../components/common/NotificationModal";

const COLORS = {
  primary: "#FF5733",
  secondary: "#333333",
  background: "#F9F9F9",
  card: "#FFFFFF",
  text: "#333333",
  subtext: "#888888",
  price: "#CC0000",
  border: "#EEEEEE",
  danger: "#D32F2F",
  shadow: "rgba(0, 0, 0, 0.1)",
  success: "#28a745",
};

export default function CartScreen() {
  const { user } = useContext(UserContext);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // --- States cho Modal ---
  
  // <-- THAY ĐỔI: Khởi tạo hook để lấy các props và hàm điều khiển modal
  const { modalProps, showSuccess, showError } = useNotificationModal();

  // <-- THAY ĐỔI: Xóa state isSuccessModal, isErrorModal, modalMessage
  
  // (Chúng ta vẫn giữ lại state cho modal XÁC NHẬN, vì nó có logic riêng)
  const [isConfirmModal, setConfirmModal] = useState(false);
  const [modalTitle, setModalTitle] = useState(""); // Dùng cho modal Xác nhận
  const [modalConfirmMessage, setModalConfirmMessage] = useState(""); // Đổi tên để tránh trùng lặp
  const [onConfirmAction, setOnConfirmAction] = useState(null);
  

  // <-- THAY ĐỔI: Xóa 2 khối useEffect cho isSuccessModal và isErrorModal (hook đã xử lý việc này)

  // --- Hàm tiện ích cho Modal ---

  // <-- THAY ĐỔI: Xóa hàm showSuccessModal và showErrorModal (giờ dùng trực tiếp từ hook)

  // Sửa lại hàm showConfirmModal để dùng state mới
  const showConfirmModal = (title, message, action) => {
    setModalTitle(title);
    setModalConfirmMessage(message); // <-- THAY ĐỔI: Dùng state mới
    setOnConfirmAction(() => action);
    setConfirmModal(true);
  };

  // --- Utils ---
  const formatCurrency = (amount) =>
    Number(amount).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });

  const totalPrice = cartItems.reduce((sum, item) => {
    if (!item.product) return sum;
    const price =
      item.product.price_discount > 0
        ? item.product.price_discount
        : item.product.price;
    return sum + price * item.quantity;
  }, 0);

  // --- API Calls & Logic (ĐÃ CẬP NHẬT) ---

  const fetchCart = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const res = await UserService.getCart(user.token);
      setCartItems(res.data);
    } catch (err) {
      // <-- THAY ĐỔI: Gọi hàm từ hook (thêm Tiêu đề và Nội dung)
      showError("Lỗi", "Không thể tải giỏ hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchCart();
    }, [user])
  );

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemove(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
    try {
      await UserService.updateCart(user.token, {
        product_id: productId,
        quantity: newQuantity,
      });
    } catch (err) {
      // <-- THAY ĐỔI: Gọi hàm từ hook
      showError("Lỗi", "Không thể cập nhật số lượng.");
      fetchCart();
    }
  };

  const handleRemove = (productId) => {
    const action = async () => {
      setCartItems(cartItems.filter((i) => i.product.id !== productId));
      try {
        await UserService.removeFromCart(user.token, {
          product_id: productId,
        });
        // <-- THAY ĐỔI: Gọi hàm từ hook
        showSuccess("Thành công", "Đã xóa sản phẩm khỏi giỏ hàng.");
      } catch (err) {
        // <-- THAY ĐỔI: Gọi hàm từ hook
        showError("Lỗi", "Không thể xóa sản phẩm khỏi giỏ hàng.");
        fetchCart();
      }
    };
    showConfirmModal(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?",
      action
    );
  };

  const handleClearCart = () => {
    const action = async () => {
      try {
        await UserService.clearCart(user.token);
        setCartItems([]);
        // <-- THAY ĐỔI: Gọi hàm từ hook
        showSuccess("Thành công", "Giỏ hàng đã được làm trống.");
      } catch (err) {
        // <-- THAY ĐỔI: Gọi hàm từ hook
        showError("Lỗi", "Không thể xóa toàn bộ giỏ hàng.");
      }
    };
    showConfirmModal(
      "Xác nhận",
      "Bạn có chắc muốn xóa toàn bộ giỏ hàng?",
      action
    );
  };

  // --- Render Item Component ---
  const renderItem = ({ item }) => {
    // ... (Không có thay đổi gì ở đây)
    const product = item.product;
    if (!product) return null;
    const hasDiscount =
      product.price_discount > 0 && product.price_discount < product.price;

    return (
      <View style={styles.cartItem}>
        <Image
          source={{
            uri: product.image_url
              ? imageUrl("product", product.image_url)
              : "https://via.placeholder.com/150",
          }}
          style={styles.image}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <View
            style={{ flexDirection: "row", alignItems: "baseline", marginTop: 4 }}
          >
            {hasDiscount && (
              <Text style={styles.originalPrice}>
                {formatCurrency(product.price)}
              </Text>
            )}
            <Text style={styles.discountPrice}>
              {formatCurrency(hasDiscount ? product.price_discount : product.price)}
            </Text>
          </View>
        </View>
        <View style={styles.actionControls}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => handleQuantityChange(product.id, item.quantity - 1)}
            >
              <MaterialIcons name="remove" size={20} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.qtyNumber}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => handleQuantityChange(product.id, item.quantity + 1)}
            >
              <MaterialIcons name="add" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => handleRemove(product.id)}
            style={styles.removeButton}
          >
            <Ionicons name="trash-outline" size={22} color={COLORS.subtext} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };


  if (!user) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="person-off" size={60} color={COLORS.subtext} />
        <Text style={styles.emptyCartText}>
          Vui lòng đăng nhập để xem giỏ hàng.
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/user/login")}
        >
          <Text style={styles.checkoutText}>Đăng nhập ngay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.subtext }}>
          Đang tải giỏ hàng...
        </Text>
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cart-outline" size={60} color={COLORS.subtext} />
        <Text style={styles.emptyCartText}>Giỏ hàng của bạn đang trống!</Text>
        <TouchableOpacity
          style={styles.continueShoppingButton}
          onPress={() => router.push("/")}
        >
          <Text style={styles.continueShoppingText}>Tiếp tục mua sắm</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ... (Không có thay đổi gì ở FlatList và Footer) */}
      <FlatList
        data={cartItems}
        keyExtractor={(item) => (item.id || item.product.id).toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.flatListContent}
        ListFooterComponent={<View style={{ height: 20 }} />}
      />
      <View style={styles.footer}>
        <View style={styles.summaryContainer}>
          <Text style={styles.subtotalText}>
            Tạm tính ({cartItems.length} sản phẩm):
          </Text>
          <Text style={styles.totalPriceText}>
            {formatCurrency(totalPrice)}
          </Text>
        </View>
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={styles.clearCartButton}
            onPress={handleClearCart}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.secondary} />
            <Text style={styles.clearCartText}>Xóa tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => router.push("/cart/checkout")}
          >
            <Text style={styles.checkoutText}>Tiến hành thanh toán</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* === CÁC MODAL === */}

      {/* <-- THAY ĐỔI: Thêm component NotificationModal và truyền props từ hook vào --> */}
      <NotificationModal {...modalProps} />

      {/* <-- THAY ĐỔI: Xóa 2 Modal cho Success và Error --> */}

      {/* Modal Xác nhận (Giữ nguyên) */}
      <Modal
        isVisible={isConfirmModal}
        animationIn="zoomIn"
        animationOut="zoomOut"
        backdropOpacity={0.4}
        onBackdropPress={() => setConfirmModal(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalIconWrapper,
              { backgroundColor: COLORS.primary }, // Màu cam
            ]}
          >
            <Ionicons name="help-sharp" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.modalTitle}>{modalTitle}</Text>
          <Text style={styles.modalMessage}>{modalConfirmMessage}</Text>
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setConfirmModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalConfirmButton]}
              onPress={() => {
                setConfirmModal(false);
                if (typeof onConfirmAction === "function") {
                  onConfirmAction();
                }
              }}
            >
              <Text style={styles.modalConfirmButtonText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  flatListContent: { paddingHorizontal: 16, paddingTop: 10 },
  cartItem: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    alignItems: "center",
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
    resizeMode: "cover",
    backgroundColor: COLORS.background,
  },
  info: {
    flex: 1,
    justifyContent: "space-between",
    paddingRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 5,
  },
  discountPrice: {
    color: COLORS.price,
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 8,
  },
  originalPrice: {
    color: COLORS.subtext,
    fontSize: 14,
    textDecorationLine: "line-through",
  },
  actionControls: {
    height: 80,
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  qtyButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  qtyNumber: {
    paddingHorizontal: 8,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    height: 30,
    lineHeight: 30,
    textAlign: "center",
  },
  removeButton: {
    padding: 5,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 15,
    paddingBottom: Platform.OS === "ios" ? 30 : 15,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  subtotalText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  totalPriceText: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.price,
  },
  footerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  clearCartButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
    backgroundColor: COLORS.card,
  },
  clearCartText: {
    color: COLORS.secondary,
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 5,
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  checkoutText: {
    color: COLORS.card,
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  emptyCartText: {
    color: COLORS.subtext,
    fontSize: 18,
    marginTop: 20,
    marginBottom: 30,
    fontWeight: "500",
  },
  continueShoppingButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 3,
  },
  continueShoppingText: {
    color: COLORS.card,
    fontWeight: "bold",
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 3,
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: COLORS.text,
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.subtext,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  modalButtonContainer: {
    flexDirection: "row",
    marginTop: 25,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: COLORS.border,
    marginRight: 10,
  },
  modalCancelButtonText: {
    color: COLORS.secondary,
    fontWeight: "600",
    fontSize: 16,
  },
  modalConfirmButton: {
    backgroundColor: COLORS.primary,
  },
  modalConfirmButtonText: {
    color: COLORS.card,
    fontWeight: "bold",
    fontSize: 16,
  },
});