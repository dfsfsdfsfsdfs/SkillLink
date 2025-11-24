// routes/tutores-tutoria.js
import { Router } from "express";
import pool from "../db.js";
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// ✅ GET - Obtener todos los tutores con información de tutorías (filtrado por rol)
router.get("/", async (req, res) => {
  try {
    let query = `
      SELECT 
        t.*,
        COUNT(DISTINCT tut.id_tutoria) as total_tutorias,
        COUNT(DISTINCT CASE WHEN tut.activo = TRUE THEN tut.id_tutoria END) as tutorias_activas,
        STRING_AGG(DISTINCT 
          CASE WHEN tut.activo = TRUE THEN 
            CONCAT(tut.nombre_tutoria, ' (', i.nombre, ')') 
          END, ', '
        ) as tutorias_asignadas,
        i.nombre as institucion_nombre,
        i.id_usuario_gerente
      FROM tutor t
      LEFT JOIN tutoria tut ON t.id_tutor = tut.id_tutor
      LEFT JOIN institucion i ON tut.id_institucion = i.id_institucion
    `;

    let whereConditions = ["t.activo = TRUE"];
    let params = [];

    // Si es gerente, solo mostrar tutores de su institución
    if (req.user.id_rol === 2) {
      whereConditions.push("(i.id_usuario_gerente = $1 OR tut.id_tutor IS NULL)");
      params.push(req.user.id_usuario);
    }

    // Agregar condiciones WHERE
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    query += `
      GROUP BY t.id_tutor, i.nombre, i.id_usuario_gerente
      ORDER BY t.nombre, t.apellido_paterno
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener tutores:", error.message);
    res.status(500).json({ error: "Error al obtener tutores" });
  }
});

// ✅ GET - Obtener tutorías disponibles para asignar a un tutor
router.get("/tutorias-disponibles/:tutorId", async (req, res) => {
  try {
    const { tutorId } = req.params;
    
    let query = `
      SELECT 
        tut.*,
        i.nombre as institucion_nombre,
        i.id_usuario_gerente
      FROM tutoria tut
      JOIN institucion i ON tut.id_institucion = i.id_institucion
      WHERE tut.activo = TRUE 
        AND tut.id_tutor IS NULL
    `;

    let params = [];

    // Si es gerente, solo mostrar tutorías de su institución
    if (req.user.id_rol === 2) {
      query += ` AND i.id_usuario_gerente = $1`;
      params.push(req.user.id_usuario);
    }

    query += ` ORDER BY tut.nombre_tutoria`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener tutorías disponibles:", error.message);
    res.status(500).json({ error: "Error al obtener tutorías disponibles" });
  }
});

// ✅ POST - Asignar tutor a tutoría (SOLO ADMIN Y GESTORES de la institución)
router.post("/asignar", async (req, res) => {
  // Verificar permisos
  if (req.user.id_rol !== 1 && req.user.id_rol !== 2) {
    return res.status(403).json({ error: "Acceso denegado. Solo administradores y gerentes pueden asignar tutores." });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { tutorId, tutoriaId } = req.body;
    
    // Validaciones
    if (!tutorId || !tutoriaId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "ID de tutor y tutoría son requeridos" });
    }

    // Verificar que el tutor existe y está activo
    const tutor = await client.query(
      "SELECT * FROM tutor WHERE id_tutor = $1 AND activo = TRUE",
      [tutorId]
    );
    
    if (tutor.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Tutor no encontrado o deshabilitado" });
    }
    
    // Verificar que la tutoría existe y está activa
    const tutoria = await client.query(`
      SELECT t.*, i.id_usuario_gerente 
      FROM tutoria t 
      JOIN institucion i ON t.id_institucion = i.id_institucion 
      WHERE t.id_tutoria = $1 AND t.activo = TRUE
    `, [tutoriaId]);
    
    if (tutoria.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Tutoría no encontrada o deshabilitada" });
    }

    // Verificar permisos específicos
    if (req.user.id_rol === 2) {
      // Gerente solo puede asignar a tutorías de SU institución
      if (tutoria.rows[0].id_usuario_gerente !== req.user.id_usuario) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para asignar tutores a esta tutoría" });
      }
    }

    // Verificar que la tutoría no tenga ya un tutor asignado
    if (tutoria.rows[0].id_tutor) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "Esta tutoría ya tiene un tutor asignado" });
    }

    // Asignar el tutor a la tutoría
    const result = await client.query(
      `UPDATE tutoria SET id_tutor = $1 
       WHERE id_tutoria = $2 AND activo = TRUE 
       RETURNING *`,
      [tutorId, tutoriaId]
    );
    
    await client.query('COMMIT');
    res.json({ 
      mensaje: "Tutor asignado correctamente a la tutoría",
      tutoria: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error al asignar tutor:", error.message);
    res.status(500).json({ error: "Error al asignar tutor" });
  } finally {
    client.release();
  }
});

// ✅ DELETE - Remover tutor de tutoría (SOLO ADMIN Y GESTORES de la institución)
router.delete("/remover/:tutoriaId", async (req, res) => {
  // Verificar permisos
  if (req.user.id_rol !== 1 && req.user.id_rol !== 2) {
    return res.status(403).json({ error: "Acceso denegado. Solo administradores y gerentes pueden remover tutores." });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { tutoriaId } = req.params;
    
    // Verificar que la tutoría existe
    const tutoria = await client.query(`
      SELECT t.*, i.id_usuario_gerente 
      FROM tutoria t 
      JOIN institucion i ON t.id_institucion = i.id_institucion 
      WHERE t.id_tutoria = $1 AND t.activo = TRUE
    `, [tutoriaId]);
    
    if (tutoria.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Tutoría no encontrada" });
    }

    // Verificar permisos específicos
    if (req.user.id_rol === 2) {
      // Gerente solo puede remover tutores de SU institución
      if (tutoria.rows[0].id_usuario_gerente !== req.user.id_usuario) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para remover tutores de esta tutoría" });
      }
    }

    // Verificar que la tutoría tenga un tutor asignado
    if (!tutoria.rows[0].id_tutor) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "Esta tutoría no tiene un tutor asignado" });
    }

    // Remover el tutor de la tutoría
    const result = await client.query(
      `UPDATE tutoria SET id_tutor = NULL 
       WHERE id_tutoria = $1 AND activo = TRUE 
       RETURNING *`,
      [tutoriaId]
    );
    
    await client.query('COMMIT');
    res.json({ 
      mensaje: "Tutor removido correctamente de la tutoría",
      tutoria: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error al remover tutor:", error.message);
    res.status(500).json({ error: "Error al remover tutor" });
  } finally {
    client.release();
  }
});

// ✅ PATCH - Activar/desactivar tutor (SOLO ADMIN)
router.patch("/:id/estado", async (req, res) => {
  // Solo admin puede activar/desactivar tutores
  if (req.user.id_rol !== 1) {
    return res.status(403).json({ error: "Acceso denegado. Solo administradores pueden activar/desactivar tutores." });
  }

  try {
    const { id } = req.params;
    const { activo } = req.body;
    
    if (typeof activo !== 'boolean') {
      return res.status(400).json({ error: "El campo 'activo' es requerido y debe ser booleano" });
    }

    // Si se está desactivando, verificar que no tenga tutorías activas
    if (!activo) {
      const tutorias = await pool.query(
        "SELECT COUNT(*) as total FROM tutoria WHERE id_tutor = $1 AND activo = TRUE",
        [id]
      );
      
      if (parseInt(tutorias.rows[0].total) > 0) {
        return res.status(400).json({ 
          error: "No se puede desactivar el tutor porque tiene tutorías activas asignadas" 
        });
      }
    }

    const result = await pool.query(
      `UPDATE tutor SET activo = $1 
       WHERE id_tutor = $2 RETURNING *`,
      [activo, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tutor no encontrado" });
    }

    res.json({ 
      mensaje: `Tutor ${activo ? 'activado' : 'desactivado'} correctamente`,
      tutor: result.rows[0]
    });
  } catch (error) {
    console.error("❌ Error al cambiar estado del tutor:", error.message);
    res.status(500).json({ error: "Error al cambiar estado del tutor" });
  }
});

export default router;