// routes/tutorias.js
import { Router } from "express";
import pool from "../db.js";
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// ✅ GET - Obtener todas las tutorías con información completa (filtrado por rol y vista)
router.get("/", async (req, res) => {
  try {
    const { vista } = req.query; // 'todas' o 'mis-tutorias'
    
    let query = `
      SELECT 
        t.*, 
        tu.nombre as tutor_nombre,
        tu.apellido_paterno as tutor_apellido_paterno,
        tu.apellido_materno as tutor_apellido_materno,
        tu.email as tutor_email,
        tu.especialidad as tutor_especialidad,
        tu.id_usuario as tutor_id_usuario,
        i.nombre as institucion_nombre,
        i.direccion as institucion_direccion,
        i.id_usuario_gerente,
        COUNT(DISTINCT ins.id_inscripcion) as inscritos_actuales,
        (t.cupo - COUNT(DISTINCT ins.id_inscripcion)) as cupos_disponibles
      FROM tutoria t
      JOIN tutor tu ON t.id_tutor = tu.id_tutor AND tu.activo = TRUE
      JOIN institucion i ON t.id_institucion = i.id_institucion AND i.activo = TRUE
      LEFT JOIN inscripcion ins ON t.id_tutoria = ins.id_tutoria AND ins.activo = TRUE
    `;

    let whereConditions = ["t.activo = TRUE"];
    let params = [];
    let paramCount = 1;

    // 🔥 NUEVO: Si es tutor y solicita "mis-tutorias", filtrar solo sus tutorías
    if (req.user.id_rol === 3 && vista === 'mis-tutorias') {
      const tutorResult = await pool.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [req.user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0) {
        return res.json([]); // No es tutor activo
      }
      
      const idTutorUsuario = tutorResult.rows[0].id_tutor;
      whereConditions.push(`t.id_tutor = $${paramCount}`);
      params.push(idTutorUsuario);
      paramCount++;
    }
    // Si es tutor pero solicita "todas", mostrar todas (sin filtrar por tutor)
    else if (req.user.id_rol === 3 && vista === 'todas') {
      // No agregamos filtro por tutor, mostramos todas
    }
    // Si es gerente, solo mostrar tutorías de su institución
    else if (req.user.id_rol === 2) {
      whereConditions.push(`i.id_usuario_gerente = $${paramCount}`);
      params.push(req.user.id_usuario);
      paramCount++;
    }

    // Agregar condiciones WHERE
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    query += `
      GROUP BY t.id_tutoria, tu.id_tutor, i.id_institucion
      ORDER BY t.nombre_tutoria
    `;

    console.log("🔍 Query ejecutada:", query);
    console.log("🔍 Parámetros:", params);
    console.log("🔍 Vista solicitada:", vista);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener tutorías:", error.message);
    res.status(500).json({ error: "Error al obtener tutorías" });
  }
});

// ✅ GET - Obtener una tutoria por ID con información completa (PERMITIR VER DETALLES A TODOS)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = `
      SELECT 
        t.*, 
        tu.nombre as tutor_nombre,
        tu.apellido_paterno as tutor_apellido_paterno,
        tu.apellido_materno as tutor_apellido_materno,
        tu.email as tutor_email,
        tu.especialidad as tutor_especialidad,
        tu.nivel_academico as tutor_nivel_academico,
        tu.celular as tutor_celular,
        tu.id_usuario as tutor_id_usuario,
        i.nombre as institucion_nombre,
        i.direccion as institucion_direccion,
        i.telefono as institucion_telefono,
        i.id_usuario_gerente,
        COUNT(DISTINCT ins.id_inscripcion) as inscritos_actuales,
        (t.cupo - COUNT(DISTINCT ins.id_inscripcion)) as cupos_disponibles,
        -- 🔥 CORREGIDO: Campos para verificación de permisos
        CASE 
          WHEN $2::integer = tu.id_usuario THEN TRUE 
          ELSE FALSE 
        END as tutor_pertenece_al_usuario,
        CASE 
          WHEN $2::integer = i.id_usuario_gerente THEN TRUE 
          ELSE FALSE 
        END as gerente_pertenece_a_institucion
      FROM tutoria t
      JOIN tutor tu ON t.id_tutor = tu.id_tutor AND tu.activo = TRUE
      JOIN institucion i ON t.id_institucion = i.id_institucion AND i.activo = TRUE
      LEFT JOIN inscripcion ins ON t.id_tutoria = ins.id_tutoria AND ins.activo = TRUE
      WHERE t.id_tutoria = $1 AND t.activo = TRUE
    `;

    let params = [id, req.user.id_usuario];
    
    // 🔥 CORREGIDO: ELIMINAR las restricciones para tutores - permitir ver detalles de cualquier tutoría
    // Solo mantener restricciones para gerentes
    if (req.user.id_rol === 2) {
      // Gerente: solo puede ver tutorías de SU institución
      query += ` AND i.id_usuario_gerente = $3`;
      params.push(req.user.id_usuario);
    }

    query += ` GROUP BY t.id_tutoria, tu.id_tutor, i.id_institucion, tu.id_usuario, i.id_usuario_gerente`;

    console.log("🔍 Query detalles:", query);
    console.log("🔍 Parámetros detalles:", params);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tutoría no encontrada" });
    }

    // Obtener asignaciones (visibles para todos)
    const asignaciones = await pool.query(`
      SELECT 
        a.*,
        au.lugar as aula_lugar,
        au.tipo_aula as aula_tipo,
        au.capacidad as aula_capacidad,
        au.id_institucion as aula_id_institucion,
        i.nombre as institucion_nombre
      FROM asigna a
      JOIN aula au ON a.id_aula = au.id_aula AND au.activo = TRUE
      JOIN institucion i ON au.id_institucion = i.id_institucion
      WHERE a.id_tutoria = $1 AND a.activo = TRUE
      ORDER BY a.dia, a.hora_inicio
    `, [id]);

    // 🔥 CORREGIDO: Obtener estudiantes inscritos SOLO si tiene permisos
    let estudiantes = [];
    const tutoriaInfo = result.rows[0];
    
    // Verificar permisos para ver estudiantes
    const puedeVerEstudiantes = 
      req.user.id_rol === 1 || // Admin ve todo
      (req.user.id_rol === 2 && tutoriaInfo.id_usuario_gerente === req.user.id_usuario) || // Gerente de la institución
      (req.user.id_rol === 3 && tutoriaInfo.tutor_pertenece_al_usuario); // Tutor dueño de la tutoría

    if (puedeVerEstudiantes) {
      estudiantes = await pool.query(`
        SELECT 
          ins.*,
          e.nombre as estudiante_nombre,
          e.paterno as estudiante_paterno,
          e.materno as estudiante_materno,
          e.email as estudiante_email,
          e.carrera as estudiante_carrera
        FROM inscripcion ins
        JOIN estudiante e ON ins.id_estudiante = e.id_estudiante AND e.activo = TRUE
        WHERE ins.id_tutoria = $1 AND ins.activo = TRUE
        ORDER BY e.paterno, e.materno, e.nombre
      `, [id]);
    }

    const tutoriaCompleta = {
      ...tutoriaInfo,
      asignaciones: asignaciones.rows,
      estudiantes: estudiantes.rows,
      // 🔥 NUEVO: Incluir información de permisos en la respuesta
      permisos: {
        puede_ver_estudiantes: puedeVerEstudiantes,
        puede_gestionar_horarios: 
          req.user.id_rol === 1 || 
          (req.user.id_rol === 2 && tutoriaInfo.id_usuario_gerente === req.user.id_usuario) ||
          (req.user.id_rol === 3 && tutoriaInfo.tutor_pertenece_al_usuario),
        puede_inscribir_estudiantes: 
          req.user.id_rol === 1 || 
          (req.user.id_rol === 2 && tutoriaInfo.id_usuario_gerente === req.user.id_usuario) ||
          (req.user.id_rol === 3 && tutoriaInfo.tutor_pertenece_al_usuario)
      }
    };

    res.json(tutoriaCompleta);
  } catch (error) {
    console.error("❌ Error al obtener tutoría:", error.message);
    res.status(500).json({ error: "Error al obtener tutoría" });
  }
});

// ✅ POST - Crear una nueva tutoria (SOLO ADMIN Y GESTORES de la institución)
router.post("/", async (req, res) => {
  // Verificar permisos
  if (req.user.id_rol !== 1 && req.user.id_rol !== 2) {
    return res.status(403).json({ error: "Acceso denegado. Solo administradores y gerentes pueden crear tutorías." });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { sigla, nombre_tutoria, cupo, descripcion_tutoria, id_tutor, id_institucion } = req.body;
    
    // Validaciones
    if (!sigla || !nombre_tutoria || !cupo || !id_tutor || !id_institucion) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "Todos los campos obligatorios deben ser completados" });
    }

    if (cupo < 1) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "El cupo debe ser mayor a 0" });
    }
    
    // Si es gerente, verificar que está creando en SU institución
    if (req.user.id_rol === 2) {
      const institucionGerente = await client.query(
        "SELECT id_institucion FROM institucion WHERE id_institucion = $1 AND id_usuario_gerente = $2",
        [id_institucion, req.user.id_usuario]
      );
      
      if (institucionGerente.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para crear tutorías en esta institución" });
      }
    }
    
    // Validar que el tutor existe y está activo
    const tutor = await client.query(
      "SELECT * FROM tutor WHERE id_tutor = $1 AND activo = TRUE",
      [id_tutor]
    );
    
    if (tutor.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Tutor no encontrado o deshabilitado" });
    }
    
    // Validar que la institución existe y está activa
    const institucion = await client.query(
      "SELECT * FROM institucion WHERE id_institucion = $1 AND activo = TRUE",
      [id_institucion]
    );
    
    if (institucion.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Institución no encontrada o deshabilitada" });
    }
    
    // Verificar si ya existe una tutoría con la misma sigla en la misma institución
    const tutoriaExistente = await client.query(
      "SELECT * FROM tutoria WHERE sigla = $1 AND id_institucion = $2 AND activo = TRUE",
      [sigla, id_institucion]
    );
    
    if (tutoriaExistente.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "Ya existe una tutoría con esta sigla en la misma institución" });
    }
    
    const result = await client.query(
      `INSERT INTO tutoria (sigla, nombre_tutoria, cupo, descripcion_tutoria, id_tutor, id_institucion, activo) 
       VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING *`,
      [sigla, nombre_tutoria, cupo, descripcion_tutoria, id_tutor, id_institucion]
    );
    
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error al crear tutoría:", error.message);
    res.status(500).json({ error: "Error al crear tutoría" });
  } finally {
    client.release();
  }
});

// ✅ PUT - Actualizar una tutoria (ADMIN, GERENTE o TUTOR de la tutoría)
router.put("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { sigla, nombre_tutoria, cupo, descripcion_tutoria, id_tutor, id_institucion } = req.body;

    // Primero obtener la tutoría actual para verificar permisos
    const tutoriaActual = await client.query(`
      SELECT t.*, i.id_usuario_gerente, tu.id_usuario as tutor_id_usuario
      FROM tutoria t 
      JOIN institucion i ON t.id_institucion = i.id_institucion 
      JOIN tutor tu ON t.id_tutor = tu.id_tutor
      WHERE t.id_tutoria = $1 AND t.activo = TRUE
    `, [id]);
    
    if (tutoriaActual.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Tutoría no encontrada" });
    }

    const tutoria = tutoriaActual.rows[0];

    // 🔥 NUEVO: Verificar permisos para tutores
    if (req.user.id_rol === 3) {
      // Tutor solo puede editar SUS tutorías
      const tutorResult = await pool.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [req.user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No se encontró información del tutor" });
      }
      
      const idTutorUsuario = tutorResult.rows[0].id_tutor;
      if (tutoria.id_tutor !== idTutorUsuario) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para editar esta tutoría" });
      }
    }
    // Verificar permisos para gerentes
    else if (req.user.id_rol === 2) {
      // Gerente solo puede editar tutorías de SU institución
      if (tutoria.id_usuario_gerente !== req.user.id_usuario) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para editar esta tutoría" });
      }
      
      // Gerente no puede cambiar la institución de la tutoría
      if (id_institucion && id_institucion !== tutoria.id_institucion) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No puedes cambiar la institución de la tutoría" });
      }
    }

    // Validar cupo no menor a los inscritos actuales
    const inscritos = await client.query(
      "SELECT COUNT(*) as total FROM inscripcion WHERE id_tutoria = $1 AND activo = TRUE",
      [id]
    );
    
    const totalInscritos = parseInt(inscritos.rows[0].total);
    if (cupo < totalInscritos) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `El cupo no puede ser menor al número de inscritos actuales (${totalInscritos})` 
      });
    }

    // 🔥 NUEVO: Para tutores, usar los valores actuales de id_tutor e id_institucion
    let idTutorFinal = id_tutor;
    let idInstitucionFinal = id_institucion;

    if (req.user.id_rol === 3) {
      // Tutor no puede cambiar el tutor ni la institución
      idTutorFinal = tutoria.id_tutor;
      idInstitucionFinal = tutoria.id_institucion;
    } else if (req.user.id_rol === 2) {
      // Gerente no puede cambiar la institución
      idInstitucionFinal = tutoria.id_institucion;
    }

    // Validaciones de tutor e institución (solo para admin/gerente)
    if (idTutorFinal && req.user.id_rol !== 3) { // Los tutores no cambian el tutor
      const tutor = await client.query(
        "SELECT * FROM tutor WHERE id_tutor = $1 AND activo = TRUE",
        [idTutorFinal]
      );
      
      if (tutor.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: "Tutor no encontrado o deshabilitado" });
      }
    }
    
    if (idInstitucionFinal && req.user.id_rol === 1) { // Solo admin puede cambiar institución
      const institucion = await client.query(
        "SELECT * FROM institucion WHERE id_institucion = $1 AND activo = TRUE",
        [idInstitucionFinal]
      );
      
      if (institucion.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: "Institución no encontrada o deshabilitada" });
      }
    }

    // Verificar sigla única si se está cambiando
    if (sigla && sigla !== tutoria.sigla) {
      const siglaExistente = await client.query(
        "SELECT * FROM tutoria WHERE sigla = $1 AND id_institucion = $2 AND activo = TRUE AND id_tutoria != $3",
        [sigla, idInstitucionFinal, id]
      );
      
      if (siglaExistente.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: "Ya existe una tutoría con esta sigla en la misma institución" });
      }
    }

    const result = await client.query(
      `UPDATE tutoria 
       SET sigla=$1, nombre_tutoria=$2, cupo=$3, descripcion_tutoria=$4, id_tutor=$5, id_institucion=$6 
       WHERE id_tutoria=$7 AND activo = TRUE RETURNING *`,
      [sigla, nombre_tutoria, cupo, descripcion_tutoria, idTutorFinal, idInstitucionFinal, id]
    );

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error al actualizar tutoría:", error.message);
    res.status(500).json({ error: "Error al actualizar tutoría" });
  } finally {
    client.release();
  }
});
// ✅ PATCH - Cambiar estado de tutoría (ADMIN o GERENTE de la institución)
router.patch("/:id/estado", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { activo } = req.body;
    
    if (typeof activo !== 'boolean') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "El campo 'activo' es requerido y debe ser booleano" });
    }

    // Primero obtener la tutoría para verificar permisos
    const tutoria = await client.query(`
      SELECT t.*, i.id_usuario_gerente 
      FROM tutoria t 
      JOIN institucion i ON t.id_institucion = i.id_institucion 
      WHERE t.id_tutoria = $1
    `, [id]);

    if (tutoria.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Tutoría no encontrada" });
    }

    // Verificar permisos
    if (req.user.id_rol === 2) {
      // Gerente solo puede cambiar estado de tutorías de SU institución
      if (tutoria.rows[0].id_usuario_gerente !== req.user.id_usuario) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para cambiar el estado de esta tutoría" });
      }
    }

    // Si se está desactivando, verificar que no tenga inscripciones activas
    if (!activo) {
      const inscripciones = await client.query(
        "SELECT COUNT(*) as total FROM inscripcion WHERE id_tutoria = $1 AND activo = TRUE",
        [id]
      );
      
      if (parseInt(inscripciones.rows[0].total) > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: "No se puede desactivar la tutoría porque tiene inscripciones activas" 
        });
      }
    }

    const result = await client.query(
      `UPDATE tutoria SET activo = $1 
       WHERE id_tutoria = $2 RETURNING *`,
      [activo, id]
    );

    await client.query('COMMIT');
    res.json({ 
      mensaje: `Tutoría ${activo ? 'activada' : 'desactivada'} correctamente`,
      tutoria: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error al cambiar estado de tutoría:", error.message);
    res.status(500).json({ error: "Error al cambiar estado de tutoría" });
  } finally {
    client.release();
  }
});

// ✅ DELETE - Eliminar tutoría (SOLO ADMIN)
router.delete("/:id", async (req, res) => {
  // Solo admin puede eliminar
  if (req.user.id_rol !== 1) {
    return res.status(403).json({ error: "Acceso denegado. Solo administradores pueden eliminar tutorías." });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Verificar que no tenga dependencias
    const dependencias = await client.query(
      `SELECT 
        (SELECT COUNT(*) FROM inscripcion WHERE id_tutoria = $1) as total_inscripciones,
        (SELECT COUNT(*) FROM actividad WHERE id_tutoria = $1) as total_actividades,
        (SELECT COUNT(*) FROM asigna WHERE id_tutoria = $1) as total_asignaciones`,
      [id]
    );
    
    const { total_inscripciones, total_actividades, total_asignaciones } = dependencias.rows[0];
    
    if (parseInt(total_inscripciones) > 0 || parseInt(total_actividades) > 0 || parseInt(total_asignaciones) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: "No se puede eliminar la tutoría porque tiene inscripciones, actividades o asignaciones asociadas" 
      });
    }
    
    const result = await client.query(
      "DELETE FROM tutoria WHERE id_tutoria = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Tutoría no encontrada" });
    }

    await client.query('COMMIT');
    res.json({ 
      mensaje: "Tutoría eliminada correctamente",
      tutoria: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error al eliminar tutoría:", error.message);
    res.status(500).json({ error: "Error al eliminar tutoría" });
  } finally {
    client.release();
  }
});

// ✅ GET - Obtener instituciones para select (filtrado para gerentes)
router.get("/recursos/instituciones", async (req, res) => {
  try {
    let query = `
      SELECT id_institucion, nombre, direccion
      FROM institucion 
      WHERE activo = TRUE 
    `;

    let params = [];

    // Si es gerente, solo mostrar SU institución
    if (req.user.id_rol === 2) {
      query += ` AND id_usuario_gerente = $1`;
      params.push(req.user.id_usuario);
    }

    query += ` ORDER BY nombre`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener instituciones:", error.message);
    res.status(500).json({ error: "Error al obtener instituciones" });
  }
});

// Mantener los otros endpoints igual...
// ✅ GET - Obtener tutores activos para select
router.get("/recursos/tutores", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_tutor, nombre, apellido_paterno, apellido_materno, email, especialidad
      FROM tutor 
      WHERE activo = TRUE 
      ORDER BY nombre, apellido_paterno
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener tutores:", error.message);
    res.status(500).json({ error: "Error al obtener tutores" });
  }
});

export default router;