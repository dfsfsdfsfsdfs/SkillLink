import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET - Todos los estudiantes (solo los activos)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM public.estudiante WHERE activo = TRUE ORDER BY id_estudiante"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener estudiantes:", error.message);
    res.status(500).json({ error: "Error al obtener estudiantes" });
  }
});
// GET - Perfil del estudiante autenticado - DEBE IR ANTES DE /:id
router.get("/mi-perfil", async (req, res) => {
  try {
    // Versión simplificada - usa query parameters
    const { email, id_usuario } = req.query;
    
    console.log("📧 Buscando estudiante con:", { email, id_usuario });
    
    let result;
    if (id_usuario) {
      // Buscar por ID de usuario
      result = await pool.query(
        `SELECT e.* FROM public.estudiante e
         JOIN public.usuario u ON e.email = u.email
         WHERE u.id_usuario = $1 AND e.activo = TRUE`,
        [id_usuario]
      );
    } else if (email) {
      // Buscar por email
      result = await pool.query(
        "SELECT * FROM public.estudiante WHERE email = $1 AND activo = TRUE",
        [email]
      );
    } else {
      return res.status(400).json({ error: "Se requiere email o id_usuario" });
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener perfil del estudiante:", error.message);
    res.status(500).json({ error: "Error al obtener perfil del estudiante" });
  }
});


// GET - Estudiante por ID (solo si está activo)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM public.estudiante WHERE id_estudiante = $1 AND activo = TRUE", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener estudiante:", error.message);
    res.status(500).json({ error: "Error al obtener estudiante" });
  }
});
// GET - Estudiante por usuario
router.get("/usuario/:idUsuario", async (req, res) => {
  try {
    const { idUsuario } = req.params;
    const result = await pool.query(
      `SELECT e.* FROM public.estudiante e
       JOIN public.usuario u ON e.email = u.email
       WHERE u.id_usuario = $1 AND e.activo = TRUE`,
      [idUsuario]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener estudiante por usuario:", error.message);
    res.status(500).json({ error: "Error al obtener estudiante" });
  }
});

// POST - Crear estudiante (se crea como activo por defecto)
router.post("/", async (req, res) => {
  try {
    const { nombre, paterno, materno, celular, email, carrera, univer_institu } = req.body;
    
    // Validar campos requeridos
    if (!nombre || !paterno || !email) {
      return res.status(400).json({ error: "Nombre, apellido paterno y email son requeridos" });
    }
    
    const result = await pool.query(
      `INSERT INTO public.estudiante (nombre, paterno, materno, celular, email, carrera, univer_institu, activo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE) RETURNING *`,
      [nombre, paterno, materno, celular, email, carrera, univer_institu]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear estudiante:", error.message);
    res.status(500).json({ error: "Error al crear estudiante" });
  }
});

// PUT - Actualizar estudiante (solo si está activo)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, paterno, materno, celular, email, carrera, univer_institu } = req.body;
    
    // Validar que el estudiante existe y está activo
    const estudianteExistente = await pool.query(
      "SELECT * FROM public.estudiante WHERE id_estudiante = $1 AND activo = TRUE",
      [id]
    );
    
    if (estudianteExistente.rows.length === 0) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }
    
    const result = await pool.query(
      `UPDATE public.estudiante 
       SET nombre=$1, paterno=$2, materno=$3, celular=$4, email=$5, carrera=$6, univer_institu=$7 
       WHERE id_estudiante=$8 AND activo = TRUE RETURNING *`,
      [nombre, paterno, materno, celular, email, carrera, univer_institu, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar estudiante:", error.message);
    res.status(500).json({ error: "Error al actualizar estudiante" });
  }
});

// PATCH - Actualizar parcialmente estudiante (solo si está activo)
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Validar que el estudiante existe y está activo
    const estudianteExistente = await pool.query(
      "SELECT * FROM public.estudiante WHERE id_estudiante = $1 AND activo = TRUE",
      [id]
    );
    
    if (estudianteExistente.rows.length === 0) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }
    
    // Construir dinámicamente la consulta UPDATE
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    Object.keys(updates).forEach(key => {
      if (['nombre', 'paterno', 'materno', 'celular', 'email', 'carrera', 'univer_institu'].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });
    
    if (fields.length === 0) {
      return res.status(400).json({ error: "No hay campos válidos para actualizar" });
    }
    
    values.push(id);
    
    const query = `UPDATE public.estudiante SET ${fields.join(', ')} WHERE id_estudiante = $${paramCount} AND activo = TRUE RETURNING *`;
    const result = await pool.query(query, values);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar estudiante:", error.message);
    res.status(500).json({ error: "Error al actualizar estudiante" });
  }
});

// DELETE - Eliminación lógica (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el estudiante tiene inscripciones activas
    const inscripciones = await pool.query(
      `SELECT i.* FROM public.inscripcion i 
       JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante 
       WHERE i.id_estudiante = $1 AND i.estado_inscripcion = 'Activa' AND e.activo = TRUE`,
      [id]
    );
    
    if (inscripciones.rows.length > 0) {
      return res.status(400).json({ 
        error: "No se puede deshabilitar el estudiante porque tiene inscripciones activas" 
      });
    }
    
    // En lugar de DELETE, hacemos un UPDATE para marcar como inactivo
    const result = await pool.query(
      `UPDATE public.estudiante SET activo = FALSE 
       WHERE id_estudiante = $1 AND activo = TRUE 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Estudiante no encontrado o ya está deshabilitado" });
    }

    res.json({ 
      mensaje: "Estudiante deshabilitado correctamente",
      estudiante: result.rows[0]
    });
  } catch (error) {
    console.error("Error al deshabilitar estudiante:", error.message);
    res.status(500).json({ error: "Error al deshabilitar estudiante" });
  }
});

// OPCIONAL: Endpoint para reactivar un estudiante
router.patch("/:id/activar", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      "UPDATE public.estudiante SET activo = TRUE WHERE id_estudiante = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }

    res.json({ 
      mensaje: "Estudiante reactivado correctamente",
      estudiante: result.rows[0]
    });
  } catch (error) {
    console.error("Error al reactivar estudiante:", error.message);
    res.status(500).json({ error: "Error al reactivar estudiante" });
  }
});

// GET - Buscar estudiantes por nombre o email (solo activos)
router.get("/buscar/:termino", async (req, res) => {
  try {
    const { termino } = req.params;
    const result = await pool.query(
      `SELECT * FROM public.estudiante 
       WHERE (nombre ILIKE $1 OR paterno ILIKE $1 OR email ILIKE $1) 
       AND activo = TRUE
       ORDER BY nombre, paterno`,
      [`%${termino}%`]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al buscar estudiantes:", error.message);
    res.status(500).json({ error: "Error al buscar estudiantes" });
  }
});

// GET - Estudiantes por universidad/institucion (solo activos)
router.get("/institucion/:institucion", async (req, res) => {
  try {
    const { institucion } = req.params;
    const result = await pool.query(
      `SELECT * FROM public.estudiante 
       WHERE univer_institu ILIKE $1 AND activo = TRUE 
       ORDER BY nombre, paterno`,
      [`%${institucion}%`]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener estudiantes por institución:", error.message);
    res.status(500).json({ error: "Error al obtener estudiantes por institución" });
  }
});

// GET - Inscripciones del estudiante (solo si el estudiante está activo)
router.get("/:id/inscripciones", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el estudiante existe y está activo
    const estudiante = await pool.query(
      "SELECT * FROM public.estudiante WHERE id_estudiante = $1 AND activo = TRUE",
      [id]
    );
    
    if (estudiante.rows.length === 0) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }
    
    const result = await pool.query(
      `SELECT i.*, t.nombre_tutoria, t.sigla 
       FROM public.inscripcion i
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       WHERE i.id_estudiante = $1
       ORDER BY i.fecha_inscripcion DESC`,
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener inscripciones del estudiante:", error.message);
    res.status(500).json({ error: "Error al obtener inscripciones del estudiante" });
  }
});
// GET - Obtener estudiante por ID de usuario
router.get("/por-usuario/:idUsuario", async (req, res) => {
  try {
    const { idUsuario } = req.params;
    
    console.log("🔍 Buscando estudiante por id_usuario:", idUsuario);
    
    const result = await pool.query(
      "SELECT * FROM public.estudiante WHERE id_usuario = $1 AND activo = TRUE",
      [idUsuario]
    );
    
    if (result.rows.length === 0) {
      console.log("❌ Estudiante no encontrado para id_usuario:", idUsuario);
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }
    
    console.log("✅ Estudiante encontrado:", result.rows[0].id_estudiante);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error obteniendo estudiante por id_usuario:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// routes/estudiantes.js o routes/notas.js

router.get('/:idEstudiante/tutoria/:idTutoria/notas', async (req, res) => {
  try {
    const { idEstudiante, idTutoria } = req.params;
    
    // Verificar que el estudiante está inscrito
    const inscripcion = await pool.query(
      `SELECT * FROM inscripcion 
       WHERE id_estudiante = $1 
         AND id_tutoria = $2 
         AND estado_solicitud = 'inscrito' 
         AND activo = TRUE`,
      [idEstudiante, idTutoria]
    );
    
    if (inscripcion.rows.length === 0) {
      return res.status(404).json({ error: 'Estudiante no inscrito en esta tutoría' });
    }
    
    // Obtener actividades calificadas
    const actividades = await pool.query(`
      SELECT 
        a.id_actividad,
        a.titulo,
        a.descripcion,
        a.fecha_entrega,
        ac.calificacion,
        ac.fecha_calificacion,
        ac.observaciones
      FROM actividad a
      LEFT JOIN actividad_calificacion ac ON a.id_actividad = ac.id_actividad 
        AND ac.id_estudiante = $1
      WHERE a.id_tutoria = $2 
        AND a.activo = TRUE
      ORDER BY a.fecha_entrega DESC
    `, [idEstudiante, idTutoria]);
    
    // Obtener evaluaciones calificadas
    const evaluaciones = await pool.query(`
      SELECT 
        e.id_evaluacion,
        e.titulo,
        e.descripcion,
        e.fecha_evaluacion,
        ec.calificacion,
        ec.fecha_calificacion,
        ec.observaciones
      FROM evaluacion e
      LEFT JOIN evaluacion_calificacion ec ON e.id_evaluacion = ec.id_evaluacion 
        AND ec.id_estudiante = $1
      WHERE e.id_tutoria = $2 
        AND e.activo = TRUE
      ORDER BY e.fecha_evaluacion DESC
    `, [idEstudiante, idTutoria]);
    
    // Calcular totales
    const totalActividades = actividades.rows.length;
    const totalEvaluaciones = evaluaciones.rows.length;
    
    res.json({
      actividades: actividades.rows,
      evaluaciones: evaluaciones.rows,
      total_actividades: totalActividades,
      total_evaluaciones: totalEvaluaciones,
      total_calificaciones: totalActividades + totalEvaluaciones
    });
    
  } catch (error) {
    console.error('Error obteniendo notas:', error);
    res.status(500).json({ error: 'Error al obtener notas del estudiante' });
  }
});

router.get('/:idEstudiante/resumen-notas', async (req, res) => {
  try {
    const { idEstudiante } = req.params;
    
    // Obtener todas las tutorías con sus calificaciones
    const tutorias = await pool.query(`
      SELECT 
        t.id_tutoria,
        t.nombre_tutoria,
        t.sigla,
        i.nombre as institucion_nombre,
        CONCAT(tu.nombre, ' ', tu.apellido_paterno) as tutor_nombre,
        ins.calificacion_acumulada,
        (
          SELECT COALESCE(SUM(ac.calificacion), 0)
          FROM actividad_calificacion ac
          JOIN actividad a ON ac.id_actividad = a.id_actividad
          WHERE ac.id_estudiante = $1 
            AND a.id_tutoria = t.id_tutoria
        ) as puntos_actividades,
        (
          SELECT COALESCE(SUM(ec.calificacion), 0)
          FROM evaluacion_calificacion ec
          JOIN evaluacion e ON ec.id_evaluacion = e.id_evaluacion
          WHERE ec.id_estudiante = $1 
            AND e.id_tutoria = t.id_tutoria
        ) as puntos_evaluaciones
      FROM tutoria t
      JOIN institucion i ON t.id_institucion = i.id_institucion
      JOIN tutor tu ON t.id_tutor = tu.id_tutor
      JOIN inscripcion ins ON t.id_tutoria = ins.id_tutoria
      WHERE ins.id_estudiante = $1 
        AND ins.estado_solicitud = 'inscrito'
        AND ins.activo = TRUE
        AND t.activo = TRUE
      ORDER BY t.nombre_tutoria
    `, [idEstudiante]);
    
    // Calcular estadísticas
    const estadisticas = {
      total_tutorias: tutorias.rows.length,
      aprobadas: tutorias.rows.filter(t => t.calificacion_acumulada >= 51).length,
      reprobadas: tutorias.rows.filter(t => t.calificacion_acumulada < 51).length,
      promedio_general: tutorias.rows.length > 0 
        ? tutorias.rows.reduce((sum, t) => sum + (t.calificacion_acumulada || 0), 0) / tutorias.rows.length 
        : 0
    };
    
    res.json({
      tutorias: tutorias.rows,
      estadisticas,
      fecha_consulta: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error obteniendo resumen de notas:', error);
    res.status(500).json({ error: 'Error al obtener resumen de notas' });
  }
});
export default router;