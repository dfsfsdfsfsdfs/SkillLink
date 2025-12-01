import { Router } from "express";
import pool from "../db.js";
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(verificarToken);

// GET - Todas las inscripciones (solo las activas) - CON FILTROS POR ROL
router.get("/", async (req, res) => {
  try {
    let query = `
      SELECT i.*, 
             e.nombre as estudiante_nombre, e.paterno as estudiante_paterno, e.email as estudiante_email,
             t.nombre_tutoria, t.sigla, t.cupo as cupo_tutoria, t.id_tutor, t.id_institucion,
             tu.nombre as tutor_nombre, tu.id_usuario as tutor_id_usuario,
             i_inst.id_usuario_gerente
      FROM public.inscripcion i
      JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante AND e.activo = TRUE
      JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria AND t.activo = TRUE
      JOIN public.tutor tu ON t.id_tutor = tu.id_tutor AND tu.activo = TRUE
      JOIN public.institucion i_inst ON t.id_institucion = i_inst.id_institucion
      WHERE i.activo = TRUE
    `;

    let params = [];
    let paramCount = 1;

    // 🔥 NUEVO: Filtros por rol
    if (req.user.id_rol === 3) { // Tutor
      const tutorResult = await pool.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [req.user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0) {
        return res.json([]);
      }
      
      query += ` AND t.id_tutor = $${paramCount}`;
      params.push(tutorResult.rows[0].id_tutor);
      paramCount++;
    }
    else if (req.user.id_rol === 2) { // Gerente
      query += ` AND i_inst.id_usuario_gerente = $${paramCount}`;
      params.push(req.user.id_usuario);
      paramCount++;
    }

    query += " ORDER BY i.fecha_inscripcion DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener inscripciones:", error.message);
    res.status(500).json({ error: "Error al obtener inscripciones" });
  }
});
// GET - Verificar si el estudiante está inscrito en una tutoría específica
router.get("/verificar-inscripcion/:id_tutoria", async (req, res) => {
  try {
    const { id_tutoria } = req.params;
    const user = req.user;

    console.log("🔍 DEBUG - Información completa del usuario:", user);
    console.log("🔍 Verificando inscripción para:", {
      usuario: user.email,
      usuario_id: user.id_usuario,
      tutoria_id: id_tutoria,
      // Agrega más campos para debug
      id_rol: user.id_rol,
      nombre: user.nombre
    });

    // 🔥 CAMBIO TEMPORAL: Buscar por id_usuario en lugar de email
    const estudianteResult = await pool.query(
      "SELECT id_estudiante, email FROM public.estudiante WHERE id_usuario = $1 AND activo = TRUE",
      [user.id_usuario]
    );

    if (estudianteResult.rows.length === 0) {
      console.log("❌ No se encontró estudiante para id_usuario:", user.id_usuario);
      
      // También intentar buscar por email como fallback
      if (user.email) {
        const estudianteResultByEmail = await pool.query(
          "SELECT id_estudiante, email FROM public.estudiante WHERE email = $1 AND activo = TRUE",
          [user.email]
        );
        
        if (estudianteResultByEmail.rows.length > 0) {
          console.log("✅ Estudiante encontrado por email:", user.email);
          const id_estudiante = estudianteResultByEmail.rows[0].id_estudiante;
          return await verificarInscripcionEstudiante(id_estudiante, id_tutoria, res);
        }
      }
      
      return res.json({
        inscrito: false,
        aprobado: false,
        mensaje: "No se encontró perfil de estudiante",
        debug: {
          id_usuario: user.id_usuario,
          email: user.email
        }
      });
    }

    const id_estudiante = estudianteResult.rows[0].id_estudiante;
    console.log("✅ ID Estudiante encontrado:", id_estudiante, "Email:", estudianteResult.rows[0].email);
    
    return await verificarInscripcionEstudiante(id_estudiante, id_tutoria, res);

  } catch (error) {
    console.error("Error al verificar inscripción:", error.message);
    res.status(500).json({ 
      error: "Error interno del servidor",
      inscrito: false,
      aprobado: false
    });
  }
});

// 🔥 NUEVA: Función separada para verificar la inscripción
async function verificarInscripcionEstudiante(id_estudiante, id_tutoria, res) {
  try {
    // Verificar inscripción
    const inscripcionResult = await pool.query(
      `SELECT i.*, t.nombre_tutoria 
       FROM public.inscripcion i
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       WHERE i.id_estudiante = $1 AND i.id_tutoria = $2 AND i.activo = TRUE
       LIMIT 1`,
      [id_estudiante, id_tutoria]
    );

    if (inscripcionResult.rows.length === 0) {
      console.log("❌ No hay inscripción activa para estudiante:", id_estudiante, "en tutoría:", id_tutoria);
      return res.json({
        inscrito: false,
        aprobado: false,
        mensaje: "No estás inscrito en esta tutoría"
      });
    }

    const inscripcion = inscripcionResult.rows[0];
    console.log("📋 Inscripción encontrada:", {
      id_inscripcion: inscripcion.id_inscripcion,
      estado_solicitud: inscripcion.estado_solicitud,
      estado_inscripcion: inscripcion.estado_inscripcion
    });
    
    // Verificar si está inscrito según estado_solicitud (la columna correcta)
    const inscrito = inscripcion.estado_solicitud === 'inscrito';
    const aprobado = inscripcion.estado_inscripcion === 'aprobada' || 
                     inscripcion.estado_inscripcion === 'activa';

    console.log("✅ Resultado final - Inscrito:", inscrito, "Aprobado:", aprobado);

    return res.json({
      inscrito: inscrito,
      aprobado: aprobado,
      estado: inscripcion.estado_inscripcion,
      estado_solicitud: inscripcion.estado_solicitud,
      fecha_inscripcion: inscripcion.fecha_inscripcion,
      nombre_tutoria: inscripcion.nombre_tutoria
    });

  } catch (error) {
    console.error("Error en verificarInscripcionEstudiante:", error.message);
    throw error;
  }
}
// GET - Inscripción por ID (solo si está activa) - CON VERIFICACIÓN DE PERMISOS
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = `
      SELECT i.*, 
              e.nombre as estudiante_nombre, e.paterno as estudiante_paterno, e.materno as estudiante_materno,
              e.celular as estudiante_celular, e.email as estudiante_email, e.carrera, e.univer_institu,
              t.nombre_tutoria, t.sigla, t.cupo as cupo_tutoria, t.descripcion_tutoria, t.id_tutor, t.id_institucion,
              tu.nombre as tutor_nombre, tu.especialidad as tutor_especialidad, tu.id_usuario as tutor_id_usuario,
              i_inst.id_usuario_gerente
       FROM public.inscripcion i
       JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante AND e.activo = TRUE
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria AND t.activo = TRUE
       JOIN public.tutor tu ON t.id_tutor = tu.id_tutor AND tu.activo = TRUE
       JOIN public.institucion i_inst ON t.id_institucion = i_inst.id_institucion
       WHERE i.id_inscripcion = $1 AND i.activo = TRUE
    `;

    let params = [id];
    let paramCount = 2;

    // 🔥 NUEVO: Verificación de permisos por rol
    if (req.user.id_rol === 3) { // Tutor
      const tutorResult = await pool.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [req.user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0) {
        return res.status(403).json({ error: "No se encontró información del tutor" });
      }
      
      query += ` AND t.id_tutor = $${paramCount}`;
      params.push(tutorResult.rows[0].id_tutor);
      paramCount++;
    }
    else if (req.user.id_rol === 2) { // Gerente
      query += ` AND i_inst.id_usuario_gerente = $${paramCount}`;
      params.push(req.user.id_usuario);
      paramCount++;
    }

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Inscripción no encontrada" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener inscripción:", error.message);
    res.status(500).json({ error: "Error al obtener inscripción" });
  }
});

// GET - Inscripciones por estudiante (solo activas) - CON VERIFICACIÓN DE PERMISOS
router.get("/estudiante/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = `
      SELECT i.*, t.nombre_tutoria, t.sigla, t.descripcion_tutoria, t.id_tutor, t.id_institucion,
             tu.nombre as tutor_nombre, tu.especialidad, tu.id_usuario as tutor_id_usuario,
             i_inst.id_usuario_gerente
       FROM public.inscripcion i
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria AND t.activo = TRUE
       JOIN public.tutor tu ON t.id_tutor = tu.id_tutor AND tu.activo = TRUE
       JOIN public.institucion i_inst ON t.id_institucion = i_inst.id_institucion
       WHERE i.id_estudiante = $1 AND i.activo = TRUE
    `;

    let params = [id];
    let paramCount = 2;

    // 🔥 NUEVO: Filtros por rol
    if (req.user.id_rol === 3) { // Tutor
      const tutorResult = await pool.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [req.user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0) {
        return res.json([]);
      }
      
      query += ` AND t.id_tutor = $${paramCount}`;
      params.push(tutorResult.rows[0].id_tutor);
      paramCount++;
    }
    else if (req.user.id_rol === 2) { // Gerente
      query += ` AND i_inst.id_usuario_gerente = $${paramCount}`;
      params.push(req.user.id_usuario);
      paramCount++;
    }

    query += " ORDER BY i.fecha_inscripcion DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener inscripciones del estudiante:", error.message);
    res.status(500).json({ error: "Error al obtener inscripciones del estudiante" });
  }
});

// GET - Inscripciones por tutoria (solo activas) - CON VERIFICACIÓN DE PERMISOS
// En routes/inscripciones.js - Modifica el GET de inscripciones por tutoría
router.get("/tutoria/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = `
        SELECT i.*, 
              e.nombre as estudiante_nombre, e.paterno, e.materno, e.email, e.carrera,
              t.id_tutor, t.id_institucion, tu.id_usuario as tutor_id_usuario, i_inst.id_usuario_gerente,
              -- 🔥 NUEVO: Incluir estado_solicitud
              i.estado_solicitud,
              -- Información de pagos
              p.estado_pago, p.fecha_de_pago, p.nro_pago,
              CASE 
                WHEN p.estado_pago = 'completado' THEN 'Sí'
                WHEN p.estado_pago IS NOT NULL THEN 'En proceso'
                ELSE 'No'
              END as pago_verificado
        FROM public.inscripcion i
        JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante AND e.activo = TRUE
        JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria AND t.activo = TRUE
        JOIN public.tutor tu ON t.id_tutor = tu.id_tutor AND tu.activo = TRUE
        JOIN public.institucion i_inst ON t.id_institucion = i_inst.id_institucion
        LEFT JOIN public.pago_qr p ON i.id_inscripcion = p.id_inscripcion AND p.activo = TRUE
        WHERE i.id_tutoria = $1 AND i.activo = TRUE
    `;

    let params = [id];
    let paramCount = 2;

    // Filtros por rol
    if (req.user.id_rol === 3) { // Tutor
      const tutorResult = await pool.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [req.user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0) {
        return res.json([]);
      }
      
      query += ` AND t.id_tutor = $${paramCount}`;
      params.push(tutorResult.rows[0].id_tutor);
      paramCount++;
    }
    else if (req.user.id_rol === 2) { // Gerente
      query += ` AND i_inst.id_usuario_gerente = $${paramCount}`;
      params.push(req.user.id_usuario);
      paramCount++;
    }

    query += " ORDER BY i.fecha_inscripcion DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener inscripciones de la tutoría:", error.message);
    res.status(500).json({ error: "Error al obtener inscripciones de la tutoría" });
  }
});

// routes/inscripciones.js - Agregar este endpoint si no existe

// GET - Inscripciones por tutoría (solo activas y aprobadas)
// GET - Obtener inscripciones del estudiante autenticado
router.get("/mis-inscripciones", async (req, res) => {
  try {
    console.log('📚 Obteniendo inscripciones del estudiante...', req.user);
    
    // Solo estudiantes pueden acceder
    if (req.user.id_rol !== 4) {
      return res.status(403).json({ 
        error: "Solo los estudiantes pueden acceder a esta información" 
      });
    }

    // Buscar el ID del estudiante por email
    const estudianteResult = await pool.query(
      "SELECT id_estudiante FROM public.estudiante WHERE email = $1 AND activo = TRUE",
      [req.user.email]
    );

    if (estudianteResult.rows.length === 0) {
      return res.status(404).json({ 
        error: "No se encontró perfil de estudiante para este usuario" 
      });
    }

    const id_estudiante = estudianteResult.rows[0].id_estudiante;
    console.log('🎓 ID Estudiante encontrado:', id_estudiante);

    // Obtener todas las inscripciones del estudiante
    const result = await pool.query(
      `SELECT 
        i.*,
        t.nombre_tutoria,
        t.sigla,
        t.descripcion_tutoria,
        t.cupo,
        tu.nombre as tutor_nombre,
        tu.especialidad,
        inst.nombre as institucion_nombre,
        p.nro_pago,
        p.monto,
        p.estado_pago,
        p.fecha_de_pago,
        (
          SELECT COUNT(*) 
          FROM public.inscripcion ins 
          WHERE ins.id_tutoria = i.id_tutoria 
          AND ins.estado_solicitud = 'inscrito' 
          AND ins.activo = TRUE
        ) as inscritos_actuales,
        t.cupo - (
          SELECT COUNT(*) 
          FROM public.inscripcion ins 
          WHERE ins.id_tutoria = i.id_tutoria 
          AND ins.estado_solicitud = 'inscrito' 
          AND ins.activo = TRUE
        ) as cupos_disponibles
       FROM public.inscripcion i
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria AND t.activo = TRUE
       JOIN public.tutor tu ON t.id_tutor = tu.id_tutor AND tu.activo = TRUE
       JOIN public.institucion inst ON t.id_institucion = inst.id_institucion
       LEFT JOIN public.pago_qr p ON i.id_inscripcion = p.id_inscripcion AND p.activo = TRUE
       WHERE i.id_estudiante = $1 AND i.activo = TRUE
       ORDER BY i.fecha_inscripcion DESC`,
      [id_estudiante]
    );

    console.log(`✅ ${result.rows.length} inscripciones encontradas`);
    
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener inscripciones:", error.message);
    res.status(500).json({ 
      error: "Error al obtener inscripciones",
      detalle: error.message 
    });
  }
});

// GET - Verificar si el estudiante actual está inscrito en una tutoría específica
router.get("/verificar-estudiante/tutoria/:id_tutoria", async (req, res) => {
  try {
    const { id_tutoria } = req.params;
    const user = req.user;

    console.log('🔍 Verificando inscripción para:', {
      usuario: user.email,
      id_tutoria: id_tutoria,
      rol: user.id_rol
    });

    // Solo estudiantes pueden usar este endpoint
    if (user.id_rol !== 4) {
      return res.status(403).json({ 
        error: "Solo los estudiantes pueden usar este endpoint",
        inscrito: false 
      });
    }

    // Buscar al estudiante por email del usuario
    const estudianteResult = await pool.query(
      "SELECT id_estudiante FROM public.estudiante WHERE email = $1 AND activo = TRUE",
      [user.email]
    );

    if (estudianteResult.rows.length === 0) {
      console.log('❌ Estudiante no encontrado para email:', user.email);
      return res.status(404).json({ 
        error: "Estudiante no encontrado",
        inscrito: false 
      });
    }

    const id_estudiante = estudianteResult.rows[0].id_estudiante;
    console.log('🎓 ID Estudiante encontrado:', id_estudiante);

    // Verificar inscripción en la tutoría
    const inscripcionResult = await pool.query(
      `SELECT i.*, t.nombre_tutoria, t.sigla,
              CASE 
                WHEN i.estado_solicitud = 'inscrito' THEN true
                ELSE false
              END as esta_inscrito
       FROM public.inscripcion i
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       WHERE i.id_estudiante = $1 
         AND i.id_tutoria = $2 
         AND i.activo = TRUE
       ORDER BY i.fecha_inscripcion DESC
       LIMIT 1`,
      [id_estudiante, id_tutoria]
    );

    if (inscripcionResult.rows.length === 0) {
      console.log('❌ No hay inscripción activa encontrada');
      return res.json({ 
        inscrito: false,
        mensaje: "No estás inscrito en esta tutoría"
      });
    }

    const inscripcion = inscripcionResult.rows[0];
    const estaInscrito = inscripcion.esta_inscrito;
    
    console.log('✅ Estado de inscripción:', {
      inscrito: estaInscrito,
      estado_solicitud: inscripcion.estado_solicitud,
      estado_inscripcion: inscripcion.estado_inscripcion
    });

    res.json({
      inscrito: estaInscrito,
      estado_solicitud: inscripcion.estado_solicitud,
      estado_inscripcion: inscripcion.estado_inscripcion,
      fecha_inscripcion: inscripcion.fecha_inscripcion,
      tutoria: {
        nombre: inscripcion.nombre_tutoria,
        sigla: inscripcion.sigla
      }
    });
    
  } catch (error) {
    console.error("Error al verificar inscripción:", error.message);
    res.status(500).json({ 
      error: "Error al verificar inscripción",
      inscrito: false 
    });
  }
});


// 🔥 NUEVO: PUT - Activar inscripción (cuando el pago está verificado)
router.put("/:id/activar", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;

    // Primero obtener la inscripción para verificar permisos
    const inscripcion = await client.query(
      `SELECT i.*, t.id_tutor, t.id_institucion, t.cupo as cupo_tutoria,
              tu.id_usuario as tutor_id_usuario, i_inst.id_usuario_gerente,
              p.estado_pago
       FROM public.inscripcion i
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       JOIN public.tutor tu ON t.id_tutor = tu.id_tutor
       JOIN public.institucion i_inst ON t.id_institucion = i_inst.id_institucion
       LEFT JOIN public.pago_qr p ON i.id_inscripcion = p.id_inscripcion AND p.activo = TRUE
       WHERE i.id_inscripcion = $1`,
      [id]
    );
    
    if (inscripcion.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Inscripción no encontrada" });
    }

    const insc = inscripcion.rows[0];

    // Verificar permisos para activar
    if (req.user.id_rol === 3) { // Tutor
      const tutorResult = await client.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [req.user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0 || insc.id_tutor !== tutorResult.rows[0].id_tutor) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para activar esta inscripción" });
      }
    }
    else if (req.user.id_rol === 2) { // Gerente
      if (insc.id_usuario_gerente !== req.user.id_usuario) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para activar esta inscripción" });
      }
    }

    // Verificar que el pago esté completado
    if (insc.estado_pago !== 'completado') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "No se puede activar la inscripción: el pago no está verificado" });
    }

    // Verificar que hay cupos disponibles
    const inscripcionesActivas = await client.query(
      "SELECT COUNT(*) as total FROM public.inscripcion WHERE id_tutoria = $1 AND estado_inscripcion = 'activa' AND activo = TRUE",
      [insc.id_tutoria]
    );
    
    const totalInscripciones = parseInt(inscripcionesActivas.rows[0].total);
    
    if (totalInscripciones >= insc.cupo_tutoria) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "No hay cupos disponibles en esta tutoría" });
    }

    // Activar la inscripción
    const result = await client.query(
      `UPDATE public.inscripcion 
       SET estado_inscripcion = 'activa', fecha_activacion = NOW()
       WHERE id_inscripcion = $1 
       RETURNING *`,
      [id]
    );

    await client.query('COMMIT');
    res.json({ 
      mensaje: "Inscripción activada correctamente",
      inscripcion: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al activar inscripción:", error.message);
    res.status(500).json({ error: "Error al activar inscripción" });
  } finally {
    client.release();
  }
});

// 🔥 NUEVO: PUT - Cancelar inscripción
router.put("/:id/cancelar", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { motivo } = req.body;

    // Primero obtener la inscripción para verificar permisos
    const inscripcion = await client.query(
      `SELECT i.*, t.id_tutor, t.id_institucion,
              tu.id_usuario as tutor_id_usuario, i_inst.id_usuario_gerente
       FROM public.inscripcion i
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       JOIN public.tutor tu ON t.id_tutor = tu.id_tutor
       JOIN public.institucion i_inst ON t.id_institucion = i_inst.id_institucion
       WHERE i.id_inscripcion = $1`,
      [id]
    );
    
    if (inscripcion.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Inscripción no encontrada" });
    }

    const insc = inscripcion.rows[0];

    // Verificar permisos para cancelar
    if (req.user.id_rol === 3) { // Tutor
      const tutorResult = await client.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [req.user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0 || insc.id_tutor !== tutorResult.rows[0].id_tutor) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para cancelar esta inscripción" });
      }
    }
    else if (req.user.id_rol === 2) { // Gerente
      if (insc.id_usuario_gerente !== req.user.id_usuario) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para cancelar esta inscripción" });
      }
    }

    // Cancelar la inscripción
    const result = await client.query(
      `UPDATE public.inscripcion 
       SET estado_inscripcion = 'cancelada', fecha_cancelacion = NOW(), motivo_cancelacion = $2
       WHERE id_inscripcion = $1 
       RETURNING *`,
      [id, motivo || 'Cancelado por administración']
    );

    await client.query('COMMIT');
    res.json({ 
      mensaje: "Inscripción cancelada correctamente",
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

// 🔥 NUEVO: GET - Inscripciones pendientes por tutoría (CON PERMISOS CORREGIDOS)
router.get("/tutoria/:id/pendientes", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Primero obtener información de la tutoría para verificar permisos
    const tutoriaInfo = await pool.query(`
      SELECT t.*, i.id_usuario_gerente, tu.id_usuario as tutor_id_usuario
      FROM tutoria t
      JOIN institucion i ON t.id_institucion = i.id_institucion
      JOIN tutor tu ON t.id_tutor = tu.id_tutor
      WHERE t.id_tutoria = $1 AND t.activo = TRUE
    `, [id]);

    if (tutoriaInfo.rows.length === 0) {
      return res.status(404).json({ error: "Tutoría no encontrada" });
    }

    const tutoria = tutoriaInfo.rows[0];

    // 🔥 CORREGIDO: Verificar permisos para ver inscripciones pendientes
    const puedeVerPendientes = 
      req.user.id_rol === 1 || // Admin ve todo
      (req.user.id_rol === 2 && tutoria.id_usuario_gerente === req.user.id_usuario) || // Gerente de la institución
      (req.user.id_rol === 3 && tutoria.tutor_id_usuario === req.user.id_usuario); // Tutor dueño de la tutoría

    if (!puedeVerPendientes) {
      return res.json([]); // Retornar array vacío si no tiene permisos
    }

    let query = `
      SELECT i.*, e.nombre as estudiante_nombre, e.paterno, e.materno, e.email, e.carrera
       FROM public.inscripcion i
       JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante AND e.activo = TRUE
       WHERE i.id_tutoria = $1 AND i.estado_inscripcion = 'pendiente' AND i.activo = TRUE
    `;

    query += " ORDER BY i.fecha_inscripcion DESC";

    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener inscripciones pendientes:", error.message);
    res.status(500).json({ error: "Error al obtener inscripciones pendientes" });
  }
});

// GET - Inscripciones por estado (solo activas) - CON FILTROS POR ROL
router.get("/estado/:estado", async (req, res) => {
  try {
    const { estado } = req.params;
    
    let query = `
      SELECT i.*, e.nombre as estudiante_nombre, t.nombre_tutoria, t.sigla,
             t.id_tutor, t.id_institucion, tu.id_usuario as tutor_id_usuario, i_inst.id_usuario_gerente
       FROM public.inscripcion i
       JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante AND e.activo = TRUE
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria AND t.activo = TRUE
       JOIN public.tutor tu ON t.id_tutor = tu.id_tutor AND tu.activo = TRUE
       JOIN public.institucion i_inst ON t.id_institucion = i_inst.id_institucion
       WHERE i.estado_inscripcion = $1 AND i.activo = TRUE
    `;

    let params = [estado];
    let paramCount = 2;

    // 🔥 NUEVO: Filtros por rol
    if (req.user.id_rol === 3) { // Tutor
      const tutorResult = await pool.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [req.user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0) {
        return res.json([]);
      }
      
      query += ` AND t.id_tutor = $${paramCount}`;
      params.push(tutorResult.rows[0].id_tutor);
      paramCount++;
    }
    else if (req.user.id_rol === 2) { // Gerente
      query += ` AND i_inst.id_usuario_gerente = $${paramCount}`;
      params.push(req.user.id_usuario);
      paramCount++;
    }

    query += " ORDER BY i.fecha_inscripcion DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener inscripciones por estado:", error.message);
    res.status(500).json({ error: "Error al obtener inscripciones por estado" });
  }
});

// POST - Crear inscripción (se crea como activa por defecto) - CON VERIFICACIÓN DE PERMISOS
router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { fecha_inscripcion, estado_inscripcion, cupo_asignado, id_estudiante, id_tutoria } = req.body;
    
    // Validar campos requeridos
    if (!id_estudiante || !id_tutoria) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "ID del estudiante y ID de la tutoría son requeridos" });
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
      `SELECT t.*, i.id_usuario_gerente, tu.id_usuario as tutor_id_usuario
       FROM public.tutoria t
       JOIN public.institucion i ON t.id_institucion = i.id_institucion
       JOIN public.tutor tu ON t.id_tutor = tu.id_tutor
       WHERE t.id_tutoria = $1 AND t.activo = TRUE`,
      [id_tutoria]
    );
    
    if (tutoria.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Tutoría no encontrada o deshabilitada" });
    }

    const tutoriaInfo = tutoria.rows[0];

    // 🔥 NUEVO: Verificar permisos para crear inscripción
    if (req.user.id_rol === 3) { // Tutor
      const tutorResult = await client.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [req.user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0 || tutoriaInfo.id_tutor !== tutorResult.rows[0].id_tutor) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para inscribir estudiantes en esta tutoría" });
      }
    }
    else if (req.user.id_rol === 2) { // Gerente
      if (tutoriaInfo.id_usuario_gerente !== req.user.id_usuario) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para inscribir estudiantes en esta tutoría" });
      }
    }
    
    // Verificar si el estudiante ya está inscrito en esta tutoría (inscripción activa)
    const inscripcionExistente = await client.query(
      "SELECT * FROM public.inscripcion WHERE id_estudiante = $1 AND id_tutoria = $2 AND activo = TRUE",
      [id_estudiante, id_tutoria]
    );
    
    if (inscripcionExistente.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "El estudiante ya está inscrito en esta tutoría" });
    }
    
    // Verificar cupos disponibles en la tutoría (solo inscripciones aprobadas)
    const cupoTutoria = tutoriaInfo.cupo;
    const inscripcionesAprobadas = await client.query(
      "SELECT COUNT(*) as total FROM public.inscripcion WHERE id_tutoria = $1 AND estado_inscripcion = 'aprobada' AND activo = TRUE",
      [id_tutoria]
    );
    
    const totalInscripciones = parseInt(inscripcionesAprobadas.rows[0].total);
    
    if (totalInscripciones >= cupoTutoria) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "No hay cupos disponibles en esta tutoría" });
    }
    
    const result = await client.query(
      `INSERT INTO public.inscripcion (fecha_inscripcion, estado_inscripcion, cupo_asignado, id_estudiante, id_tutoria, activo) 
       VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *`,
      [fecha_inscripcion || new Date(), estado_inscripcion || 'pendiente', cupo_asignado, id_estudiante, id_tutoria]
    );
    
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al crear inscripción:", error.message);
    res.status(500).json({ error: "Error al crear inscripción" });
  } finally {
    client.release();
  }
});

// PUT - Actualizar inscripción (solo si está activa) - CON VERIFICACIÓN DE PERMISOS
router.put("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { fecha_inscripcion, estado_inscripcion, cupo_asignado } = req.body;
    
    // Primero obtener la inscripción para verificar permisos
    const inscripcion = await client.query(
      `SELECT i.*, t.id_tutor, t.id_institucion, tu.id_usuario as tutor_id_usuario, i_inst.id_usuario_gerente
       FROM public.inscripcion i
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       JOIN public.tutor tu ON t.id_tutor = tu.id_tutor
       JOIN public.institucion i_inst ON t.id_institucion = i_inst.id_institucion
       WHERE i.id_inscripcion = $1`,
      [id]
    );
    
    if (inscripcion.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Inscripción no encontrada" });
    }

    const insc = inscripcion.rows[0];

    // 🔥 NUEVO: Verificar permisos para actualizar
    if (req.user.id_rol === 3) { // Tutor
      const tutorResult = await client.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [req.user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0 || insc.id_tutor !== tutorResult.rows[0].id_tutor) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para actualizar esta inscripción" });
      }
    }
    else if (req.user.id_rol === 2) { // Gerente
      if (insc.id_usuario_gerente !== req.user.id_usuario) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para actualizar esta inscripción" });
      }
    }

    const result = await client.query(
      `UPDATE public.inscripcion 
       SET fecha_inscripcion=$1, estado_inscripcion=$2, cupo_asignado=$3 
       WHERE id_inscripcion=$4 AND activo = TRUE RETURNING *`,
      [fecha_inscripcion, estado_inscripcion, cupo_asignado, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Inscripción no encontrada" });
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al actualizar inscripción:", error.message);
    res.status(500).json({ error: "Error al actualizar inscripción" });
  } finally {
    client.release();
  }
});

// 🔥 NUEVO: PUT - Aprobar inscripción (ACTUALIZADO para estado_solicitud)
router.put("/:id/aprobar", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;

    // Primero obtener la inscripción para verificar permisos
    const inscripcion = await client.query(
      `SELECT i.*, t.id_tutor, t.id_institucion, t.cupo as cupo_tutoria,
              tu.id_usuario as tutor_id_usuario, i_inst.id_usuario_gerente
       FROM public.inscripcion i
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       JOIN public.tutor tu ON t.id_tutor = tu.id_tutor
       JOIN public.institucion i_inst ON t.id_institucion = i_inst.id_institucion
       WHERE i.id_inscripcion = $1 AND i.activo = TRUE`,
      [id]
    );
    
    if (inscripcion.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Inscripción no encontrada" });
    }

    const insc = inscripcion.rows[0];

    // Verificar que la solicitud esté pendiente
    if (insc.estado_solicitud !== 'pendiente') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "Solo se pueden aprobar solicitudes pendientes" });
    }

    // 🔥 NUEVO: Verificar permisos para aprobar
    if (req.user.id_rol === 3) { // Tutor
      const tutorResult = await client.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [req.user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0 || insc.id_tutor !== tutorResult.rows[0].id_tutor) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para aprobar esta inscripción" });
      }
    }
    else if (req.user.id_rol === 2) { // Gerente
      if (insc.id_usuario_gerente !== req.user.id_usuario) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para aprobar esta inscripción" });
      }
    }

    // Verificar que hay cupos disponibles (contando inscritos)
    const inscripcionesInscritas = await client.query(
      "SELECT COUNT(*) as total FROM public.inscripcion WHERE id_tutoria = $1 AND estado_solicitud = 'inscrito' AND activo = TRUE",
      [insc.id_tutoria]
    );
    
    const totalInscritos = parseInt(inscripcionesInscritas.rows[0].total);
    
    if (totalInscritos >= insc.cupo_tutoria) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "No hay cupos disponibles en esta tutoría" });
    }

    // 🔥 ACTUALIZADO: Aprobar la inscripción (cambiar estado_solicitud a 'inscrito')
    const result = await client.query(
      `UPDATE public.inscripcion 
       SET estado_solicitud = 'inscrito', fecha_aprobacion = NOW(), id_docente_aprobador = $2
       WHERE id_inscripcion = $1 AND activo = TRUE 
       RETURNING *`,
      [id, req.user.id_usuario] // Guardar quién aprobó la solicitud
    );

    await client.query('COMMIT');
    res.json({ 
      mensaje: "Solicitud aprobada correctamente - Estudiante inscrito",
      inscripcion: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al aprobar inscripción:", error.message);
    res.status(500).json({ error: "Error al aprobar inscripción" });
  } finally {
    client.release();
  }
});


// 🔥 CORREGIDO: PUT - Rechazar inscripción (sin motivo requerido)
router.put("/:id/rechazar", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { motivo } = req.body || {}; // 🔥 CORRECCIÓN: Manejar body undefined

    // Primero obtener la inscripción para verificar permisos
    const inscripcion = await client.query(
      `SELECT i.*, t.id_tutor, t.id_institucion,
              tu.id_usuario as tutor_id_usuario, i_inst.id_usuario_gerente
       FROM public.inscripcion i
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       JOIN public.tutor tu ON t.id_tutor = tu.id_tutor
       JOIN public.institucion i_inst ON t.id_institucion = i_inst.id_institucion
       WHERE i.id_inscripcion = $1 AND i.activo = TRUE`,
      [id]
    );
    
    if (inscripcion.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Inscripción no encontrada" });
    }

    const insc = inscripcion.rows[0];

    // Verificar que la solicitud esté pendiente
    if (insc.estado_solicitud !== 'pendiente') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "Solo se pueden rechazar solicitudes pendientes" });
    }

    // Verificar permisos para rechazar
    if (req.user.id_rol === 3) { // Tutor
      const tutorResult = await client.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [req.user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0 || insc.id_tutor !== tutorResult.rows[0].id_tutor) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para rechazar esta inscripción" });
      }
    }
    else if (req.user.id_rol === 2) { // Gerente
      if (insc.id_usuario_gerente !== req.user.id_usuario) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para rechazar esta inscripción" });
      }
    }

    // Rechazar la inscripción (cambiar estado_solicitud a 'rechazado')
    const result = await client.query(
      `UPDATE public.inscripcion 
       SET estado_solicitud = 'rechazado', fecha_rechazo = NOW(), id_docente_aprobador = $2,
           motivo_rechazo = $3
       WHERE id_inscripcion = $1 AND activo = TRUE 
       RETURNING *`,
      [id, req.user.id_usuario, motivo || 'Solicitud rechazada'] // 🔥 CORRECCIÓN: valor por defecto
    );

    await client.query('COMMIT');
    res.json({ 
      mensaje: "Solicitud rechazada correctamente",
      inscripcion: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al rechazar inscripción:", error.message);
    res.status(500).json({ error: "Error al rechazar inscripción" });
  } finally {
    client.release();
  }
});
// PATCH - Cambiar estado de inscripción (solo si está activa) - CON VERIFICACIÓN DE PERMISOS
router.patch("/:id/estado", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { estado_inscripcion } = req.body;
    
    // Validar estado permitido
    const estadosPermitidos = ['Activa', 'Pendiente', 'Cancelada'];
    if (!estado_inscripcion || !estadosPermitidos.includes(estado_inscripcion)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: "Estado inválido. Los estados permitidos son: Activa, Pendiente, Cancelada" 
      });
    }
    
    // Primero obtener la inscripción para verificar permisos
    const inscripcion = await client.query(
      `SELECT i.*, t.id_tutor, t.id_institucion, tu.id_usuario as tutor_id_usuario, i_inst.id_usuario_gerente
       FROM public.inscripcion i
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       JOIN public.tutor tu ON t.id_tutor = tu.id_tutor
       JOIN public.institucion i_inst ON t.id_institucion = i_inst.id_institucion
       WHERE i.id_inscripcion = $1`,
      [id]
    );
    
    if (inscripcion.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Inscripción no encontrada" });
    }

    const insc = inscripcion.rows[0];

    // 🔥 NUEVO: Verificar permisos para cambiar estado
    if (req.user.id_rol === 3) { // Tutor
      const tutorResult = await client.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [req.user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0 || insc.id_tutor !== tutorResult.rows[0].id_tutor) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para cambiar el estado de esta inscripción" });
      }
    }
    else if (req.user.id_rol === 2) { // Gerente
      if (insc.id_usuario_gerente !== req.user.id_usuario) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para cambiar el estado de esta inscripción" });
      }
    }
    
    const result = await client.query(
      "UPDATE public.inscripcion SET estado_inscripcion=$1 WHERE id_inscripcion=$2 AND activo = TRUE RETURNING *",
      [estado_inscripcion, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Inscripción no encontrada" });
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al cambiar estado de inscripción:", error.message);
    res.status(500).json({ error: "Error al cambiar estado de inscripción" });
  } finally {
    client.release();
  }
});
// DELETE - Eliminación lógica (soft delete) - CON VERIFICACIÓN DE PERMISOS
router.delete("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Primero obtener la inscripción para verificar permisos
    const inscripcion = await client.query(
      `SELECT i.*, t.id_tutor, t.id_institucion, tu.id_usuario as tutor_id_usuario, i_inst.id_usuario_gerente
       FROM public.inscripcion i
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       JOIN public.tutor tu ON t.id_tutor = tu.id_tutor
       JOIN public.institucion i_inst ON t.id_institucion = i_inst.id_institucion
       WHERE i.id_inscripcion = $1`,
      [id]
    );
    
    if (inscripcion.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Inscripción no encontrada" });
    }

    const insc = inscripcion.rows[0];

    // 🔥 NUEVO: Verificar permisos para eliminar
    if (req.user.id_rol === 3) { // Tutor
      const tutorResult = await client.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [req.user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0 || insc.id_tutor !== tutorResult.rows[0].id_tutor) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para eliminar esta inscripción" });
      }
    }
    else if (req.user.id_rol === 2) { // Gerente
      if (insc.id_usuario_gerente !== req.user.id_usuario) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para eliminar esta inscripción" });
      }
    }
    
    // Verificar si hay pagos asociados activos a esta inscripción
    const pagos = await client.query(
      "SELECT * FROM public.pago_qr WHERE id_inscripcion = $1 AND activo = TRUE",
      [id]
    );
    
    if (pagos.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: "No se puede deshabilitar la inscripción porque tiene pagos activos asociados" 
      });
    }
    
    // Verificar si hay respuestas activas asociadas a esta inscripción
    const respuestas = await client.query(
      "SELECT * FROM public.respuesta WHERE id_inscripcion = $1 AND activo = TRUE",
      [id]
    );
    
    if (respuestas.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: "No se puede deshabilitar la inscripción porque tiene respuestas activas asociadas" 
      });
    }
    
    // En lugar de DELETE, hacemos un UPDATE para marcar como inactivo
    const result = await client.query(
      `UPDATE public.inscripcion SET activo = FALSE 
       WHERE id_inscripcion = $1 AND activo = TRUE 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Inscripción no encontrada o ya está deshabilitada" });
    }

    await client.query('COMMIT');
    res.json({ 
      mensaje: "Inscripción deshabilitada correctamente",
      inscripcion: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al deshabilitar inscripción:", error.message);
    res.status(500).json({ error: "Error al deshabilitar inscripción" });
  } finally {
    client.release();
  }
});

// OPCIONAL: Endpoint para reactivar una inscripción - CON VERIFICACIÓN DE PERMISOS
router.patch("/:id/activar", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Primero obtener la inscripción para verificar permisos
    const inscripcion = await client.query(
      `SELECT i.*, e.activo as estudiante_activo, t.activo as tutoria_activo,
              t.id_tutor, t.id_institucion, tu.id_usuario as tutor_id_usuario, i_inst.id_usuario_gerente
       FROM public.inscripcion i
       JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       JOIN public.tutor tu ON t.id_tutor = tu.id_tutor
       JOIN public.institucion i_inst ON t.id_institucion = i_inst.id_institucion
       WHERE i.id_inscripcion = $1`,
      [id]
    );
    
    if (inscripcion.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Inscripción no encontrada" });
    }

    const insc = inscripcion.rows[0];

    // 🔥 NUEVO: Verificar permisos para reactivar
    if (req.user.id_rol === 3) { // Tutor
      const tutorResult = await client.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [req.user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0 || insc.id_tutor !== tutorResult.rows[0].id_tutor) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para reactivar esta inscripción" });
      }
    }
    else if (req.user.id_rol === 2) { // Gerente
      if (insc.id_usuario_gerente !== req.user.id_usuario) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para reactivar esta inscripción" });
      }
    }
    
    if (!insc.estudiante_activo) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "No se puede reactivar: el estudiante está deshabilitado" });
    }
    
    if (!insc.tutoria_activo) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "No se puede reactivar: la tutoría está deshabilitada" });
    }
    
    const result = await client.query(
      "UPDATE public.inscripcion SET activo = TRUE WHERE id_inscripcion = $1 RETURNING *",
      [id]
    );

    await client.query('COMMIT');
    res.json({ 
      mensaje: "Inscripción reactivada correctamente",
      inscripcion: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al reactivar inscripción:", error.message);
    res.status(500).json({ error: "Error al reactivar inscripción" });
  } finally {
    client.release();
  }
});

// GET - Estadísticas de inscripciones (solo activas) - CON FILTROS POR ROL
router.get("/estadisticas/resumen", async (req, res) => {
  try {
    let query = `
      SELECT 
        COUNT(*) as total_inscripciones,
        COUNT(CASE WHEN estado_inscripcion = 'aprobada' THEN 1 END) as aprobadas,
        COUNT(CASE WHEN estado_inscripcion = 'pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado_inscripcion = 'rechazada' THEN 1 END) as rechazadas,
        AVG(cupo_asignado) as promedio_cupo
      FROM public.inscripcion i
      JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
      JOIN public.institucion i_inst ON t.id_institucion = i_inst.id_institucion
      WHERE i.activo = TRUE
    `;

    let params = [];
    let paramCount = 1;

    // 🔥 NUEVO: Filtros por rol
    if (req.user.id_rol === 3) { // Tutor
      const tutorResult = await pool.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [req.user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0) {
        return res.json({
          total_inscripciones: 0,
          aprobadas: 0,
          pendientes: 0,
          rechazadas: 0,
          promedio_cupo: 0
        });
      }
      
      query += ` AND t.id_tutor = $${paramCount}`;
      params.push(tutorResult.rows[0].id_tutor);
      paramCount++;
    }
    else if (req.user.id_rol === 2) { // Gerente
      query += ` AND i_inst.id_usuario_gerente = $${paramCount}`;
      params.push(req.user.id_usuario);
      paramCount++;
    }

    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error.message);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});
// GET - Inscripciones por tutoría con calificaciones y pagos REALES
router.get("/tutoria/:id/completo", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Cargando estudiantes para tutoría: ${id}`);
    
    // Consulta base CON la tabla pago_qr
    const inscripciones = await pool.query(`
      SELECT 
        i.id_inscripcion,
        i.estado_solicitud,
        i.fecha_inscripcion,
        e.id_estudiante,
        e.nombre as estudiante_nombre,
        e.paterno,
        e.materno,
        e.email,
        e.carrera,
        pq.nro_pago,
        pq.estado_pago,
        pq.fecha_de_pago,
        pq.monto,
        pq.codigo_transaccion
      FROM public.inscripcion i
      JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante
      LEFT JOIN public.pago_qr pq ON i.id_inscripcion = pq.id_inscripcion AND pq.activo = TRUE
      WHERE i.id_tutoria = $1
      ORDER BY e.paterno, e.materno, e.nombre
    `, [id]);

    console.log(`📊 ${inscripciones.rows.length} estudiantes encontrados`);

    // Para cada estudiante, calcular calificaciones
    const estudiantesConCalificaciones = await Promise.all(
      inscripciones.rows.map(async (est) => {
        try {
          // Calcular puntos de evaluaciones
          let puntosEvaluaciones = 0;
          try {
            const evalResult = await pool.query(`
              SELECT SUM(r.nota_obtenida) as total_puntos
              FROM public.respuesta r
              JOIN public.preguntas p ON r.numero_preg = p.numero_preg
              JOIN public.evaluaciones ev ON p.id_evaluacion = ev.id_evaluacion
              WHERE r.id_inscripcion = $1 
              AND ev.id_tutoria = $2
              AND r.activo = TRUE
            `, [est.id_inscripcion, id]);
            
            puntosEvaluaciones = parseFloat(evalResult.rows[0]?.total_puntos) || 0;
          } catch (evalError) {
            console.warn(`⚠️ Error calculando evaluaciones:`, evalError.message);
            puntosEvaluaciones = 0;
          }

          // Calcular total de actividades
          let totalActividades = 0;
          try {
            const actResult = await pool.query(`
              SELECT COUNT(*) as total
              FROM public.actividad 
              WHERE id_tutoria = $1 
              AND activo = TRUE
            `, [id]);
            
            totalActividades = parseInt(actResult.rows[0]?.total) || 0;
          } catch (actError) {
            console.warn(`⚠️ Error contando actividades:`, actError.message);
            totalActividades = 0;
          }

          // Calcular actividades completadas usando entrega_tarea
          let actividadesCompletadas = 0;
          let puntosActividades = 0;
          try {
            const entregaResult = await pool.query(`
              SELECT 
                COUNT(*) as completadas,
                COALESCE(SUM(et.calificacion), 0) as total_puntos
              FROM public.entrega_tarea et
              JOIN public.actividad act ON et.id_actividad = act.id_actividad
              WHERE et.id_estudiante = $1 
              AND act.id_tutoria = $2
              AND et.activo = TRUE
              AND et.estado = 'calificado'  -- Solo las calificadas
            `, [est.id_estudiante, id]);
            
            actividadesCompletadas = parseInt(entregaResult.rows[0]?.completadas) || 0;
            puntosActividades = parseFloat(entregaResult.rows[0]?.total_puntos) || 0;
          } catch (entregaError) {
            console.warn(`⚠️ Error calculando entregas:`, entregaError.message);
            actividadesCompletadas = 0;
            puntosActividades = 0;
          }

          // Calcular calificación acumulada
          const puntosTotales = puntosEvaluaciones + puntosActividades;
          const calificacionAcumulada = Math.min(puntosTotales, 100);

          return {
            ...est,
            calificacion_acumulada: calificacionAcumulada,
            puntos_evaluaciones: puntosEvaluaciones,
            puntos_actividades: puntosActividades,
            total_actividades: totalActividades,
            actividades_completadas: actividadesCompletadas
            // estado_pago y fecha_de_pago ya vienen de la consulta principal
          };
        } catch (error) {
          console.error(`❌ Error procesando estudiante ${est.id_inscripcion}:`, error);
          return {
            ...est,
            calificacion_acumulada: 0,
            puntos_evaluaciones: 0,
            puntos_actividades: 0,
            total_actividades: 0,
            actividades_completadas: 0
          };
        }
      })
    );

    console.log(`✅ Estudiantes procesados: ${estudiantesConCalificaciones.length}`);
    res.json(estudiantesConCalificaciones);

  } catch (error) {
    console.error("❌ Error crítico al obtener estudiantes completos:", error);
    res.status(500).json({ 
      error: "Error interno del servidor",
      detalle: error.message
    });
  }
});

// GET - Obtener inscripción del estudiante actual para una tutoría específica
router.get("/estudiante-actual/tutoria/:idTutoria", async (req, res) => {
  try {
    const { idTutoria } = req.params;
    
    // Asumiendo que tienes el ID del estudiante en el token JWT
    // O necesitas enviarlo desde el frontend
    const idEstudiante = req.user.id_estudiante; // O como lo tengas en tu token
    
    const result = await pool.query(
      `SELECT i.*, e.nombre, e.paterno, e.materno, e.email
       FROM public.inscripcion i
       JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante
       WHERE i.id_tutoria = $1 AND i.id_estudiante = $2 AND i.activo = TRUE
       AND i.estado_solicitud = 'inscrito'`,
      [idTutoria, idEstudiante]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No estás inscrito en esta tutoría o tu inscripción no está activa" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener inscripción del estudiante:", error.message);
    res.status(500).json({ error: "Error al obtener inscripción" });
  }
});
// GET - Verificar si el estudiante actual está inscrito en una tutoría específica
router.get("/verificar-estudiante/tutoria/:id_tutoria", async (req, res) => {
  try {
    const { id_tutoria } = req.params;
    const user = req.user;

    console.log('🔍 Verificando inscripción para:', {
      usuario: user.email,
      id_tutoria: id_tutoria,
      rol: user.id_rol
    });

    // Solo estudiantes pueden usar este endpoint
    if (user.id_rol !== 4) {
      return res.status(403).json({ 
        error: "Solo los estudiantes pueden usar este endpoint",
        inscrito: false 
      });
    }

    // Buscar al estudiante por email del usuario
    const estudianteResult = await pool.query(
      "SELECT id_estudiante FROM public.estudiante WHERE email = $1 AND activo = TRUE",
      [user.email]
    );

    if (estudianteResult.rows.length === 0) {
      console.log('❌ Estudiante no encontrado para email:', user.email);
      return res.status(404).json({ 
        error: "Estudiante no encontrado",
        inscrito: false 
      });
    }

    const id_estudiante = estudianteResult.rows[0].id_estudiante;
    console.log('🎓 ID Estudiante encontrado:', id_estudiante);

    // Verificar inscripción en la tutoría
    const inscripcionResult = await pool.query(
      `SELECT i.*, t.nombre_tutoria, t.sigla,
              CASE 
                WHEN i.estado_solicitud = 'inscrito' THEN true
                ELSE false
              END as esta_inscrito
       FROM public.inscripcion i
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       WHERE i.id_estudiante = $1 
         AND i.id_tutoria = $2 
         AND i.activo = TRUE
       ORDER BY i.fecha_inscripcion DESC
       LIMIT 1`,
      [id_estudiante, id_tutoria]
    );

    if (inscripcionResult.rows.length === 0) {
      console.log('❌ No hay inscripción activa encontrada');
      return res.json({ 
        inscrito: false,
        mensaje: "No estás inscrito en esta tutoría"
      });
    }

    const inscripcion = inscripcionResult.rows[0];
    const estaInscrito = inscripcion.esta_inscrito;
    
    console.log('✅ Estado de inscripción:', {
      inscrito: estaInscrito,
      estado_solicitud: inscripcion.estado_solicitud,
      estado_inscripcion: inscripcion.estado_inscripcion
    });

    res.json({
      inscrito: estaInscrito,
      estado_solicitud: inscripcion.estado_solicitud,
      estado_inscripcion: inscripcion.estado_inscripcion,
      fecha_inscripcion: inscripcion.fecha_inscripcion,
      tutoria: {
        nombre: inscripcion.nombre_tutoria,
        sigla: inscripcion.sigla
      }
    });
    
  } catch (error) {
    console.error("Error al verificar inscripción:", error.message);
    res.status(500).json({ 
      error: "Error al verificar inscripción",
      inscrito: false 
    });
  }
});
export default router;