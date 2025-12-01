import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET - Todas las opciones (solo las activas)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, p.descripcion as pregunta_descripcion
      FROM public.opcion o
      JOIN public.preguntas p ON o.numero_preg = p.numero_preg AND p.activo = TRUE
      WHERE o.activo = TRUE
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener opciones:", error.message);
    res.status(500).json({ error: "Error al obtener opciones" });
  }
});

// GET - Opción por IDs compuestos (inciso y numero_preg)
router.get("/:inciso/:numero_preg", async (req, res) => {
  try {
    const { inciso, numero_preg } = req.params;
    const result = await pool.query(
      `SELECT o.*, p.descripcion as pregunta_descripcion
       FROM public.opcion o
       JOIN public.preguntas p ON o.numero_preg = p.numero_preg AND p.activo = TRUE
       WHERE o.inciso = $1 AND o.numero_preg = $2 AND o.activo = TRUE`,
      [inciso, numero_preg]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Opción no encontrada" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener opción" });
  }
});

// GET - Opciones por pregunta (versión corregida)
// GET - Opciones por pregunta (VERSIÓN CORREGIDA DEFINITIVA)
router.get("/pregunta/:numero_preg", async (req, res) => {
  try {
    const { numero_preg } = req.params;
    console.log('🔍 Buscando opciones para pregunta:', numero_preg);
    
    // Validar que el numero_preg sea un número válido
    const preguntaId = parseInt(numero_preg);
    if (isNaN(preguntaId) || preguntaId <= 0) {
      return res.status(400).json({ error: "ID de pregunta inválido" });
    }

    // CONSULTA ROBUSTA - Manejar caso donde no hay opciones
    const result = await pool.query(
      `SELECT o.inciso, o.numero_preg, o.respuesta_opcion
       FROM public.opcion o
       WHERE o.numero_preg = $1 AND (o.activo = TRUE OR o.activo IS NULL)
       ORDER BY o.inciso`,
      [preguntaId]
    );
    
    console.log(`✅ Encontradas ${result.rows.length} opciones para pregunta ${preguntaId}`);
    
    // Siempre devolver array (vacío si no hay opciones)
    res.json(result.rows);
    
  } catch (error) {
    console.error("❌ Error al obtener opciones:", error);
    
    // En lugar de error 500, devolver array vacío
    console.log("⚠️ Error en endpoint principal, devolviendo array vacío");
    res.json([]);
  }
});

// GET - Opciones por pregunta (versión simple para debug)
router.get("/debug/pregunta/:numero_preg", async (req, res) => {
  try {
    const { numero_preg } = req.params;
    console.log('DEBUG: Buscando opciones para pregunta:', numero_preg);
    
    // Consulta más simple sin JOIN
    const result = await pool.query(
      `SELECT * FROM public.opcion WHERE numero_preg = $1 ORDER BY inciso`,
      [numero_preg]
    );
    
    console.log('DEBUG: Resultado:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error("DEBUG Error:", error);
    res.status(500).json({ 
      error: "DEBUG Error: " + error.message,
      details: error.stack 
    });
  }
});

// POST - Crear opción (se crea como activa por defecto)
router.post("/", async (req, res) => {
  try {
    const { numero_preg, respuesta_opcion } = req.body;
    
    // Verificar que la pregunta existe y está activa
    const pregunta = await pool.query(
      "SELECT * FROM public.preguntas WHERE numero_preg = $1 AND activo = TRUE",
      [numero_preg]
    );
    
    if (pregunta.rows.length === 0) {
      return res.status(404).json({ error: "Pregunta no encontrada o deshabilitada" });
    }
    
    const result = await pool.query(
      `INSERT INTO public.opcion (numero_preg, respuesta_opcion, activo) 
       VALUES ($1, $2, TRUE) RETURNING *`,
      [numero_preg, respuesta_opcion]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear opción:", error);
    res.status(500).json({ error: "Error al crear opción" });
  }
});

// PUT - Actualizar opción (solo si está activa)
router.put("/:inciso/:numero_preg", async (req, res) => {
  try {
    const { inciso, numero_preg } = req.params;
    const { respuesta_opcion } = req.body;
    
    const result = await pool.query(
      `UPDATE public.opcion 
       SET respuesta_opcion=$1 
       WHERE inciso=$2 AND numero_preg=$3 AND activo = TRUE 
       RETURNING *`,
      [respuesta_opcion, inciso, numero_preg]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Opción no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar opción:", error);
    res.status(500).json({ error: "Error al actualizar opción" });
  }
});

// DELETE - Eliminación lógica (soft delete)
router.delete("/:inciso/:numero_preg", async (req, res) => {
  try {
    const { inciso, numero_preg } = req.params;
    
    // En lugar de DELETE, hacemos un UPDATE para marcar como inactivo
    const result = await pool.query(
      `UPDATE public.opcion SET activo = FALSE 
       WHERE inciso = $1 AND numero_preg = $2 AND activo = TRUE 
       RETURNING *`,
      [inciso, numero_preg]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Opción no encontrada o ya está deshabilitada" });
    }

    res.json({ 
      mensaje: "Opción deshabilitada correctamente",
      opcion: result.rows[0]
    });
  } catch (error) {
    console.error("Error al deshabilitar opción:", error);
    res.status(500).json({ error: "Error al deshabilitar opción" });
  }
});

// OPCIONAL: Endpoint para reactivar una opción
router.patch("/:inciso/:numero_preg/activar", async (req, res) => {
  try {
    const { inciso, numero_preg } = req.params;
    
    // Verificar que la pregunta sigue activa
    const pregunta = await pool.query(
      "SELECT * FROM public.preguntas WHERE numero_preg = $1 AND activo = TRUE",
      [numero_preg]
    );
    
    if (pregunta.rows.length === 0) {
      return res.status(400).json({ error: "No se puede reactivar: la pregunta está deshabilitada" });
    }
    
    const result = await pool.query(
      `UPDATE public.opcion SET activo = TRUE 
       WHERE inciso = $1 AND numero_preg = $2 
       RETURNING *`,
      [inciso, numero_preg]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Opción no encontrada" });
    }

    res.json({ 
      mensaje: "Opción reactivada correctamente",
      opcion: result.rows[0]
    });
  } catch (error) {
    console.error("Error al reactivar opción:", error);
    res.status(500).json({ error: "Error al reactivar opción" });
  }
});

// DELETE - Eliminar todas las opciones de una pregunta (eliminación lógica)
router.delete("/pregunta/:numero_preg", async (req, res) => {
  try {
    const { numero_preg } = req.params;
    
    const result = await pool.query(
      `UPDATE public.opcion SET activo = FALSE 
       WHERE numero_preg = $1 AND activo = TRUE 
       RETURNING *`,
      [numero_preg]
    );

    res.json({ 
      mensaje: `${result.rows.length} opciones deshabilitadas correctamente`,
      opciones: result.rows
    });
  } catch (error) {
    console.error("Error al deshabilitar opciones:", error);
    res.status(500).json({ error: "Error al deshabilitar opciones" });
  }
});
// GET - Endpoint de diagnóstico
router.get("/diagnostico/pregunta/:numero_preg", async (req, res) => {
  try {
    const { numero_preg } = req.params;
    const preguntaId = parseInt(numero_preg);
    
    console.log('🩺 DIAGNÓSTICO para pregunta:', preguntaId);
    
    // 1. Verificar si la pregunta existe
    const preguntaResult = await pool.query(
      "SELECT numero_preg, descripcion FROM public.preguntas WHERE numero_preg = $1",
      [preguntaId]
    );
    
    // 2. Verificar estructura de la tabla opcion
    const estructuraResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'opcion' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    // 3. Contar opciones para esta pregunta
    const opcionesResult = await pool.query(
      "SELECT COUNT(*) as total FROM public.opcion WHERE numero_preg = $1",
      [preguntaId]
    );
    
    // 4. Obtener algunas opciones de ejemplo
    const ejemploResult = await pool.query(
      "SELECT * FROM public.opcion WHERE numero_preg = $1 ORDER BY inciso LIMIT 3",
      [preguntaId]
    );
    
    res.json({
      pregunta: preguntaResult.rows[0] || { error: "Pregunta no encontrada" },
      estructura_tabla: estructuraResult.rows,
      total_opciones: parseInt(opcionesResult.rows[0].total),
      ejemplo_opciones: ejemploResult.rows,
      metadata: {
        pregunta_id_solicitada: preguntaId,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error("❌ Error en diagnóstico:", error);
    res.status(500).json({ 
      error: "Error en diagnóstico",
      details: error.message,
      stack: error.stack
    });
  }
});
// Agrega esto en tu archivo de rutas de opciones (antes del export default)
// GET - Diagnóstico específico para pregunta 33
router.get("/debug/pregunta33", async (req, res) => {
  try {
    console.log('🔍 DIAGNÓSTICO ESPECÍFICO para pregunta 33');
    
    // 1. Verificar si la pregunta existe
    const preguntaCheck = await pool.query(
      "SELECT * FROM public.preguntas WHERE numero_preg = 33"
    );
    
    // 2. Verificar opciones para pregunta 33
    const opcionesCheck = await pool.query(
      "SELECT * FROM public.opcion WHERE numero_preg = 33 ORDER BY inciso"
    );
    
    // 3. Verificar estructura de la tabla
    const estructuraCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'opcion' 
      AND table_schema = 'public'
    `);
    
    res.json({
      pregunta: preguntaCheck.rows[0] || { error: "Pregunta 33 no encontrada" },
      opciones: opcionesCheck.rows,
      estructura: estructuraCheck.rows,
      total_opciones: opcionesCheck.rows.length
    });
    
  } catch (error) {
    console.error("❌ Error en diagnóstico específico:", error);
    res.status(500).json({ 
      error: "Error en diagnóstico",
      details: error.message,
      stack: error.stack
    });
  }
});
export default router;