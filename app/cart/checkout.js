import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,

} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { UserContext } from "../../contexts/UserContext";
import UserService from "../../services/UserService";
import { imageUrl } from "../../services/config";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";


import { useNotificationModal } from "../../hooks/useNotificationModal";
import NotificationModal from "../../components/common/NotificationModal";

const COLORS = {
  primary: "#FF5733",
  background: "#F9F9F9",
  card: "#FFFFFF",
  text: "#333333",
  subtext: "#888888",
  price: "#CC0000",
  border: "#EEEEEE",
  active: "#FFF3EF",
  shadow: "rgba(0, 0, 0, 0.08)",
};

export default function CheckoutScreen() {

  const { modalProps, showError, showSuccess } = useNotificationModal();

  const { user } = useContext(UserContext);
  const router = useRouter();
  const params = useLocalSearchParams();

  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(user.address);

  const SHIPPING_FEE = 30000;
  const singleBuy = params.single === "true" || params.single === true;
  const isReorder = params.reorder === "true" || params.reorder === true;
  const reorderOrderId = params.order_id;


  useFocusEffect(
    React.useCallback(() => {
      const loadAddress = async () => {
        const savedAddress = await AsyncStorage.getItem("selectedAddress");
        if (savedAddress) {
          setSelectedAddress(savedAddress);
        } else {
          setSelectedAddress(user.address);
        }
      };
      loadAddress();
    }, [user.address])
  );


  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isReorder && reorderOrderId) {

          const res = await UserService.getOrderDetail(user.token, reorderOrderId);
          const order = res.data;
          if (order && order.details) {
            const items = order.details.map((detail) => ({
              id: detail.product_id,
              quantity: detail.quantity,
              product: {
                id: detail.product_id,
                name: detail.product_name,
                image_url: detail.image_url,
                price: detail.price,
                price_discount: 0,
              },
            }));
            setCartItems(items);
          }
        } else if (singleBuy) {
          // ... (logic mua ngay)
          const fakeItem = {
            id: params.product_id,
            quantity: Number(params.quantity) || 1,
            product: {
              id: params.product_id,
              name: params.name,
              image_url: params.image_url,
              price: Number(params.price),
              price_discount: 0,
            },
          };
          setCartItems([fakeItem]);
        } else {
          await fetchCart();
        }
      } catch (error) {
        console.log("❌ Lỗi khi load sản phẩm:", error.message);
        // <-- THAY ĐỔI: Dùng showError
        showError("Lỗi", "Không thể tải sản phẩm từ đơn hàng cũ.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isReorder, reorderOrderId, singleBuy, params.product_id]);

  const fetchCart = async () => {
    try {
      const res = await UserService.getCart(user.token);
      setCartItems(res.data);
    } catch (err) {
      // <-- THAY ĐỔI: Dùng showError
      showError("Lỗi", "Không thể tải giỏ hàng");
    } finally {
      // (Không setLoading(false) ở đây nữa vì đã có ở fetchData)
    }
  };

  const calcTotal = () => {
    return cartItems.reduce((sum, item) => {
      const price =
        item.product.price_discount && item.product.price_discount > 0
          ? item.product.price_discount
          : item.product.price;
      return sum + price * item.quantity;
    }, 0);
  };

  const totalAmount = calcTotal() + SHIPPING_FEE;

  const formatCurrency = (amount) =>
    Number(amount).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });

  // --- Đặt hàng ---
  const handlePlaceOrder = async () => {
    if (placingOrder) return;
    setPlacingOrder(true);
    try {
      const res = await UserService.checkout(user.token, {
        payment_method: paymentMethod,
        shipping_fee: SHIPPING_FEE,
        address: selectedAddress || user.address,
        product_id: singleBuy ? params.product_id : undefined,
        quantity: singleBuy ? params.quantity : undefined,
        single: singleBuy,
        reorder: isReorder,
        order_id: reorderOrderId,
      });

      if (paymentMethod === "ONLINE") {
        const orderId = res.data.order_id;
        router.push({
          pathname: "/cart/payment-qr",
          params: { order_id: orderId, total: totalAmount },
        });
      } else {
        // <-- THAY ĐỔI: Thay thế Alert bằng showSuccess và truyền vào mảng buttons
        showSuccess(
          "Đặt hàng thành công 🎉",
          `Đơn hàng sẽ sớm được giao đến bạn.`,
          [
            {
              text: "Về trang chủ",
              onPress: () => router.replace("/"),
              style: "cancel",
            },
            {
              text: "Xem đơn hàng",
              onPress: () => router.push("/order"),
            },
          ]
        );
      }
    } catch (err) {
      console.log("Checkout error:", err);
      // <-- THAY ĐỔI: Dùng showError
      showError(
        "Lỗi",
        err.response?.data?.message || "Không thể thanh toán, vui lòng thử lại."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 15 }}>
        {/* ... (Toàn bộ JSX của ScrollView không thay đổi) ... */}
        {/* Địa chỉ nhận hàng */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="location-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.sectionTitle}>Địa chỉ nhận hàng</Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/user/address")} // chuyển sang danh sách địa chỉ
            >
              <Ionicons
                name="chevron-forward-outline"
                size={22}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.addressName}>
            {user.name} | {user.phone}
          </Text>
          <Text style={styles.addressText}>
            {selectedAddress || "Chưa có địa chỉ giao hàng"}
          </Text>
        </View>

        {/* Sản phẩm */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="bag-outline" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Sản phẩm đã chọn</Text>
            </View>
          </View>

          {cartItems.map((item, index) => (
            <View key={index} style={styles.item}>
              <Image
                source={{
                  uri: imageUrl("product", item.product.image_url),
                }}
                style={styles.image}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.product.name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.qty}>SL: {item.quantity}</Text>
                  <Text style={styles.price}>
                    {formatCurrency(
                      item.product.price_discount > 0
                        ? item.product.price_discount
                        : item.product.price
                    )}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Phương thức thanh toán */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="card-outline" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "COD" && styles.paymentSelected,
            ]}
            onPress={() => setPaymentMethod("COD")}
          >
            <Text style={styles.paymentText}>Thanh toán khi nhận hàng</Text>
            {paymentMethod === "COD" && (
              <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === "ONLINE" && styles.paymentSelected,
            ]}
            onPress={() => {
              showError(
                "Đang bảo trì",
                "Tính năng chuyển khoản ngân hàng tạm thời chưa khả dụng. Vui lòng chọn COD.",
                [
                  {
                    text: "OK",
                    style: "cancel",
                  },
                ]
              );

            }}
          >
            <Text style={styles.paymentText}>Chuyển khoản ngân hàng</Text>
            {paymentMethod === "ONLINE" && (
              <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Chi tiết thanh toán */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.headerLeft}>
              <Ionicons
                name="receipt-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.detailLabel}>Tổng tiền hàng</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(calcTotal())}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.detailLabel}>Phí vận chuyển</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(SHIPPING_FEE)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.totalLabel}>Tổng thanh toán</Text>
            <Text style={styles.totalText}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer (Không thay đổi) */}
      <View style={styles.footer}>
        <View style={styles.footerSummary}>
          <Text style={styles.footerTextLabel}>Tổng cộng:</Text>
          <Text style={styles.footerTextValue}>
            {formatCurrency(totalAmount)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.orderButton}
          onPress={handlePlaceOrder}
          disabled={placingOrder}
        >
          {placingOrder ? (
            <ActivityIndicator size="small" color={COLORS.card} />
          ) : (
            <Text style={styles.orderButtonText}>ĐẶT HÀNG</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* <-- THAY ĐỔI: Thêm component Modal ở đây --> */}
      <NotificationModal {...modalProps} />

    </View>
  );
}

// --- Styles ---
// (Không thay đổi)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  section: {
    backgroundColor: COLORS.card,
    marginBottom: 10,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 10,
    marginTop: 10,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 17,
    color: COLORS.text,
    marginLeft: 8,
  },
  addressName: {
    fontWeight: "700",
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 4,
  },
  addressText: {
    color: COLORS.subtext,
    fontSize: 15,
    marginBottom: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
    resizeMode: "cover",
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    color: COLORS.text,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    marginTop: 5,
  },
  price: {
    color: COLORS.price,
    fontWeight: "700",
    fontSize: 16,
  },
  qty: {
    color: COLORS.subtext,
    fontSize: 14,
  },
  paymentOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  paymentSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.active,
  },
  paymentText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  detailLabel: {
    fontSize: 15,
    color: COLORS.subtext,
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  totalLabel: {
    fontWeight: "700",
    fontSize: 18,
    color: COLORS.text,
  },
  totalText: {
    color: COLORS.price,
    fontWeight: "bold",
    fontSize: 18,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    elevation: 6,
    marginBottom: 20,
  },
  footerSummary: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  footerTextLabel: {
    fontSize: 16,
    color: COLORS.subtext,
    marginRight: 4,
  },
  footerTextValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.price,
  },
  orderButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    minWidth: 150,
    alignItems: "center",
    elevation: 5,
  },
  orderButtonText: {
    color: COLORS.card,
    fontWeight: "700",
    fontSize: 17,
    letterSpacing: 0.5,
  },
});