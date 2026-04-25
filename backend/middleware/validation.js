import { body, validationResult } from 'express-validator';

// Validasi untuk registrasi
export const validateRegister = [
  body('nama')
    .trim()
    .notEmpty().withMessage('Nama harus diisi')
    .isLength({ min: 3 }).withMessage('Nama minimal 3 karakter'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email harus diisi')
    .isEmail().withMessage('Format email tidak valid'),
  
  body('password')
    .notEmpty().withMessage('Password harus diisi')
    .isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  
  body('telepon')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9+\-\s]+$/).withMessage('Format telepon tidak valid'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Format error yang konsisten dengan frontend
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return res.status(400).json({
        success: false,
        message: errorMessages,
        errors: errors.array() // tetap pertahankan untuk debugging
      });
    }
    next();
  }
];

// Validasi untuk login
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email harus diisi')
    .isEmail().withMessage('Format email tidak valid'),
  
  body('password')
    .notEmpty().withMessage('Password harus diisi'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Format error yang konsisten dengan frontend
      const errorMessages = errors.array().map(err => err.msg).join(', ');
      return res.status(400).json({
        success: false,
        message: errorMessages,
        errors: errors.array() // tetap pertahankan untuk debugging
      });
    }
    next();
  }
];
