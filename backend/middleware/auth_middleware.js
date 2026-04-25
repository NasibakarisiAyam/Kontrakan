// middleware/auth_middleware.js
import jwt from 'jsonwebtoken';

const authMiddleware = async (req, res, next) => {
  try {
    // Ambil token dari header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan'
      });
    }

    // FIX: Ambil token dengan split untuk memastikan format 'Bearer <token>'
    // Jika user mengirim header tanpa 'Bearer', fallback ke raw header
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan'
      });
    }

    // Verifikasi token - gunakan fallback secret yang sama dengan server.js
    const secret = process.env.JWT_SECRET || 'dev-secret-key-ganti-di-production';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Auth Middleware Error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token sudah kadaluarsa'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error pada autentikasi'
    });
  }
};

export default authMiddleware;