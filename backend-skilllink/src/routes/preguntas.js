import { Router } from "express";
import pool from "../db.js";

const router = Router();

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

// GET - Preguntas existentes para reutilizar
router.get("/existentes/tutoria/:id_tutoria", async (req, res) => {
  try {
    const { id_tutoria } = req.params;
    
    const result = await pool.query(`
      SELECT p.*, 
             COUNT(o.inciso) as total_opciones,
             CASE 
               WHEN p.inciso_correcto IS NOT NULL THEN true 
               ELSE false 
             END as tiene_respuesta_correcta
      FROM public.preguntas p
      LEFT JOIN public.opcion o ON p.numero_preg = o.numero_preg AND o.activo = true
      WHERE p.id_tutoria = $1 AND p.activo = TRUE
      GROUP BY p.numero_preg
      ORDER BY p.numero_preg DESC
    `, [id_tutoria]);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener preguntas existentes:", error);
    res.status(500).json({ error: "Error al obtener preguntas existentes" });
  }
});

// POST - Crear pregunta (MEJORADO - Con manejo completo de opciones)
router.post("/", async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { 
      descripcion, 
      tipo_pregun, 
      id_tutoria, 
      id_evaluacion, 
      numero_orden, 
      nota_pregunta,
      inciso_correcto,
      opciones // Array de opciones para crear automáticamente
    } = req.body;
    
    console.log("📥 Datos recibidos para crear pregunta:", {
      descripcion, 
      tipo_pregun, 
      id_tutoria, 
      id_evaluacion, 
      numero_orden, 
      nota_pregunta,
      inciso_correcto,
      opciones: opciones ? `Array con ${opciones.length} elementos` : 'No hay opciones'
    });

    await client.query('BEGIN');

    // Validar que inciso_correcto existe en las opciones si se proporciona
    if (inciso_correcto && opciones && opciones.length > 0) {
      const opcionExiste = opciones.some(opcion => opcion.inciso === inciso_correcto);
      if (!opcionExiste) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: "El inciso correcto no existe en las opciones proporcionadas" 
        });
      }
    }

    // Si es pregunta de desarrollo, no debe tener opciones ni inciso_correcto
    if (tipo_pregun === 'desarrollo') {
      if (opciones && opciones.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: "Las preguntas de desarrollo no pueden tener opciones" 
        });
      }
      if (inciso_correcto) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: "Las preguntas de desarrollo no pueden tener respuesta correcta" 
        });
      }
    }

    // Si es de opción múltiple o V/F, debe tener opciones
    if ((tipo_pregun === 'multiple' || tipo_pregun === 'verdadero_falso') && (!opciones || opciones.length === 0)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: "Las preguntas de opción múltiple y verdadero/falso deben tener opciones" 
      });
    }

    // Crear la pregunta
    const preguntaResult = await client.query(
      `INSERT INTO public.preguntas 
       (descripcion, tipo_pregun, id_tutoria, id_evaluacion, numero_orden, nota_pregunta, inciso_correcto, activo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE) RETURNING *`,
      [
        descripcion, 
        tipo_pregun, 
        id_tutoria, 
        id_evaluacion, 
        numero_orden || 1, 
        nota_pregunta || 1.0, 
        inciso_correcto
      ]
    );
    
    const nuevaPregunta = preguntaResult.rows[0];
    console.log("✅ Pregunta creada:", nuevaPregunta);

    // Crear opciones si es necesario
    if ((tipo_pregun === 'multiple' || tipo_pregun === 'verdadero_falso') && opciones && opciones.length > 0) {
      console.log("🔄 Creando opciones:", opciones);
      
      for (const opcion of opciones) {
        await client.query(
          `INSERT INTO public.opcion (numero_preg, inciso, respuesta_opcion, activo) 
           VALUES ($1, $2, $3, TRUE)`,
          [nuevaPregunta.numero_preg, opcion.inciso, opcion.respuesta_opcion]
        );
      }
      console.log(`✅ ${opciones.length} opciones creadas exitosamente`);
    }

    await client.query('COMMIT');

    // Obtener la pregunta completa con opciones
    const preguntaCompleta = await client.query(
      `SELECT p.*, 
              json_agg(
                json_build_object(
                  'inciso', o.inciso,
                  'respuesta_opcion', o.respuesta_opcion
                ) ORDER BY o.inciso
              ) as opciones
       FROM public.preguntas p
       LEFT JOIN public.opcion o ON p.numero_preg = o.numero_preg AND o.activo = true
       WHERE p.numero_preg = $1
       GROUP BY p.numero_preg`,
      [nuevaPregunta.numero_preg]
    );

    res.status(201).json(preguntaCompleta.rows[0]);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error al crear pregunta:", error);
    res.status(500).json({ 
      error: "Error al crear pregunta",
      details: error.message 
    });
  } finally {
    client.release();
  }
});

// PUT - Actualizar pregunta (VERSIÓN CORREGIDA - Sin error de llave duplicada)
router.put("/:id", async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { 
      descripcion, 
      tipo_pregun, 
      id_tutoria, 
      numero_orden, 
      nota_pregunta, 
      inciso_correcto,
      opciones // Array de opciones actualizadas
    } = req.body;
    
    console.log("📥 Actualizando pregunta:", { 
      id, 
      descripcion, 
      tipo_pregun, 
      inciso_correcto,
      opciones: opciones ? `Array con ${opciones.length} elementos` : 'No hay opciones'
    });

    await client.query('BEGIN');

    // Verificar que la pregunta existe
    const preguntaExistente = await client.query(
      "SELECT * FROM public.preguntas WHERE numero_preg = $1 AND activo = TRUE",
      [id]
    );

    if (preguntaExistente.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Pregunta no encontrada" });
    }

    const preguntaActual = preguntaExistente.rows[0];

    // Validaciones según el tipo de pregunta
    if (tipo_pregun === 'desarrollo') {
      if (opciones && opciones.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: "Las preguntas de desarrollo no pueden tener opciones" 
        });
      }
      if (inciso_correcto) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: "Las preguntas de desarrollo no pueden tener respuesta correcta" 
        });
      }
    }

    if ((tipo_pregun === 'multiple' || tipo_pregun === 'verdadero_falso') && (!opciones || opciones.length === 0)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: "Las preguntas de opción múltiple y verdadero/falso deben tener opciones" 
      });
    }

    // Validar que inciso_correcto existe en las opciones si se proporciona
    if (inciso_correcto && opciones && opciones.length > 0) {
      const opcionExiste = opciones.some(opcion => opcion.inciso === inciso_correcto);
      if (!opcionExiste) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: "El inciso correcto no existe en las opciones proporcionadas" 
        });
      }
    }

    // Actualizar la pregunta
    const preguntaResult = await client.query(
      `UPDATE public.preguntas 
       SET descripcion=$1, tipo_pregun=$2, id_tutoria=$3, numero_orden=$4, nota_pregunta=$5, inciso_correcto=$6
       WHERE numero_preg=$7 AND activo = TRUE RETURNING *`,
      [descripcion, tipo_pregun, id_tutoria, numero_orden || 1, nota_pregunta || 1.0, inciso_correcto, id]
    );

    const preguntaActualizada = preguntaResult.rows[0];
    console.log("✅ Pregunta actualizada:", preguntaActualizada);

    // 🚨 CORRECCIÓN CRÍTICA: Manejar opciones correctamente
    if (tipo_pregun === 'multiple' || tipo_pregun === 'verdadero_falso') {
      console.log("🔄 Procesando opciones para pregunta de opciones...");
      
      // 1. ELIMINAR FÍSICAMENTE las opciones existentes (no solo desactivar)
      console.log("🗑️ Eliminando opciones existentes para pregunta:", id);
      await client.query(
        "DELETE FROM public.opcion WHERE numero_preg = $1",
        [id]
      );

      // 2. Crear nuevas opciones
      if (opciones && opciones.length > 0) {
        console.log("🆕 Insertando nuevas opciones:", opciones);
        
        for (const opcion of opciones) {
          // Validar que el inciso sea único para esta inserción
          const insertOpcionQuery = `
            INSERT INTO public.opcion (numero_preg, inciso, respuesta_opcion, activo) 
            VALUES ($1, $2, $3, TRUE)
            RETURNING *;
          `;
          
          const result = await client.query(insertOpcionQuery, [
            id, 
            opcion.inciso, 
            opcion.respuesta_opcion || ''
          ]);
          console.log(`✅ Opción insertada: inciso ${opcion.inciso}`);
        }
        console.log(`✅ ${opciones.length} opciones creadas exitosamente`);
      }
    } else if (tipo_pregun === 'desarrollo') {
      // Para preguntas de desarrollo, ELIMINAR cualquier opción existente
      console.log("🧹 Limpiando opciones para pregunta de desarrollo");
      await client.query(
        "DELETE FROM public.opcion WHERE numero_preg = $1",
        [id]
      );
    }

    await client.query('COMMIT');
    console.log("✅ Transacción completada exitosamente");

    // Obtener la pregunta completa actualizada
    const preguntaCompleta = await client.query(
      `SELECT p.*, 
              json_agg(
                json_build_object(
                  'inciso', o.inciso,
                  'respuesta_opcion', o.respuesta_opcion
                ) ORDER BY o.inciso
              ) as opciones
       FROM public.preguntas p
       LEFT JOIN public.opcion o ON p.numero_preg = o.numero_preg AND o.activo = true
       WHERE p.numero_preg = $1
       GROUP BY p.numero_preg`,
      [id]
    );

    res.json({
      success: true,
      message: 'Pregunta actualizada correctamente',
      pregunta: preguntaCompleta.rows[0]
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error al actualizar pregunta:", error);
    
    // Manejo específico del error de llave duplicada
    if (error.code === '23505') {
      res.status(400).json({ 
        success: false,
        error: "Error de duplicación: Ya existe una opción con el mismo inciso para esta pregunta.",
        details: error.detail
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: "Error al actualizar pregunta",
        details: error.message 
      });
    }
  } finally {
    client.release();
  }
});

// GET - Pregunta completa por ID (con opciones)
router.get("/:id/completo", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT p.*, 
             json_agg(
               json_build_object(
                 'inciso', o.inciso,
                 'respuesta_opcion', o.respuesta_opcion
               ) ORDER BY o.inciso
             ) as opciones
      FROM public.preguntas p
      LEFT JOIN public.opcion o ON p.numero_preg = o.numero_preg AND o.activo = true
      WHERE p.numero_preg = $1 AND p.activo = true
      GROUP BY p.numero_preg
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pregunta no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener pregunta completa:", error);
    res.status(500).json({ error: "Error al obtener pregunta" });
  }
});

// POST - Reutilizar pregunta existente
router.post("/reutilizar", async (req, res) => {
  try {
    const { 
      numero_preg_original, 
      id_evaluacion_destino,
      numero_orden,
      nota_pregunta 
    } = req.body;
    
    // Obtener la pregunta original
    const preguntaOriginal = await pool.query(
      `SELECT * FROM public.preguntas WHERE numero_preg = $1 AND activo = TRUE`,
      [numero_preg_original]
    );
    
    if (preguntaOriginal.rows.length === 0) {
      return res.status(404).json({ error: "Pregunta original no encontrada" });
    }
    
    const original = preguntaOriginal.rows[0];
    
    // Crear nueva pregunta basada en la original
    const nuevaPregunta = await pool.query(
      `INSERT INTO public.preguntas 
       (descripcion, tipo_pregun, id_tutoria, id_evaluacion, numero_orden, nota_pregunta, inciso_correcto, activo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE) RETURNING *`,
      [
        original.descripcion,
        original.tipo_pregun,
        original.id_tutoria,
        id_evaluacion_destino,
        numero_orden || 1,
        nota_pregunta || original.nota_pregunta || 1.0,
        original.inciso_correcto
      ]
    );
    
    // Si la pregunta tiene opciones, copiarlas también
    if (original.tipo_pregun === 'multiple' || original.tipo_pregun === 'verdadero_falso') {
      const opcionesOriginales = await pool.query(
        `SELECT * FROM public.opcion WHERE numero_preg = $1 AND activo = TRUE`,
        [numero_preg_original]
      );
      
      for (const opcion of opcionesOriginales.rows) {
        await pool.query(
          `INSERT INTO public.opcion (numero_preg, inciso, respuesta_opcion, activo) 
           VALUES ($1, $2, $3, TRUE)`,
          [nuevaPregunta.rows[0].numero_preg, opcion.inciso, opcion.respuesta_opcion]
        );
      }
    }
    
    res.status(201).json(nuevaPregunta.rows[0]);
    
  } catch (error) {
    console.error("Error al reutilizar pregunta:", error);
    res.status(500).json({ error: "Error al reutilizar pregunta" });
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

// PUT - Marcar respuesta correcta (endpoint específico)
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

    const pregunta = preguntaExists.rows[0];

    // Solo permitir marcar respuesta correcta para preguntas de opción múltiple o V/F
    if (pregunta.tipo_pregun !== 'multiple' && pregunta.tipo_pregun !== 'verdadero_falso') {
      return res.status(400).json({ 
        error: 'Solo se puede marcar respuesta correcta para preguntas de opción múltiple o verdadero/falso' 
      });
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

export default router;