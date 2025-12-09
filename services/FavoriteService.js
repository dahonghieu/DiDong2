import httpAxios from "./httpAxios";

const FavoriteService = {

  // 🔹 Lấy danh sách yêu thích
  getFavorites: async (token) => {
    return await httpAxios.get("favorites", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 🔹 Thêm vào yêu thích
  addFavorite: async (token, productId) => {
    return await httpAxios.post(
      "favorites",
      { product_id: productId },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  // 🔹 Xóa khỏi yêu thích
  removeFavorite: async (token, productId) => {
    return await httpAxios.delete(`favorites/${productId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

export default FavoriteService;
