import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  timeout: 15000,
});

// Attach token from storage on each request (in case it was set after api creation)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;