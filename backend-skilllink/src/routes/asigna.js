import { Router } from "express";
import pool from "../db.js";

const router = Router();


// GET - Verificar disponibilidad de aula
router.get("/disponibilidad", async (req, res) => {
  try {
    const { id_aula, dia, hora_inicio, hora_fin, id_tutoria } = req.query;
    
    const result = await pool.query(
      `SELECT * FROM public.asigna 
       WHERE id_aula = $1 AND dia = $2 AND activo = TRUE
       AND (
         (hora_inicio <= $3 AND hora_fin > $3) OR
         (hora_inicio < $4 AND hora_fin >= $4) OR
         (hora_inicio >= $3 AND hora_fin <= $4)
       )
       AND id_tutoria != $5`,
      [id_aula, dia, hora_inicio, hora_fin, id_tutoria || 0]
    );
    
    res.json({ 
      disponible: result.rows.length === 0,
      conflictos: result.rows 
    });
  } catch (error) {
    console.error("Error al verificar disponibilidad:", error.message);
    res.status(500).json({ error: "Error al verificar disponibilidad" });
  }
});

// GET - Aulas disponibles para un día y horario específico
router.get("/aulas-disponibles", async (req, res) => {
  try {
    const { dia, hora_inicio, hora_fin, id_institucion } = req.query;
    
    let query = `
      SELECT a.*, i.nombre as institucion_nombre
      FROM public.aula a
      JOIN public.institucion i ON a.id_institucion = i.id_institucion
      WHERE a.activo = TRUE 
      AND a.id_aula NOT IN (
        SELECT id_aula FROM public.asigna 
        WHERE dia = $1 AND activo = TRUE
        AND (
          (hora_inicio <= $2 AND hora_fin > $2) OR
          (hora_inicio < $3 AND hora_fin >= $3) OR
          (hora_inicio >= $2 AND hora_fin <= $3)
        )
      )
    `;
    
    let params = [dia, hora_inicio, hora_fin];
    
    if (id_institucion) {
      query += " AND a.id_institucion = $4";
      params.push(id_institucion);
    }
    
    query += " ORDER BY a.lugar, a.tipo_aula";
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener aulas disponibles:", error.message);
    res.status(500).json({ error: "Error al obtener aulas disponibles" });
  }
});

// GET - Horarios disponibles para un aula específica
router.get("/horarios-disponibles/:id_aula", async (req, res) => {
  try {
    const { id_aula } = req.params;
    const { dia } = req.query;
    
    // Obtener horarios ocupados
    const horariosOcupados = await pool.query(
      `SELECT hora_inicio, hora_fin 
       FROM public.asigna 
       WHERE id_aula = $1 AND dia = $2 AND activo = TRUE
       ORDER BY hora_inicio`,
      [id_aula, dia]
    );
    
    // Generar horarios disponibles (de 7:00 a 22:00 en intervalos de 1 hora)
    const horariosDisponibles = [];
    const horas = Array.from({ length: 16 }, (_, i) => i + 7); // 7:00 a 22:00
    
    for (let i = 0; i < horas.length - 1; i++) {
      const hora_inicio = `${horas[i].toString().padStart(2, '0')}:00`;
      const hora_fin = `${(horas[i] + 1).toString().padStart(2, '0')}:00`;
      
      // Verificar si este horario está disponible
      const tieneConflicto = horariosOcupados.rows.some(ocupado => {
        const inicioOcupado = ocupado.hora_inicio;
        const finOcupado = ocupado.hora_fin;
        
        return (
          (hora_inicio < finOcupado && hora_fin > inicioOcupado)
        );
      });
      
      if (!tieneConflicto) {
        horariosDisponibles.push({
          hora_inicio,
          hora_fin,
          label: `${hora_inicio} - ${hora_fin}`
        });
      }
    }
    
    res.json(horariosDisponibles);
  } catch (error) {
    console.error("Error al obtener horarios disponibles:", error.message);
    res.status(500).json({ error: "Error al obtener horarios disponibles" });
  }
});
// GET - Asignaciones por tutor
router.get("/tutor/:id_tutor", async (req, res) => {
  try {
    const { id_tutor } = req.params;
    
    const result = await pool.query(
      `SELECT a.*, t.nombre_tutoria, t.descripcion_tutoria, 
              au.lugar, au.tipo_aula, i.nombre as institucion_nombre
       FROM public.asigna a
       JOIN public.tutoria t ON a.id_tutoria = t.id_tutoria
       JOIN public.aula au ON a.id_aula = au.id_aula
       JOIN public.institucion i ON au.id_institucion = i.id_institucion
       WHERE a.id_tutor = $1 AND a.activo = TRUE
       ORDER BY a.dia, a.hora_inicio`,
      [id_tutor]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener asignaciones del tutor:", error.message);
    res.status(500).json({ error: "Error al obtener asignaciones del tutor" });
  }
});
// GET - Todas las asignaciones (solo las activas)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, t.nombre_tutoria, tu.nombre as tutor_nombre, au.lugar, au.tipo_aula
      FROM public.asigna a
      JOIN public.tutoria t ON a.id_tutoria = t.id_tutoria
      JOIN public.tutor tu ON a.id_tutor = tu.id_tutor
      JOIN public.aula au ON a.id_aula = au.id_aula
      WHERE a.activo = TRUE
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener asignaciones:", error.message);
    res.status(500).json({ error: "Error al obtener asignaciones" });
  }
});

// GET - Asignación por IDs compuestos (solo si está activa)
router.get("/:id_aula/:id_tutoria/:id_tutor", async (req, res) => {
  try {
    const { id_aula, id_tutoria, id_tutor } = req.params;
    const result = await pool.query(
      `SELECT a.*, t.nombre_tutoria, tu.nombre as tutor_nombre, au.lugar, au.tipo_aula
       FROM public.asigna a
       JOIN public.tutoria t ON a.id_tutoria = t.id_tutoria
       JOIN public.tutor tu ON a.id_tutor = tu.id_tutor
       JOIN public.aula au ON a.id_aula = au.id_aula
       WHERE a.id_aula = $1 AND a.id_tutoria = $2 AND a.id_tutor = $3 AND a.activo = TRUE`,
      [id_aula, id_tutoria, id_tutor]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Asignación no encontrada" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener asignación" });
  }
});

// POST - Crear asignación (se crea como activa por defecto)
// POST - Crear asignación con validación de disponibilidad
router.post("/", async (req, res) => {
  try {
    const { id_aula, id_tutoria, id_tutor, hora_inicio, hora_fin, dia } = req.body;
    
    // Validar que el horario sea válido
    if (hora_inicio >= hora_fin) {
      return res.status(400).json({ error: "La hora de inicio debe ser anterior a la hora de fin" });
    }
    
    // Verificar disponibilidad
    const disponibilidad = await pool.query(
      `SELECT * FROM public.asigna 
       WHERE id_aula = $1 AND dia = $2 AND activo = TRUE
       AND (
         (hora_inicio <= $3 AND hora_fin > $3) OR
         (hora_inicio < $4 AND hora_fin >= $4) OR
         (hora_inicio >= $3 AND hora_fin <= $4)
       )`,
      [id_aula, dia, hora_inicio, hora_fin]
    );
    
    if (disponibilidad.rows.length > 0) {
      return res.status(400).json({ 
        error: "El aula no está disponible en el horario seleccionado",
        conflictos: disponibilidad.rows 
      });
    }
    
    // Verificar que el tutor no tenga otra asignación en el mismo horario
    const conflictoTutor = await pool.query(
      `SELECT * FROM public.asigna 
       WHERE id_tutor = $1 AND dia = $2 AND activo = TRUE
       AND (
         (hora_inicio <= $3 AND hora_fin > $3) OR
         (hora_inicio < $4 AND hora_fin >= $4) OR
         (hora_inicio >= $3 AND hora_fin <= $4)
       )`,
      [id_tutor, dia, hora_inicio, hora_fin]
    );
    
    if (conflictoTutor.rows.length > 0) {
      return res.status(400).json({ 
        error: "Ya tienes una asignación en este horario",
        conflictos: conflictoTutor.rows 
      });
    }
    
    // Crear la asignación
    const result = await pool.query(
      `INSERT INTO public.asigna (id_aula, id_tutoria, id_tutor, hora_inicio, hora_fin, dia, activo) 
       VALUES ($1, $2, $3, $4, $5, $6, TRUE) RETURNING *`,
      [id_aula, id_tutoria, id_tutor, hora_inicio, hora_fin, dia]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear asignación:", error.message);
    res.status(500).json({ error: "Error al crear asignación" });
  }
});

// PUT - Actualizar asignación (solo si está activa)
// PUT - Actualizar asignación con validación de disponibilidad
router.put("/:id_aula/:id_tutoria/:id_tutor", async (req, res) => {
  try {
    const { id_aula, id_tutoria, id_tutor } = req.params;
    const { hora_inicio, hora_fin, dia, nueva_id_aula } = req.body;
    
    // Validar que el horario sea válido
    if (hora_inicio >= hora_fin) {
      return res.status(400).json({ error: "La hora de inicio debe ser anterior a la hora de fin" });
    }
    
    const aulaId = nueva_id_aula || id_aula;
    
    // Verificar disponibilidad (excluyendo la asignación actual)
    const disponibilidad = await pool.query(
      `SELECT * FROM public.asigna 
       WHERE id_aula = $1 AND dia = $2 AND activo = TRUE
       AND (
         (hora_inicio <= $3 AND hora_fin > $3) OR
         (hora_inicio < $4 AND hora_fin >= $4) OR
         (hora_inicio >= $3 AND hora_fin <= $4)
       )
       AND (id_aula != $5 OR id_tutoria != $6 OR id_tutor != $7)`,
      [aulaId, dia, hora_inicio, hora_fin, id_aula, id_tutoria, id_tutor]
    );
    
    if (disponibilidad.rows.length > 0) {
      return res.status(400).json({ 
        error: "El aula no está disponible en el horario seleccionado",
        conflictos: disponibilidad.rows 
      });
    }
    
    // Verificar que el tutor no tenga otra asignación en el mismo horario
    const conflictoTutor = await pool.query(
      `SELECT * FROM public.asigna 
       WHERE id_tutor = $1 AND dia = $2 AND activo = TRUE
       AND (
         (hora_inicio <= $3 AND hora_fin > $3) OR
         (hora_inicio < $4 AND hora_fin >= $4) OR
         (hora_inicio >= $3 AND hora_fin <= $4)
       )
       AND (id_aula != $5 OR id_tutoria != $6 OR id_tutor != $7)`,
      [id_tutor, dia, hora_inicio, hora_fin, id_aula, id_tutoria, id_tutor]
    );
    
    if (conflictoTutor.rows.length > 0) {
      return res.status(400).json({ 
        error: "Ya tienes una asignación en este horario",
        conflictos: conflictoTutor.rows 
      });
    }
    
    // Actualizar la asignación
    const result = await pool.query(
      `UPDATE public.asigna 
       SET hora_inicio=$1, hora_fin=$2, dia=$3, id_aula=$4
       WHERE id_aula=$5 AND id_tutoria=$6 AND id_tutor=$7 AND activo = TRUE 
       RETURNING *`,
      [hora_inicio, hora_fin, dia, aulaId, id_aula, id_tutoria, id_tutor]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Asignación no encontrada" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar asignación:", error.message);
    res.status(500).json({ error: "Error al actualizar asignación" });
  }
});


// DELETE - Eliminación lógica (soft delete)
router.delete("/:id_aula/:id_tutoria/:id_tutor", async (req, res) => {
  try {
    const { id_aula, id_tutoria, id_tutor } = req.params;
    
    // En lugar de DELETE, hacemos un UPDATE para marcar como inactivo
    const result = await pool.query(
      `UPDATE public.asigna SET activo = FALSE 
       WHERE id_aula = $1 AND id_tutoria = $2 AND id_tutor = $3 AND activo = TRUE 
       RETURNING *`,
      [id_aula, id_tutoria, id_tutor]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Asignación no encontrada o ya está eliminada" });
    }

    res.json({ 
      mensaje: "Asignación deshabilitada correctamente",
      asignacion: result.rows[0] 
    });
  } catch (error) {
    res.status(500).json({ error: "Error al deshabilitar asignación" });
  }
});

// OPCIONAL: Endpoint para reactivar una asignación
router.patch("/:id_aula/:id_tutoria/:id_tutor/activar", async (req, res) => {
  try {
    const { id_aula, id_tutoria, id_tutor } = req.params;
    
    const result = await pool.query(
      `UPDATE public.asigna SET activo = TRUE 
       WHERE id_aula = $1 AND id_tutoria = $2 AND id_tutor = $3 
       RETURNING *`,
      [id_aula, id_tutoria, id_tutor]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Asignación no encontrada" });
    }

    res.json({ 
      mensaje: "Asignación reactivada correctamente",
      asignacion: result.rows[0] 
    });
  } catch (error) {
    res.status(500).json({ error: "Error al reactivar asignación" });
  }
});
// Los demás endpoints permanecen igual...
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, t.nombre_tutoria, tu.nombre as tutor_nombre, au.lugar, au.tipo_aula
      FROM public.asigna a
      JOIN public.tutoria t ON a.id_tutoria = t.id_tutoria
      JOIN public.tutor tu ON a.id_tutor = tu.id_tutor
      JOIN public.aula au ON a.id_aula = au.id_aula
      WHERE a.activo = TRUE
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener asignaciones:", error.message);
    res.status(500).json({ error: "Error al obtener asignaciones" });
  }
});
export default router;