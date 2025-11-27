import { Router } from "express";
import pool from "../db.js";
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(verificarToken);

// POST - Crear inscripción desde el estudiante - CORREGIDO
router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id_tutoria } = req.body;
    
    // Obtener id_estudiante del token de manera segura
    let id_estudiante;
    
    // Si el usuario es estudiante, usar id_estudiante del token
    if (req.user.id_rol === 4) {
      id_estudiante = req.user.id_estudiante;
    } else {
      // Para desarrollo/testing, permitir especificar id_estudiante
      id_estudiante = req.body.id_estudiante;
    }

    if (!id_estudiante) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "ID de estudiante no disponible" });
    }

    // Validar campos requeridos
    if (!id_tutoria) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "ID de la tutoría es requerido" });
    }

    // Verificar si el estudiante existe y está activo
    const estudiante = await client.query(
      "SELECT * FROM public.estudiante WHERE id_estudiante = $1 AND activo = TRUE",
      [id_estudiante]
    );
    
    if (estudiante.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Estudiante no encontrado o deshabilitado" });
    }

    // Verificar si la tutoría existe y está activa
    const tutoria = await client.query(
      `SELECT t.*, i.nombre as institucion_nombre, 
              tu.nombre as tutor_nombre, tu.especialidad,
              COUNT(ins.id_inscripcion) as inscritos_actuales,
              t.cupo - COUNT(ins.id_inscripcion) as cupos_disponibles
       FROM public.tutoria t
       JOIN public.institucion i ON t.id_institucion = i.id_institucion
       JOIN public.tutor tu ON t.id_tutor = tu.id_tutor
       LEFT JOIN public.inscripcion ins ON t.id_tutoria = ins.id_tutoria AND ins.estado_inscripcion = 'aprobada' AND ins.activo = TRUE
       WHERE t.id_tutoria = $1 AND t.activo = TRUE
       GROUP BY t.id_tutoria, i.nombre, tu.nombre, tu.especialidad`,
      [id_tutoria]
    );
    
    if (tutoria.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Tutoría no encontrada o deshabilitada" });
    }

    const tutoriaInfo = tutoria.rows[0];

    // Verificar cupos disponibles
    if (tutoriaInfo.cupos_disponibles <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "No hay cupos disponibles en esta tutoría" });
    }

    // Verificar si el estudiante ya está inscrito en esta tutoría
    const inscripcionExistente = await client.query(
      `SELECT * FROM public.inscripcion 
       WHERE id_estudiante = $1 AND id_tutoria = $2 AND activo = TRUE
       AND estado_inscripcion IN ('pendiente', 'aprobada')`,
      [id_estudiante, id_tutoria]
    );
    
    if (inscripcionExistente.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: "Ya estás inscrito en esta tutoría",
        estado_actual: inscripcionExistente.rows[0].estado_inscripcion
      });
    }

    // Crear la inscripción
    const result = await client.query(
      `INSERT INTO public.inscripcion 
       (fecha_inscripcion, estado_inscripcion, id_estudiante, id_tutoria, activo) 
       VALUES (NOW(), 'pendiente', $1, $2, TRUE) RETURNING *`,
      [id_estudiante, id_tutoria]
    );

    await client.query('COMMIT');
    
    res.status(201).json({
      mensaje: "Inscripción creada exitosamente",
      inscripcion: result.rows[0],
      tutoria: tutoriaInfo
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al crear inscripción:", error.message);
    res.status(500).json({ error: "Error al crear inscripción: " + error.message });
  } finally {
    client.release();
  }
});

// GET - Obtener inscripciones del estudiante autenticado - CORREGIDO
router.get("/mis-inscripciones", async (req, res) => {
  try {
    let id_estudiante;
    
    if (req.user.id_rol === 4) {
      id_estudiante = req.user.id_estudiante;
    } else {
      return res.status(403).json({ error: "Solo los estudiantes pueden acceder a esta información" });
    }

    const result = await pool.query(
      `SELECT i.*, 
              t.nombre_tutoria, t.sigla, t.descripcion_tutoria, t.cupo,
              tu.nombre as tutor_nombre, tu.especialidad,
              inst.nombre as institucion_nombre,
              p.nro_pago, p.monto, p.estado_pago, p.fecha_de_pago,
              (SELECT COUNT(*) FROM public.inscripcion ins 
               WHERE ins.id_tutoria = i.id_tutoria AND ins.estado_inscripcion = 'aprobada' AND ins.activo = TRUE) as inscritos_actuales,
              t.cupo - (SELECT COUNT(*) FROM public.inscripcion ins 
                       WHERE ins.id_tutoria = i.id_tutoria AND ins.estado_inscripcion = 'aprobada' AND ins.activo = TRUE) as cupos_disponibles
       FROM public.inscripcion i
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria AND t.activo = TRUE
       JOIN public.tutor tu ON t.id_tutor = tu.id_tutor AND tu.activo = TRUE
       JOIN public.institucion inst ON t.id_institucion = inst.id_institucion
       LEFT JOIN public.pago_qr p ON i.id_inscripcion = p.id_inscripcion AND p.activo = TRUE
       WHERE i.id_estudiante = $1 AND i.activo = TRUE
       ORDER BY i.fecha_inscripcion DESC`,
      [id_estudiante]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener inscripciones:", error.message);
    res.status(500).json({ error: "Error al obtener inscripciones" });
  }
});

// DELETE - Cancelar inscripción (solo si está pendiente)
router.delete("/:id/cancelar", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const id_estudiante = req.user.id_estudiante;

    // Verificar que la inscripción pertenece al estudiante y está pendiente
    const inscripcion = await client.query(
      `SELECT * FROM public.inscripcion 
       WHERE id_inscripcion = $1 AND id_estudiante = $2 AND estado_inscripcion = 'pendiente' AND activo = TRUE`,
      [id, id_estudiante]
    );
    
    if (inscripcion.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        error: "Inscripción no encontrada, no te pertenece o no se puede cancelar" 
      });
    }

    // Verificar si tiene pagos asociados
    const pagos = await client.query(
      "SELECT * FROM public.pago_qr WHERE id_inscripcion = $1 AND activo = TRUE",
      [id]
    );
    
    if (pagos.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: "No se puede cancelar la inscripción porque tiene pagos asociados" 
      });
    }

    // Desactivar la inscripción
    const result = await client.query(
      `UPDATE public.inscripcion SET activo = FALSE 
       WHERE id_inscripcion = $1 RETURNING *`,
      [id]
    );

    await client.query('COMMIT');
    
    res.json({ 
      mensaje: "Inscripción cancelada exitosamente",
      inscripcion: result.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al cancelar inscripción:", error.message);
    res.status(500).json({ error: "Error al cancelar inscripción" });
  } finally {
    client.release();
  }
});
// GET - Verificar inscripción del estudiante en una tutoría específica
router.get("/tutoria/:id_tutoria", async (req, res) => {
  try {
    const { id_tutoria } = req.params;
    const user = req.user;

    // Obtener el id_estudiante del usuario
    const estudianteResult = await pool.query(
      "SELECT id_estudiante FROM public.estudiante WHERE email = $1 AND activo = TRUE",
      [user.email]
    );

    if (estudianteResult.rows.length === 0) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }

    const id_estudiante = estudianteResult.rows[0].id_estudiante;

    // Verificar inscripción en la tutoría
    const inscripcionResult = await pool.query(
      `SELECT i.*, t.nombre_tutoria, t.sigla
       FROM public.inscripcion i
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       WHERE i.id_estudiante = $1 AND i.id_tutoria = $2 AND i.activo = TRUE
       ORDER BY i.fecha_inscripcion DESC
       LIMIT 1`,
      [id_estudiante, id_tutoria]
    );

    if (inscripcionResult.rows.length === 0) {
      return res.status(404).json({ 
        error: "No estás inscrito en esta tutoría",
        inscrito: false
      });
    }

    const inscripcion = inscripcionResult.rows[0];
    
    res.json({
      ...inscripcion,
      inscrito: true,
      aprobado: inscripcion.estado_inscripcion === 'aprobada'
    });
  } catch (error) {
    console.error("Error al verificar inscripción:", error.message);
    res.status(500).json({ error: "Error al verificar inscripción" });
  }
});

export default router;