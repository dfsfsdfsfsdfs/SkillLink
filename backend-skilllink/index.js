import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Importar todas las rutas
import tutoriasRouter from "./src/routes/tutorias.js";
import aulasRouter from "./src/routes/aulas.js";
import tutoresRouter from "./src/routes/tutores.js";
import institucionesRouter from "./src/routes/instituciones.js";
import actividadesRouter from "./src/routes/actividades.js";
import estudiantesRouter from "./src/routes/estudiantes.js";
import inscripcionesRouter from "./src/routes/inscripciones.js";
import pagosQrRouter from "./src/routes/pagosQr.js";
import asignaRouter from "./src/routes/asigna.js";
import preguntasRouter from "./src/routes/preguntas.js";
import opcionesRouter from "./src/routes/opciones.js";
import respuestasRouter from "./src/routes/respuestas.js";
import tutoresTutoriaRoutes from './src/routes/tutores-tutoria.js';
// Importar rutas de autenticación y usuarios
import authRoutes from "./src/routes/authRoutes.js";
import usuarioRoutes from "./src/routes/usuarioRoutes.js";
import aprobacionRoutes from "./src/routes/aprobacionRoutes.js";
import inscripcionesEstudianteRoutes from "./src/routes/InscripcionesEstudiante.js";
import evaluacionesRouter from "./src/routes/evaluaciones.js";
import entregasRouter from './src/routes/entregasTareas.js';

dotenv.config();

const app = express();

// 🔥 SOLUCIÓN: Aumentar límites de tamaño para JSON y URL encoded
app.use(express.json({ 
  limit: '50mb', // Aumentar de 100kb por defecto a 50MB
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb' // Aumentar límite para datos URL encoded
}));

app.use(cors());

app.get("/", (req, res) => {
  res.json({ 
    mensaje: "API SkillLink funcionando 🚀",
    version: "1.0.0",
    endpoints: {
      auth: "/auth",
      usuarios: "/usuarios",
      aprobaciones: "/aprobaciones",
      tutorias: "/tutorias",
      aulas: "/aulas", 
      tutores: "/tutores",
      instituciones: "/instituciones",
      actividades: "/actividades",
      estudiantes: "/estudiantes",
      inscripciones: "/inscripciones",
      pagos: "/pagos",
      asignaciones: "/asigna",
      preguntas: "/preguntas",
      opciones: "/opciones",
      respuestas: "/respuestas"
    },
    configuracion: {
      limite_json: "50MB",
      limite_urlencoded: "50MB"
    }
  });
});

// Configurar todas las rutas
app.use("/auth", authRoutes);
app.use("/usuarios", usuarioRoutes); // Registro y gestión de usuarios
app.use("/aprobaciones", aprobacionRoutes); // Aprobación de inscripciones
app.use("/tutorias", tutoriasRouter);
app.use("/aulas", aulasRouter);
app.use("/tutores", tutoresRouter);
app.use("/instituciones", institucionesRouter);
app.use("/actividades", actividadesRouter);
app.use("/estudiantes", estudiantesRouter);
app.use("/inscripciones", inscripcionesRouter);
app.use("/pagos", pagosQrRouter);
app.use("/asigna", asignaRouter);
app.use("/preguntas", preguntasRouter);
app.use("/opciones", opcionesRouter);
app.use("/respuestas", respuestasRouter);
app.use('/tutores-tutoria', tutoresTutoriaRoutes);
app.use('/inscripciones-estudiante', inscripcionesEstudianteRoutes);
app.use("/evaluaciones", evaluacionesRouter);
app.use('/entregas', entregasRouter);

// Middleware para manejar errores de Payload Too Large
app.use((error, req, res, next) => {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      error: "Payload Too Large",
      mensaje: "El archivo o datos enviados son demasiado grandes",
      limite: "50MB",
      recomendacion: "Reduzca el tamaño de la imagen o use compresión"
    });
  }
  next(error);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📚 Endpoints CRUD completos disponibles:`);
  console.log(`   GET  http://localhost:${PORT}/tutorias`);
  console.log(`   GET  http://localhost:${PORT}/aulas`);
  console.log(`   GET  http://localhost:${PORT}/tutores`);
  console.log(`   GET  http://localhost:${PORT}/instituciones`);
  console.log(`   GET  http://localhost:${PORT}/estudiantes`);
  console.log(`   GET  http://localhost:${PORT}/inscripciones`);
  console.log(`   GET  http://localhost:${PORT}/pagos`);
  console.log(`   GET  http://localhost:${PORT}/asigna`);
  console.log(`   GET  http://localhost:${PORT}/preguntas`);
  console.log(`   GET  http://localhost:${PORT}/opciones`);
  console.log(`   GET  http://localhost:${PORT}/respuestas`);
  console.log(`🔐 Endpoints de autenticación y usuarios:`);
  console.log(`   POST http://localhost:${PORT}/auth/login`);
  console.log(`   POST http://localhost:${PORT}/usuarios (Registro)`);
  console.log(`   GET  http://localhost:${PORT}/usuarios/pendientes`);
  console.log(`   PUT  http://localhost:${PORT}/usuarios/:id/aprobar`);
  console.log(`⚙️  Configuración:`);
  console.log(`   Límite JSON: 50MB`);
  console.log(`   Límite URL Encoded: 50MB`);
});