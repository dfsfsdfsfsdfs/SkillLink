import { Router } from "express";
import pool from "../db.js";
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(verificarToken);

// GET - Todas las entregas (para admin)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT et.*, 
             a.nombre as actividad_nombre,
             a.nota_act as nota_maxima,
             e.nombre as estudiante_nombre,
             e.paterno as estudiante_paterno,
             t.nombre_tutoria,
             tu.nombre as tutor_nombre,
             tc.nombre as tutor_calificador_nombre
      FROM public.entrega_tarea et
      JOIN public.actividad a ON et.id_actividad = a.id_actividad
      JOIN public.estudiante e ON et.id_estudiante = e.id_estudiante
      JOIN public.tutoria t ON a.id_tutoria = t.id_tutoria
      LEFT JOIN public.tutor tu ON a.id_tutor = tu.id_tutor
      LEFT JOIN public.tutor tc ON et.id_tutor_calificador = tc.id_tutor
      WHERE et.activo = TRUE
      ORDER BY et.fecha_entrega DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener entregas:", error.message);
    res.status(500).json({ error: "Error al obtener entregas" });
  }
});
// GET - Mis entregas (para estudiantes) - VERSIÓN CORREGIDA
router.get("/estudiante/mis-entregas", async (req, res) => {
  try {
    const { id_estudiante, email } = req.query;
    
    console.log("📦 Buscando entregas con:", { id_estudiante, email });
    
    let estudianteId = id_estudiante;
    
    // Si no se proporciona id_estudiante, buscarlo por email
    if (!estudianteId && email) {
      const estudianteResult = await pool.query(
        "SELECT id_estudiante FROM public.estudiante WHERE email = $1 AND activo = TRUE",
        [email]
      );
      
      if (estudianteResult.rows.length === 0) {
        return res.status(404).json({ error: "Estudiante no encontrado" });
      }
      
      estudianteId = estudianteResult.rows[0].id_estudiante;
    }
    
    if (!estudianteId) {
      return res.status(400).json({ error: "Se requiere id_estudiante o email" });
    }
    
    // CORREGIR: Usar la tabla correcta entrega_tarea en lugar de entrega
    const result = await pool.query(
      `SELECT et.*, 
              a.nombre as actividad_nombre, 
              a.fecha_presentacion, 
              a.nota_act,
              t.nombre_tutoria, 
              t.sigla,
              tut.nombre as tutor_nombre
       FROM public.entrega_tarea et
       JOIN public.actividad a ON et.id_actividad = a.id_actividad
       JOIN public.tutoria t ON a.id_tutoria = t.id_tutoria
       LEFT JOIN public.tutor tut ON a.id_tutor = tut.id_tutor
       WHERE et.id_estudiante = $1 AND et.activo = TRUE
       ORDER BY et.fecha_entrega DESC`,
      [estudianteId]
    );
    
    console.log(`✅ Encontradas ${result.rows.length} entregas para estudiante ${estudianteId}`);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener mis entregas:", error.message);
    res.status(500).json({ error: "Error al obtener mis entregas: " + error.message });
  }
});

// GET - Entregas por actividad (para tutores) - VERSIÓN CORREGIDA
router.get("/actividad/:id_actividad", async (req, res) => {
  try {
    const { id_actividad } = req.params;
    
    const result = await pool.query(
      `SELECT et.*, 
              est.nombre as estudiante_nombre, 
              est.paterno as estudiante_paterno,
              est.materno as estudiante_materno
       FROM public.entrega_tarea et
       JOIN public.estudiante est ON et.id_estudiante = est.id_estudiante
       WHERE et.id_actividad = $1 AND et.activo = TRUE
       ORDER BY et.fecha_entrega DESC`,
      [id_actividad]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener entregas por actividad:", error.message);
    res.status(500).json({ error: "Error al obtener entregas por actividad" });
  }
});

// POST - Crear entrega - VERSIÓN CORREGIDA
router.post("/", async (req, res) => {
  try {
    const { id_actividad, id_estudiante, url_drive } = req.body;
    
    if (!id_actividad || !id_estudiante || !url_drive) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }
    
    // CORREGIR: Usar la tabla correcta entrega_tarea
    const result = await pool.query(
      `INSERT INTO public.entrega_tarea (id_actividad, id_estudiante, url_drive, fecha_entrega, estado) 
       VALUES ($1, $2, $3, NOW(), 'pendiente') RETURNING *`,
      [id_actividad, id_estudiante, url_drive]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear entrega:", error.message);
    res.status(500).json({ error: "Error al crear entrega" });
  }
});

// PUT - Calificar entrega - VERSIÓN CORREGIDA
router.put("/:id_entrega/calificar", async (req, res) => {
  try {
    const { id_entrega } = req.params;
    const { calificacion, comentario_tutor } = req.body;
    
    // CORREGIR: Usar la tabla correcta entrega_tarea
    const result = await pool.query(
      `UPDATE public.entrega_tarea 
       SET calificacion = $1, comentario_tutor = $2, fecha_calificacion = NOW(), estado = 'calificado'
       WHERE id_entrega = $3 AND activo = TRUE
       RETURNING *`,
      [calificacion, comentario_tutor, id_entrega]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Entrega no encontrada" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al calificar entrega:", error.message);
    res.status(500).json({ error: "Error al calificar entrega" });
  }
});


// GET - Entregas pendientes de calificar
router.get("/pendientes-calificacion", async (req, res) => {
  try {
    const user = req.user;
    
    let query = `
      SELECT et.*, 
             a.nombre as actividad_nombre,
             e.nombre as estudiante_nombre,
             e.paterno as estudiante_paterno,
             t.nombre_tutoria,
             tu.nombre as tutor_nombre
      FROM public.entrega_tarea et
      JOIN public.actividad a ON et.id_actividad = a.id_actividad
      JOIN public.estudiante e ON et.id_estudiante = e.id_estudiante
      JOIN public.tutoria t ON a.id_tutoria = t.id_tutoria
      LEFT JOIN public.tutor tu ON a.id_tutor = tu.id_tutor
      WHERE et.activo = TRUE AND et.estado = 'pendiente'
    `;

    let params = [];

    // Filtrar por permisos
    if (user.id_rol === 3) { // Tutor
      const tutorResult = await pool.query(
        "SELECT id_tutor FROM public.tutor WHERE id_usuario = $1",
        [user.id_usuario]
      );
      if (tutorResult.rows.length > 0) {
        query += " AND a.id_tutor = $1";
        params = [tutorResult.rows[0].id_tutor];
      }
    } else if (user.id_rol === 2) { // Gerente
      query += " AND t.id_institucion IN (SELECT id_institucion FROM public.institucion WHERE id_usuario_gerente = $1)";
      params = [user.id_usuario];
    }

    query += " ORDER BY et.fecha_entrega DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener entregas pendientes:", error.message);
    res.status(500).json({ error: "Error al obtener entregas pendientes" });
  }
});

export default router;