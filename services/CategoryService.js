import httpAxios from "./httpAxios";

const CategoryService = {
  
  index: async () => {
    return await httpAxios.get("category-list");
  },

  
  show: async (id) => {
    return await httpAxios.get(`category/${id}`);
  },


  create: async (data) => {
    return await httpAxios.post("category", data);
  },


  update: async (id, data) => {
    return await httpAxios.put(`category/${id}`, data);
  },


  delete: async (id) => {
    return await httpAxios.delete(`category/${id}`);
  },


  restore: async (id) => {
    return await httpAxios.put(`category/restore/${id}`);
  },


  destroy: async (id) => {
    return await httpAxios.delete(`category/destroy/${id}`);
  },
};

export default CategoryService;
