import React, { useState, useEffect } from 'react';
import Badge from './Badge';

const TablaEstudiantes = ({ tutoriaId, puedeAprobarInscripciones }) => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  const getToken = () => {
    return localStorage.getItem('authToken');
  };

  // Cargar todos los estudiantes de la tutoría con información de pagos y calificaciones
// Cargar todos los estudiantes de la tutoría con información de pagos y calificaciones
const cargarEstudiantesCompleto = async () => {
  try {
    setLoading(true);
    setError(null);
    const token = getToken();
    
    console.log(`🔄 Cargando estudiantes completos para tutoría ${tutoriaId}...`);
    
    const response = await fetch(`http://localhost:3000/inscripciones/tutoria/${tutoriaId}/completo`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${data.length} estudiantes cargados exitosamente`);
      setEstudiantes(data);
    } else {
      const errorData = await response.json();
      console.error('❌ Error del servidor:', errorData);
      
      // Si falla el endpoint completo, intentar con el endpoint normal
      console.log('🔄 Intentando cargar datos básicos...');
      await cargarEstudiantesBasicos();
    }
  } catch (err) {
    console.error('❌ Error de red:', err);
    setError('Error de conexión: ' + err.message);
    
    // Intentar cargar datos básicos como fallback
    await cargarEstudiantesBasicos();
  } finally {
    setLoading(false);
  }
};

// Función fallback para cargar solo datos básicos
const cargarEstudiantesBasicos = async () => {
  try {
    const token = getToken();
    const response = await fetch(`http://localhost:3000/inscripciones/tutoria/${tutoriaId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const dataNormal = await response.json();
      console.log(`🔄 Cargados ${dataNormal.length} estudiantes básicos`);
      // Agregar calificaciones por defecto
      const estudiantesConCalificaciones = dataNormal.map(est => ({
        ...est,
        calificacion_acumulada: 0,
        puntos_evaluaciones: 0,
        puntos_actividades: 0,
        total_actividades: 0,
        actividades_completadas: 0
      }));
      setEstudiantes(estudiantesConCalificaciones);
    } else {
      throw new Error('No se pudieron cargar los datos de estudiantes');
    }
  } catch (err) {
    console.error('❌ Error cargando datos básicos:', err);
    setError('No se pudieron cargar los datos de estudiantes: ' + err.message);
  }
};

  // Aprobar inscripción (Cambiar estado_solicitud a "inscrito")
  const aprobarInscripcion = async (idInscripcion) => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/inscripciones/${idInscripcion}/aprobar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await cargarEstudiantesCompleto();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al aprobar inscripción');
      }
    } catch (err) {
      console.error('Error aprobando inscripción:', err);
      setError(err.message);
    }
  };

  // Rechazar inscripción
  const rechazarInscripcion = async (idInscripcion) => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/inscripciones/${idInscripcion}/rechazar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        await cargarEstudiantesCompleto();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al rechazar inscripción');
      }
    } catch (err) {
      console.error('Error rechazando inscripción:', err);
      setError(err.message);
    }
  };

  // Verificar si el estudiante tiene pago completado
  const tienePagoCompletado = (estudiante) => {
    return estudiante.estado_pago === 'completado';
  };

  // Obtener texto del estado de pago
  const getEstadoPagoTexto = (estudiante) => {
    if (estudiante.estado_pago === 'completado') return 'Completado';
    if (estudiante.estado_pago === 'pendiente') return 'Pendiente';
    return 'Sin pago';
  };

  // Obtener color del badge para estado de pago
  const getColorEstadoPago = (estudiante) => {
    if (estudiante.estado_pago === 'completado') return 'green';
    if (estudiante.estado_pago === 'pendiente') return 'yellow';
    return 'red';
  };

  // Obtener color del badge para estado de solicitud
  const getColorEstadoSolicitud = (estadoSolicitud) => {
    if (estadoSolicitud === 'inscrito') return 'green';
    if (estadoSolicitud === 'pendiente') return 'yellow';
    if (estadoSolicitud === 'rechazado') return 'red';
    return 'gray';
  };

  // Obtener texto del estado de solicitud
  const getEstadoSolicitudTexto = (estadoSolicitud) => {
    if (estadoSolicitud === 'inscrito') return 'Inscrito';
    if (estadoSolicitud === 'pendiente') return 'Pendiente';
    if (estadoSolicitud === 'rechazado') return 'Rechazado';
    return estadoSolicitud || 'Pendiente';
  };

  // Obtener color para la calificación
  const getColorCalificacion = (calificacion) => {
    if (calificacion >= 90) return 'green';
    if (calificacion >= 70) return 'blue';
    if (calificacion >= 50) return 'yellow';
    return 'red';
  };

  // Formatear calificación
  const formatearCalificacion = (calificacion) => {
    return calificacion ? calificacion.toFixed(1) : '0.0';
  };

  useEffect(() => {
    if (tutoriaId) {
      cargarEstudiantesCompleto();
    }
  }, [tutoriaId]);

  // Filtrar estudiantes según el estado seleccionado
  const estudiantesFiltrados = estudiantes.filter(estudiante => {
    if (filtroEstado === 'todos') return true;
    if (filtroEstado === 'con_pago') return tienePagoCompletado(estudiante);
    if (filtroEstado === 'sin_pago') return !tienePagoCompletado(estudiante);
    return estudiante.estado_solicitud === filtroEstado;
  });

  // Estadísticas actualizadas
  const estadisticas = {
    total: estudiantes.length,
    inscritos: estudiantes.filter(e => e.estado_solicitud === 'inscrito').length,
    pendientes: estudiantes.filter(e => e.estado_solicitud === 'pendiente').length,
    rechazados: estudiantes.filter(e => e.estado_solicitud === 'rechazado').length,
    con_pago: estudiantes.filter(e => tienePagoCompletado(e)).length,
    promedio_calificaciones: estudiantes.length > 0 
      ? estudiantes.reduce((sum, e) => sum + (e.calificacion_acumulada || 0), 0) / estudiantes.length 
      : 0
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-300">Error: {error}</p>
        <button 
          onClick={cargarEstudiantesCompleto}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros y Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filtros */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filtrar por estado:
          </label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="todos">Todos los estudiantes</option>
            <option value="inscrito">Inscritos</option>
            <option value="pendiente">Pendientes</option>
            <option value="rechazado">Rechazados</option>
            <option value="con_pago">Con Pago Completado</option>
            <option value="sin_pago">Sin Pago Completado</option>
          </select>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{estadisticas.total}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Total</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{estadisticas.inscritos}</p>
            <p className="text-xs text-green-600 dark:text-green-400">Inscritos</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
            <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{estadisticas.pendientes}</p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">Pendientes</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {estadisticas.promedio_calificaciones.toFixed(1)}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400">Promedio</p>
          </div>
        </div>
      </div>

      {/* Tabla de Estudiantes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Paterno
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Materno
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Carrera
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado Solicitud
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado Pago
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Calificación
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Progreso
                </th>
                {puedeAprobarInscripciones && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {estudiantesFiltrados.length > 0 ? (
                estudiantesFiltrados.map((estudiante) => (
                  <tr key={estudiante.id_inscripcion} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {estudiante.estudiante_nombre}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {estudiante.paterno}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {estudiante.materno || 'No especificado'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {estudiante.email}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {estudiante.carrera || 'No especificado'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge color={getColorEstadoSolicitud(estudiante.estado_solicitud)}>
                        {getEstadoSolicitudTexto(estudiante.estado_solicitud)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge color={getColorEstadoPago(estudiante)}>
                        {getEstadoPagoTexto(estudiante)}
                      </Badge>
                      {estudiante.fecha_de_pago && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(estudiante.fecha_de_pago).toLocaleDateString()}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Badge color={getColorCalificacion(estudiante.calificacion_acumulada || 0)}>
                          {formatearCalificacion(estudiante.calificacion_acumulada)}%
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ 
                              width: `${estudiante.total_actividades > 0 
                                ? (estudiante.actividades_completadas / estudiante.total_actividades) * 100 
                                : 0
                              }%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {estudiante.actividades_completadas || 0}/{estudiante.total_actividades || 0}
                        </span>
                      </div>
                    </td>
                    {puedeAprobarInscripciones && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          {/* Solo mostrar acciones para solicitudes pendientes */}
                          {estudiante.estado_solicitud === 'pendiente' && (
                            <>
                              <button
                                onClick={() => aprobarInscripcion(estudiante.id_inscripcion)}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                                title="Aprobar solicitud"
                              >
                                Inscribir
                              </button>
                              <button
                                onClick={() => rechazarInscripcion(estudiante.id_inscripcion)}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs"
                                title="Rechazar solicitud"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          {/* Para solicitudes ya procesadas, mostrar mensaje */}
                          {(estudiante.estado_solicitud === 'inscrito' || estudiante.estado_solicitud === 'rechazado') && (
                            <span className="text-xs text-gray-500 italic">
                              Procesado
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan={puedeAprobarInscripciones ? "10" : "9"} 
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No se encontraron estudiantes con los filtros seleccionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Información de la tabla:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-300">
          <div>
            <p><strong>Estado Solicitud:</strong> Estado actual de la solicitud de inscripción</p>
            <p><strong>Estado Pago:</strong> Estado del pago QR asociado a la inscripción</p>
          </div>
          <div>
            <p><strong>Calificación:</strong> Promedio acumulado de evaluaciones y actividades</p>
            <p><strong>Progreso:</strong> Progreso en actividades completadas vs total</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablaEstudiantes;