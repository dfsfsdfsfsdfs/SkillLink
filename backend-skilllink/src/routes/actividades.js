import { Router } from "express";
import pool from "../db.js";
import { verificarToken } from '../middlewares/authMiddleware.js'; 

const router = Router();
router.use(verificarToken); // 
// GET - Todas las actividades (solo las activas)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, t.nombre_tutoria, tu.nombre as tutor_nombre
      FROM public.actividad a
      JOIN public.tutoria t ON a.id_tutoria = t.id_tutoria
      LEFT JOIN public.tutor tu ON a.id_tutor = tu.id_tutor
      WHERE a.activo = TRUE
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener actividades:", error.message);
    res.status(500).json({ error: "Error al obtener actividades" });
  }
});

// GET - Actividad por ID (solo si está activa)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT a.*, t.nombre_tutoria, tu.nombre as tutor_nombre
       FROM public.actividad a
       JOIN public.tutoria t ON a.id_tutoria = t.id_tutoria
       LEFT JOIN public.tutor tu ON a.id_tutor = tu.id_tutor
       WHERE a.id_actividad = $1 AND a.activo = TRUE`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Actividad no encontrada" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener actividad" });
  }
});

// GET - Actividades por tutoria (solo activas)
router.get("/tutoria/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT a.*, tu.nombre as tutor_nombre
       FROM public.actividad a
       LEFT JOIN public.tutor tu ON a.id_tutor = tu.id_tutor
       WHERE a.id_tutoria = $1 AND a.activo = TRUE`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener actividades" });
  }
});

// POST - Crear actividad (CON VERIFICACIÓN DE PERMISOS)
router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { nombre, descripcion, fecha_publicacion, fecha_presentacion, nota_act, id_tutoria, id_tutor } = req.body;
    const user = req.user;

    console.log('🔍 Creando actividad - Usuario:', {
      id_usuario: user.id_usuario,
      id_rol: user.id_rol,
      id_tutoria: id_tutoria
    });

    // Validar campos requeridos
    if (!nombre || !id_tutoria) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: "Nombre de la actividad y ID de tutoría son requeridos" 
      });
    }

    // 🔥 NUEVO: Verificar permisos para crear actividad en esta tutoría
    // Primero obtener información de la tutoría
    const tutoriaResult = await client.query(
      `SELECT t.*, i.id_usuario_gerente, tu.id_usuario as tutor_id_usuario
       FROM public.tutoria t
       JOIN public.institucion i ON t.id_institucion = i.id_institucion
       JOIN public.tutor tu ON t.id_tutor = tu.id_tutor
       WHERE t.id_tutoria = $1 AND t.activo = TRUE`,
      [id_tutoria]
    );

    if (tutoriaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Tutoría no encontrada o deshabilitada" });
    }

    const tutoria = tutoriaResult.rows[0];

    // Verificar permisos según rol
    let tienePermiso = false;

    if (user.id_rol === 1) { // Admin
      tienePermiso = true;
    } 
    else if (user.id_rol === 2) { // Gerente
      // Gerente solo si la tutoría es de su institución
      tienePermiso = tutoria.id_usuario_gerente === user.id_usuario;
      if (!tienePermiso) {
        console.log('❌ Gerente sin permisos:', {
          gerente_institucion: tutoria.id_usuario_gerente,
          usuario_actual: user.id_usuario
        });
      }
    } 
    else if (user.id_rol === 3) { // Tutor
      // Tutor solo si está dando esa tutoría
      const tutorResult = await client.query(
        "SELECT id_tutor FROM tutor WHERE id_usuario = $1 AND activo = TRUE",
        [user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0) {
        tienePermiso = false;
      } else {
        tienePermiso = tutoria.id_tutor === tutorResult.rows[0].id_tutor;
      }
      
      if (!tienePermiso) {
        console.log('❌ Tutor sin permisos:', {
          tutor_tutoria: tutoria.id_tutor,
          tutor_usuario: tutorResult.rows[0]?.id_tutor
        });
      }
    }

    if (!tienePermiso) {
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        error: "No tienes permisos para crear actividades en esta tutoría" 
      });
    }

    console.log('✅ Permisos verificados - Creando actividad...');

    // Obtener el ID del tutor (si no se proporciona, usar el tutor de la tutoría)
    let tutorId = id_tutor;
    if (!tutorId) {
      tutorId = tutoria.id_tutor;
    }

    // Crear la actividad
    const result = await client.query(
      `INSERT INTO public.actividad 
       (nombre, descripcion, fecha_publicacion, fecha_presentacion, nota_act, id_tutoria, id_tutor, activo) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE) 
       RETURNING *`,
      [nombre, descripcion, fecha_publicacion, fecha_presentacion, nota_act, id_tutoria, tutorId]
    );

    await client.query('COMMIT');
    console.log('✅ Actividad creada exitosamente');
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("❌ Error al crear actividad:", error.message);
    res.status(500).json({ 
      error: "Error al crear actividad",
      detalles: error.message 
    });
  } finally {
    client.release();
  }
});


// PUT - Actualizar actividad (solo si está activa)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, fecha_publicacion, fecha_presentacion, nota_act, id_tutor } = req.body;
    
    const result = await pool.query(
      `UPDATE public.actividad 
       SET nombre=$1, descripcion=$2, fecha_publicacion=$3, fecha_presentacion=$4, nota_act=$5, id_tutor=$6 
       WHERE id_actividad=$7 AND activo = TRUE RETURNING *`,
      [nombre, descripcion, fecha_publicacion, fecha_presentacion, nota_act, id_tutor, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Actividad no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar actividad" });
  }
});

// DELETE - Eliminación lógica (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // En lugar de DELETE, hacemos un UPDATE para marcar como inactivo
    const result = await pool.query(
      "UPDATE public.actividad SET activo = FALSE WHERE id_actividad = $1 AND activo = TRUE RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Actividad no encontrada o ya está eliminada" });
    }

    res.json({ 
      mensaje: "Actividad deshabilitada correctamente",
      actividad: result.rows[0] 
    });
  } catch (error) {
    res.status(500).json({ error: "Error al deshabilitar actividad" });
  }
});

// OPCIONAL: Endpoint para reactivar una actividad
router.patch("/:id/activar", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      "UPDATE public.actividad SET activo = TRUE WHERE id_actividad = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Actividad no encontrada" });
    }

    res.json({ 
      mensaje: "Actividad reactivada correctamente",
      actividad: result.rows[0] 
    });
  } catch (error) {
    res.status(500).json({ error: "Error al reactivar actividad" });
  }
});

export default router;