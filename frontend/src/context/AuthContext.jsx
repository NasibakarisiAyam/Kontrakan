// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        // Set user dari localStorage dulu agar langsung ter-authenticate
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }

        // Lalu verifikasi dengan backend
        const response = await api.get(API_ENDPOINTS.AUTH.PROFILE);
        if (response.success) {
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } else {
          // Token invalid, logout
          logout(false);
        }
      } else {
        // Tidak ada token
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // Jika error, coba gunakan data dari localStorage jika ada
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        setUser(null);
      }
    } finally {
      setLoading(false);
      setIsAuthChecked(true);
    }
  };

  const login = async (email, password) => {
    console.log('=== AUTHCONTEXT LOGIN ===');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('API Endpoint:', API_ENDPOINTS.AUTH.LOGIN);
    
    try {
      // Debug: log payload before request
      const payload = { email, password };
      console.log('Payload:', payload);
      
      // API interceptor akan mengembalikan response object (tidak reject)
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, payload);
      console.log('AuthContext.login - response:', response);
      console.log('Response success:', response?.success);
      
      if (response && response.success) {
        const userData = response.data;
        console.log('User data:', userData);
        
        // Simpan token dan user ke localStorage
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update state
        setUser(userData);
        
        return { success: true, data: userData };
      } else {
        console.log('Login failed - response:', response);
        const errorMsg = response?.message || 'Login gagal';
        console.log('Error message:', errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (error) {
      console.error('AuthContext.login - UNEXPECTED error caught:', error);
      console.error('Error type:', typeof error);
      console.error('Error:', error);
      
      // Handle unexpected errors (should rarely happen now)
      const message = error?.message || 'Terjadi kesalahan yang tidak terduga';
      console.log('Returning error message:', message);
      
      return { 
        success: false, 
        message: message
      };
    }
  };

  const register = async (formData) => {
    console.log('=== AUTHCONTEXT REGISTER ===');
    console.log('Form data:', formData);
    
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, formData);
      console.log('AuthContext.register - response:', response);
      
      if (response.success) {
        const userData = response.data;
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return { success: true, data: userData };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('AuthContext.register - error:', error);
      return { 
        success: false, 
        message: error.message || 'Tidak dapat terhubung ke server. Pastikan server backend berjalan.' 
      };
    }
  };

  const logout = (shouldRedirect = true) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    if (shouldRedirect) {
      navigate('/login', { replace: true });
    }
  };

  const isAuthenticated = () => {
    // Lebih robust: cek token di localStorage dan user state
    const token = localStorage.getItem('token');
    return !!token;
  };

  const value = {
    user,
    loading,
    isAuthChecked,
    register,
    login,
    logout,
    isAuthenticated,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
