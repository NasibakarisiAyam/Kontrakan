import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Beranda from './pages/Beranda';
import DaftarKontrakan from './pages/DaftarKontrakan';
import PesanKontrakan from './pages/PesanKontrakan';
import PerpanjanganKontrakan from './pages/PerpanjanganKontrakan';
import Penyewa from './pages/Penyewa';
import Pengaturan from "./pages/Pengaturan";
import UserManagement from "./pages/UserManagement";

import ProtectedRoute from "./pages/ProtectedRoute";

function AppContent() {
  const { isAuthenticated, loading, isAuthChecked } = useAuth();

  // Hanya tampilkan loading spinner jika:
  // 1. Belum ada token di localStorage DAN masih dalam proses auth check
  // 2. Jika sudah ada token, langsung tampilkan konten (berdasarkan token saja)
  // Ini memungkinkan user yang baru login langsung ke beranda tanpa tunggu verifikasi backend
  const hasToken = !!localStorage.getItem('token');
  const showLoading = !hasToken && loading && !isAuthChecked;
  
  if (showLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {isAuthenticated() && <Navbar />}
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes (Hanya bisa diakses jika login) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Beranda />} />
            <Route path="/kontrakan" element={<DaftarKontrakan />} />
            <Route path="/pesan-kontrakan" element={<PesanKontrakan />} />
            <Route path="/perpanjangan-kontrakan" element={<PerpanjanganKontrakan />} />
            <Route path="/penyewa" element={<Penyewa />} />
            <Route path="/pengaturan" element={<Pengaturan />} />
            <Route path="/users" element={<UserManagement />} />

          </Route>

          {/* Redirect halaman tidak dikenal ke Home (yang akan dicek loginnya) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
