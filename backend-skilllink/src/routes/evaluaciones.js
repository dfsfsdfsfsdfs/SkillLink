// routes/evaluaciones.js
import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET - Todas las evaluaciones de una tutoría
router.get("/tutoria/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT e.*, 
              COUNT(p.numero_preg) as total_preguntas,
              t.nombre_tutoria
       FROM public.evaluaciones e
       LEFT JOIN public.preguntas p ON e.id_evaluacion = p.id_evaluacion AND p.activo = TRUE
       JOIN public.tutoria t ON e.id_tutoria = t.id_tutoria
       WHERE e.id_tutoria = $1 AND e.activo = TRUE
       GROUP BY e.id_evaluacion, t.nombre_tutoria
       ORDER BY e.fecha_creacion DESC`,
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener evaluaciones:", error.message);
    res.status(500).json({ error: "Error al obtener evaluaciones" });
  }
});

// GET - Evaluación por ID con sus preguntas
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const evaluacion = await pool.query(
      `SELECT e.*, t.nombre_tutoria
       FROM public.evaluaciones e
       JOIN public.tutoria t ON e.id_tutoria = t.id_tutoria
       WHERE e.id_evaluacion = $1 AND e.activo = TRUE`,
      [id]
    );
    
    if (evaluacion.rows.length === 0) {
      return res.status(404).json({ error: "Evaluación no encontrada" });
    }
    
    const preguntas = await pool.query(
      `SELECT p.* 
       FROM public.preguntas p
       WHERE p.id_evaluacion = $1 AND p.activo = TRUE
       ORDER BY p.numero_orden ASC`,
      [id]
    );
    
    res.json({
      ...evaluacion.rows[0],
      preguntas: preguntas.rows
    });
  } catch (error) {
    console.error("Error al obtener evaluación:", error.message);
    res.status(500).json({ error: "Error al obtener evaluación" });
  }
});

// POST - Crear evaluación
router.post("/", async (req, res) => {
  try {
    const { nombre_evaluacion, descripcion, id_tutoria, fecha_limite } = req.body;
    
    if (!nombre_evaluacion || !id_tutoria) {
      return res.status(400).json({ error: "Nombre e ID de tutoría son requeridos" });
    }
    
    // Verificar que la tutoría existe
    const tutoria = await pool.query(
      "SELECT * FROM public.tutoria WHERE id_tutoria = $1 AND activo = TRUE",
      [id_tutoria]
    );
    
    if (tutoria.rows.length === 0) {
      return res.status(404).json({ error: "Tutoría no encontrada" });
    }
    
    const result = await pool.query(
      `INSERT INTO public.evaluaciones 
       (nombre_evaluacion, descripcion, id_tutoria, fecha_limite, activo) 
       VALUES ($1, $2, $3, $4, TRUE) RETURNING *`,
      [nombre_evaluacion, descripcion, id_tutoria, fecha_limite]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear evaluación:", error.message);
    res.status(500).json({ error: "Error al crear evaluación" });
  }
});

// PUT - Actualizar evaluación
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_evaluacion, descripcion, fecha_limite } = req.body;
    
    const result = await pool.query(
      `UPDATE public.evaluaciones 
       SET nombre_evaluacion = $1, descripcion = $2, fecha_limite = $3
       WHERE id_evaluacion = $4 AND activo = TRUE RETURNING *`,
      [nombre_evaluacion, descripcion, fecha_limite, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Evaluación no encontrada" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar evaluación:", error.message);
    res.status(500).json({ error: "Error al actualizar evaluación" });
  }
});

// DELETE - Eliminar evaluación (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE public.evaluaciones SET activo = FALSE 
       WHERE id_evaluacion = $1 AND activo = TRUE RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Evaluación no encontrada" });
    }
    
    res.json({ 
      mensaje: "Evaluación eliminada correctamente",
      evaluacion: result.rows[0]
    });
  } catch (error) {
    console.error("Error al eliminar evaluación:", error.message);
    res.status(500).json({ error: "Error al eliminar evaluación" });
  }
});

export default router;