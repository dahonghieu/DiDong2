import axios from "axios";
import { BASE_URL } from "./config.js";



const httpAxios = axios.create({
  baseURL: `${BASE_URL}/api/`,
  // timeout: 1000,
  // headers: { 'X-Custom-Header': 'foobar' }
});

export default httpAxios;
