// src/routes/usuarioRoutes.js
import express from 'express';
import usuarioController from '../controllers/usuarioController.js';
import { verificarToken, verificarRol } from '../middlewares/authMiddleware.js';

const router = express.Router();

// REGISTRO PÚBLICO - sin autenticación
router.post('/', usuarioController.crearUsuario);

// Endpoints que requieren autenticación
router.get('/pendientes', verificarToken, verificarRol([1, 2]), usuarioController.obtenerPendientes);
router.put('/:id/aprobar', verificarToken, verificarRol([1, 2]), usuarioController.aprobarUsuario);

// NUEVOS ENDPOINTS QUE NECESITAS AGREGAR:
// En usuarioRoutes.js - actualizar estas rutas:
router.patch('/:id', verificarToken, verificarRol([1, 2]), usuarioController.actualizarUsuario);
router.delete('/:id', verificarToken, verificarRol([1, 2]), usuarioController.eliminarUsuario);

// Agrega esta ruta a usuarioRoutes.js
router.get('/todos', verificarToken, verificarRol([1]), usuarioController.obtenerTodosUsuarios);

export default router;