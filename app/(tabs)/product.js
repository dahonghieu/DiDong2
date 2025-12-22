import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import ProductService from "../../services/ProductService";
import CategoryService from "../../services/CategoryService";
import FavoriteService from "../../services/FavoriteService";
import { imageUrl } from "../../services/config.js";
import { UserContext } from "../../contexts/UserContext";
import { useNotificationModal } from "../../hooks/useNotificationModal";
import NotificationModal from "../../components/common/NotificationModal";
import BurstHeartButton from "../../components/common/BurstHeartButton";

const { width, height } = Dimensions.get("window");
const screenPadding = 16;
const cardSpacing = 12;
const cardWidth = (width - screenPadding * 2 - cardSpacing) / 2;

const COLORS = {
  primaryRed: "#E53935",
  secondaryOrange: "#FF7043",
  background: "#F5F7FA",
  cardBackground: "#FFFFFF",
  productImageBackground: "#FFFFFF", // Giữ nguyên màu trắng bạn đã chọn
  textDark: "#1A237E",
  textGray: "#78909C",
  border: "#E0E0E0",
  activeBg: "#FFEBEE",
};

export default function ProductScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams();
  const { user } = useContext(UserContext);
  const { modalProps, showSuccess, showError } = useNotificationModal();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(category || "all");
  const [searchText, setSearchText] = useState("");
  const [limit, setLimit] = useState(6);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortOrder, setSortOrder] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState([]);

  const debounceTimer = useRef(null);
  const isInitialLoadRef = useRef(true);

  // --- THAY ĐỔI 1: Tải Categories (Chỉ 1 lần) ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catRes = await CategoryService.index();
        setCategories([{ id: "all", name: "Tất cả" }, ...catRes.data]);
      } catch (err) {
        console.log("❌ Lỗi lấy danh mục:", err);
      }
    };
    fetchCategories();
  }, []); // Dependency rỗng, chỉ chạy 1 lần

  // --- THAY ĐỔI 2: Tải Favorites (Mỗi khi focus hoặc user thay đổi) ---
  useFocusEffect(
    useCallback(() => {
      const fetchFavorites = async () => {
        if (user?.token) {
          try {
            const favRes = await FavoriteService.getFavorites(user.token);
            setFavoriteIds(favRes.data.map((p) => p.id));
          } catch (err) {
            console.log("❌ Lỗi lấy favorites:", err);
            setFavoriteIds([]);
          }
        } else {
          setFavoriteIds([]); // Xóa favorites nếu không có user
        }
      };
      fetchFavorites();
    }, [user]) // Phụ thuộc vào user
  );

  const fetchProducts = async (
    categoryId,
    limitValue,
    sort = sortOrder,
    isLoadMore = false,
    max = maxPrice
  ) => {
    if (!isLoadMore) {
      setProducts([]);
      setHasMore(true);
    }
    if (!hasMore && isLoadMore) return;
    try {
      setIsLoading(true);
      const res = await ProductService.byCategory(
        categoryId,
        limitValue,
        sort,
        0,
        max || 99999999
      );
      const fetched = res.data.data || [];
      setProducts(fetched);
      setHasMore(fetched.length === limitValue);
    } catch (err) {
      console.log("❌ Lỗi lấy sản phẩm:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (category && category !== selectedCategory) {
        setSelectedCategory(category);
        setLimit(6);
      }
    }, [category])
  );

  useEffect(() => {
    fetchProducts(selectedCategory, limit, sortOrder, limit > 6, maxPrice);
  }, [selectedCategory, limit, sortOrder, maxPrice]);

  useEffect(() => {
    if (!searchText.trim()) {
      if (!isInitialLoadRef.current) {
        fetchProducts(selectedCategory, limit, sortOrder, false, maxPrice);
      }
      isInitialLoadRef.current = false;
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        const res = await ProductService.search(searchText.trim());
        setProducts(res.data.data || []);
        setHasMore(false);
      } catch (err) {
        console.log("❌ Lỗi search:", err);
      } finally {
        setIsLoading(false);
      }
    }, 500);
    return () => clearTimeout(debounceTimer.current);
  }, [searchText]);

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
      isCurrentlyFavorited ? prev.filter((id) => id !== productId) : [...prev, productId]
    );

    try {
      if (isCurrentlyFavorited) {
        await FavoriteService.removeFavorite(user.token, productId);
      } else {
        await FavoriteService.addFavorite(user.token, productId);
      }
    } catch (err) {
      console.log("❌ Lỗi toggle yêu thích:", err);
      setFavoriteIds((prev) =>
        isCurrentlyFavorited ? [...prev, productId] : prev.filter((id) => id !== productId)
      );
      showError("Lỗi", "Không thể cập nhật yêu thích.");
    }
  };

  const renderProductItem = (item) => {
    const isFavorited = favoriteIds.includes(item.id);

    return (
      <View key={item.id} style={styles.productCardWrapper}>
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
            {item.price_discount && item.price !== item.price_discount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  -{Math.round(((item.price - item.price_discount) / item.price) * 100)}%
                </Text>
              </View>
            )}
            {/* Nút tim BurstHeartButton, đặt bên trong imageContainer */}
            <View style={styles.heartButtonOnImage}>
              <BurstHeartButton
                isFavorited={!!user && isFavorited}
                onPress={() => toggleFavorite(item.id)}
                size={20}
              />
            </View>
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>
                {Number(item.price_discount || item.price).toLocaleString()}
              </Text>
              {item.price_discount && item.price !== item.price_discount && (
                <Text style={styles.originalPrice}>
                  {Number(item.price).toLocaleString()}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isFilterModalVisible}
      onRequestClose={() => setIsFilterModalVisible(false)}
    >
      <Pressable style={styles.modalOverlay} onPress={() => setIsFilterModalVisible(false)}>
        <Pressable style={styles.modalContent} onPress={() => { }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bộ lọc & Sắp xếp</Text>
            <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.filterSectionTitle}>Sắp xếp theo giá</Text>
            <View style={styles.sortOptionsContainer}>
              <TouchableOpacity
                style={[styles.filterOptionChip, sortOrder === "asc" && styles.activeFilterChip]}
                onPress={() => setSortOrder(sortOrder === "asc" ? null : "asc")}
              >
                <Feather name="trending-up" size={16} color={sortOrder === "asc" ? COLORS.primaryRed : COLORS.textDark} />
                <Text style={[styles.filterOptionText, sortOrder === "asc" && styles.activeFilterText]}>Tăng dần</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOptionChip, sortOrder === "desc" && styles.activeFilterChip]}
                onPress={() => setSortOrder(sortOrder === "desc" ? null : "desc")}
              >
                <Feather name="trending-down" size={16} color={sortOrder === "desc" ? COLORS.primaryRed : COLORS.textDark} />
                <Text style={[styles.filterOptionText, sortOrder === "desc" && styles.activeFilterText]}>Giảm dần</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Khoảng giá tối đa</Text>
            <View style={styles.priceOptionsContainer}>
              {[
                { label: "Tất cả", value: null },
                { label: "< 5 triệu", value: 5000000 },
                { label: "< 10 triệu", value: 10000000 },
                { label: "< 15 triệu", value: 15000000 },
                { label: "< 20 triệu", value: 20000000 },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[styles.filterOptionChip, maxPrice === opt.value && styles.activeFilterChip]}
                  onPress={() => setMaxPrice(opt.value)}
                >
                  <Text style={[styles.filterOptionText, maxPrice === opt.value && styles.activeFilterText]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setSortOrder(null);
                setMaxPrice(null);
              }}
            >
              <Text style={styles.resetButtonText}>Thiết lập lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setIsFilterModalVisible(false)}
            >
              <Text style={styles.applyButtonText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header & Search */}
      <View style={styles.headerContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={COLORS.textGray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            placeholderTextColor={COLORS.textGray}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, (sortOrder || maxPrice) && styles.activeFilterButton]}
          onPress={() => setIsFilterModalVisible(true)}
        >
          <Feather name="sliders" size={20} color={(sortOrder || maxPrice) ? COLORS.primaryRed : COLORS.textDark} />
          {(sortOrder || maxPrice) && <View style={styles.filterBadge} />}
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {/* Category Bar */}
        <View style={styles.categoryBarWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryTab,
                  selectedCategory == cat.id && styles.activeCategoryTab,
                ]}
                onPress={() => {
                  setSearchText("");
                  setLimit(6);
                  setSelectedCategory(cat.id);
                }}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    selectedCategory == cat.id && styles.activeCategoryTabText,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Product List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productListContent}
        >
          {/* Active Filters */}
          {(sortOrder || maxPrice) && (
            <View style={styles.activeFiltersBar}>
              <Text style={styles.activeFiltersLabel}>Đang lọc:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {sortOrder && (
                  <View style={styles.activeFilterChipDisplay}>
                    <Text style={styles.activeFilterTextDisplay}>
                      Giá {sortOrder === 'asc' ? 'tăng dần' : 'giảm dần'}
                    </Text>
                    <TouchableOpacity onPress={() => setSortOrder(null)}>
                      <Ionicons name="close-circle" size={16} color={COLORS.primaryRed} />
                    </TouchableOpacity>
                  </View>
                )}
                {maxPrice && (
                  <View style={styles.activeFilterChipDisplay}>
                    <Text style={styles.activeFilterTextDisplay}>
                      {'< ' + (maxPrice / 1000000) + ' triệu'}
                    </Text>
                    <TouchableOpacity onPress={() => setMaxPrice(null)}>
                      <Ionicons name="close-circle" size={16} color={COLORS.primaryRed} />
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {isLoading && products.length === 0 ? (
            <ActivityIndicator size="large" color={COLORS.primaryRed} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.productGrid}>
              {products.map(renderProductItem)}
            </View>
          )}

          {!isLoading && products.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="store-search-outline" size={80} color="#E0E0E0" />
              <Text style={styles.emptyText}>Không tìm thấy sản phẩm nào phù hợp.</Text>
            </View>
          )}

          {products.length >= limit && !searchText && !isLoading && hasMore && (
            <TouchableOpacity style={styles.loadMoreButton} onPress={() => setLimit(limit + 6)}>
              <Text style={styles.loadMoreText}>Xem thêm sản phẩm</Text>
              <Feather name="chevron-down" size={18} color={COLORS.primaryRed} />
            </TouchableOpacity>
          )}

          {!hasMore && products.length > 0 && !searchText && (
            <View style={styles.endOfListContainer}>
              <View style={styles.divider} />
              <Text style={styles.endOfListText}>Đã hiển thị tất cả</Text>
              <View style={styles.divider} />
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>

      {/* Modal Filter & Notification */}
      {renderFilterModal()}
      <NotificationModal {...modalProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenPadding,
    paddingVertical: 12,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginRight: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.textDark, height: '100%' },
  filterButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    position: 'relative',
  },
  activeFilterButton: {
    backgroundColor: COLORS.activeBg,
    borderColor: COLORS.primaryRed,
    borderWidth: 1,
  },
  filterBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryRed,
    borderWidth: 1,
    borderColor: COLORS.cardBackground,
  },

  contentContainer: { flex: 1 },
  categoryBarWrapper: {
    backgroundColor: COLORS.cardBackground,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryScrollContent: { paddingHorizontal: screenPadding },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeCategoryTab: {
    backgroundColor: COLORS.activeBg,
    borderColor: COLORS.primaryRed,
  },
  categoryTabText: { fontSize: 14, fontWeight: '500', color: COLORS.textGray },
  activeCategoryTabText: { color: COLORS.primaryRed, fontWeight: '700' },

  productListContent: { paddingBottom: 20 },
  activeFiltersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenPadding,
    paddingVertical: 10,
  },
  activeFiltersLabel: { fontSize: 13, color: COLORS.textGray, marginRight: 8 },
  activeFilterChipDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.activeBg,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryRed,
  },
  activeFilterTextDisplay: { fontSize: 12, color: COLORS.primaryRed, marginRight: 4, fontWeight: '500' },

  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: screenPadding,
    paddingTop: cardSpacing,
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
  productImage: { width: "90%", height: "90%", resizeMode: "contain" },
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
  discountText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  productInfo: { padding: 12 },
  productName: { fontSize: 14, fontWeight: "500", color: COLORS.textDark, marginBottom: 6, height: 40 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
  productPrice: { fontSize: 16, fontWeight: "700", color: COLORS.primaryRed, marginRight: 8 },
  originalPrice: { fontSize: 12, color: COLORS.textGray, textDecorationLine: "line-through" },

  heartButtonOnImage: {
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

  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: screenPadding,
    marginTop: 20,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryRed,
  },
  loadMoreText: { color: COLORS.primaryRed, fontWeight: '600', marginRight: 6 },
  endOfListContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24, paddingHorizontal: 40 },
  divider: { flex: 1, height: 1, backgroundColor: COLORS.border },
  endOfListText: { marginHorizontal: 10, fontSize: 12, color: COLORS.textGray },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { marginTop: 16, fontSize: 16, color: COLORS.textGray },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.cardBackground, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.7 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: screenPadding, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  modalBody: { padding: screenPadding },
  filterSectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textDark, marginTop: 16, marginBottom: 12 },
  sortOptionsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  priceOptionsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  filterOptionChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, backgroundColor: COLORS.background, borderRadius: 20, marginRight: 10, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  activeFilterChip: { backgroundColor: COLORS.activeBg, borderColor: COLORS.primaryRed },
  filterOptionText: { marginLeft: 6, fontSize: 14, color: COLORS.textDark },
  activeFilterText: { color: COLORS.primaryRed, fontWeight: '500' },
  modalFooter: { flexDirection: 'row', padding: screenPadding, borderTopWidth: 1, borderTopColor: COLORS.border },
  resetButton: { flex: 1, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  resetButtonText: { color: COLORS.textDark, fontWeight: '600' },
  applyButton: { flex: 2, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryRed, borderRadius: 8 },
  applyButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});