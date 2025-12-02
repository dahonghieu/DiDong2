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

 

 



 

 

 


};

export default UserService;

