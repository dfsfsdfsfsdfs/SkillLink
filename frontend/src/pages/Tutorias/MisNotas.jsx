import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Componente Badge (si no tienes uno)
const Badge = ({ children, color = "gray", size = "sm" }) => {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs font-medium rounded-full",
    md: "px-3 py-1.5 text-sm font-medium rounded-lg"
  };

  return (
    <span className={`inline-flex items-center ${colorClasses[color]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
};

// Card de resumen de tutoría
const TutoriasCard = ({ tutoria, onClick }) => {
  const [detalles, setDetalles] = useState(null);
  const [loading, setLoading] = useState(false);
  const { getAuthToken } = useAuth();

  const getToken = () => {
    return getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
  };

  // Función para calcular el color según la nota
  const getColorNota = (nota) => {
    if (nota >= 90) return "green";
    if (nota >= 80) return "blue";
    if (nota >= 70) return "indigo";
    if (nota >= 51) return "yellow";
    return "red";
  };

  // Función para obtener el estado de aprobación
  const getEstadoAprobacion = (nota) => {
    return nota >= 51 ? "Aprobado" : "Reprobado";
  };

  // Obtener detalles de las notas del estudiante en esta tutoría
  const obtenerDetallesNotas = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      // Primer endpoint: Obtener información del estudiante en esta tutoría
      const response = await fetch(`http://localhost:3000/estudiantes/${tutoria.id_estudiante}/tutoria/${tutoria.id_tutoria}/notas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDetalles(data);
      }
    } catch (error) {
      console.error('Error obteniendo detalles de notas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular nota final si hay detalles
  const calcularNotaFinal = () => {
    if (!detalles) return tutoria.calificacion_acumulada || 0;
    
    const notaActividades = detalles.actividades?.reduce((sum, act) => sum + (act.calificacion || 0), 0) || 0;
    const notaEvaluaciones = detalles.evaluaciones?.reduce((sum, ev) => sum + (ev.calificacion || 0), 0) || 0;
    
    return notaActividades + notaEvaluaciones;
  };

  const notaFinal = calcularNotaFinal();

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`w-12 h-12 rounded-xl ${getColorLogo(tutoria.nombre_tutoria)} flex items-center justify-center text-white font-bold text-lg`}>
              {getIniciales(tutoria.nombre_tutoria)}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {tutoria.nombre_tutoria}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{tutoria.sigla}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge color="blue">
              {tutoria.institucion_nombre}
            </Badge>
            <Badge color="purple">
              Tutor: {tutoria.tutor_nombre}
            </Badge>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {notaFinal.toFixed(1)}
          </div>
          <Badge color={getColorNota(notaFinal)} size="sm">
            {getEstadoAprobacion(notaFinal)}
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {/* Barra de progreso de nota */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Progreso de nota</span>
            <span>{notaFinal.toFixed(1)}/100</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${notaFinal >= 51 ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(notaFinal, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Botón para ver detalles */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            obtenerDetallesNotas();
          }}
          disabled={loading}
          className="w-full px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Cargando detalles...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Ver detalles de notas</span>
            </>
          )}
        </button>
      </div>

      {/* Detalles expandidos */}
      {detalles && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Actividades */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Actividades ({detalles.actividades?.length || 0})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {detalles.actividades?.map((actividad, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {actividad.titulo}
                      </span>
                      <Badge color={getColorNota(actividad.calificacion || 0)} size="sm">
                        {actividad.calificacion?.toFixed(1) || "0.0"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {actividad.descripcion?.substring(0, 50)}...
                    </p>
                  </div>
                ))}
                {(!detalles.actividades || detalles.actividades.length === 0) && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    No hay actividades calificadas
                  </p>
                )}
              </div>
            </div>

            {/* Evaluaciones */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Evaluaciones ({detalles.evaluaciones?.length || 0})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {detalles.evaluaciones?.map((evaluacion, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                        {evaluacion.titulo}
                      </span>
                      <Badge color={getColorNota(evaluacion.calificacion || 0)} size="sm">
                        {evaluacion.calificacion?.toFixed(1) || "0.0"}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {evaluacion.descripcion?.substring(0, 50)}...
                    </p>
                  </div>
                ))}
                {(!detalles.evaluaciones || detalles.evaluaciones.length === 0) && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                    No hay evaluaciones calificadas
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Resumen total */}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {detalles.total_actividades || 0}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Total Actividades</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {detalles.total_evaluaciones || 0}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400">Total Evaluaciones</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {notaFinal.toFixed(1)}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">Nota Final</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Función para generar PDF
const generarPDFReporteNotas = (tutorias, estudianteNombre) => {
  const doc = new jsPDF();
  
  // Configuración del documento
  doc.setFontSize(20);
  doc.setTextColor(41, 128, 185);
  doc.text('REPORTE DE NOTAS DEL ESTUDIANTE', 105, 20, { align: 'center' });
  
  // Información del estudiante
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Estudiante: ${estudianteNombre}`, 20, 40);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 48);
  doc.text(`Total de cursos: ${tutorias.length}`, 20, 56);
  
  // Tabla de resumen
  const headers = [['Curso', 'Código', 'Institución', 'Tutor', 'Nota Final', 'Estado']];
  const data = tutorias.map(tutoria => [
    tutoria.nombre_tutoria,
    tutoria.sigla,
    tutoria.institucion_nombre,
    tutoria.tutor_nombre,
    (tutoria.calificacion_acumulada || 0).toFixed(1),
    (tutoria.calificacion_acumulada || 0) >= 51 ? 'Aprobado' : 'Reprobado'
  ]);
  
  doc.autoTable({
    head: headers,
    body: data,
    startY: 65,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: {
      4: { cellWidth: 20 },
      5: { cellWidth: 25 }
    }
  });
  
  // Estadísticas
  const finalY = doc.lastAutoTable.finalY + 10;
  const aprobados = tutorias.filter(t => (t.calificacion_acumulada || 0) >= 51).length;
  const promedio = tutorias.reduce((sum, t) => sum + (t.calificacion_acumulada || 0), 0) / tutorias.length;
  
  doc.setFontSize(12);
  doc.setTextColor(41, 128, 185);
  doc.text('ESTADÍSTICAS GENERALES', 20, finalY);
  
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Cursos aprobados: ${aprobados}`, 20, finalY + 10);
  doc.text(`Promedio general: ${promedio.toFixed(1)}%`, 20, finalY + 18);
  doc.text(`Porcentaje de aprobación: ${((aprobados / tutorias.length) * 100).toFixed(1)}%`, 20, finalY + 26);
  
  // Guardar PDF
  doc.save(`reporte_notas_${estudianteNombre.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
};

// Componente principal MisNotas
const MisNotas = () => {
  const [tutorias, setTutorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estudianteInfo, setEstudianteInfo] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    aprobados: 0,
    reprobados: 0,
    promedio: 0,
    notaMasAlta: 0,
    notaMasBaja: 100
  });
  
  const { getAuthToken, user } = useAuth();
  const [tutoriaSeleccionada, setTutoriaSeleccionada] = useState(null);
  const [modalDetalles, setModalDetalles] = useState(false);

  const getToken = () => {
    return getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
  };

  // Obtener ID del estudiante
  const obtenerIdEstudiante = async () => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/estudiantes/por-usuario/${user.id_usuario}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.id_estudiante;
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo ID estudiante:', error);
      return null;
    }
  };

  // Cargar tutorías con notas del estudiante
  const cargarTutoriasConNotas = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const idEstudiante = await obtenerIdEstudiante();
      
      if (!idEstudiante) {
        throw new Error('No se pudo obtener el ID del estudiante');
      }

      // Primero obtener las tutorías inscritas
      const response = await fetch(`http://localhost:3000/tutorias/estudiante/inscrito/${idEstudiante}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const tutoriasData = await response.json();
        
        // Para cada tutoría, obtener las notas detalladas
        const tutoriasConDetalles = await Promise.all(
          tutoriasData.map(async (tutoria) => {
            try {
              const notasResponse = await fetch(
                `http://localhost:3000/estudiantes/${idEstudiante}/tutoria/${tutoria.id_tutoria}/notas`,
                { headers: { 'Authorization': `Bearer ${token}` } }
              );
              
              if (notasResponse.ok) {
                const notasData = await notasResponse.json();
                return {
                  ...tutoria,
                  detallesNotas: notasData
                };
              }
              return tutoria;
            } catch (error) {
              console.error(`Error obteniendo notas para tutoría ${tutoria.id_tutoria}:`, error);
              return tutoria;
            }
          })
        );
        
        setTutorias(tutoriasConDetalles);
        calcularEstadisticas(tutoriasConDetalles);
      } else {
        throw new Error('Error al cargar las tutorías');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error cargando tutorías con notas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas
  const calcularEstadisticas = (tutoriasData) => {
    const notas = tutoriasData.map(t => t.calificacion_acumulada || 0);
    const aprobados = tutoriasData.filter(t => (t.calificacion_acumulada || 0) >= 51).length;
    const promedio = notas.length > 0 ? notas.reduce((a, b) => a + b) / notas.length : 0;
    
    setEstadisticas({
      total: tutoriasData.length,
      aprobados,
      reprobados: tutoriasData.length - aprobados,
      promedio,
      notaMasAlta: Math.max(...notas),
      notaMasBaja: Math.min(...notas)
    });
  };

  // Obtener información del estudiante
  const obtenerInfoEstudiante = async () => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/estudiantes/por-usuario/${user.id_usuario}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEstudianteInfo(data);
      }
    } catch (error) {
      console.error('Error obteniendo info del estudiante:', error);
    }
  };

  // Funciones auxiliares
  const getIniciales = (nombre) => {
    if (!nombre) return 'TU';
    const palabras = nombre.split(' ').filter(word => word.trim() !== '');
    if (palabras.length >= 2) {
      return (palabras[0].charAt(0) + palabras[1].charAt(0)).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  };

  const getColorLogo = (nombre) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-green-500 to-green-600',
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-red-500 to-red-600',
      'bg-gradient-to-br from-yellow-500 to-yellow-600',
    ];
    if (!nombre) return colors[0];
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  useEffect(() => {
    cargarTutoriasConNotas();
    obtenerInfoEstudiante();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  Error al cargar las notas
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                  {error}
                </p>
                <button 
                  onClick={cargarTutoriasConNotas}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="w-full bg-gradient-to-r from-indigo-600 to-purple-700 shadow-xl">
        <div className="p-8">
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                Mis Calificaciones
              </h1>
              <p className="text-lg text-indigo-100 opacity-90 max-w-2xl leading-relaxed">
                Revisa tus notas, actividades y evaluaciones en todas tus tutorías
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => generarPDFReporteNotas(tutorias, estudianteInfo?.nombre || 'Estudiante')}
                className="px-6 py-3 bg-white text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all flex items-center space-x-3 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Exportar Reporte</span>
              </button>
            </div>
          </div>
          
          {/* Información del estudiante */}
          {estudianteInfo && (
            <div className="relative mt-6 pt-6 border-t border-white/20">
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center space-x-2 text-white/80">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span>{estudianteInfo.nombre} {estudianteInfo.paterno}</span>
                </div>
                <div className="flex items-center space-x-2 text-white/80">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span>{estudianteInfo.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-white/80">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span>{estudianteInfo.carrera || 'Carrera no especificada'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {estadisticas.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Total Cursos
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
              {estadisticas.aprobados}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Cursos Aprobados
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
              {estadisticas.reprobados}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Cursos Reprobados
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {estadisticas.promedio.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Promedio General
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {estadisticas.notaMasAlta.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Nota Más Alta
            </div>
          </div>
        </div>

        {/* Lista de tutorías con notas */}
        {tutorias.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorias.map((tutoria) => (
              <TutoriasCard 
                key={tutoria.id_tutoria}
                tutoria={tutoria}
                onClick={() => {
                  setTutoriaSeleccionada(tutoria);
                  setModalDetalles(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 dark:text-gray-500 mb-6">
              <svg className="mx-auto h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              No tienes calificaciones registradas
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg">
              Las notas aparecerán aquí cuando tus tutores califiquen tus actividades y evaluaciones
            </p>
          </div>
        )}

        {/* Modal de detalles completos */}
        {modalDetalles && tutoriaSeleccionada && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Detalles de Calificaciones
                  </h2>
                  <button
                    onClick={() => setModalDetalles(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Aquí puedes agregar una vista detallada de todas las calificaciones */}
                <div className="space-y-6">
                  {/* Tabla detallada de actividades */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Calificaciones Detalladas
                    </h3>
                    {/* Agrega tablas detalladas aquí */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MisNotas;