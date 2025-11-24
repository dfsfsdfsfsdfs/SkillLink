import pool from '../db.js';
import bcrypt from 'bcryptjs';

const usuarioController = {
    // Crear usuario y perfil específico
    crearUsuario: async (req, res) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const { username, password, email, id_rol, ...datosPerfil } = req.body;
            
            console.log('📥 Datos recibidos:', { username, email, id_rol, datosPerfil });
            
            // Verificar si usuario ya existe
            const usuarioExistente = await client.query(
                "SELECT * FROM public.usuario WHERE username = $1 OR email = $2",
                [username, email]
            );
            
            if (usuarioExistente.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'El usuario o email ya existe' });
            }

            // Hash password
            const saltRounds = 10;
            const password_hash = await bcrypt.hash(password, saltRounds);

            // Verificar si es el primer usuario
            const totalUsuarios = await client.query("SELECT COUNT(*) as total FROM public.usuario");
            const count = parseInt(totalUsuarios.rows[0].total);
            
            let usuarioData = {
                username,
                password_hash,
                email,
                id_rol: parseInt(id_rol)
            };

            console.log('🔍 Total usuarios:', count, 'Rol:', id_rol);

            // LÓGICA CORREGIDA: Solo admin, gerente y tutor requieren aprobación
            // Los estudiantes NUNCA requieren aprobación
            if (count === 0 && parseInt(id_rol) === 1) {
                // Primer usuario administrador - auto-aprobado
                usuarioData.activo = true;
                usuarioData.pendiente_aprobacion = false;
                console.log('👑 Primer administrador creado - Autoaprobado');
            } else if (parseInt(id_rol) === 4) {
                // Usuario estudiante - SIEMPRE auto-aprobado, sin necesidad de aprobación
                usuarioData.activo = true;
                usuarioData.pendiente_aprobacion = false;
                console.log('🎓 Estudiante creado - Autoaprobado');
            } else if ([1, 2, 3].includes(parseInt(id_rol))) {
                // Usuarios admin, gerente y tutor - pendientes de aprobación (excepto primer admin)
                usuarioData.activo = false;
                usuarioData.pendiente_aprobacion = true;
                console.log('👨‍🏫 Usuario requiere aprobación');
            } else {
                // Por defecto (para cualquier otro rol no especificado)
                usuarioData.activo = false;
                usuarioData.pendiente_aprobacion = true;
            }

            // Insertar usuario - CORREGIDO: agregar fecha_solicitud
            const usuarioResult = await client.query(
                `INSERT INTO public.usuario 
                 (username, password_hash, email, id_rol, activo, pendiente_aprobacion, fecha_solicitud) 
                 VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
                [usuarioData.username, usuarioData.password_hash, usuarioData.email, 
                 usuarioData.id_rol, usuarioData.activo, usuarioData.pendiente_aprobacion]
            );
            
            const usuarioCreado = usuarioResult.rows[0];
            console.log('✅ Usuario creado:', usuarioCreado.id_usuario);

            // Crear perfil específico según el rol
            let perfilCreado = null;
            
            switch (parseInt(id_rol)) {
                case 4: // Estudiante
                    console.log('📝 Creando perfil de estudiante:', datosPerfil);
                    // CORREGIDO: Asegurar que todos los campos requeridos estén presentes
                    const estudianteResult = await client.query(
                        `INSERT INTO public.estudiante 
                         (nombre, paterno, materno, celular, email, carrera, univer_institu, activo, id_usuario) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                        [
                            datosPerfil.nombre || '',
                            datosPerfil.paterno || '',
                            datosPerfil.materno || null,
                            datosPerfil.celular || null,
                            email, // Usar el mismo email del usuario
                            datosPerfil.carrera || '',
                            datosPerfil.univer_institu || '',
                            true, // activo
                            usuarioCreado.id_usuario // CORREGIDO: Guardar id_usuario
                        ]
                    );
                    perfilCreado = estudianteResult.rows[0];
                    console.log('✅ Estudiante creado con id_usuario:', usuarioCreado.id_usuario);
                    break;
                    
                case 3: // Tutor/Docente
                    console.log('📝 Creando perfil de tutor:', datosPerfil);
                    const tutorResult = await client.query(
                        `INSERT INTO public.tutor 
                         (nombre, apellido_paterno, apellido_materno, celular, email, especialidad, nivel_academico, activo, id_usuario) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
                        [
                            datosPerfil.nombre || '',
                            datosPerfil.apellido_paterno || '',
                            datosPerfil.apellido_materno || null,
                            datosPerfil.celular || null,
                            email,
                            datosPerfil.especialidad || '',
                            datosPerfil.nivel_academico || '',
                            true, // activo
                            usuarioCreado.id_usuario // CORREGIDO: Guardar id_usuario
                        ]
                    );
                    perfilCreado = tutorResult.rows[0];
                    console.log('✅ Tutor creado con id_usuario:', usuarioCreado.id_usuario);
                    break;
                    
                case 2: // Gerente (Institución)
                    console.log('📝 Creando perfil de institución:', datosPerfil);
                    const institucionResult = await client.query(
                        `INSERT INTO public.institucion 
                         (nombre, direccion, telefono, tipo_institucion, horario_atencion, activo, id_usuario_gerente) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                        [
                            datosPerfil.nombre_institucion || '',
                            datosPerfil.direccion || null,
                            datosPerfil.telefono || null,
                            datosPerfil.tipo_institucion || '',
                            datosPerfil.horario_atencion || null,
                            true, // activo
                            usuarioCreado.id_usuario // CORREGIDO: Guardar id_usuario
                        ]
                    );
                    perfilCreado = institucionResult.rows[0];
                    console.log('✅ Institución creada con id_usuario_gerente:', usuarioCreado.id_usuario);
                    break;
                    
                case 1: // Administrador
                    console.log('👑 Administrador creado - Sin perfil específico');
                    perfilCreado = { mensaje: 'Perfil de administrador creado' };
                    break;
                    
                default:
                    console.warn('⚠️ Rol no reconocido:', id_rol);
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: 'Rol no válido' });
            }
            
            await client.query('COMMIT');
            
            // Mensajes personalizados según el tipo de usuario
            let mensaje = '';
            if (count === 0 && parseInt(id_rol) === 1) {
                mensaje = 'Usuario administrador creado exitosamente.';
            } else if (parseInt(id_rol) === 4) {
                mensaje = 'Estudiante registrado exitosamente. ¡Ya puedes iniciar sesión!';
            } else if (parseInt(id_rol) === 3) {
                mensaje = usuarioData.pendiente_aprobacion 
                    ? 'Tutor registrado exitosamente. Tu cuenta está pendiente de aprobación.' 
                    : 'Tutor registrado y aprobado exitosamente. ¡Ya puedes iniciar sesión!';
            } else if (parseInt(id_rol) === 2) {
                mensaje = usuarioData.pendiente_aprobacion 
                    ? 'Gerente de institución registrado exitosamente. Tu cuenta está pendiente de aprobación.' 
                    : 'Gerente de institución registrado y aprobado exitosamente. ¡Ya puedes iniciar sesión!';
            } else {
                mensaje = usuarioData.pendiente_aprobacion 
                    ? 'Usuario registrado exitosamente. Tu cuenta está pendiente de aprobación.' 
                    : 'Usuario registrado y aprobado exitosamente. ¡Ya puedes iniciar sesión!';
            }
            
            res.status(201).json({ 
                mensaje,
                usuario: {
                    id_usuario: usuarioCreado.id_usuario,
                    username: usuarioCreado.username,
                    email: usuarioCreado.email,
                    id_rol: usuarioCreado.id_rol,
                    activo: usuarioCreado.activo,
                    pendiente_aprobacion: usuarioCreado.pendiente_aprobacion
                },
                perfil: perfilCreado
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Error en crearUsuario:', error);
            res.status(500).json({ error: error.message });
        } finally {
            client.release();
        }
    },

    // Obtener usuarios pendientes de aprobación (solo roles que requieren aprobación)
    obtenerPendientes: async (req, res) => {
        try {
            const aprobadorRol = req.user.id_rol;
            
            // Roles que puede aprobar según su rol
            const rolesAprobables = {
                1: [2, 3], // Admin puede aprobar gerente y tutor
                2: [3],    // Gerente puede aprobar tutor
                3: []      // Tutor no puede aprobar a nadie
            };
            
            const rolesPermitidos = rolesAprobables[aprobadorRol] || [];
            
            if (rolesPermitidos.length === 0) {
                return res.json([]);
            }
            
            // Convertir array a string para la consulta SQL
            const rolesString = rolesPermitidos.join(',');
            
            const result = await pool.query(
                `SELECT u.*, r.nombre_rol 
                 FROM public.usuario u
                 JOIN public.rol r ON u.id_rol = r.id_rol
                 WHERE u.pendiente_aprobacion = TRUE 
                 AND u.id_rol IN (${rolesString})
                 ORDER BY u.fecha_solicitud ASC`
            );
            
            res.json(result.rows);
            
        } catch (error) {
            console.error('Error en obtenerPendientes:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Actualizar usuario (activar/desactivar)
    actualizarUsuario: async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        const { activo } = req.body;
        const idActualizador = req.user.id_usuario;

        // Verificar que el usuario existe
        const usuarioResult = await client.query(
        "SELECT * FROM public.usuario WHERE id_usuario = $1",
        [id]
        );
        
        if (usuarioResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = usuarioResult.rows[0];

        // No permitir desactivarse a sí mismo
        if (parseInt(id) === idActualizador) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
        }

        // Verificar permisos (solo admin puede desactivar otros admins)
        if (usuario.id_rol === 1 && req.user.id_rol !== 1) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Solo un administrador puede desactivar a otro administrador' });
        }

        // Actualizar usuario - SIN fecha_actualizacion
        const updateResult = await client.query(
        `UPDATE public.usuario 
        SET activo = $1
        WHERE id_usuario = $2 
        RETURNING *`,
        [activo, id]
        );

        // Si se está desactivando, también actualizar el perfil relacionado
        if (!activo) {
        await actualizarPerfilRelacionado(client, usuario.id_rol, usuario.id_usuario, false);
        }

        await client.query('COMMIT');

        res.json({ 
        mensaje: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`,
        usuario: updateResult.rows[0] 
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en actualizarUsuario:', error);
        
        // Manejar errores específicos de base de datos
        if (error.code === '23503') { // Violación de clave foránea
        res.status(400).json({ 
            error: 'No se puede desactivar el usuario debido a dependencias existentes' 
        });
        } else {
        res.status(500).json({ error: error.message });
        }
    } finally {
        client.release();
    }
    },
    
    // Eliminar usuario (rechazar)
    eliminarUsuario: async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        const idEliminador = req.user.id_usuario;

        // Verificar que el usuario existe
        const usuarioResult = await client.query(
        "SELECT * FROM public.usuario WHERE id_usuario = $1",
        [id]
        );
        
        if (usuarioResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = usuarioResult.rows[0];

        // No permitir eliminarse a sí mismo
        if (parseInt(id) === idEliminador) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
        }

        // Solo permitir eliminar usuarios pendientes de aprobación
        if (!usuario.pendiente_aprobacion) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Solo se pueden eliminar usuarios pendientes de aprobación' });
        }

        // Primero eliminar el perfil específico
        await eliminarPerfilRelacionado(client, usuario.id_rol, usuario.id_usuario);

        // Luego eliminar el usuario
        const deleteResult = await client.query(
        "DELETE FROM public.usuario WHERE id_usuario = $1 RETURNING *",
        [id]
        );

        await client.query('COMMIT');

        res.json({ 
        mensaje: 'Usuario eliminado exitosamente',
        usuario: deleteResult.rows[0] 
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en eliminarUsuario:', error);
        
        if (error.code === '23503') {
        res.status(400).json({ 
            error: 'No se puede eliminar el usuario debido a dependencias existentes' 
        });
        } else {
        res.status(500).json({ error: error.message });
        }
    } finally {
        client.release();
    }
    },
    // En usuarioController.js
    obtenerTodosUsuarios: async (req, res) => {
    try {
        const result = await pool.query(
        `SELECT u.*, r.nombre_rol 
        FROM public.usuario u
        JOIN public.rol r ON u.id_rol = r.id_rol
        ORDER BY u.fecha_solicitud DESC`
        );
        
        res.json(result.rows);
        
    } catch (error) {
        console.error('Error en obtenerTodosUsuarios:', error);
        res.status(500).json({ error: error.message });
    }
    },

    // Aprobar usuario
    aprobarUsuario: async (req, res) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const { id } = req.params;
            const idAprobador = req.user.id_usuario;
            const rolAprobador = req.user.id_rol;
            
            // Obtener usuario a aprobar
            const usuarioResult = await client.query(
                "SELECT * FROM public.usuario WHERE id_usuario = $1",
                [id]
            );
            
            if (usuarioResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
            const usuario = usuarioResult.rows[0];
            
            if (!usuario.pendiente_aprobacion) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Usuario no pendiente de aprobación' });
            }
            
            // Verificar que no sea un estudiante (no debería estar pendiente)
            if (usuario.id_rol === 4) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Los usuarios estudiantes no requieren aprobación' });
            }
            
            // Verificar permisos de aprobación
            const puedeAprobar = await verificarPermisoAprobacion(rolAprobador, usuario.id_rol);
            if (!puedeAprobar) {
                await client.query('ROLLBACK');
                return res.status(403).json({ error: 'No tienes permisos para aprobar este rol de usuario' });
            }
            
            // Aprobar usuario
            const updateResult = await client.query(
                `UPDATE public.usuario 
                 SET activo = TRUE, pendiente_aprobacion = FALSE, 
                     id_usuario_aprobador = $1, fecha_aprobacion = NOW()
                 WHERE id_usuario = $2 RETURNING *`,
                [idAprobador, id]
            );
            
            await client.query('COMMIT');
            
            res.json({ 
                mensaje: 'Usuario aprobado exitosamente', 
                usuario: updateResult.rows[0] 
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error en aprobarUsuario:', error);
            res.status(500).json({ error: error.message });
        } finally {
            client.release();
        }
    }
};

// Función auxiliar para verificar permisos
async function verificarPermisoAprobacion(rolAprobador, rolSolicitante) {
    const permisos = {
        1: [2, 3], // Admin puede aprobar gerente y tutor
        2: [3],    // Gerente puede aprobar tutor
        3: []      // Tutor no puede aprobar a nadie
    };
    return permisos[rolAprobador]?.includes(rolSolicitante) || false;
}
// Función auxiliar para actualizar perfiles relacionados
async function actualizarPerfilRelacionado(client, idRol, idUsuario, activo) {
  try {
    switch (idRol) {
      case 4: // Estudiante
        await client.query(
          'UPDATE public.estudiante SET activo = $1 WHERE id_usuario = $2',
          [activo, idUsuario]
        );
        break;
      case 3: // Tutor
        await client.query(
          'UPDATE public.tutor SET activo = $1 WHERE id_usuario = $2',
          [activo, idUsuario]
        );
        break;
      case 2: // Gerente/Institución
        await client.query(
          'UPDATE public.institucion SET activo = $1 WHERE id_usuario_gerente = $2',
          [activo, idUsuario]
        );
        break;
      // El administrador no tiene perfil específico
    }
  } catch (error) {
    console.error('Error actualizando perfil relacionado:', error);
    throw error;
  }
}

async function eliminarPerfilRelacionado(client, idRol, idUsuario) {
  try {
    switch (idRol) {
      case 4: // Estudiante
        await client.query(
          'DELETE FROM public.estudiante WHERE id_usuario = $1',
          [idUsuario]
        );
        break;
      case 3: // Tutor
        await client.query(
          'DELETE FROM public.tutor WHERE id_usuario = $1',
          [idUsuario]
        );
        break;
      case 2: // Gerente/Institución
        await client.query(
          'DELETE FROM public.institucion WHERE id_usuario_gerente = $1',
          [idUsuario]
        );
        break;
      // El administrador no tiene perfil específico
    }
  } catch (error) {
    console.error('Error eliminando perfil relacionado:', error);
    throw error;
  }
}
export default usuarioController;