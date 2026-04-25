import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, loading, isAuthChecked } = useAuth();

  // Hanya tampilkan loading spinner jika TIDAK ada token di localStorage
  // Jika sudah ada token (user baru login), langsung redirect ke beranda
  const hasToken = !!localStorage.getItem('token');
  
  if (!hasToken && loading && !isAuthChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // Cek apakah user sudah ter-authenticate
  // isAuthenticated() cek localStorage token
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
