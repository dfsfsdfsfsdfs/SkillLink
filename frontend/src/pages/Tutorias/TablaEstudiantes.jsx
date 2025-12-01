import React, { useState, useEffect } from 'react';
import Badge from './Badge';
import { jsPDF } from 'jspdf';
import { Document, Page, Text, View, StyleSheet, pdf, Image, Font } from '@react-pdf/renderer';
import logoSL from '../../../public/logoSL.png';

const TablaEstudiantes = ({ tutoriaId, puedeAprobarInscripciones }) => {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [generandoReporte, setGenerandoReporte] = useState(false);

  const getToken = () => {
    return localStorage.getItem('authToken');
  };

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
        await cargarEstudiantesBasicos();
      }
    } catch (err) {
      console.error('❌ Error de red:', err);
      setError('Error de conexión: ' + err.message);
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


// Registra una fuente bonita (opcional)
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf'
});

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  header: { backgroundColor: '#2980b9', color: 'white', padding: 20, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 12, marginTop: 5 },
  logo: { width: 80, height: 80, position: 'absolute', top: 30, left: 30 },
  statsBox: { 
    flexDirection: 'row', 
    backgroundColor: '#f8f9fa', 
    padding: 15, 
    borderRadius: 8, 
    marginVertical: 20,
    justifyContent: 'space-between'
  },
  table: { display: 'flex', width: 'auto' },
  tableHeader: { 
    backgroundColor: '#2980b9', 
    color: 'white', 
    flexDirection: 'row', 
    fontWeight: 'bold',
    fontSize: 10
  },
  tableRow: { 
    flexDirection: 'row', 
    borderBottom: '1px solid #eee',
    fontSize: 9,
    minHeight: 30,
    alignItems: 'center'
  },
  cell: { padding: 8, textAlign: 'center' },
  footer: { 
    position: 'absolute', 
    bottom: 30, 
    left: 0, 
    right: 0, 
    textAlign: 'center', 
    fontSize: 10, 
    color: '#777' 
  }
});

const ReportePDF = ({ estudiantes, tipo, tutoriaId }) => {
  const fecha = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const aprobados = estudiantes.filter(e => (e.calificacion_acumulada || 0) >= 51).length;
  const promedio = estudiantes.reduce((s, e) => s + (e.calificacion_acumulada || 0), 0) / estudiantes.length || 0;

  const columnas = tipo === 'detallado' 
    ? ['Nombre', 'Apellidos', 'Email', 'Carrera', 'Estado', 'Nota Final', 'Resultado']
    : ['Nombre Completo', 'Carrera', 'Nota Final', 'Estado', 'Aprobación'];

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* LOGO AHORA SÍ APARECE */}
        <Image src={logoSL} style={styles.logo} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>REPORTE DE ESTUDIANTES</Text>
          <Text style={styles.subtitle}>Tutoría ID: {tutoriaId} • Generado: {fecha}</Text>
        </View>

        {/* Estadísticas */}
        <View style={styles.statsBox}>
          <Text>Aprobados: {aprobados}</Text>
          <Text>Reprobados: {estudiantes.length - aprobados}</Text>
          <Text>Promedio: {promedio.toFixed(1)}%</Text>
          <Text>Tasa de aprobación: {((aprobados / estudiantes.length) * 100).toFixed(1)}%</Text>
        </View>

        {/* Tabla */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            {columnas.map((col, i) => (
              <Text key={i} style={{ ...styles.cell, width: tipo === 'detallado' ? '14.28%' : '20%' }}>
                {col}
              </Text>
            ))}
          </View>

          {estudiantes.map((est, index) => {
            const nombre = est.estudiante_nombre || "N/A";
            const apellidos = `${est.paterno || ""} ${est.materno || ""}`.trim();
            const nota = est.calificacion_acumulada ? est.calificacion_acumulada.toFixed(1) : "0.0";
            const resultado = (est.calificacion_acumulada || 0) >= 51 ? "Aprobado" : "Reprobado";

            return (
              <View key={index} style={{ ...styles.tableRow, backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                {tipo === 'detallado' ? (
                  <>
                    <Text style={{ ...styles.cell, width: '14.28%', textAlign: 'left' }}>{nombre}</Text>
                    <Text style={{ ...styles.cell, width: '14.28%', textAlign: 'left' }}>{apellidos}</Text>
                    <Text style={{ ...styles.cell, width: '14.28%' }}>{est.email || 'N/A'}</Text>
                    <Text style={{ ...styles.cell, width: '14.28%' }}>{est.carrera || 'N/A'}</Text>
                    <Text style={{ ...styles.cell, width: '14.28%' }}>Inscrito</Text>
                    <Text style={{ ...styles.cell, width: '14.28%', fontWeight: 'bold' }}>{nota}%</Text>
                    <Text style={{ ...styles.cell, width: '14.28%', color: resultado === 'Aprobado' ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>
                      {resultado}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={{ ...styles.cell, width: '28%', textAlign: 'left' }}>{nombre} {apellidos}</Text>
                    <Text style={{ ...styles.cell, width: '22%' }}>{est.carrera || 'N/A'}</Text>
                    <Text style={{ ...styles.cell, width: '15%', fontWeight: 'bold' }}>{nota}%</Text>
                    <Text style={{ ...styles.cell, width: '15%' }}>Inscrito</Text>
                    <Text style={{ ...styles.cell, width: '20%', color: resultado === 'Aprobado' ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>
                      {resultado}
                    </Text>
                  </>
                )}
              </View>
            );
          })}
        </View>

        <Text style={styles.footer}>
          Sistema de Tutorías • Generado el {fecha}
        </Text>
      </Page>
    </Document>
  );
};
// === NUEVA FUNCIÓN QUE REEMPLAZA LA VIEJA ===
const generarReportePDF = async (tipo = 'basico') => {
  try {
    setGenerandoReporte(true);

    const estudiantesReporte = estudiantes.filter(e => e.estado_solicitud === "inscrito");
    if (estudiantesReporte.length === 0) {
      alert("No hay estudiantes inscritos");
      return;
    }

    const blob = await pdf(
      <ReportePDF estudiantes={estudiantesReporte} tipo={tipo} tutoriaId={tutoriaId} />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_estudiantes_${tipo}_${tutoriaId}_${Date.now()}.pdf`;
    link.click();

    URL.revokeObjectURL(url);

  } catch (error) {
    console.error(error);
    alert("Error: " + error.message);
  } finally {
    setGenerandoReporte(false);
  }
};
// 🎯 FUNCIÓN AUXILIAR MEJORADA: Truncar texto largo
const truncateText = (text, maxLength) => {
  if (!text || text === 'N/A') return 'N/A';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

// 🎯 FUNCIÓN AUXILIAR: Obtener color según nota (mejorada)
const getColorNota = (nota) => {
  if (nota >= 90) return [46, 204, 113];    // Verde brillante
  if (nota >= 80) return [52, 152, 219];    // Azul
  if (nota >= 70) return [155, 89, 182];    // Púrpura
  if (nota >= 51) return [241, 196, 15];    // Amarillo
  return [231, 76, 60];                     // Rojo
};

  // Funciones auxiliares existentes
  const determinarEstadoAprobacion = (calificacion) => {
    return calificacion >= 51 ? 'Aprobado' : 'Reprobado';
  };

  const getEstadoSolicitudTexto = (estadoSolicitud) => {
    if (estadoSolicitud === 'inscrito') return 'Inscrito';
    if (estadoSolicitud === 'pendiente') return 'Pendiente';
    if (estadoSolicitud === 'rechazado') return 'Rechazado';
    return estadoSolicitud || 'Pendiente';
  };

  const formatearCalificacion = (calificacion) => {
    return calificacion ? calificacion.toFixed(1) : '0.0';
  };

  // Funciones de gestión de estudiantes
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

  const tienePagoCompletado = (estudiante) => {
    return estudiante.estado_pago === 'completado';
  };

  const getEstadoPagoTexto = (estudiante) => {
    if (estudiante.estado_pago === 'completado') return 'Completado';
    if (estudiante.estado_pago === 'pendiente') return 'Pendiente';
    return 'Sin pago';
  };

  const getColorEstadoPago = (estudiante) => {
    if (estudiante.estado_pago === 'completado') return 'green';
    if (estudiante.estado_pago === 'pendiente') return 'yellow';
    return 'red';
  };

  const getColorEstadoSolicitud = (estadoSolicitud) => {
    if (estadoSolicitud === 'inscrito') return 'green';
    if (estadoSolicitud === 'pendiente') return 'yellow';
    if (estadoSolicitud === 'rechazado') return 'red';
    return 'gray';
  };

  const getColorCalificacion = (calificacion) => {
    if (calificacion >= 90) return 'green';
    if (calificacion >= 70) return 'blue';
    if (calificacion >= 51) return 'yellow';
    return 'red';
  };

  const getColorEstadoAprobacion = (calificacion) => {
    return calificacion >= 51 ? 'green' : 'red';
  };

  // Funciones para reportes CSV (existentes)
  const generarReporte = async () => {
    // Tu implementación existente para CSV básico
  };

  const generarReporteDetallado = async () => {
    // Tu implementación existente para CSV detallado
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
    if (filtroEstado === 'aprobados') return (estudiante.calificacion_acumulada || 0) >= 51;
    if (filtroEstado === 'reprobados') return (estudiante.calificacion_acumulada || 0) < 51;
    return estudiante.estado_solicitud === filtroEstado;
  });

  // Estadísticas
  const estadisticas = {
    total: estudiantes.length,
    inscritos: estudiantes.filter(e => e.estado_solicitud === 'inscrito').length,
    pendientes: estudiantes.filter(e => e.estado_solicitud === 'pendiente').length,
    rechazados: estudiantes.filter(e => e.estado_solicitud === 'rechazado').length,
    con_pago: estudiantes.filter(e => tienePagoCompletado(e)).length,
    aprobados: estudiantes.filter(e => (e.calificacion_acumulada || 0) >= 51).length,
    reprobados: estudiantes.filter(e => (e.calificacion_acumulada || 0) < 51).length,
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
      {/* Botones de Reporte */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestión de Estudiantes</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {estudiantesFiltrados.length} estudiantes encontrados
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Botones de PDF */}
          <button
            onClick={() => generarReportePDF('basico')}
            disabled={generandoReporte || estadisticas.inscritos === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {generandoReporte ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generando...</span>
              </>
            ) : (
              <>
                <span>📄 PDF Básico</span>
              </>
            )}
          </button>

          <button
            onClick={() => generarReportePDF('detallado')}
            disabled={generandoReporte || estadisticas.inscritos === 0}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {generandoReporte ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generando...</span>
              </>
            ) : (
              <>
                <span>📑 PDF Detallado</span>
              </>
            )}
          </button>
        </div>
      </div>

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
            <option value="aprobados">Aprobados (≥51)</option>
            <option value="reprobados">Reprobados (&lt;51)</option>
          </select>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{estadisticas.total}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Total</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{estadisticas.aprobados}</p>
            <p className="text-xs text-green-600 dark:text-green-400">Aprobados</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{estadisticas.reprobados}</p>
            <p className="text-xs text-red-600 dark:text-red-400">Reprobados</p>
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
                  Estudiante
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
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
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {estudiante.estudiante_nombre} {estudiante.paterno} {estudiante.materno}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {estudiante.carrera || 'Carrera no especificada'}
                        </p>
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 dark:text-white">{estudiante.email}</p>
                    </td>
                    
                    <td className="px-4 py-3 space-y-2">
                      <Badge color={getColorEstadoSolicitud(estudiante.estado_solicitud)}>
                        {getEstadoSolicitudTexto(estudiante.estado_solicitud)}
                      </Badge>
                      <Badge color={getColorEstadoPago(estudiante)}>
                        {getEstadoPagoTexto(estudiante)}
                      </Badge>
                    </td>
                    
                    <td className="px-4 py-3 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge color={getColorCalificacion(estudiante.calificacion_acumulada || 0)}>
                          {formatearCalificacion(estudiante.calificacion_acumulada)}%
                        </Badge>
                      </div>
                      <Badge color={getColorEstadoAprobacion(estudiante.calificacion_acumulada || 0)}>
                        {determinarEstadoAprobacion(estudiante.calificacion_acumulada || 0)}
                      </Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        TP: {estudiante.puntos_actividades || 0} | 
                        Ev: {estudiante.puntos_evaluaciones || 0}
                      </div>
                    </td>
                    
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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
                          {estudiante.estado_solicitud === 'pendiente' && (
                            <>
                              <button
                                onClick={() => aprobarInscripcion(estudiante.id_inscripcion)}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
                              >
                                Inscribir
                              </button>
                              <button
                                onClick={() => rechazarInscripcion(estudiante.id_inscripcion)}
                                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
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
                    colSpan={puedeAprobarInscripciones ? "6" : "5"} 
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
        <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Información del Sistema:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-300">
          <div>
            <p><strong>✅ Aprobado:</strong> Calificación ≥ 51%</p>
            <p><strong>❌ Reprobado:</strong> Calificación &lt; 51%</p>
            <p><strong>📊 Reportes:</strong> Descargue listados completos en PDF</p>
          </div>
          <div>
            <p><strong>TP:</strong> Puntos de Trabajos Prácticos</p>
            <p><strong>Ev:</strong> Puntos de Evaluaciones</p>
            <p><strong>Nota Final:</strong> Suma de TP + Ev</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablaEstudiantes;