// middleware/validation.js

export const validateRegister = (req, res, next) => {
  const { nama, email, password } = req.body;
  
  // Validasi field required
  if (!nama || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Nama, email, dan password wajib diisi'
    });
  }

  // Validasi email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Format email tidak valid'
    });
  }

  // Validasi password minimal 6 karakter
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password minimal 6 karakter'
    });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email dan password wajib diisi'
    });
  }

  next();
};