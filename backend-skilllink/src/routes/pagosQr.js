// routes/pagosQr.js - VERSIÓN COMPLETAMENTE CORREGIDA
import { Router } from "express";
import pool from "../db.js";
import QRCode from 'qrcode';
import { createCanvas, loadImage } from 'canvas';
import { verificarToken } from '../middlewares/authMiddleware.js';

// ✅ CORRECTO: Inicializar router PRIMERO
const router = Router();

// ✅ CORRECTO: Aplicar middleware DESPUÉS de inicializar router
router.use(verificarToken);

// Configuración para QR
const QR_CONFIG = {
  width: 300,
  height: 300,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
};

// POST - Crear pago QR corregido
router.post("/", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { monto, id_inscripcion, concepto } = req.body;
    
    // Validar campos requeridos
    if (!monto || !id_inscripcion) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "Monto e ID de inscripción son requeridos" });
    }
    
    // Verificar si la inscripción existe y está activa
    const inscripcion = await client.query(
      `SELECT i.*, e.nombre as estudiante_nombre, e.paterno, 
              t.nombre_tutoria, t.sigla, t.id_tutor
       FROM public.inscripcion i
       JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       WHERE i.id_inscripcion = $1 AND i.activo = TRUE`,
      [id_inscripcion]
    );
    
    if (inscripcion.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Inscripción no encontrada" });
    }

    const inscripcionData = inscripcion.rows[0];
    
    // Generar datos únicos para el pago
    const codigoTransaccion = `TUT${Date.now()}${Math.random().toString(36).substr(2, 6)}`.toUpperCase();
    const fechaExpiracion = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas
    
    // Crear datos estructurados para el QR (más compacto)
    const qrData = {
      t: "PAGO_TUTORIA",
      c: codigoTransaccion,
      m: parseFloat(monto),
      mon: "BOB",
      con: concepto || `Tutoría ${inscripcionData.sigla}`,
      ben: "OLAR",
      est: `${inscripcionData.estudiante_nombre} ${inscripcionData.paterno}`,
      ref: `TUT${inscripcionData.id_tutoria}`,
      exp: fechaExpiracion.toISOString().split('T')[0] // Solo la fecha
    };

    // Generar código QR
    const qrImageBuffer = await generarQR(JSON.stringify(qrData));
    const qrBase64 = qrImageBuffer.toString('base64');

    // Insertar pago en la base de datos - fecha_de_pago como NULL inicialmente
    const result = await client.query(
      `INSERT INTO public.pago_qr (
        monto, fecha_de_pago, codigo_qr, id_inscripcion, activo,
        estado_pago, codigo_transaccion, fecha_expiracion, qr_imagen, concepto
      ) VALUES ($1, NULL, $2, $3, TRUE, 'pendiente', $4, $5, $6, $7) RETURNING *`,
      [
        monto, 
        codigoTransaccion, // Solo el código en codigo_qr
        id_inscripcion, 
        codigoTransaccion, 
        fechaExpiracion, 
        qrBase64,
        concepto || `Tutoría ${inscripcionData.sigla} - ${inscripcionData.nombre_tutoria}`
      ]
    );

    await client.query('COMMIT');
    
    res.status(201).json({
      ...result.rows[0],
      qr_imagen: qrBase64,
      datos_qr: qrData
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al crear pago QR:", error.message);
    res.status(500).json({ error: "Error al crear pago QR: " + error.message });
  } finally {
    client.release();
  }
});

// Función para generar QR simplificada
async function generarQR(qrString) {
  const canvas = createCanvas(QR_CONFIG.width, QR_CONFIG.height);
  const ctx = canvas.getContext('2d');

  // Generar QR básico
  const qrDataURL = await QRCode.toDataURL(qrString, {
    width: QR_CONFIG.width,
    margin: QR_CONFIG.margin,
    color: {
      dark: QR_CONFIG.color.dark,
      light: QR_CONFIG.color.light
    }
  });

  // Cargar QR en canvas
  const qrImage = await loadImage(qrDataURL);
  ctx.drawImage(qrImage, 0, 0, QR_CONFIG.width, QR_CONFIG.height);

  // Agregar logo simulado (símbolo de dólar en el centro)
  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', QR_CONFIG.width / 2, QR_CONFIG.height / 2);

  // Agregar texto inferior
  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('OLAR TUTORÍAS', QR_CONFIG.width / 2, QR_CONFIG.height - 15);

  return canvas.toBuffer();
}

// POST - Simular pago (para desarrollo) - CORREGIDO
router.post("/:id/simular-pago", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Buscar pago pendiente
    const pago = await client.query(
      `SELECT * FROM public.pago_qr 
       WHERE nro_pago = $1 AND estado_pago = 'pendiente' AND activo = TRUE`,
      [id]
    );
    
    if (pago.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Pago no encontrado o ya procesado" });
    }

    // Simular procesamiento de pago
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Actualizar pago como completado - AHORA SÍ se establece fecha_de_pago
    const result = await client.query(
      `UPDATE public.pago_qr 
       SET estado_pago = 'completado', fecha_de_pago = NOW()
       WHERE nro_pago = $1 RETURNING *`,
      [id]
    );

    // Actualizar estado de inscripción a aprobada
    await client.query(
      `UPDATE public.inscripcion 
       SET estado_inscripcion = 'aprobada', fecha_aprobacion = NOW()
       WHERE id_inscripcion = $1`,
      [pago.rows[0].id_inscripcion]
    );

    await client.query('COMMIT');
    
    res.json({
      mensaje: "Pago simulado exitosamente",
      pago: result.rows[0],
      comprobante: {
        numero: `CMP-${Date.now()}`,
        fecha: new Date().toISOString(),
        monto: pago.rows[0].monto,
        estado: "APROBADO"
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error al simular pago:", error.message);
    res.status(500).json({ error: "Error al simular pago" });
  } finally {
    client.release();
  }
});

// GET - Obtener estado del pago
router.get("/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT p.*, i.estado_inscripcion, t.nombre_tutoria, e.nombre as estudiante_nombre
       FROM public.pago_qr p
       JOIN public.inscripcion i ON p.id_inscripcion = i.id_inscripcion
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante
       WHERE p.nro_pago = $1 AND p.activo = TRUE`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Pago no encontrado" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener estado del pago:", error.message);
    res.status(500).json({ error: "Error al obtener estado del pago" });
  }
});

// GET - Obtener pagos del estudiante autenticado - MEJORADO
// GET - Obtener pagos según el rol del usuario
// GET - Obtener pagos según el rol del usuario - VERSIÓN CORREGIDA
router.get("/estudiante/mis-pagos", async (req, res) => {
  try {
    console.log('🔐 Usuario autenticado:', req.user);
    
    const user = req.user;
    
    // Verificar que el usuario esté autenticado
    if (!user) {
      return res.status(401).json({ 
        error: "Usuario no autenticado"
      });
    }

    let query = ``;
    let params = [];
    let role = '';

    // Determinar la consulta según el rol
    if (user.id_rol === 4) { 
      // ESTUDIANTE - Buscar id_estudiante basado en id_usuario
      role = 'estudiante';
      
      // Primero, obtener el id_estudiante del usuario
      const estudianteResult = await pool.query(
        `SELECT id_estudiante FROM public.estudiante 
         WHERE id_usuario = $1 AND activo = TRUE`,
        [user.id_usuario]
      );
      
      if (estudianteResult.rows.length === 0) {
        return res.status(403).json({ 
          error: "No se encontró información del estudiante",
          detalles: "El usuario no tiene un estudiante asociado"
        });
      }
      
      const id_estudiante = estudianteResult.rows[0].id_estudiante;
      console.log('🎓 ID Estudiante encontrado:', id_estudiante);
      
      query = `
        SELECT p.*, 
               i.id_tutoria, 
               t.nombre_tutoria, 
               t.sigla,
               e.nombre as estudiante_nombre, 
               e.paterno as estudiante_paterno,
               inst.nombre as institucion_nombre
        FROM public.pago_qr p
        JOIN public.inscripcion i ON p.id_inscripcion = i.id_inscripcion
        JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
        JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante
        JOIN public.institucion inst ON t.id_institucion = inst.id_institucion
        WHERE i.id_estudiante = $1 AND p.activo = TRUE
        ORDER BY p.nro_pago DESC
      `;
      params = [id_estudiante];
      
    } else if (user.id_rol === 3) { 
      // TUTOR - pagos de estudiantes en sus tutorías
      role = 'tutor';
      
      // Primero, obtener el id_tutor del usuario
      const tutorResult = await pool.query(
        `SELECT id_tutor FROM public.tutor 
         WHERE id_usuario = $1 AND activo = TRUE`,
        [user.id_usuario]
      );
      
      if (tutorResult.rows.length === 0) {
        return res.status(403).json({ 
          error: "No se encontró información del tutor",
          detalles: "El usuario no tiene un tutor asociado"
        });
      }
      
      const id_tutor = tutorResult.rows[0].id_tutor;
      console.log('👨‍🏫 ID Tutor encontrado:', id_tutor);
      
      query = `
        SELECT p.*, 
               i.id_tutoria, 
               t.nombre_tutoria, 
               t.sigla,
               e.nombre as estudiante_nombre, 
               e.paterno as estudiante_paterno,
               e.email as estudiante_email,
               inst.nombre as institucion_nombre
        FROM public.pago_qr p
        JOIN public.inscripcion i ON p.id_inscripcion = i.id_inscripcion
        JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
        JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante
        JOIN public.institucion inst ON t.id_institucion = inst.id_institucion
        WHERE t.id_tutor = $1 AND p.activo = TRUE
        ORDER BY p.nro_pago DESC
      `;
      params = [id_tutor];
      
    } else if (user.id_rol === 2) { 
      // GERENTE - pagos de su institución
      role = 'gerente';
      query = `
        SELECT p.*, 
               i.id_tutoria, 
               t.nombre_tutoria, 
               t.sigla,
               e.nombre as estudiante_nombre, 
               e.paterno as estudiante_paterno,
               e.email as estudiante_email,
               inst.nombre as institucion_nombre,
               tutor.nombre as tutor_nombre
        FROM public.pago_qr p
        JOIN public.inscripcion i ON p.id_inscripcion = i.id_inscripcion
        JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
        JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante
        JOIN public.institucion inst ON t.id_institucion = inst.id_institucion
        JOIN public.tutor tutor ON t.id_tutor = tutor.id_tutor
        WHERE inst.id_usuario_gerente = $1 AND p.activo = TRUE
        ORDER BY p.nro_pago DESC
      `;
      params = [user.id_usuario];
      
    } else if (user.id_rol === 1) { 
      // ADMIN - todos los pagos
      role = 'admin';
      query = `
        SELECT p.*, 
               i.id_tutoria, 
               t.nombre_tutoria, 
               t.sigla,
               e.nombre as estudiante_nombre, 
               e.paterno as estudiante_paterno,
               e.email as estudiante_email,
               inst.nombre as institucion_nombre,
               tutor.nombre as tutor_nombre
        FROM public.pago_qr p
        JOIN public.inscripcion i ON p.id_inscripcion = i.id_inscripcion
        JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
        JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante
        JOIN public.institucion inst ON t.id_institucion = inst.id_institucion
        JOIN public.tutor tutor ON t.id_tutor = tutor.id_tutor
        WHERE p.activo = TRUE
        ORDER BY p.nro_pago DESC
      `;
      params = [];
      
    } else {
      return res.status(403).json({ 
        error: "No tienes permisos para acceder a estos pagos",
        detalles: `Rol no autorizado: ${user.id_rol}`,
        usuario: user
      });
    }

    console.log(`📋 Buscando pagos para ${role}. Consulta:`, query.substring(0, 100) + '...');
    console.log(`📋 Parámetros:`, params);
    
    const result = await pool.query(query, params);
    
    console.log(`✅ Pagos encontrados para ${role}:`, result.rows.length);
    
    // Agregar información del rol a la respuesta
    const responseData = {
      pagos: result.rows,
      metadata: {
        total: result.rows.length,
        rol: role,
        usuario: {
          id: user.id_usuario,
          rol: user.id_rol,
          nombre: user.nombre || user.username
        }
      }
    };
    
    res.json(responseData);
    
  } catch (error) {
    console.error("❌ Error al obtener pagos:", error.message);
    res.status(500).json({ 
      error: "Error al obtener pagos",
      detalles: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET - Endpoint de prueba (sin autenticación requerida)
router.get("/test", (req, res) => {
  res.json({ 
    mensaje: "✅ Router de pagos funcionando correctamente",
    timestamp: new Date().toISOString(),
    endpoints: {
      mis_pagos: "GET /estudiante/mis-pagos",
      test_pagos: "GET /estudiante/test-pagos",
      estado_pago: "GET /:id/estado",
      simular_pago: "POST /:id/simular-pago"
    }
  });
});

// GET - Endpoint de prueba con datos (para testing)
router.get("/estudiante/test-pagos", async (req, res) => {
  try {
    // Usar un ID de estudiante fijo para testing
    const id_estudiante = 1; // Cambia por un ID que exista en tu base de datos
    
    console.log('🧪 Testing pagos para estudiante ID:', id_estudiante);
    
    const result = await pool.query(
      `SELECT p.*, 
              i.id_tutoria, 
              t.nombre_tutoria, 
              t.sigla,
              e.nombre as estudiante_nombre, 
              e.paterno as estudiante_paterno
       FROM public.pago_qr p
       JOIN public.inscripcion i ON p.id_inscripcion = i.id_inscripcion
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante
       WHERE i.id_estudiante = $1 AND p.activo = TRUE
       ORDER BY p.nro_pago DESC`,
      [id_estudiante]
    );
    
    console.log('✅ Pagos de test encontrados:', result.rows.length);
    res.json({
      mensaje: "Datos de prueba",
      estudiante_id: id_estudiante,
      total_pagos: result.rows.length,
      pagos: result.rows
    });
  } catch (error) {
    console.error("❌ Error en endpoint de test:", error.message);
    res.status(500).json({ 
      error: "Error en test",
      detalles: error.message 
    });
  }
});

// GET - Obtener pagos por inscripción
router.get("/inscripcion/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT p.*, i.estado_inscripcion, t.nombre_tutoria, e.nombre as estudiante_nombre
       FROM public.pago_qr p
       JOIN public.inscripcion i ON p.id_inscripcion = i.id_inscripcion
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante
       WHERE p.id_inscripcion = $1 AND p.activo = TRUE
       ORDER BY p.nro_pago DESC`,
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener pagos de la inscripción:", error.message);
    res.status(500).json({ error: "Error al obtener pagos" });
  }
});

// GET - Obtener pagos del estudiante con información completa
router.get("/estudiante/mis-pagos-completos", async (req, res) => {
  try {
    const id_estudiante = req.user.id_estudiante;
    
    const result = await pool.query(
      `SELECT 
        p.*, 
        i.id_tutoria, 
        t.nombre_tutoria, 
        t.sigla,
        t.descripcion_tutoria,
        e.nombre as estudiante_nombre, 
        e.paterno as estudiante_paterno,
        e.materno as estudiante_materno,
        e.email as estudiante_email,
        e.carrera,
        tu.nombre as tutor_nombre,
        tu.apellido_paterno as tutor_apellido
       FROM public.pago_qr p
       JOIN public.inscripcion i ON p.id_inscripcion = i.id_inscripcion
       JOIN public.tutoria t ON i.id_tutoria = t.id_tutoria
       JOIN public.estudiante e ON i.id_estudiante = e.id_estudiante
       JOIN public.tutor tu ON t.id_tutor = tu.id_tutor
       WHERE i.id_estudiante = $1 AND p.activo = TRUE
       ORDER BY p.nro_pago DESC`,
      [id_estudiante]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener pagos del estudiante:", error.message);
    res.status(500).json({ error: "Error al obtener pagos" });
  }
});

export default router;