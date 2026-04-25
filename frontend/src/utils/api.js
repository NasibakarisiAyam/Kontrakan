// src/utils/api.js
import axios from 'axios';
import API_URL from '../config/api';

// Buat instance axios dengan konfigurasi dasar
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menambahkan token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor untuk menangani response
api.interceptors.response.use(
  (response) => {
    // Debug: log response untuk troubleshooting
    console.log('API Response:', response.status, response.data);
    
    // Handle response yang konsisten
    // Periksa apakah response sudah dalam format yang diharapkan
    if (response.data && response.data.success !== undefined) {
      // Response dari backend sudah memiliki format { success, message, data }
      return response.data;
    }
    
    // Response tidak dalam format standar - wrap dalam format yang diharapkan
    return {
      success: true,
      data: response.data?.data || response.data || [],
      message: response.data?.message || 'Success',
      status: response.status,
    };
  },
  (error) => {
    // Debug: log error untuk troubleshooting
    console.log('API Error caught:', error);
    console.log('Error response:', error.response?.data);
    console.log('Error status:', error.response?.status);
    
    // Handle error dengan konsisten - BERIKAN RESPONSE OBJECT BUKAN REJECT
    let message = 'Terjadi kesalahan pada server';
    let success = false;
    let data = null;
    
    if (error.response) {
      // Server merespons dengan error
      success = error.response.data?.success || false;
      message = error.response.data?.message || error.message;
      data = error.response.data?.data || null;
      
      // Handle 401 Unauthorized - redirect ke login (tapi jangan langsung redirect dari interceptor login endpoint)
      if (error.response.status === 401 && !error.config.url?.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Delay redirect untuk memastikan promise handling selesai
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    } else if (error.request) {
      // Request dibuat tapi tidak ada response
      message = 'Tidak dapat terhubung ke server. Pastikan server backend berjalan.';
      console.log('No response from server');
    } else {
      // Error lainnya
      message = error.message || 'Unknown error';
      console.log('Error:', error.message);
    }

    // PENTING: Return response object (jangan reject) agar konsisten dengan success case
    return {
      success: success,
      message: message,
      data: data,
      isError: true
    };
  }
);

export default api;
