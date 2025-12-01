import { Router } from "express";
import pool from "../db.js";

const router = Router();

// GET - Todas las evaluaciones activas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT e.*, t.nombre_tutoria,
             COUNT(p.numero_preg) as total_preguntas
      FROM public.evaluaciones e
      LEFT JOIN public.tutoria t ON e.id_tutoria = t.id_tutoria AND t.activo = TRUE
      LEFT JOIN public.preguntas p ON e.id_evaluacion = p.id_evaluacion AND p.activo = TRUE
      WHERE e.activo = TRUE
      GROUP BY e.id_evaluacion, t.nombre_tutoria
      ORDER BY e.fecha_creacion DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener evaluaciones:", error);
    res.status(500).json({ error: "Error al obtener evaluaciones" });
  }
});

// GET - Evaluación por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT e.*, t.nombre_tutoria,
             COUNT(p.numero_preg) as total_preguntas,
             COALESCE(SUM(p.nota_pregunta), 0) as puntaje_total
      FROM public.evaluaciones e
      LEFT JOIN public.tutoria t ON e.id_tutoria = t.id_tutoria AND t.activo = TRUE
      LEFT JOIN public.preguntas p ON e.id_evaluacion = p.id_evaluacion AND p.activo = TRUE
      WHERE e.id_evaluacion = $1 AND e.activo = TRUE
      GROUP BY e.id_evaluacion, t.nombre_tutoria
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Evaluación no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener evaluación:", error);
    res.status(500).json({ error: "Error al obtener evaluación" });
  }
});

// GET - Evaluaciones por tutoría
router.get("/tutoria/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que la tutoría existe
    const tutoria = await pool.query(
      "SELECT * FROM public.tutoria WHERE id_tutoria = $1 AND activo = TRUE",
      [id]
    );
    
    if (tutoria.rows.length === 0) {
      return res.status(404).json({ error: "Tutoría no encontrada" });
    }

    const result = await pool.query(`
      SELECT e.*, 
             COUNT(p.numero_preg) as total_preguntas,
             COALESCE(SUM(p.nota_pregunta), 0) as puntaje_total
      FROM public.evaluaciones e
      LEFT JOIN public.preguntas p ON e.id_evaluacion = p.id_evaluacion AND p.activo = TRUE
      WHERE e.id_tutoria = $1 AND e.activo = TRUE
      GROUP BY e.id_evaluacion
      ORDER BY e.fecha_creacion DESC
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener evaluaciones por tutoría:", error);
    res.status(500).json({ error: "Error al obtener evaluaciones" });
  }
});

// POST - Crear evaluación
router.post("/", async (req, res) => {
  try {
    const { nombre_evaluacion, descripcion, fecha_limite, id_tutoria } = req.body;
    
    // Verificar que la tutoría existe
    if (id_tutoria) {
      const tutoria = await pool.query(
        "SELECT * FROM public.tutoria WHERE id_tutoria = $1 AND activo = TRUE",
        [id_tutoria]
      );
      
      if (tutoria.rows.length === 0) {
        return res.status(404).json({ error: "Tutoría no encontrada" });
      }
    }
    
    const result = await pool.query(
      `INSERT INTO public.evaluaciones 
       (nombre_evaluacion, descripcion, fecha_limite, id_tutoria, activo) 
       VALUES ($1, $2, $3, $4, TRUE) RETURNING *`,
      [nombre_evaluacion, descripcion, fecha_limite, id_tutoria]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear evaluación:", error);
    res.status(500).json({ error: "Error al crear evaluación" });
  }
});

// PUT - Actualizar evaluación
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_evaluacion, descripcion, fecha_limite, id_tutoria } = req.body;
    
    // Si se cambia la tutoría, verificar que existe
    if (id_tutoria) {
      const tutoria = await pool.query(
        "SELECT * FROM public.tutoria WHERE id_tutoria = $1 AND activo = TRUE",
        [id_tutoria]
      );
      
      if (tutoria.rows.length === 0) {
        return res.status(404).json({ error: "Tutoría no encontrada" });
      }
    }
    
    const result = await pool.query(
      `UPDATE public.evaluaciones 
       SET nombre_evaluacion=$1, descripcion=$2, fecha_limite=$3, id_tutoria=$4
       WHERE id_evaluacion=$5 AND activo = TRUE RETURNING *`,
      [nombre_evaluacion, descripcion, fecha_limite, id_tutoria, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Evaluación no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar evaluación:", error);
    res.status(500).json({ error: "Error al actualizar evaluación" });
  }
});

// DELETE - Eliminación lógica de evaluación
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si hay preguntas activas asociadas
    const preguntas = await pool.query(
      "SELECT * FROM public.preguntas WHERE id_evaluacion = $1 AND activo = TRUE",
      [id]
    );
    
    if (preguntas.rows.length > 0) {
      return res.status(400).json({ 
        error: "No se puede eliminar la evaluación porque tiene preguntas activas asociadas" 
      });
    }
    
    const result = await pool.query(
      `UPDATE public.evaluaciones SET activo = FALSE 
       WHERE id_evaluacion = $1 AND activo = TRUE 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Evaluación no encontrada o ya está deshabilitada" });
    }

    res.json({ 
      mensaje: "Evaluación deshabilitada correctamente",
      evaluacion: result.rows[0]
    });
  } catch (error) {
    console.error("Error al deshabilitar evaluación:", error);
    res.status(500).json({ error: "Error al deshabilitar evaluación" });
  }
});

// POST - Responder evaluación y calcular calificación
// Backend completamente adaptado para números
router.post("/:id/responder", async (req, res) => {
  try {
    const { id_inscripcion, respuestas } = req.body;
    const evaluacionId = req.params.id;

    // Verificaciones
    const evaluacion = await pool.query(
      'SELECT * FROM public.evaluaciones WHERE id_evaluacion = $1 AND activo = TRUE',
      [evaluacionId]
    );

    if (evaluacion.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluación no encontrada' });
    }

    const inscripcion = await pool.query(
      'SELECT * FROM public.inscripcion WHERE id_inscripcion = $1',
      [id_inscripcion]
    );

    if (inscripcion.rows.length === 0) {
      return res.status(404).json({ error: 'Inscripción no encontrada' });
    }

    let calificacionFinal = 0;
    const resultados = [];

    // Procesar cada respuesta - COMPLETAMENTE ADAPTADO PARA NÚMEROS
    for (const respuesta of respuestas) {
      // Obtener la pregunta
      const pregunta = await pool.query(`
        SELECT p.* 
        FROM public.preguntas p
        WHERE p.numero_preg = $1 AND p.id_evaluacion = $2 AND p.activo = true
      `, [respuesta.numero_preg, evaluacionId]);

      if (pregunta.rows.length > 0) {
        const preg = pregunta.rows[0];
        
        // ADAPTACIÓN: Si inciso_correcto es texto (A,B,C) y tenemos números
        // Convertir letras a números: A=1, B=2, C=3, D=4
        const mapeoLetraANumero = {
          'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5,
          'F': 6, 'G': 7, 'H': 8, 'I': 9, 'J': 10,
          'K': 11, 'L': 12, 'M': 13, 'N': 14, 'O': 15,
          'P': 16, 'Q': 17, 'R': 18, 'S': 19, 'T': 20,
          'U': 21, 'V': 22, 'W': 23, 'X': 24, 'Y': 25, 'Z': 26
        };
        
        // Convertir inciso_correcto (letra) a número
        const incisoCorrectoNumero = mapeoLetraANumero[preg.inciso_correcto];
        
        // inciso_seleccionado viene del frontend como número
        const incisoSeleccionadoNumero = parseInt(respuesta.inciso_seleccionado);
        
        const esCorrecta = incisoCorrectoNumero === incisoSeleccionadoNumero;
        const notaObtenida = esCorrecta ? (preg.nota_pregunta || 1) : 0;

        // Guardar respuesta - ADAPTADO para tu estructura
        await pool.query(`
          INSERT INTO public.respuesta (
            id_inscripcion, opcion_respuestas, descripcion, activo
          ) VALUES ($1, $2, $3, TRUE)
        `, [
          id_inscripcion, 
          respuesta.inciso_seleccionado.toString(), // Convertir a texto para guardar
          `Pregunta ${respuesta.numero_preg}. ${esCorrecta ? 'Correcta' : 'Incorrecta'}. Seleccionado: ${respuesta.inciso_seleccionado}, Correcto: ${preg.inciso_correcto}`
        ]);

        calificacionFinal += notaObtenida;
        resultados.push({
          pregunta: respuesta.numero_preg,
          esCorrecta,
          notaObtenida,
          seleccionado: respuesta.inciso_seleccionado,
          correcto: preg.inciso_correcto
        });
      }
    }

    // Calcular calificación máxima
    const calificacionMaxima = await pool.query(`
      SELECT COALESCE(SUM(nota_pregunta), 0) as maximo
      FROM public.preguntas 
      WHERE id_evaluacion = $1 AND activo = true
    `, [evaluacionId]);

    const maximo = parseFloat(calificacionMaxima.rows[0].maximo) || 0;
    const porcentaje = maximo > 0 ? (calificacionFinal / maximo) * 100 : 0;

    res.json({
      calificacion_final: calificacionFinal,
      calificacion_maxima: maximo,
      porcentaje: Math.round(porcentaje * 100) / 100,
      total_preguntas: respuestas.length,
      preguntas_correctas: resultados.filter(r => r.esCorrecta).length,
      resultados: resultados
    });

  } catch (error) {
    console.error('Error al procesar respuestas:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Resultados de evaluación por estudiante
router.get("/:id/resultados/:id_inscripcion", async (req, res) => {
  try {
    const { id, id_inscripcion } = req.params;

    // Obtener las respuestas del estudiante
    const respuestas = await pool.query(`
      SELECT r.*, p.descripcion as pregunta_descripcion, p.nota_pregunta,
             o.respuesta_opcion as opcion_seleccionada_texto,
             oc.respuesta_opcion as opcion_correcta_texto,
             p.inciso_correcto
      FROM public.respuesta r
      JOIN public.preguntas p ON r.numero_preg = p.numero_preg
      JOIN public.opcion o ON r.inciso_seleccionado = o.inciso AND r.numero_preg = o.numero_preg
      LEFT JOIN public.opcion oc ON p.inciso_correcto = oc.inciso AND p.numero_preg = oc.numero_preg
      WHERE r.id_inscripcion = $1 AND p.id_evaluacion = $2 AND r.activo = TRUE
      ORDER BY p.numero_orden
    `, [id_inscripcion, id]);

    // Calcular estadísticas
    const totalPreguntas = respuestas.rows.length;
    const preguntasCorrectas = respuestas.rows.filter(r => r.es_correcta).length;
    const calificacionFinal = respuestas.rows.reduce((sum, r) => sum + parseFloat(r.nota_obtenida || 0), 0);
    
    // Obtener calificación máxima
    const calificacionMaxima = await pool.query(`
      SELECT COALESCE(SUM(nota_pregunta), 0) as maximo
      FROM public.preguntas 
      WHERE id_evaluacion = $1 AND activo = true
    `, [id]);

    const maximo = parseFloat(calificacionMaxima.rows[0].maximo) || 0;
    const porcentaje = maximo > 0 ? (calificacionFinal / maximo) * 100 : 0;

    res.json({
      respuestas: respuestas.rows,
      estadisticas: {
        total_preguntas: totalPreguntas,
        preguntas_correctas: preguntasCorrectas,
        preguntas_incorrectas: totalPreguntas - preguntasCorrectas,
        calificacion_final: calificacionFinal,
        calificacion_maxima: maximo,
        porcentaje: Math.round(porcentaje * 100) / 100
      }
    });

  } catch (error) {
    console.error('Error al obtener resultados:', error);
    res.status(500).json({ error: error.message });
  }
});
// Agregar este endpoint al backend de evaluaciones
router.post("/:id/calificar-desarrollo", async (req, res) => {
  try {
    const { id } = req.params;
    const { id_inscripcion, calificaciones } = req.body;

    // Verificar que la evaluación existe
    const evaluacion = await pool.query(
      'SELECT * FROM public.evaluaciones WHERE id_evaluacion = $1 AND activo = TRUE',
      [id]
    );

    if (evaluacion.rows.length === 0) {
      return res.status(404).json({ error: 'Evaluación no encontrada' });
    }

    let calificacionFinal = 0;

    // Procesar cada calificación de pregunta de desarrollo
    for (const calificacion of calificaciones) {
      // Actualizar la nota obtenida en la respuesta
      await pool.query(`
        UPDATE public.respuesta 
        SET nota_obtenida = $1, es_correcta = $2
        WHERE id_inscripcion = $3 AND numero_preg = $4 
      `, [
        calificacion.nota_obtenida,
        calificacion.nota_obtenida > 0,
        id_inscripcion,
        calificacion.numero_preg
      ]);

      calificacionFinal += calificacion.nota_obtenida;
    }

    res.json({
      calificacion_final: calificacionFinal,
      mensaje: 'Preguntas de desarrollo calificadas correctamente'
    });

  } catch (error) {
    console.error('Error al calificar desarrollo:', error);
    res.status(500).json({ error: error.message });
  }
});
export default router;