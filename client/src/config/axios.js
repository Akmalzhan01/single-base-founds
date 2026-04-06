import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const path = window.location.pathname;
    const isPublicBlog = path.startsWith('/blog');
    if (err.response?.status === 401 && path !== '/login' && !isPublicBlog) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
