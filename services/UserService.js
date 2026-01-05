import httpAxios from "./httpAxios";

const UserService = {

  register: async (data) => {
    return await httpAxios.post("register", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  login: async (data) => {
    return await httpAxios.post(`login`, data);
  },

  update: async (email, data) => {
    return await httpAxios.post(`user-update/${email}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  changePassword: async (email, data) => {
    return await httpAxios.post(`user-change-password/${email}`, data, {
      headers: { "Content-Type": "application/json" },
    });
  },

  // forgotPassword: async (data) => {

  //   return await httpAxios.post("forgot-password", data, {
  //     headers: { "Content-Type": "application/json" },
  //   });
  // },

  // resetPassword: async (data) => {

  //   return await httpAxios.post("reset-password", data, {
  //     headers: { "Content-Type": "application/json" },
  //   });
  // },

  sendOtp: async (data) => {
    // data = { email: "abc@gmail.com" }
    return await httpAxios.post("send-otp", data, {
      headers: { "Content-Type": "application/json" },
    });
  },

  resetPasswordWithOtp: async (data) => {
    // data = { email, otp, password, password_confirmation }
    return await httpAxios.post("reset-password-otp", data, {
      headers: { "Content-Type": "application/json" },
    });
  },


  createOrder: async (orderData) => {
    return await httpAxios.post(`order-store`, orderData);
  },

  createOrderDetail: async (orderDetailData) => {
    return await httpAxios.post(`orderdetail-store`, orderDetailData);
  },

  // ---------------- GIỎ HÀNG ----------------
  addToCart: async (token, data) => {
    return await httpAxios.post("cart/add", data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getCart: async (token) => {
    return await httpAxios.get("cart", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },

  removeFromCart: async (token, data) => {
    return await httpAxios.post("cart/remove", data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },

  updateCart: async (token, data) => {
    return await httpAxios.post("cart/update", data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },

  clearCart: async (token) => {
    return await httpAxios.post("cart/clear", {}, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },


  checkout: async (token, data) => {
    return await httpAxios.post("checkout", data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },

  confirmPayment: async (orderId) => {
    return await httpAxios.post("order/confirm-payment", { order_id: orderId });
  },

  getOrderDetail: async (token, orderId) => {
    return await httpAxios.get(`order/${orderId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },


  getOrders: async (token) => {
    return await httpAxios.get("orders", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // ---------------- ĐỊA CHỈ NGƯỜI DÙNG ----------------
  getAddresses: async (token) => {
    return await httpAxios.get("addresses", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },

  addAddress: async (token, data) => {
    return await httpAxios.post("addresses", data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getCompletedOrders: async (token) => {
    return await httpAxios.get("orders/completed", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },

  cancelOrder: async (token, orderId, reason) => {
    return await httpAxios.post(
      `order/${orderId}/cancel`,
      { reason },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  updateAddress: async (token, id, data) => {
    return await httpAxios.put(`addresses/${id}`, data, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },

  updateMainAddress: async (token, address) => {
    return await httpAxios.post(
      "user/update-main-address",
      { address },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  deleteAddress: async (token, id) => {
    return await httpAxios.delete(`addresses/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },


};

export default UserService;

