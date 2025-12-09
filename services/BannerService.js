import httpAxios from "./httpAxios";

const BannerService = {

  index: async (limit = 2) => {
    return await httpAxios.get(`banner-list?limit=${limit}`);
  },

 


};

export default BannerService;
