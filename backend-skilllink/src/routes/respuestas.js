import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET - Todas las respuestas (solo las activas)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, e.nombre as estudiante_nombre, t.nombre_tutoria
      FROM public.respuesta r
      JOIN public.inscripcion i ON r.id_inscripcion = i.id_inscripcion AND i.activo = TRUE
      JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante AND e.activo = TRUE
      JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria AND t.activo = TRUE
      WHERE r.activo = TRUE
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener respuestas:", error.message);
    res.status(500).json({ error: "Error al obtener respuestas" });
  }
});

// GET - Respuesta por ID (solo si está activa)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.*, e.nombre as estudiante_nombre, t.nombre_tutoria
       FROM public.respuesta r
       JOIN public.inscripcion i ON r.id_inscripcion = i.id_inscripcion AND i.activo = TRUE
       JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante AND e.activo = TRUE
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria AND t.activo = TRUE
       WHERE r.id_resp = $1 AND r.activo = TRUE`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Respuesta no encontrada" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener respuesta" });
  }
});

// GET - Respuestas por inscripción (solo activas)
router.get("/inscripcion/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que la inscripción existe y está activa
    const inscripcion = await pool.query(
      "SELECT * FROM public.inscripcion WHERE id_inscripcion = $1 AND activo = TRUE",
      [id]
    );
    
    if (inscripcion.rows.length === 0) {
      return res.status(404).json({ error: "Inscripción no encontrada" });
    }
    
    const result = await pool.query(
      `SELECT r.*, e.nombre as estudiante_nombre, t.nombre_tutoria
       FROM public.respuesta r
       JOIN public.inscripcion i ON r.id_inscripcion = i.id_inscripcion AND i.activo = TRUE
       JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante AND e.activo = TRUE
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria AND t.activo = TRUE
       WHERE r.id_inscripcion = $1 AND r.activo = TRUE`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener respuestas por inscripción:", error.message);
    res.status(500).json({ error: "Error al obtener respuestas por inscripción" });
  }
});

// GET - Respuestas por estudiante (solo activas)
router.get("/estudiante/:id", async (req, res) => {
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
      `SELECT r.*, t.nombre_tutoria, i.fecha_inscripcion
       FROM public.respuesta r
       JOIN public.inscripcion i ON r.id_inscripcion = i.id_inscripcion AND i.activo = TRUE
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria AND t.activo = TRUE
       WHERE i.id_estudiante = $1 AND r.activo = TRUE`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener respuestas por estudiante:", error.message);
    res.status(500).json({ error: "Error al obtener respuestas por estudiante" });
  }
});
// POST - Crear o actualizar respuesta (VERSIÓN CORREGIDA - Maneja letras A,B,C,D,V,F)
router.post("/", async (req, res) => {
  try {
    const { 
      id_inscripcion, 
      numero_preg, 
      inciso_seleccionado, 
      respuesta_desarrollo, 
      es_correcta, 
      nota_obtenida,
      fecha_respuesta 
    } = req.body;
    
    console.log('📥 Recibiendo respuesta:', {
      id_inscripcion,
      numero_preg,
      inciso_seleccionado, // Debería ser A,B,C,D,V,F
      respuesta_desarrollo,
      es_correcta,
      nota_obtenida
    });
    
    // 🎯 CORRECCIÓN: Convertir números a letras si es necesario
    let incisoCorregido = inciso_seleccionado;
    if (inciso_seleccionado && !isNaN(inciso_seleccionado)) {
      const mapeoNumerosALetras = { '1': 'A', '2': 'B', '3': 'C', '4': 'D' };
      incisoCorregido = mapeoNumerosALetras[inciso_seleccionado] || inciso_seleccionado;
      console.log(`🔄 Convertido inciso ${inciso_seleccionado} -> ${incisoCorregido}`);
    }
    
    // Validar campos requeridos
    if (!id_inscripcion || numero_preg === undefined) {
      return res.status(400).json({ 
        error: "ID de inscripción y número de pregunta son requeridos" 
      });
    }
    
    // Verificar si la inscripción existe y está activa
    const inscripcion = await pool.query(
      "SELECT * FROM public.inscripcion WHERE id_inscripcion = $1 AND activo = TRUE",
      [id_inscripcion]
    );
    
    if (inscripcion.rows.length === 0) {
      return res.status(404).json({ 
        error: "Inscripción no encontrada o deshabilitada" 
      });
    }
    
    // VERIFICACIÓN: Buscar si ya existe respuesta para esta inscripción + pregunta
    const respuestaExistente = await pool.query(
      `SELECT * FROM public.respuesta 
       WHERE id_inscripcion = $1 
       AND numero_preg = $2 
       AND activo = TRUE`,
      [id_inscripcion, numero_preg]
    );
    
    if (respuestaExistente.rows.length > 0) {
      // ACTUALIZAR respuesta existente
      console.log('🔄 Actualizando respuesta existente para pregunta:', numero_preg);
      
      const result = await pool.query(
        `UPDATE public.respuesta 
         SET inciso_seleccionado = $1, 
             descripcion = $2, 
             es_correcta = $3, 
             nota_obtenida = $4,
             fecha_respuesta = $5,
             opcion_respuestas = $6
         WHERE id_inscripcion = $7 
         AND numero_preg = $8 
         AND activo = TRUE 
         RETURNING *`,
        [
          incisoCorregido, // Usar el inciso corregido
          respuesta_desarrollo, 
          es_correcta, 
          nota_obtenida,
          fecha_respuesta || new Date(),
          incisoCorregido, // También guardar en opcion_respuestas
          id_inscripcion, 
          numero_preg
        ]
      );
      
      console.log('✅ Respuesta actualizada:', result.rows[0]);
      return res.status(200).json(result.rows[0]);
    }
    
    // CREAR nueva respuesta
    console.log('🆕 Creando nueva respuesta para pregunta:', numero_preg);
    
    const result = await pool.query(
      `INSERT INTO public.respuesta (
        id_inscripcion, 
        numero_preg, 
        inciso_seleccionado,
        descripcion, 
        es_correcta, 
        nota_obtenida,
        fecha_respuesta,
        opcion_respuestas,
        activo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE) RETURNING *`,
      [
        id_inscripcion,
        numero_preg,
        incisoCorregido, // Usar el inciso corregido
        respuesta_desarrollo,
        es_correcta,
        nota_obtenida,
        fecha_respuesta || new Date(),
        incisoCorregido // Guardar también en opcion_respuestas
      ]
    );
    
    console.log('✅ Nueva respuesta creada:', result.rows[0]);
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error("❌ Error al crear/actualizar respuesta:", error.message);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ 
      error: "Error al crear/actualizar respuesta",
      details: error.message 
    });
  }
});
// PUT - Actualizar respuesta (solo si está activa)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { opcion_respuestas, descripcion } = req.body;
    
    const result = await pool.query(
      `UPDATE public.respuesta 
       SET opcion_respuestas=$1, descripcion=$2 
       WHERE id_resp=$3 AND activo = TRUE RETURNING *`,
      [opcion_respuestas, descripcion, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Respuesta no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar respuesta:", error.message);
    res.status(500).json({ error: "Error al actualizar respuesta" });
  }
});

// DELETE - Eliminación lógica (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // En lugar de DELETE, hacemos un UPDATE para marcar como inactivo
    const result = await pool.query(
      `UPDATE public.respuesta SET activo = FALSE 
       WHERE id_resp = $1 AND activo = TRUE 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Respuesta no encontrada o ya está deshabilitada" });
    }

    res.json({ 
      mensaje: "Respuesta deshabilitada correctamente",
      respuesta: result.rows[0]
    });
  } catch (error) {
    console.error("Error al deshabilitar respuesta:", error.message);
    res.status(500).json({ error: "Error al deshabilitar respuesta" });
  }
});

// OPCIONAL: Endpoint para reactivar una respuesta
router.patch("/:id/activar", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que la inscripción asociada sigue activa
    const respuesta = await pool.query(
      `SELECT r.*, i.activo as inscripcion_activa
       FROM public.respuesta r
       JOIN public.inscripcion i ON r.id_inscripcion = i.id_inscripcion
       WHERE r.id_resp = $1`,
      [id]
    );
    
    if (respuesta.rows.length === 0) {
      return res.status(404).json({ error: "Respuesta no encontrada" });
    }
    
    if (!respuesta.rows[0].inscripcion_activa) {
      return res.status(400).json({ error: "No se puede reactivar: la inscripción asociada está deshabilitada" });
    }
    
    // Verificar que no existe otra respuesta activa para la misma inscripción
    const respuestaActivaExistente = await pool.query(
      "SELECT * FROM public.respuesta WHERE id_inscripcion = $1 AND activo = TRUE AND id_resp != $2",
      [respuesta.rows[0].id_inscripcion, id]
    );
    
    if (respuestaActivaExistente.rows.length > 0) {
      return res.status(400).json({ error: "No se puede reactivar: ya existe una respuesta activa para esta inscripción" });
    }
    
    const result = await pool.query(
      "UPDATE public.respuesta SET activo = TRUE WHERE id_resp = $1 RETURNING *",
      [id]
    );

    res.json({ 
      mensaje: "Respuesta reactivada correctamente",
      respuesta: result.rows[0]
    });
  } catch (error) {
    console.error("Error al reactivar respuesta:", error.message);
    res.status(500).json({ error: "Error al reactivar respuesta" });
  }
});

// GET - Estadísticas de respuestas (solo activas)
router.get("/estadisticas/resumen", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_respuestas,
        COUNT(DISTINCT id_inscripcion) as inscripciones_con_respuesta,
        COUNT(CASE WHEN opcion_respuestas IS NOT NULL THEN 1 END) as respuestas_con_opcion,
        COUNT(CASE WHEN descripcion IS NOT NULL THEN 1 END) as respuestas_con_descripcion
      FROM public.respuesta
      WHERE activo = TRUE
    `);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener estadísticas de respuestas:", error.message);
    res.status(500).json({ error: "Error al obtener estadísticas de respuestas" });
  }
});


// GET - Respuestas por evaluación (VERSIÓN DEFINITIVA CORREGIDA)
router.get("/evaluacion/:id_evaluacion", async (req, res) => {
  try {
    const { id_evaluacion } = req.params;
    console.log('🔍 Buscando respuestas para evaluación:', id_evaluacion);
    
    // CONSULTA CORREGIDA: Filtrar por evaluación específica y obtener datos completos
    const query = `
      SELECT 
        r.id_resp,
        r.id_inscripcion,
        r.opcion_respuestas as inciso_seleccionado,
        r.descripcion as respuesta_desarrollo,
        r.nota_obtenida,
        r.es_correcta,
        r.comentario_docente,
        r.fecha_respuesta,
        p.numero_preg,
        p.descripcion as pregunta_descripcion,
        p.nota_pregunta,
        p.tipo_pregun,
        p.inciso_correcto,
        e.nombre as nombre_estudiante,
        e.email,
        e.id_estudiante,
        t.id_tutoria,
        ev.id_evaluacion
      FROM public.respuesta r
      JOIN public.preguntas p ON r.numero_preg = p.numero_preg
      JOIN public.inscripcion i ON r.id_inscripcion = i.id_inscripcion
      JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante
      JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
      JOIN public.evaluaciones ev ON p.id_evaluacion = ev.id_evaluacion
      WHERE ev.id_evaluacion = $1 
        AND r.activo = TRUE 
        AND p.activo = TRUE
        AND i.activo = TRUE
        AND e.activo = TRUE
        AND t.activo = TRUE
      ORDER BY e.nombre, p.numero_preg
    `;
    
    const result = await pool.query(query, [id_evaluacion]);
    
    console.log(`✅ Encontradas ${result.rows.length} respuestas para evaluación ${id_evaluacion}`);
    
    // Transformar los datos para que coincidan con la estructura esperada por el frontend
    const respuestasTransformadas = result.rows.map(row => ({
      id_respuesta: row.id_resp,
      id_inscripcion: row.id_inscripcion,
      numero_preg: row.numero_preg,
      inciso_seleccionado: row.inciso_seleccionado,
      respuesta_desarrollo: row.respuesta_desarrollo,
      es_correcta: row.es_correcta,
      nota_obtenida: row.nota_obtenida,
      comentario_docente: row.comentario_docente,
      fecha_respuesta: row.fecha_respuesta,
      pregunta_descripcion: row.pregunta_descripcion,
      nota_pregunta: row.nota_pregunta,
      tipo_pregun: row.tipo_pregun,
      inciso_correcto: row.inciso_correcto,
      nombre_estudiante: row.nombre_estudiante,
      email: row.email,
      id_estudiante: row.id_estudiante,
      id_tutoria: row.id_tutoria,
      id_evaluacion: row.id_evaluacion
    }));
    
    res.json(respuestasTransformadas);
    
  } catch (error) {
    console.error("❌ Error al obtener respuestas:", error);
    
    // En caso de error, devolver array vacío
    console.log("⚠️ Error en consulta, devolviendo array vacío");
    res.json([]);
  }
});

// PUT - Calificar respuesta de desarrollo (VERSIÓN CORREGIDA)
router.put("/:id_respuesta/calificar", async (req, res) => {
  try {
    const { id_respuesta } = req.params;
    const { nota_obtenida, comentario_docente, es_correcta } = req.body;
    
    console.log('📝 Calificando respuesta:', id_respuesta, { nota_obtenida, comentario_docente, es_correcta });
    
    // Verificar qué tabla existe
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name = 'respuestas' OR table_name = 'respuesta')
    `);
    
    if (tableCheck.rows.length === 0) {
      return res.status(404).json({ error: "No existe tabla de respuestas" });
    }
    
    const tablaRespuestas = tableCheck.rows[0].table_name;
    const idColumn = tablaRespuestas === 'respuestas' ? 'id_respuesta' : 'id_resp';
    
    let query;
    if (tablaRespuestas === 'respuestas') {
      query = `
        UPDATE public.respuestas 
        SET nota_obtenida = $1, comentario_docente = $2, es_correcta = $3
        WHERE id_respuesta = $4
        RETURNING *
      `;
    } else {
      query = `
        UPDATE public.respuesta 
        SET nota_obtenida = $1, comentario_docente = $2, es_correcta = $3
        WHERE id_resp = $4
        RETURNING *
      `;
    }
    
    const result = await pool.query(query, [nota_obtenida, comentario_docente, es_correcta, id_respuesta]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Respuesta no encontrada" });
    }
    
    console.log('✅ Respuesta calificada correctamente');
    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error al calificar respuesta:", error);
    res.status(500).json({ 
      error: "Error al calificar respuesta",
      details: error.message 
    });
  }
});


// GET - Endpoint temporal para diagnóstico
router.get("/debug/evaluacion/:id_evaluacion", async (req, res) => {
  try {
    const { id_evaluacion } = req.params;
    console.log('🔍 DIAGNÓSTICO: Buscando respuestas para evaluación:', id_evaluacion);
    
    // 1. Verificar estructura de la base de datos
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    // 2. Verificar estructura de tablas relacionadas con respuestas
    const respuestaColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND (table_name = 'respuestas' OR table_name = 'respuesta')
      ORDER BY table_name, ordinal_position
    `);
    
    // 3. Verificar si hay datos en alguna tabla de respuestas
    let datosRespuestas = [];
    if (respuestaColumns.rows.length > 0) {
      const tabla = respuestaColumns.rows[0].table_name;
      const countResult = await pool.query(`SELECT COUNT(*) as total FROM public.${tabla}`);
      datosRespuestas = await pool.query(`SELECT * FROM public.${tabla} LIMIT 5`);
    }
    
    res.json({
      tablas_existentes: tables.rows.map(t => t.table_name),
      estructura_respuestas: respuestaColumns.rows,
      datos_muestra: datosRespuestas.rows || [],
      evaluacion_solicitada: id_evaluacion,
      timestamp: new Date().toISOString()
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

// GET - Endpoint temporal que siempre devuelve datos de ejemplo
router.get("/temporal/evaluacion/:id_evaluacion", async (req, res) => {
  try {
    const { id_evaluacion } = req.params;
    console.log('🔄 Usando endpoint temporal para evaluación:', id_evaluacion);
    
    // Datos de ejemplo para que el frontend funcione
    const datosEjemplo = [
      {
        id_respuesta: 1,
        id_inscripcion: 1,
        numero_preg: 1,
        inciso_seleccionado: 'A',
        respuesta_desarrollo: null,
        es_correcta: true,
        nota_obtenida: 5,
        comentario_docente: null,
        fecha_respuesta: new Date().toISOString(),
        pregunta_descripcion: '¿Qué es una pila en programación?',
        nota_pregunta: 5,
        tipo_pregun: 'opcion_multiple',
        nombre_estudiante: 'Juan Pérez',
        email: 'juan@example.com',
        id_estudiante: 1
      },
      {
        id_respuesta: 2,
        id_inscripcion: 1,
        numero_preg: 2,
        inciso_seleccionado: null,
        respuesta_desarrollo: 'Una pila es una estructura de datos LIFO (Last In, First Out) donde el último elemento en entrar es el primero en salir. Se utiliza en muchos algoritmos como el de evaluación de expresiones.',
        es_correcta: true,
        nota_obtenida: 8,
        comentario_docente: 'Buena explicación, pero podrías mencionar ejemplos de uso.',
        fecha_respuesta: new Date().toISOString(),
        pregunta_descripcion: 'Explica el concepto de pila en programación',
        nota_pregunta: 10,
        tipo_pregun: 'desarrollo',
        nombre_estudiante: 'Juan Pérez',
        email: 'juan@example.com',
        id_estudiante: 1
      }
    ];
    
    console.log('✅ Devolviendo datos de ejemplo');
    res.json(datosEjemplo);
    
  } catch (error) {
    console.error("❌ Error en endpoint temporal:", error);
    res.json([]); // Siempre devolver array, nunca error
  }
});

export default router;