import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    Dimensions,
    ScrollView,
    TextInput,
    Keyboard,
    TouchableWithoutFeedback,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";

import CategoryService from "../../services/CategoryService";
import ProductService from "../../services/ProductService";
import BannerService from "../../services/BannerService";
import FavoriteService from "../../services/FavoriteService";
import { UserContext } from "../../contexts/UserContext";
import { imageUrl } from "../../services/config.js";
import { useNotificationModal } from "../../hooks/useNotificationModal";
import NotificationModal from "../../components/common/NotificationModal";
import BurstHeartButton from "../../components/common/BurstHeartButton";

const { width, height } = Dimensions.get("window"); // <-- Thêm 'height'
const screenPadding = 16;
const cardSpacing = 12;
const cardWidth = (width - screenPadding * 2 - cardSpacing) / 2;

const COLORS = {
    primaryRed: "#730806",
    secondaryOrange: "#F39C12",
    background: "#F5F7FA",
    cardBackground: "#FFFFFF",
    productImageBackground: "#FFFFFF",
    textDark: "#1A237E",
    textGray: "#78909C",
    shadow: "rgba(0, 0, 0, 0.1)",
};

export default function HomeScreen() {
    const router = useRouter();
    const { user } = useContext(UserContext);
    const { modalProps, showError } = useNotificationModal();

    const [categories, setCategories] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [saleProducts, setSaleProducts] = useState([]);
    const [banners, setBanners] = useState([]);
    const [favoriteIds, setFavoriteIds] = useState([]);

    const [searchText, setSearchText] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, setLoading] = useState(true);

    const scrollRef = useRef(null);
    const currentIndexRef = useRef(0);
    const debounceTimer = useRef(null);

    // --- Tự động cuộn banner ---
    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(() => {
            currentIndexRef.current =
                (currentIndexRef.current + 1) % banners.length;
            scrollRef.current?.scrollTo({
                x: currentIndexRef.current * width,
                animated: true,
            });
        }, 3000);
        return () => clearInterval(interval);
    }, [banners.length]);

    // --- Chạy 1 lần duy nhất: tải dữ liệu tĩnh ---
    useEffect(() => {
        const fetchStaticData = async () => {
            try {
                setLoading(true);
                const [b, c, f, s] = await Promise.all([
                    BannerService.index(5),
                    CategoryService.index(),
                    ProductService.featured(6),
                    ProductService.discount(16),
                ]);
                setBanners(b.data);
                setCategories(c.data);
                setFeaturedProducts(f.data);
                setSaleProducts(s.data);
            } catch (err) {
                console.log("❌ Lỗi tải dữ liệu tĩnh:", err);
                showError("Lỗi tải dữ liệu", "Không thể tải dữ liệu trang chủ.", [
                    { text: "OK" },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchStaticData();
    }, []);

    // --- Mỗi khi user thay đổi hoặc quay lại Home: cập nhật favorites ---
    useFocusEffect(
        useCallback(() => {
            const fetchFavorites = async () => {
                try {
                    if (user?.token) {
                        const res = await FavoriteService.getFavorites(user.token);
                        setFavoriteIds(res.data.map((p) => p.id));
                    } else {
                        setFavoriteIds([]);
                    }
                } catch (err) {
                    console.log("❌ Lỗi lấy danh sách yêu thích:", err);
                }
            };
            fetchFavorites();
        }, [user])
    );

    // --- Tìm kiếm realtime ---
    useEffect(() => {
        if (!searchText.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        setIsSearching(true);

        debounceTimer.current = setTimeout(async () => {
            try {
                const res = await ProductService.search(searchText.trim());
                setSearchResults(res.data.data || []);
            } catch (err) {
                console.log("Lỗi search:", err);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(debounceTimer.current);
    }, [searchText]);

    // --- Toggle yêu thích ---
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
            setFavoriteIds((prev) =>
                isCurrentlyFavorited
                    ? [...prev, productId]
                    : prev.filter((id) => id !== productId)
            );
            showError("Lỗi", "Không thể cập nhật danh sách yêu thích.", [
                { text: "OK" },
            ]);
        }
    };

    // --- Product Card ---
    const ProductCard = ({ item, isSale = false }) => {
        const isFavorited = favoriteIds.includes(item.id);

        const isEven = isSale && saleProducts.indexOf(item) % 2 !== 0;
        const cardWrapperStyle = isSale
            ? {
                width: cardWidth,
                marginRight: isEven ? 0 : cardSpacing,
                marginBottom: cardSpacing,
            }
            : { width: 200, marginRight: cardSpacing };

        return (
            <View style={[styles.productCardWrapper, cardWrapperStyle]}>
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
                                    -
                                    {Math.round(
                                        ((item.price - item.price_discount) / item.price) * 100
                                    )}
                                    %
                                </Text>
                            </View>
                        )}
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
            </View>
        );
    };

    // --- Component hiển thị nội dung trang chủ ---
    const RenderHomeScreenContent = () => (
        <React.Fragment>
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.bannerContainer}
            >
                {banners.map((item) => (
                    <View key={item.id} style={styles.bannerWrapper}>
                        <Image
                            source={{ uri: imageUrl("banner", item.image_url) }}
                            style={styles.bannerImage}
                        />
                    </View>
                ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>📂 Danh mục nổi bật</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollPadding}
            >
                {categories.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.categoryCard}
                        onPress={() =>
                            router.push({
                                pathname: "/product",
                                params: { category: item.id, categoryName: item.name },
                            })
                        }
                    >
                        <Image
                            source={{ uri: imageUrl("category", item.image_url) }}
                            style={styles.categoryImage}
                        />
                        <Text style={styles.categoryName} numberOfLines={1}>
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>✨ Sản phẩm nổi bật</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollPadding}
            >
                {featuredProducts.map((item) => (
                    <ProductCard key={item.id} item={item} />
                ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>🎁 Sản phẩm khuyến mãi HOT</Text>
            <View style={styles.productGrid}>
                {saleProducts.map((item) => (
                    <ProductCard key={item.id} item={item} isSale />
                ))}
            </View>
        </React.Fragment>
    );

    // --- [ĐÃ SỬA] Component hiển thị kết quả tìm kiếm ---
    const RenderSearchResults = () => {
        return (
            // Lớp phủ
            <View style={styles.searchResultsOverlay}>
                {isSearching && (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={COLORS.primaryRed} />
                    </View>
                )}

                {!isSearching && searchResults.length === 0 && (
                    <View style={styles.center}>
                        <Text style={styles.noResultsText}>
                            Không tìm thấy sản phẩm nào
                        </Text>
                    </View>
                )}

                {!isSearching && searchResults.length > 0 && (
                    <FlatList
                        data={searchResults}
                        keyExtractor={(item) => item.id.toString()}
                        keyboardShouldPersistTaps="handled" // Để có thể bấm vào item
                        contentContainerStyle={{ paddingHorizontal: screenPadding }}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.searchItem}
                                onPress={() => {
                                    router.push(`/product/${item.id}`);
                                    setSearchText("");
                                    Keyboard.dismiss();
                                }}
                            >
                                <Image
                                    source={{ uri: imageUrl("product", item.image_url) }}
                                    style={styles.searchItemImage}
                                />
                                {/* [ĐÃ SỬA] Hiển thị giá */}
                                <View style={styles.searchItemInfo}>
                                    <Text style={styles.searchItemName} numberOfLines={2}>
                                        {item.name}
                                    </Text>
                                    <View style={styles.priceContainer}>
                                        <Text style={styles.searchItemPrice}>
                                            {(
                                                item.price_discount || item.price
                                            ).toLocaleString()}{" "}
                                            đ
                                        </Text>
                                        {item.price_discount &&
                                            item.price !== item.price_discount && (
                                                <Text style={styles.searchItemOriginalPrice}>
                                                    {item.price.toLocaleString()} đ
                                                </Text>
                                            )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={COLORS.primaryRed} />
            </View>
        );
    }

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                {/* Search (Luôn hiển thị) */}
                <View style={styles.searchContainer}>
                    <TextInput
                        placeholder="🔍 Tìm kiếm sản phẩm..."
                        style={styles.searchInput}
                        placeholderTextColor={COLORS.textGray}
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>

                {/* --- [ĐÃ SỬA] Cấu trúc hiển thị --- */}
                <View style={{ flex: 1, position: "relative" }}>
                    {/* Nội dung chính (luôn render) */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        // Vô hiệu hoá cuộn khi đang tìm kiếm
                        scrollEnabled={searchText.trim().length === 0}
                    >
                        <RenderHomeScreenContent />
                    </ScrollView>

                    {/* Lớp phủ kết quả tìm kiếm (hiển thị đè lên) */}
                    {searchText.trim().length > 0 && (
                        <RenderSearchResults />
                    )}
                </View>
                {/* ---------------------------------- */}

                <NotificationModal {...modalProps} />
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    horizontalScrollPadding: {
        paddingHorizontal: screenPadding,
        paddingBottom: 10,
    },
    bannerContainer: { height: 180, marginBottom: 16 },
    bannerWrapper: { width: width, height: 180 },
    bannerImage: { width: "100%", height: "100%", resizeMode: "cover" },
    searchContainer: {
        paddingHorizontal: screenPadding,
        paddingVertical: 16,
        backgroundColor: COLORS.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: "#EEE",
    },
    searchInput: {
        backgroundColor: COLORS.background,
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 20,
        fontSize: 16,
        color: COLORS.textDark,
        borderWidth: 1,
        borderColor: "#EFEFEF",
    },
    sectionTitle: {
        fontWeight: "bold",
        fontSize: 18,
        marginTop: 20,
        marginBottom: 12,
        paddingHorizontal: screenPadding,
        color: COLORS.textDark,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.secondaryOrange,
        paddingLeft: 8,
    },
    categoryCard: {
        alignItems: "center",
        marginRight: cardSpacing,
        backgroundColor: COLORS.cardBackground,
        padding: 10,
        borderRadius: 15,
        width: 80,
        height: 100,
        justifyContent: "center",
        elevation: 3,
        borderWidth: 1,
        borderColor: "#F1F1F1",
    },
    categoryImage: {
        width: 50,
        height: 50,
        marginBottom: 6,
        resizeMode: "contain",
    },
    categoryName: { fontSize: 12, fontWeight: "600", color: COLORS.textDark },
    productGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: screenPadding,
        justifyContent: "space-between",
        paddingBottom: 20,
    },
    productCardWrapper: { position: "relative" },
    productCard: {
        width: "100%",
        backgroundColor: COLORS.cardBackground,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
        overflow: "hidden",
    },
    imageContainer: {
        position: "relative",
        backgroundColor: COLORS.productImageBackground,
        height: 160,
        justifyContent: "center",
        alignItems: "center",
    },
    productImage: { width: "90%", height: "90%", resizeMode: "contain" },
    discountBadge: {
        position: "absolute",
        top: 8,
        left: 8,
        backgroundColor: COLORS.primaryRed,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        zIndex: 1,
    },
    discountText: { color: "white", fontSize: 10, fontWeight: "bold" },
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
        justifyContent: "center",
        alignItems: "center",
    },
    productInfo: { padding: 12 },
    productName: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.textDark,
        marginBottom: 6,
        height: 40,
    },
    priceContainer: { flexDirection: "row", alignItems: "baseline" },
    productPrice: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.primaryRed,
        marginRight: 8,
    },
    originalPrice: {
        fontSize: 12,
        color: COLORS.textGray,
        textDecorationLine: "line-through",
    },

    // --- [SỬA] STYLES CHO KẾT QUẢ TÌM KIẾM ---
    noResultsText: {
        textAlign: "center",
        fontSize: 16,
        color: COLORS.textGray,
        marginTop: 40,
    },
    searchItem: {
        flexDirection: "row",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#EEE",
        // Bỏ background, vì giờ nó nằm trong overlay
        alignItems: "center",
    },
    searchItemImage: {
        width: 60,
        height: 60,
        resizeMode: "contain",
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: COLORS.productImageBackground,
    },
    searchItemInfo: {
        flex: 1,
    },
    searchItemName: {
        fontSize: 15,
        fontWeight: "500",
        color: COLORS.textDark,
        marginBottom: 4,
    },
    searchItemPrice: { // Này là giá khuyến mãi
        fontSize: 14,
        fontWeight: "bold",
        color: COLORS.primaryRed,
    },

    // --- [MỚI] STYLES CHO OVERLAY VÀ GIÁ GỐC ---
    searchResultsOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        maxHeight: height * 0.5, // Tối đa nửa màn hình
        backgroundColor: COLORS.background, // Nền để che content
        zIndex: 10,
        // Thêm bóng cho đẹp
        borderBottomWidth: 1,
        borderBottomColor: "#DDD",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    searchItemOriginalPrice: {
        fontSize: 12,
        color: COLORS.textGray,
        textDecorationLine: "line-through",
        marginLeft: 8,
    },
});