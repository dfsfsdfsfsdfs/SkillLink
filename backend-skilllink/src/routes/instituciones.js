// routes/instituciones.js
import { Router } from "express";
import pool from "../db.js";
import { verificarToken, verificarRol } from '../middlewares/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configuración de multer para subida de archivos
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG, GIF y WebP.'), false);
    }
  }
});
router.get("/public/activas", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id_institucion, nombre FROM public.institucion WHERE activo = TRUE ORDER BY nombre"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener instituciones públicas:", error.message);
    res.status(500).json({ error: "Error al obtener instituciones" });
  }
});
// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// POST - Subir logo para institución
router.post('/:id/logo', upload.single('logo'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    
    if (!req.file) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "No se proporcionó ningún archivo" });
    }

    // Convertir imagen a base64
    const base64Image = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    // Actualizar institución con el logo
    const result = await client.query(
      `UPDATE public.institucion 
       SET logo_base64 = $1 
       WHERE id_institucion = $2 
       RETURNING id_institucion, nombre, logo_base64`,
      [dataUrl, id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Institución no encontrada" });
    }

    await client.query('COMMIT');
    res.json({
      mensaje: "Logo actualizado correctamente",
      institucion: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al subir logo:", error.message);
    res.status(500).json({ error: "Error al subir logo: " + error.message });
  } finally {
    client.release();
  }
});

// DELETE - Eliminar logo de institución
router.delete('/:id/logo', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const result = await client.query(
      `UPDATE public.institucion 
       SET logo_base64 = NULL 
       WHERE id_institucion = $1 
       RETURNING id_institucion, nombre`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Institución no encontrada" });
    }

    await client.query('COMMIT');
    res.json({
      mensaje: "Logo eliminado correctamente",
      institucion: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al eliminar logo:", error.message);
    res.status(500).json({ error: "Error al eliminar logo" });
  } finally {
    client.release();
  }
});

router.get("/", async (req, res) => {
  try {
    let query;
    let params = [];
    
    if (req.user.id_rol === 1) {
      query = "SELECT * FROM public.institucion ORDER BY id_institucion";
    } else if (req.user.id_rol === 2) {
      query = "SELECT * FROM public.institucion WHERE id_usuario_gerente = $1 ORDER BY id_institucion";
      params = [req.user.id_usuario];
    } else {
      query = "SELECT * FROM public.institucion WHERE activo = TRUE ORDER BY id_institucion";
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener instituciones:", error.message);
    res.status(500).json({ error: "Error al obtener instituciones" });
  }
});
// GET - Institución del gerente actual
router.get("/gerente/mi-institucion", async (req, res) => {
  try {
    // Solo gerentes pueden acceder a esta ruta
    if (req.user.id_rol !== 2) {
      return res.status(403).json({ error: "Acceso denegado. Solo para gerentes." });
    }

    const result = await pool.query(
      "SELECT * FROM public.institucion WHERE id_usuario_gerente = $1",
      [req.user.id_usuario]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No se encontró institución asignada" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener institución del gerente:", error.message);
    res.status(500).json({ error: "Error al obtener institución" });
  }
});

// GET - Institución por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let query = "SELECT * FROM public.institucion WHERE id_institucion = $1";
    let params = [id];
    
    // Si no es admin, mostrar solo si está activa
    if (req.user.id_rol !== 1) {
      query = "SELECT * FROM public.institucion WHERE id_institucion = $1 AND activo = TRUE";
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Institución no encontrada" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener institución:", error.message);
    res.status(500).json({ error: "Error al obtener institución" });
  }
});

// POST - Crear institución (actualizado para incluir logo)
router.post("/", verificarRol([1]), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { nombre, direccion, telefono, tipo_institucion, horario_atencion, id_usuario_gerente, logo_base64 } = req.body;
    
    if (!nombre) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "El nombre de la institución es requerido" });
    }
    
    const result = await client.query(
      `INSERT INTO public.institucion 
       (nombre, direccion, telefono, tipo_institucion, horario_atencion, activo, id_usuario_gerente, logo_base64) 
       VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7) RETURNING *`,
      [nombre, direccion, telefono, tipo_institucion, horario_atencion, id_usuario_gerente, logo_base64]
    );
    
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al crear institución:", error.message);
    res.status(500).json({ error: "Error al crear institución" });
  } finally {
    client.release();
  }
});


// PUT - Actualizar institución (actualizado para incluir logo)
router.put("/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { nombre, direccion, telefono, tipo_institucion, horario_atencion, id_usuario_gerente, logo_base64 } = req.body;
    
    // Verificar permisos
    let query;
    let params;
    
    if (req.user.id_rol === 1) {
      query = `UPDATE public.institucion 
               SET nombre=$1, direccion=$2, telefono=$3, tipo_institucion=$4, 
                   horario_atencion=$5, id_usuario_gerente=$6, logo_base64=$7
               WHERE id_institucion=$8 RETURNING *`;
      params = [nombre, direccion, telefono, tipo_institucion, horario_atencion, id_usuario_gerente, logo_base64, id];
    } else if (req.user.id_rol === 2) {
      // Verificar que la institución le pertenece
      const institucionCheck = await client.query(
        "SELECT id_institucion FROM public.institucion WHERE id_institucion = $1 AND id_usuario_gerente = $2",
        [id, req.user.id_usuario]
      );
      
      if (institucionCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: "No tienes permisos para editar esta institución" });
      }
      
      query = `UPDATE public.institucion 
               SET nombre=$1, direccion=$2, telefono=$3, tipo_institucion=$4, horario_atencion=$5, logo_base64=$6
               WHERE id_institucion=$7 AND id_usuario_gerente=$8 RETURNING *`;
      params = [nombre, direccion, telefono, tipo_institucion, horario_atencion, logo_base64, id, req.user.id_usuario];
    } else {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: "Acceso denegado" });
    }
    
    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Institución no encontrada" });
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al actualizar institución:", error.message);
    res.status(500).json({ error: "Error al actualizar institución" });
  } finally {
    client.release();
  }
});

// PATCH - Activar/Desactivar institución (SOLO ADMIN) - VERSIÓN COMPLETA CON REACTIVACIÓN
router.patch("/:id/estado", verificarRol([1]), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { activo, desactivar_dependencias = false, reactivar_dependencias = false } = req.body;
    
    if (typeof activo !== 'boolean') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "El campo 'activo' es requerido y debe ser booleano" });
    }
    
    // Obtener información de la institución
    const institucionResult = await client.query(
      "SELECT * FROM public.institucion WHERE id_institucion = $1",
      [id]
    );
    
    if (institucionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Institución no encontrada" });
    }
    
    const institucion = institucionResult.rows[0];
    const institucionNombre = institucion.nombre;
    
    // Declarar variables
    let aulasAfectadas = 0;
    let tutoriasAfectadas = 0;
    let aulasReactivadas = 0;
    let tutoriasReactivadas = 0;
    
    // SI SE ESTÁ DESACTIVANDO
    if (!activo) {
      console.log(`🔧 Desactivando institución "${institucionNombre}" (ID: ${id})`);
      
      // Verificar dependencias activas
      const aulas = await client.query(
        "SELECT COUNT(*) as total, ARRAY_AGG(id_aula) as ids FROM public.aula WHERE id_institucion = $1 AND activo = TRUE",
        [id]
      );
      
      const tutorias = await client.query(
        "SELECT COUNT(*) as total, ARRAY_AGG(id_tutoria) as ids FROM public.tutoria WHERE id_institucion = $1 AND activo = TRUE",
        [id]
      );
      
      aulasAfectadas = parseInt(aulas.rows[0].total) || 0;
      tutoriasAfectadas = parseInt(tutorias.rows[0].total) || 0;
      
      // Si hay dependencias activas
      if (aulasAfectadas > 0 || tutoriasAfectadas > 0) {
        // Si NO se pidió desactivar dependencias, mostrar error
        if (!desactivar_dependencias) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            error: "No se puede desactivar la institución porque tiene dependencias activas",
            detalles: {
              aulas_activas: aulasAfectadas,
              tutorias_activas: tutoriasAfectadas,
              necesita_confirmacion: true
            }
          });
        }
        
        // Si SÍ se pidió desactivar dependencias, proceder
        console.log(`   - Desactivando dependencias...`);
        
        // 1. Desactivar tutorías
        if (tutoriasAfectadas > 0) {
          console.log(`     • Desactivando ${tutoriasAfectadas} tutoría(s)`);
          const tutoriasResult = await client.query(
            "UPDATE public.tutoria SET activo = FALSE WHERE id_institucion = $1 AND activo = TRUE RETURNING id_tutoria",
            [id]
          );
          tutoriasAfectadas = tutoriasResult.rowCount || 0;
        }
        
        // 2. Desactivar aulas
        if (aulasAfectadas > 0) {
          console.log(`     • Desactivando ${aulasAfectadas} aula(s)`);
          const aulasResult = await client.query(
            "UPDATE public.aula SET activo = FALSE WHERE id_institucion = $1 AND activo = TRUE RETURNING id_aula",
            [id]
          );
          aulasAfectadas = aulasResult.rowCount || 0;
        }
        
        console.log(`✅ Dependencias desactivadas: ${aulasAfectadas} aulas, ${tutoriasAfectadas} tutorías`);
      }
    } 
    // SI SE ESTÁ ACTIVANDO
    else {
      console.log(`🔧 Activando institución "${institucionNombre}" (ID: ${id})`);
      
      // Verificar si hay dependencias inactivas que podrían reactivarse
      if (reactivar_dependencias) {
        const aulasInactivas = await client.query(
          "SELECT COUNT(*) as total FROM public.aula WHERE id_institucion = $1 AND activo = FALSE",
          [id]
        );
        
        const tutoriasInactivas = await client.query(
          "SELECT COUNT(*) as total FROM public.tutoria WHERE id_institucion = $1 AND activo = FALSE",
          [id]
        );
        
        const totalAulasInactivas = parseInt(aulasInactivas.rows[0].total) || 0;
        const totalTutoriasInactivas = parseInt(tutoriasInactivas.rows[0].total) || 0;
        
        console.log(`   - Encontradas: ${totalAulasInactivas} aulas inactivas, ${totalTutoriasInactivas} tutorías inactivas`);
        
        // Reactivar tutorías
        if (totalTutoriasInactivas > 0) {
          console.log(`     • Reactivando ${totalTutoriasInactivas} tutoría(s)`);
          const tutoriasResult = await client.query(
            "UPDATE public.tutoria SET activo = TRUE WHERE id_institucion = $1 AND activo = FALSE RETURNING id_tutoria",
            [id]
          );
          tutoriasReactivadas = tutoriasResult.rowCount || 0;
        }
        
        // Reactivar aulas
        if (totalAulasInactivas > 0) {
          console.log(`     • Reactivando ${totalAulasInactivas} aula(s)`);
          const aulasResult = await client.query(
            "UPDATE public.aula SET activo = TRUE WHERE id_institucion = $1 AND activo = FALSE RETURNING id_aula",
            [id]
          );
          aulasReactivadas = aulasResult.rowCount || 0;
        }
        
        console.log(`✅ Dependencias reactivadas: ${aulasReactivadas} aulas, ${tutoriasReactivadas} tutorías`);
      } else {
        console.log(`   - Modo normal: solo se activa la institución, no sus dependencias`);
      }
    }
    
    // Finalmente, cambiar el estado de la institución
    const result = await client.query(
      `UPDATE public.institucion SET activo = $1 
       WHERE id_institucion = $2 RETURNING *`,
      [activo, id]
    );

    await client.query('COMMIT');
    
    // Preparar respuesta
    const respuesta = { 
      mensaje: `Institución ${activo ? 'activada' : 'desactivada'} correctamente`,
      institucion: result.rows[0]
    };
    
    // Agregar detalles según la operación
    if (!activo && desactivar_dependencias) {
      respuesta.dependencias_desactivadas = true;
      respuesta.resumen = {
        aulas_desactivadas: aulasAfectadas,
        tutorias_desactivadas: tutoriasAfectadas
      };
    } else if (activo && reactivar_dependencias) {
      respuesta.dependencias_reactivadas = true;
      respuesta.resumen = {
        aulas_reactivadas: aulasReactivadas,
        tutorias_reactivadas: tutoriasReactivadas
      };
    }
    
    res.json(respuesta);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al cambiar estado de institución:", error.message);
    res.status(500).json({ 
      error: "Error al cambiar estado de institución",
      detalles: error.message 
    });
  } finally {
    client.release();
  }
});

// DELETE - Eliminar institución (SOLO ADMIN - eliminación física)
router.delete("/:id", verificarRol([1]), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Verificar que no tenga dependencias
    const dependencias = await client.query(
      `SELECT 
        (SELECT COUNT(*) FROM public.aula WHERE id_institucion = $1) as total_aulas,
        (SELECT COUNT(*) FROM public.tutoria WHERE id_institucion = $1) as total_tutorias`,
      [id]
    );
    
    const { total_aulas, total_tutorias } = dependencias.rows[0];
    
    if (parseInt(total_aulas) > 0 || parseInt(total_tutorias) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: "No se puede eliminar la institución porque tiene aulas o tutorías asociadas" 
      });
    }
    
    const result = await client.query(
      "DELETE FROM public.institucion WHERE id_institucion = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Institución no encontrada" });
    }

    await client.query('COMMIT');
    res.json({ 
      mensaje: "Institución eliminada correctamente",
      institucion: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al eliminar institución:", error.message);
    res.status(500).json({ error: "Error al eliminar institución" });
  } finally {
    client.release();
  }
});

// Los endpoints de aulas, tutorías y estadísticas se mantienen igual...
// GET - Aulas de la institución
router.get("/:id/aulas", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await client.query(
      "SELECT * FROM public.aula WHERE id_institucion = $1 AND activo = TRUE ORDER BY id_aula",
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener aulas de la institución:", error.message);
    res.status(500).json({ error: "Error al obtener aulas de la institución" });
  }
});

// GET - Estadísticas de la institución
router.get("/:id/estadisticas", async (req, res) => {
  try {
    const { id } = req.params;
    
    const estadisticas = await client.query(
      `SELECT 
        (SELECT COUNT(*) FROM public.aula WHERE id_institucion = $1 AND activo = TRUE) as total_aulas,
        (SELECT COUNT(*) FROM public.tutoria WHERE id_institucion = $1 AND activo = TRUE) as total_tutorias,
        (SELECT COUNT(*) FROM public.inscripcion i 
         JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria 
         WHERE t.id_institucion = $1 AND i.activo = TRUE) as total_inscripciones`,
      [id]
    );
    
    res.json(estadisticas.rows[0]);
  } catch (error) {
    console.error("Error al obtener estadísticas de la institución:", error.message);
    res.status(500).json({ error: "Error al obtener estadísticas de la institución" });
  }
});


export default router;