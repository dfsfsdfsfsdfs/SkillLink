// components/DetallesEvaluacion.jsx - VERSIÓN MEJORADA
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

const DetallesEvaluacion = ({ evaluacion, onVolver }) => {
  const [respuestas, setRespuestas] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [calificando, setCalificando] = useState(null);
  const [notaEditando, setNotaEditando] = useState('');
  const [comentarioEditando, setComentarioEditando] = useState('');
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const { getAuthToken } = useAuth();

  const getToken = useCallback(() => {
    return getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
  }, [getAuthToken]);

  // Cargar respuestas de la evaluación específica
  const cargarRespuestas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      
      console.log('📋 Cargando respuestas para evaluación:', evaluacion.id_evaluacion);
      
      const respuestasResponse = await fetch(
        `http://localhost:3000/respuestas/evaluacion/${evaluacion.id_evaluacion}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (respuestasResponse.ok) {
        const respuestasData = await respuestasResponse.json();
        console.log('✅ Respuestas cargadas:', respuestasData);
        setRespuestas(respuestasData);
      } else {
        throw new Error('Error al cargar respuestas de la evaluación');
      }
    } catch (err) {
      console.error('❌ Error cargando respuestas:', err);
      setError('Error al cargar respuestas: ' + err.message);
      setRespuestas([]);
    } finally {
      setLoading(false);
    }
  }, [evaluacion.id_evaluacion, getToken]);

  // Cargar inscripciones de la tutoría
  const cargarInscripciones = useCallback(async () => {
    try {
      const token = getToken();
      
      if (!evaluacion.id_tutoria) {
        console.warn('⚠️ No hay ID de tutoría en la evaluación');
        return;
      }
      
      const response = await fetch(
        `http://localhost:3000/inscripciones/tutoria/${evaluacion.id_tutoria}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const inscripcionesData = await response.json();
        console.log('✅ Inscripciones cargadas:', inscripcionesData);
        setInscripciones(inscripcionesData);
      } else {
        console.warn('⚠️ No se pudieron cargar las inscripciones');
      }
    } catch (err) {
      console.error('❌ Error cargando inscripciones:', err);
    }
  }, [evaluacion.id_tutoria, getToken]);

  // Agrupar respuestas por estudiante - VERSIÓN MEJORADA
  const respuestasPorEstudiante = useCallback(() => {
    const agrupadas = {};
    
    inscripciones.forEach(inscripcion => {
      agrupadas[inscripcion.id_inscripcion] = {
        estudiante: {
          id_inscripcion: inscripcion.id_inscripcion,
          nombre_estudiante: inscripcion.nombre_estudiante || 'Estudiante',
          apellido_paterno: inscripcion.apellido_paterno || '',
          apellido_materno: inscripcion.apellido_materno || '',
          email: inscripcion.email || 'Sin email',
          id_estudiante: inscripcion.id_estudiante
        },
        respuestas: [],
        puntajeTotal: 0,
        preguntasDesarrollo: 0,
        tieneRespuestas: false,
        porcentaje: 0
      };
    });
    
    respuestas.forEach(respuesta => {
      const idInscripcion = respuesta.id_inscripcion;
      
      if (agrupadas[idInscripcion]) {
        agrupadas[idInscripcion].respuestas.push(respuesta);
        agrupadas[idInscripcion].puntajeTotal += parseFloat(respuesta.nota_obtenida) || 0;
        agrupadas[idInscripcion].preguntasDesarrollo += respuesta.respuesta_desarrollo ? 1 : 0;
        agrupadas[idInscripcion].tieneRespuestas = true;
      }
    });

    // Calcular porcentaje
    Object.values(agrupadas).forEach(est => {
      est.porcentaje = evaluacion.puntaje_total 
        ? (est.puntajeTotal / evaluacion.puntaje_total) * 100 
        : 0;
    });
    
    return agrupadas;
  }, [respuestas, inscripciones, evaluacion.puntaje_total]);

  // Calificar pregunta de desarrollo
  const calificarPregunta = useCallback(async (respuestaId, nuevaNota, comentario = '') => {
    try {
      setError(null);
      const token = getToken();
      
      const nota = parseFloat(nuevaNota);
      if (isNaN(nota)) {
        throw new Error('La nota debe ser un número válido');
      }

      const response = await fetch(`http://localhost:3000/respuestas/${respuestaId}/calificar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nota_obtenida: nota,
          comentario_docente: comentario,
          es_correcta: nota > 0
        })
      });

      if (response.ok) {
        console.log('✅ Pregunta calificada correctamente');
        await cargarRespuestas();
        setCalificando(null);
        setNotaEditando('');
        setComentarioEditando('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al calificar pregunta');
      }
    } catch (err) {
      console.error('❌ Error calificando:', err);
      setError('Error al calificar: ' + err.message);
    }
  }, [getToken, cargarRespuestas]);

  // Calcular estadísticas generales
  const calcularEstadisticas = useCallback(() => {
    const agrupadas = respuestasPorEstudiante();
    const estudiantesConRespuestas = Object.values(agrupadas).filter(est => est.tieneRespuestas).length;
    const totalEstudiantes = inscripciones.length;
    
    return {
      estudiantesConRespuestas,
      totalEstudiantes,
      porcentajeParticipacion: totalEstudiantes > 0 ? (estudiantesConRespuestas / totalEstudiantes) * 100 : 0
    };
  }, [respuestasPorEstudiante, inscripciones]);

  // Obtener nombre completo del estudiante
  const getNombreCompleto = (estudiante) => {
    return `${estudiante.nombre_estudiante || ''} ${estudiante.apellido_paterno || ''} ${estudiante.apellido_materno || ''}`.trim();
  };

  // Obtener color según el porcentaje
  const getColorNota = (porcentaje) => {
    if (porcentaje >= 80) return 'text-green-600 dark:text-green-400';
    if (porcentaje >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (porcentaje >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Obtener badge color según el porcentaje
  const getBadgeColor = (porcentaje) => {
    if (porcentaje >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (porcentaje >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    if (porcentaje >= 40) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  };

  useEffect(() => {
    if (evaluacion) {
      Promise.all([cargarRespuestas(), cargarInscripciones()])
        .finally(() => setLoading(false));
    }
  }, [evaluacion, cargarRespuestas, cargarInscripciones]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 dark:text-white">Cargando evaluación</p>
          <p className="text-gray-600 dark:text-gray-400">Obteniendo respuestas de estudiantes...</p>
        </div>
      </div>
    );
  }

  const agrupadas = respuestasPorEstudiante();
  const estadisticas = calcularEstadisticas();
  const estudiantesConRespuestas = Object.values(agrupadas).filter(est => est.tieneRespuestas);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={onVolver}
                className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Volver a Evaluaciones</span>
              </button>
            </div>
            
            <h1 className="text-3xl font-bold mb-3">{evaluacion.nombre_evaluacion}</h1>
            {evaluacion.descripcion && (
              <p className="text-blue-100 text-lg opacity-90">
                {evaluacion.descripcion}
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                👥 {estadisticas.estudiantesConRespuestas}/{estadisticas.totalEstudiantes} Estudiantes
              </span>
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                📝 {respuestas.length} Respuestas
              </span>
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                📊 {estadisticas.porcentajeParticipacion.toFixed(1)}% Participación
              </span>
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                🎯 {evaluacion.puntaje_total || 100} Puntos Totales
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Error</h3>
              <p className="text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={cargarRespuestas}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vista: Lista de Estudiantes o Detalles */}
      {estudianteSeleccionado ? (
        // VISTA DE DETALLES DEL ESTUDIANTE
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setEstudianteSeleccionado(null)}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Volver a la lista</span>
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Respuestas de {getNombreCompleto(estudianteSeleccionado.estudiante)}
              </h2>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getColorNota(estudianteSeleccionado.porcentaje)}`}>
                {estudianteSeleccionado.puntajeTotal.toFixed(1)} pts
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeColor(estudianteSeleccionado.porcentaje)}`}>
                {estudianteSeleccionado.porcentaje.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Respuestas del estudiante seleccionado */}
          <div className="space-y-4">
            {estudianteSeleccionado.respuestas.map((respuesta) => (
              <div key={respuesta.id_respuesta} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                      Pregunta {respuesta.numero_preg}
                    </h4>
                    {respuesta.pregunta_descripcion && (
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {respuesta.pregunta_descripcion}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      respuesta.es_correcta 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {respuesta.es_correcta ? '✅ Correcta' : '❌ Incorrecta'}
                    </span>
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                      {respuesta.nota_obtenida || 0} / {respuesta.nota_pregunta || 10} pts
                    </span>
                  </div>
                </div>

                {/* Respuesta de desarrollo */}
                {respuesta.respuesta_desarrollo && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Respuesta del estudiante:
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border">
                      <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                        {respuesta.respuesta_desarrollo}
                      </p>
                    </div>
                    
                    {/* Comentario del docente */}
                    {respuesta.comentario_docente && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Comentario del docente:
                        </label>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                          <p className="text-yellow-800 dark:text-yellow-300">
                            {respuesta.comentario_docente}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Botón para calificar desarrollo */}
                    <div className="mt-4">
                      <button
                        onClick={() => setCalificando(calificando === respuesta.id_respuesta ? null : respuesta.id_respuesta)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        {respuesta.nota_obtenida ? 'Recalificar' : 'Calificar'} Desarrollo
                      </button>
                    </div>

                    {/* Modal de calificación */}
                    {calificando === respuesta.id_respuesta && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h5 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
                          Calificar Respuesta de Desarrollo
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Puntaje (0-{respuesta.nota_pregunta || 10}):
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={respuesta.nota_pregunta || 10}
                              step="0.1"
                              value={notaEditando}
                              onChange={(e) => setNotaEditando(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Comentario (opcional):
                            </label>
                            <textarea
                              value={comentarioEditando}
                              onChange={(e) => setComentarioEditando(e.target.value)}
                              rows="3"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                              placeholder="Agrega comentarios para el estudiante..."
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => calificarPregunta(respuesta.id_respuesta, notaEditando, comentarioEditando)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Guardar Calificación
                            </button>
                            <button
                              onClick={() => setCalificando(null)}
                              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Opción seleccionada (para opción múltiple/VF) */}
                {respuesta.inciso_seleccionado && !respuesta.respuesta_desarrollo && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Opción seleccionada:
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {respuesta.inciso_seleccionado}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        // VISTA DE LISTA DE ESTUDIANTES
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Resultados de Estudiantes ({estudiantesConRespuestas.length})
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Puntaje total: {evaluacion.puntaje_total || 100} puntos
            </div>
          </div>

          {estudiantesConRespuestas.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay respuestas aún
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Ninguno de los {estadisticas.totalEstudiantes} estudiantes inscritos ha enviado respuestas para esta evaluación.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header de la tabla */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-900 dark:text-white">
                <div className="col-span-5">Estudiante</div>
                <div className="col-span-2 text-center">Puntaje</div>
                <div className="col-span-2 text-center">Porcentaje</div>
                <div className="col-span-1 text-center">Desarrollo</div>
                <div className="col-span-2 text-center">Acciones</div>
              </div>

              {/* Lista de estudiantes */}
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {estudiantesConRespuestas
                  .sort((a, b) => b.puntajeTotal - a.puntajeTotal)
                  .map((datosEstudiante) => (
                  <div key={datosEstudiante.estudiante.id_inscripcion} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {/* Información del estudiante */}
                    <div className="col-span-5">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                          {datosEstudiante.estudiante.nombre_estudiante?.charAt(0) || 'E'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {getNombreCompleto(datosEstudiante.estudiante)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {datosEstudiante.estudiante.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Puntaje */}
                    <div className="col-span-2 text-center">
                      <div className={`text-xl font-bold ${getColorNota(datosEstudiante.porcentaje)}`}>
                        {datosEstudiante.puntajeTotal.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        de {evaluacion.puntaje_total || 100}
                      </div>
                    </div>

                    {/* Porcentaje */}
                    <div className="col-span-2 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBadgeColor(datosEstudiante.porcentaje)}`}>
                        {datosEstudiante.porcentaje.toFixed(1)}%
                      </span>
                    </div>

                    {/* Preguntas de desarrollo */}
                    <div className="col-span-1 text-center">
                      {datosEstudiante.preguntasDesarrollo > 0 ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 rounded-full text-sm font-bold">
                          {datosEstudiante.preguntasDesarrollo}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="col-span-2 text-center">
                      <button
                        onClick={() => setEstudianteSeleccionado(datosEstudiante)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DetallesEvaluacion;