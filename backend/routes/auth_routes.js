import express from 'express';
import { register, login, getProfile, updateProfile, getUsers, createUser } from '../controller/auth_controller.js';
import authMiddleware from '../middleware/auth_middleware.js';
import adminMiddleware from '../middleware/admin_middleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (Login required)
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

// Admin routes (Login + Admin role required)
router.get('/users', authMiddleware, adminMiddleware, getUsers);
router.post('/create', authMiddleware, adminMiddleware, createUser);

export default router;