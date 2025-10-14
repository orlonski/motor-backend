import express from 'express';
import { login, me } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login - Login
router.post('/login', login);

// GET /api/auth/me - Obter usuário atual (protegido)
router.get('/me', authenticate, me);

export default router;
