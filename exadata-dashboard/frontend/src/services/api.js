import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const auth = {
  login: async (username, password) => {
    const form = new URLSearchParams();
    form.append('username', username);
    form.append('password', password);
    const res = await axios.post('/api/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    localStorage.setItem('token', res.data.access_token);
    return res.data;
  },
  logout: () => localStorage.removeItem('token'),
  isAuthenticated: () => !!localStorage.getItem('token'),
};

export const metrics = {
  overview:     () => api.get('/metrics/overview').then((r) => r.data),
  instances:    () => api.get('/metrics/instances').then((r) => r.data),
  cpu:          () => api.get('/metrics/cpu').then((r) => r.data),
  sessions:     () => api.get('/metrics/sessions').then((r) => r.data),
  sga:          () => api.get('/metrics/memory/sga').then((r) => r.data),
  pga:          () => api.get('/metrics/memory/pga').then((r) => r.data),
  topWaits:     () => api.get('/metrics/waits/top').then((r) => r.data),
  ashWaits:     () => api.get('/metrics/waits/ash').then((r) => r.data),
  tablespaces:  () => api.get('/metrics/storage/tablespaces').then((r) => r.data),
  asm:          () => api.get('/metrics/storage/asm').then((r) => r.data),
  topSql:       () => api.get('/metrics/sql/top').then((r) => r.data),
  offload:      () => api.get('/metrics/exadata/offload').then((r) => r.data),
  flashCache:   () => api.get('/metrics/exadata/flash-cache').then((r) => r.data),
  backups:      () => api.get('/metrics/backups').then((r) => r.data),
  alerts:       () => api.get('/metrics/alerts').then((r) => r.data),
  blocking:     () => api.get('/metrics/blocking').then((r) => r.data),
};

export default api;
