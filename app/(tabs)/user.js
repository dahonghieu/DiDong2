import React, { useContext, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,

  Platform,
} from "react-native";
import { UserContext } from "../../contexts/UserContext";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { imageUrl } from "../../services/config.js";
import { useNotificationModal } from "../../hooks/useNotificationModal";
import NotificationModal from "../../components/common/NotificationModal";


const COLORS = {
  primary: "#FF5733",
  secondary: "#FFB300",
  background: "#F9F9F9",
  card: "#FFFFFF",
  text: "#212121",
  subtext: "#757575",
  danger: "#FF5733",
  border: "#F0F0F0",
};


const MenuItem = ({ iconName, title, route, router, isLast = false }) => (
  <TouchableOpacity
    style={[styles.menuItem, isLast && { borderBottomWidth: 0 }]}
    onPress={() => router.push(route)}
  >
    <View style={styles.iconCircle}>
      <Ionicons name={iconName} size={20} color={COLORS.primary} />
    </View>
    <Text style={styles.menuText}>{title}</Text>
    <Ionicons name="chevron-forward" size={18} color={COLORS.subtext} />
  </TouchableOpacity>
);


const ActionItem = ({ iconName, title, route, router }) => (
  <TouchableOpacity
    style={styles.actionItem}
    onPress={() => router.push(route)}
  >
    <View style={styles.actionIconCircle}>
      <Ionicons name={iconName} size={24} color={COLORS.primary} />
    </View>
    <Text style={styles.actionText}>{title}</Text>
  </TouchableOpacity>
);

export default function UserScreen() {

  const { modalProps, showError, showSuccess, showWarning } =
    useNotificationModal();
  const { user, logout } = useContext(UserContext);
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((prev) => prev + 1);
    }, [user])
  );


  if (!user) {
    return (

      <View style={styles.unloggedInScreen}>
        <ScrollView contentContainerStyle={{ paddingVertical: 40 }}>
          <View style={styles.unloggedInCard}>
            <Ionicons
              name="person-circle-outline"
              size={90}
              color={COLORS.primary}
            />
            <Text style={styles.unloggedInTitle}>Chào mừng bạn!</Text>
            <Text style={styles.unloggedInSubtitle}>
              Đăng nhập để xem đơn hàng, nhận ưu đãi và truy cập các tính năng cá
              nhân.
            </Text>

            <TouchableOpacity
              style={styles.loginCTAButton}
              onPress={() => router.push("/user/login")}
            >
              <Text style={styles.loginCTAText}>Đăng Nhập Ngay</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLinkButton}
              onPress={() => router.push("/user/register")}
            >
              <Text style={styles.registerLinkText}>Đăng ký tài khoản mới</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.unloggedInFeatureSection}>
            <Text style={styles.sectionTitleModern}>Lợi ích thành viên</Text>
            <View style={styles.featureItem}>
              <Ionicons
                name="flash-outline"
                size={20}
                color={COLORS.secondary}
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>
                Ưu đãi chớp nhoáng & mã giảm giá
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="navigate-circle-outline"
                size={20}
                color={COLORS.primary}
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>Theo dõi đơn hàng chi tiết</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name="chatbubbles-outline"
                size={20}
                color="#34C759"
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>Hỗ trợ khách hàng ưu tiên</Text>
            </View>
          </View>
        </ScrollView>

        <NotificationModal {...modalProps} />
      </View>
    );
  }


  return (

    <View style={styles.screen}>
      <ScrollView key={refreshKey}>

        <View style={styles.header}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: imageUrl("user", user.avatar) }}
              style={styles.avatar}
            />
            <TouchableOpacity
              style={styles.editIcon}
              onPress={() => router.push("/user")}
            >
              <Ionicons name="pencil-outline" size={16} color={COLORS.card} />
            </TouchableOpacity>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {user.name}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
        </View>


        <View style={styles.actionBar}>
          <ActionItem
            iconName="receipt-outline"
            title="Đơn hàng"
            route="/user"
            router={router}
          />
          <ActionItem
            iconName="heart-outline"
            title="Yêu thích"
            route="/user"
            router={router}
          />
          <ActionItem
            iconName="location-outline"
            title="Địa chỉ"
            route="/user"
            router={router}
          />
          <ActionItem
            iconName="headset-outline"
            title="Hỗ trợ"
            route="/user"
            router={router}
          />
        </View>


        <View style={styles.sectionModern}>
          <Text style={styles.sectionTitleModern}>Quản lý tài khoản</Text>
          <MenuItem
            iconName="person-outline"
            title="Thông tin cá nhân"
            route="/user"
            router={router}
          />
          <MenuItem
            iconName="lock-closed-outline"
            title="Đổi mật khẩu"
            route="/user"
            router={router}
          />
          <MenuItem
            iconName="wallet-outline"
            title="Lịch sử mua hàng"
            route="/user"
            router={router}
            isLast={true}
          />
        </View>


        <View style={styles.sectionModern}>
          <Text style={styles.sectionTitleModern}>Ứng dụng</Text>
          <MenuItem
            iconName="options-outline"
            title="Cài đặt chung"
            route="/user"
            router={router}
            isLast={false}
          />
          <MenuItem
            iconName="information-circle-outline"
            title="Về chúng tôi"
            route="/user"
            router={router}
            isLast={true}
          />
        </View>


        <TouchableOpacity
          style={styles.logoutButtonModern}

          onPress={() =>
            showWarning(
              "Xác nhận đăng xuất",
              "Đăng xuất tài khoản khỏi thiết bị này?",
              [
                { text: "Hủy", style: "cancel" },
                {
                  text: "Đăng xuất",
                  onPress: logout,

                },
              ]
            )
          }
        >
          <Text style={styles.logoutTextModern}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>


      <NotificationModal {...modalProps} />
    </View>
  );
}


const styles = StyleSheet.create({

  screen: { flex: 1, backgroundColor: COLORS.background },


  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 20,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 10,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    padding: 5,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.card,
    zIndex: 1,
  },
  userInfo: { flex: 1 },
  name: { fontSize: 22, fontWeight: "700", color: COLORS.text },
  email: { fontSize: 14, color: COLORS.subtext, marginTop: 4 },


  actionBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: COLORS.card,
    paddingVertical: 15,
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  actionItem: {
    alignItems: "center",
    width: "25%",
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF3EF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  actionText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
    textAlign: "center",
  },


  sectionModern: {
    marginBottom: 20,
    marginHorizontal: 15,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  sectionTitleModern: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.subtext,
    paddingHorizontal: 15,
    paddingTop: 15,
    marginBottom: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#FFF3EF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuText: { flex: 1, fontSize: 16, color: COLORS.text, fontWeight: "500" },


  logoutButtonModern: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginHorizontal: 15,
    backgroundColor: COLORS.danger,
    paddingVertical: 15,
    borderRadius: 12,
    elevation: 2,
  },
  logoutTextModern: {
    color: COLORS.card,
    fontSize: 17,
    fontWeight: "700",
  },


  unloggedInScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  unloggedInCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 30,
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  unloggedInTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 15,
  },
  unloggedInSubtitle: {
    fontSize: 15,
    color: COLORS.subtext,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
    marginBottom: 30,
  },
  loginCTAButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 10,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
  },
  loginCTAText: { color: COLORS.card, fontSize: 18, fontWeight: "700" },
  registerLinkButton: { padding: 8 },
  registerLinkText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  unloggedInFeatureSection: {
    marginHorizontal: 20,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: { shadowColor: COLORS.shadow, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  featureItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  featureIcon: { marginRight: 15 },
  featureText: { fontSize: 16, color: COLORS.text },
});