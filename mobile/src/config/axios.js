import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// !! O'z serveringiz IP manzilingizni yozing !!
// Android emulator uchun: http://10.0.2.2:3000/api
// Fizik qurilma uchun: http://192.168.x.x:3000/api
export const BASE_URL = 'http://192.168.1.9:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    return Promise.reject(err);
  }
);

export default api;
