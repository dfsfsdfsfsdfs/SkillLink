// src/routes/authRoutes.js
import express from 'express';
import authController from '../controllers/authController.js';
import usuarioController from '../controllers/usuarioController.js'; // ← Importar usuarioController

const router = express.Router();

router.post('/login', authController.login);
router.post('/registro', usuarioController.crearUsuario); // ← Usar usuarioController.crearUsuario

export default router;