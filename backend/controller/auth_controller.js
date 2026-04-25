// controller/auth_controller.js
import User from '../model/user.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Generate JWT Token
const generateToken = (user) => {
  // Gunakan fallback secret jika tidak ada di .env (untuk development)
  // Samakan dengan default yang digunakan di server.js untuk menghindari mismatch
  const secret = process.env.JWT_SECRET || 'dev-secret-key-ganti-di-production';
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: user.role 
    },
    secret,
    { expiresIn: '24h' }
  );
};

// Register User
const register = async (req, res) => {
  try {
    const { nama, email, password, telepon } = req.body;

    // Validasi input
    if (!nama || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan password harus diisi'
      });
    }

    // Cek jika user sudah ada
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    // Buat user baru
    const user = new User({
      nama: nama.trim(),
      email: email.toLowerCase().trim(),
      password, // Password akan di-hash otomatis oleh model/user.js
      telepon: telepon?.trim() || '',
      role: 'penyewa' // Default role untuk registrasi adalah penyewa
    });

    await user.save();

    // Generate JWT Token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        id: user._id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        telepon: user.telepon,
        token
      }
    });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mendaftar: ' + error.message,
      error: error.message
    });
  }
};

// Login User
const login = async (req, res) => {
  try {
    // Debug: log headers and body untuk mengetahui mengapa body kosong
    console.log('---- LOGIN REQUEST ----');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);

    const { email, password } = req.body || {};
    console.log('Extracted email:', email);
    console.log('Extracted password:', password ? '***' : 'undefined');

    // Validasi input
    if (!email || !password) {
      console.log('Validation failed: email atau password kosong');
      return res.status(400).json({
        success: false,
        message: 'Email dan password harus diisi'
      });
    }

    // Cek jika user ada
    const emailNormalized = email.toString().toLowerCase().trim();
    console.log('Searching for user with email:', emailNormalized);
    
    const user = await User.findOne({ email: emailNormalized });
    console.log('User found:', user ? 'YES' : 'NO');
    
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    console.log('User data:', user.email, user.nama, user.role);
    
    // Verifikasi password
    console.log('Verifying password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Password incorrect');
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // Generate JWT Token
    console.log('Generating token...');
    const token = generateToken(user);
    console.log('Token generated successfully');

    // Response tanpa password
    const userResponse = {
      id: user._id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      telepon: user.telepon,
      token
    };

    console.log('Login successful for:', user.email);
    res.json({
      success: true,
      message: 'Login berhasil',
      data: userResponse
    });

  } catch (error) {
    console.error('Login Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Gagal Login: ' + error.message, // Tampilkan pesan error asli
      error: error.message
    });
  }
};

// Get Current User Profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Update User Profile
const updateProfile = async (req, res) => {
  try {
    const { nama, telepon } = req.body;
    
    const updateData = {};
    if (nama) updateData.nama = nama.trim();
    if (telepon !== undefined) updateData.telepon = telepon.trim();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: user
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// Get All Users (Admin Only)
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data user',
      error: error.message
    });
  }
};

// Create User by Admin
const createUser = async (req, res) => {
  try {
    const { nama, email, password, telepon, role } = req.body;

    // Validasi input
    if (!nama || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, password, dan role harus diisi'
      });
    }

    // Cek jika user sudah ada
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    // Buat user baru
    const user = new User({
      nama: nama.trim(),
      email: email.toLowerCase().trim(),
      password, // Password akan di-hash otomatis oleh model/user.js
      telepon: telepon?.trim() || '',
      role: role // Role sesuai input admin (admin/karyawan)
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Akun berhasil dibuat',
      data: {
        id: user._id,
        nama: user.nama,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat user: ' + error.message,
      error: error.message
    });
  }
};

export {
  register,
  login,
  getProfile,
  updateProfile,
  getUsers,
  createUser
};