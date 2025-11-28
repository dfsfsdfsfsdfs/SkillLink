import { Router } from "express";
import pool from "../db.js";

const router = Router();

// POST - Crear pregunta (actualizado para evaluaciones)
router.post("/", async (req, res) => {
  try {
    const { descripcion, tipo_pregun, id_tutoria, id_evaluacion, numero_orden, nota_pregunta } = req.body;
    
    // Si tiene evaluación asociada, verificar que existe
    if (id_evaluacion) {
      const evaluacion = await pool.query(
        "SELECT * FROM public.evaluaciones WHERE id_evaluacion = $1 AND activo = TRUE",
        [id_evaluacion]
      );
      
      if (evaluacion.rows.length === 0) {
        return res.status(404).json({ error: "Evaluación no encontrada" });
      }
    }
    
    const result = await pool.query(
      `INSERT INTO public.preguntas 
       (descripcion, tipo_pregun, id_tutoria, id_evaluacion, numero_orden, nota_pregunta, activo) 
       VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING *`,
      [descripcion, tipo_pregun, id_tutoria, id_evaluacion, numero_orden || 1, nota_pregunta || 1.0]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear pregunta:", error);
    res.status(500).json({ error: "Error al crear pregunta" });
  }
});

// GET - Preguntas por evaluación
router.get("/evaluacion/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT p.*, e.nombre_evaluacion
       FROM public.preguntas p
       JOIN public.evaluaciones e ON p.id_evaluacion = e.id_evaluacion
       WHERE p.id_evaluacion = $1 AND p.activo = TRUE
       ORDER BY p.numero_orden ASC`,
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener preguntas por evaluación:", error);
    res.status(500).json({ error: "Error al obtener preguntas" });
  }
});

// GET - Preguntas por evaluación COMPLETAS (con opciones)
router.get("/evaluacion/:id/completo", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        p.numero_preg,
        p.descripcion,
        p.tipo_pregun,
        p.numero_orden,
        p.nota_pregunta,
        p.inciso_correcto,
        json_agg(
          json_build_object(
            'inciso', o.inciso,
            'respuesta_opcion', o.respuesta_opcion
          ) ORDER BY o.inciso
        ) as opciones
      FROM public.preguntas p
      LEFT JOIN public.opcion o ON p.numero_preg = o.numero_preg AND o.activo = true
      WHERE p.id_evaluacion = $1 AND p.activo = true
      GROUP BY p.numero_preg
      ORDER BY p.numero_orden, p.numero_preg
    `, [id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al cargar preguntas completas:", error);
    res.status(500).json({ error: "Error al cargar preguntas completas" });
  }
});

// GET - Todas las preguntas (solo las activas)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, t.nombre_tutoria
      FROM public.preguntas p
      LEFT JOIN public.tutoria t ON p.id_tutoria = t.id_tutoria AND t.activo = TRUE
      WHERE p.activo = TRUE
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener preguntas:", error.message);
    res.status(500).json({ error: "Error al obtener preguntas" });
  }
});

// GET - Pregunta por ID (solo si está activa)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.*, t.nombre_tutoria
       FROM public.preguntas p
       LEFT JOIN public.tutoria t ON p.id_tutoria = t.id_tutoria AND t.activo = TRUE
       WHERE p.numero_preg = $1 AND p.activo = TRUE`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pregunta no encontrada" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener pregunta:", error);
    res.status(500).json({ error: "Error al obtener pregunta" });
  }
});

// GET - Preguntas por tutoria (solo activas)
router.get("/tutoria/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que la tutoría existe y está activa
    const tutoria = await pool.query(
      "SELECT * FROM public.tutoria WHERE id_tutoria = $1 AND activo = TRUE",
      [id]
    );
    
    if (tutoria.rows.length === 0) {
      return res.status(404).json({ error: "Tutoría no encontrada" });
    }
    
    const result = await pool.query(
      "SELECT * FROM public.preguntas WHERE id_tutoria = $1 AND activo = TRUE",
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener preguntas por tutoría:", error);
    res.status(500).json({ error: "Error al obtener preguntas" });
  }
});

// PUT - Actualizar pregunta (solo si está activa)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, tipo_pregun, id_tutoria, numero_orden, nota_pregunta } = req.body;
    
    // Si se cambia la tutoría, verificar que la nueva existe y está activa
    if (id_tutoria) {
      const tutoria = await pool.query(
        "SELECT * FROM public.tutoria WHERE id_tutoria = $1 AND activo = TRUE",
        [id_tutoria]
      );
      
      if (tutoria.rows.length === 0) {
        return res.status(404).json({ error: "Tutoría no encontrada o deshabilitada" });
      }
    }
    
    const result = await pool.query(
      `UPDATE public.preguntas 
       SET descripcion=$1, tipo_pregun=$2, id_tutoria=$3, numero_orden=$4, nota_pregunta=$5
       WHERE numero_preg=$6 AND activo = TRUE RETURNING *`,
      [descripcion, tipo_pregun, id_tutoria, numero_orden || 1, nota_pregunta || 1.0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pregunta no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar pregunta:", error);
    res.status(500).json({ error: "Error al actualizar pregunta" });
  }
});

// PUT - Marcar respuesta correcta
router.put("/:id/correcta", async (req, res) => {
  try {
    const { id } = req.params;
    const { inciso_correcto } = req.body;

    console.log(`Marcando respuesta correcta para pregunta ${id}: inciso ${inciso_correcto}`);

    // Verificar que la pregunta existe
    const preguntaExists = await pool.query(
      'SELECT * FROM public.preguntas WHERE numero_preg = $1 AND activo = true',
      [id]
    );

    if (preguntaExists.rows.length === 0) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }

    // Si se envía null, limpiar la respuesta correcta
    if (inciso_correcto === null) {
      const result = await pool.query(
        'UPDATE public.preguntas SET inciso_correcto = NULL WHERE numero_preg = $1 RETURNING *',
        [id]
      );
      return res.json({ 
        message: 'Respuesta correcta eliminada',
        pregunta: result.rows[0] 
      });
    }

    // Verificar que la opción existe para esta pregunta
    const opcionExists = await pool.query(
      'SELECT 1 FROM public.opcion WHERE numero_preg = $1 AND inciso = $2 AND activo = true',
      [id, inciso_correcto]
    );

    if (opcionExists.rows.length === 0) {
      return res.status(400).json({ 
        error: 'La opción seleccionada no existe para esta pregunta' 
      });
    }

    // Actualizar la respuesta correcta
    const result = await pool.query(
      'UPDATE public.preguntas SET inciso_correcto = $1 WHERE numero_preg = $2 RETURNING *',
      [inciso_correcto, id]
    );

    res.json({
      message: 'Respuesta correcta actualizada exitosamente',
      pregunta: result.rows[0]
    });

  } catch (error) {
    console.error('Error al marcar respuesta correcta:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Eliminación lógica (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si hay opciones activas asociadas a esta pregunta
    const opciones = await pool.query(
      "SELECT * FROM public.opcion WHERE numero_preg = $1 AND activo = TRUE",
      [id]
    );
    
    if (opciones.rows.length > 0) {
      return res.status(400).json({ 
        error: "No se puede deshabilitar la pregunta porque tiene opciones activas asociadas" 
      });
    }
    
    // En lugar de DELETE, hacemos un UPDATE para marcar como inactivo
    const result = await pool.query(
      `UPDATE public.preguntas SET activo = FALSE 
       WHERE numero_preg = $1 AND activo = TRUE 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pregunta no encontrada o ya está deshabilitada" });
    }

    res.json({ 
      mensaje: "Pregunta deshabilitada correctamente",
      pregunta: result.rows[0]
    });
  } catch (error) {
    console.error("Error al deshabilitar pregunta:", error);
    res.status(500).json({ error: "Error al deshabilitar pregunta" });
  }
});

// OPCIONAL: Endpoint para reactivar una pregunta
router.patch("/:id/activar", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que la tutoría asociada (si existe) sigue activa
    const pregunta = await pool.query(
      `SELECT p.*, t.activo as tutoria_activa
       FROM public.preguntas p
       LEFT JOIN public.tutoria t ON p.id_tutoria = t.id_tutoria
       WHERE p.numero_preg = $1`,
      [id]
    );
    
    if (pregunta.rows.length === 0) {
      return res.status(404).json({ error: "Pregunta no encontrada" });
    }
    
    // Si la pregunta tiene tutoría asociada, verificar que esté activa
    if (pregunta.rows[0].id_tutoria && !pregunta.rows[0].tutoria_activa) {
      return res.status(400).json({ error: "No se puede reactivar: la tutoría asociada está deshabilitada" });
    }
    
    const result = await pool.query(
      "UPDATE public.preguntas SET activo = TRUE WHERE numero_preg = $1 RETURNING *",
      [id]
    );

    res.json({ 
      mensaje: "Pregunta reactivada correctamente",
      pregunta: result.rows[0]
    });
  } catch (error) {
    console.error("Error al reactivar pregunta:", error);
    res.status(500).json({ error: "Error al reactivar pregunta" });
  }
});

// DELETE - Eliminar todas las preguntas de una tutoría (eliminación lógica)
router.delete("/tutoria/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE public.preguntas SET activo = FALSE 
       WHERE id_tutoria = $1 AND activo = TRUE 
       RETURNING *`,
      [id]
    );

    res.json({ 
      mensaje: `${result.rows.length} preguntas deshabilitadas correctamente`,
      preguntas: result.rows
    });
  } catch (error) {
    console.error("Error al deshabilitar preguntas de tutoría:", error);
    res.status(500).json({ error: "Error al deshabilitar preguntas" });
  }
});

// GET - Preguntas sin tutoría (solo activas)
router.get("/sin-tutoria/activas", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM public.preguntas WHERE id_tutoria IS NULL AND activo = TRUE"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener preguntas sin tutoría:", error);
    res.status(500).json({ error: "Error al obtener preguntas sin tutoría" });
  }
});

export default router;