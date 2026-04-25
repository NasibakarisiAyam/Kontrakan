const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
  },
  KONTRAKAN: '/kontrakan',
  PENYEWA: '/penyewa',
  PEMBAYARAN: '/pembayaran',
};

export default API_URL;