import httpAxios from "./httpAxios";

const ProductService = {

  index: async (limit = 2) => {
    return await httpAxios.get(`product-list?limit=${limit}`);
  },

  show: async (id) => {
    return await httpAxios.get(`product-show/${id}`);
  },

  featured: async (limit = 4) => {
    return await httpAxios.get(`product-featured?limit=${limit}`);
  },

  discount: async (limit = 4) => {
    return await httpAxios.get(`product-discount?limit=${limit}`);
  },

  search: async (keyword) => {
    return await httpAxios.get(`products/search?q=${encodeURIComponent(keyword)}`);
  },

  byCategory: async (categoryId, limit = 2, sortOrder = null, minPrice = null, maxPrice = null) => {
    let url = `products/by-category/${categoryId}?limit=${limit}`;
    if (sortOrder) url += `&sort=${sortOrder}`;
    if (minPrice !== null) url += `&min_price=${minPrice}`;
    if (maxPrice !== null) url += `&max_price=${maxPrice}`;
    return await httpAxios.get(url);
  },



};

export default ProductService;
