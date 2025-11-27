// pages/pagos/ReporteFinanciero.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const ReporteFinanciero = () => {
  const { user } = useAuth();
  const [reporteData, setReporteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    console.log('🔐 Usuario actual:', user);
    if (user) {
      cargarReportes();
    }
  }, [user]);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📡 Iniciando carga de reportes financieros...');
      
      // ✅ USAR EL ENDPOINT CORRECTO SEGÚN EL ROL
      let endpoint = '';
      
      if (user?.id_rol === 3) { // Tutor
        endpoint = 'http://localhost:3000/pagos/reportes-financieros';
      } else if (user?.id_rol === 4) { // Estudiante
        endpoint = 'http://localhost:3000/pagos/estudiante/mis-pagos';
      } else if (user?.id_rol === 2) { // Gerente
        endpoint = 'http://localhost:3000/pagos/estudiante/mis-pagos'; // Mismo endpoint pero filtra por institución
      } else if (user?.id_rol === 1) { // Admin
        endpoint = 'http://localhost:3000/pagos/estudiante/mis-pagos'; // Mismo endpoint pero trae todos
      } else {
        setError(`Tu rol (${user?.id_rol}) no tiene acceso a reportes financieros`);
        return;
      }
      
      console.log('🎯 Endpoint seleccionado:', endpoint);
      
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Respuesta completa:', response);
      console.log('📊 Datos recibidos:', response.data);
      
      if (response.data && response.data.pagos !== undefined) {
        const pagos = response.data.pagos || [];
        console.log('💰 Pagos recibidos para reportes:', pagos);
        console.log('🎭 Rol del usuario:', user?.id_rol);
        
        if (pagos.length > 0) {
          console.log('📝 Estructura del primer pago:', pagos[0]);
        }
        
        if (pagos.length === 0) {
          console.log('⚠️ No hay pagos en la base de datos');
          setReporteData({
            tipo: 'sin_datos',
            mensaje: 'No se encontraron pagos registrados en el sistema.'
          });
          return;
        }

        // Procesar datos según el rol
        let datosProcesados = {};
        
        if (user?.id_rol === 3) { // Tutor
          console.log('👨‍🏫 Procesando como TUTOR');
          datosProcesados = procesarDatosTutor(pagos);
        } else if (user?.id_rol === 4) { // Estudiante
          console.log('🎓 Procesando como ESTUDIANTE');
          datosProcesados = procesarDatosEstudiante(pagos);
        } else if (user?.id_rol === 2) { // Gerente
          console.log('🏢 Procesando como GERENTE');
          datosProcesados = procesarDatosGerente(pagos);
        } else if (user?.id_rol === 1) { // Admin
          console.log('👑 Procesando como ADMIN');
          datosProcesados = procesarDatosAdmin(pagos);
        }
        
        console.log('📈 Datos procesados:', datosProcesados);
        setReporteData(datosProcesados);
      } else {
        console.log('⚠️ Estructura de datos incorrecta');
        setReporteData({
          tipo: 'sin_datos',
          mensaje: 'No se pudieron cargar los datos de reportes.'
        });
      }
    } catch (err) {
      console.error('❌ Error al cargar reportes:', err);
      console.error('❌ Detalles del error:', err.response?.data);
      
      let errorMessage = 'Error al cargar los reportes financieros: ';
      
      if (err.response?.status === 401) {
        errorMessage += 'No estás autenticado. Por favor, inicia sesión nuevamente.';
      } else if (err.response?.status === 403) {
        errorMessage += 'No tienes permisos para acceder a estos reportes.';
      } else if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Error desconocido';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Procesar datos para TUTOR
  const procesarDatosTutor = (pagos) => {
    console.log('👨‍🏫 Procesando pagos para tutor:', pagos);
    
    const pagosCompletados = pagos.filter(pago => pago.estado_pago === 'completado');
    const pagosPendientes = pagos.filter(pago => pago.estado_pago === 'pendiente');
    
    const tutoriasMap = {};
    
    pagos.forEach(pago => {
      const key = pago.id_tutoria;
      if (!tutoriasMap[key]) {
        tutoriasMap[key] = {
          id_tutoria: pago.id_tutoria,
          nombre_tutoria: pago.nombre_tutoria || 'Tutoría sin nombre',
          sigla: pago.sigla || 'N/A',
          totalRecaudado: 0,
          totalPendiente: 0,
          totalEstudiantes: 0,
          estudiantes: []
        };
      }
      
      if (pago.estado_pago === 'completado') {
        tutoriasMap[key].totalRecaudado += parseFloat(pago.monto || 0);
      } else {
        tutoriasMap[key].totalPendiente += parseFloat(pago.monto || 0);
      }
      
      // Agregar estudiante si no existe
      const nombreEstudiante = `${pago.estudiante_nombre || ''} ${pago.estudiante_paterno || ''}`.trim() || 'Estudiante';
      const estudianteExiste = tutoriasMap[key].estudiantes.find(
        e => e.id_estudiante === pago.id_estudiante
      );
      
      if (!estudianteExiste) {
        tutoriasMap[key].estudiantes.push({
          id_estudiante: pago.id_estudiante,
          nombre: nombreEstudiante,
          email: pago.estudiante_email || '',
          totalPagado: pago.estado_pago === 'completado' ? parseFloat(pago.monto || 0) : 0,
          totalPendiente: pago.estado_pago === 'pendiente' ? parseFloat(pago.monto || 0) : 0,
          cantidadPagos: 1,
          ultimoEstado: pago.estado_pago
        });
        tutoriasMap[key].totalEstudiantes++;
      } else {
        if (pago.estado_pago === 'completado') {
          estudianteExiste.totalPagado += parseFloat(pago.monto || 0);
        } else {
          estudianteExiste.totalPendiente += parseFloat(pago.monto || 0);
        }
        estudianteExiste.cantidadPagos++;
        estudianteExiste.ultimoEstado = pago.estado_pago;
      }
    });

    const tutoriasArray = Object.values(tutoriasMap);
    const totalGeneral = tutoriasArray.reduce((sum, tutoria) => sum + tutoria.totalRecaudado, 0);
    const totalPendienteGeneral = tutoriasArray.reduce((sum, tutoria) => sum + tutoria.totalPendiente, 0);
    
    return {
      tipo: 'tutor',
      totalGeneral,
      totalPendienteGeneral,
      totalTutorias: tutoriasArray.length,
      totalEstudiantes: new Set(pagos.map(p => p.id_estudiante)).size,
      totalPagos: pagos.length,
      pagosCompletados: pagosCompletados.length,
      pagosPendientes: pagosPendientes.length,
      tutorias: tutoriasArray,
      pagos: pagos
    };
  };

  // Procesar datos para ESTUDIANTE
  const procesarDatosEstudiante = (pagos) => {
    const pagosCompletados = pagos.filter(pago => pago.estado_pago === 'completado');
    const pagosPendientes = pagos.filter(pago => pago.estado_pago === 'pendiente');
    
    const totalPagado = pagosCompletados.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0);
    const totalPendiente = pagosPendientes.reduce((sum, pago) => sum + parseFloat(pago.monto || 0), 0);
    
    return {
      tipo: 'estudiante',
      totalPagado,
      totalPendiente,
      totalPagos: pagos.length,
      pagosCompletados: pagosCompletados.length,
      pagosPendientes: pagosPendientes.length,
      pagos: pagos,
      resumenPorTutoria: agruparPorTutoria(pagos)
    };
  };

  // Procesar datos para GERENTE
  const procesarDatosGerente = (pagos) => {
    const pagosCompletados = pagos.filter(pago => pago.estado_pago === 'completado');
    const pagosPendientes = pagos.filter(pago => pago.estado_pago === 'pendiente');
    
    const tutoriasMap = {};
    
    pagos.forEach(pago => {
      const key = pago.id_tutoria;
      if (!tutoriasMap[key]) {
        tutoriasMap[key] = {
          id_tutoria: pago.id_tutoria,
          nombre_tutoria: pago.nombre_tutoria,
          sigla: pago.sigla,
          tutor_nombre: pago.tutor_nombre,
          totalRecaudado: 0,
          totalPendiente: 0,
          totalEstudiantes: 0,
          estudiantes: []
        };
      }
      
      if (pago.estado_pago === 'completado') {
        tutoriasMap[key].totalRecaudado += parseFloat(pago.monto || 0);
      } else {
        tutoriasMap[key].totalPendiente += parseFloat(pago.monto || 0);
      }
      
      const estudianteExiste = tutoriasMap[key].estudiantes.find(
        e => e.id_estudiante === pago.id_estudiante
      );
      
      if (!estudianteExiste) {
        tutoriasMap[key].estudiantes.push({
          id_estudiante: pago.id_estudiante,
          nombre: `${pago.estudiante_nombre} ${pago.estudiante_paterno}`,
          email: pago.estudiante_email,
          totalPagado: pago.estado_pago === 'completado' ? parseFloat(pago.monto || 0) : 0,
          totalPendiente: pago.estado_pago === 'pendiente' ? parseFloat(pago.monto || 0) : 0,
          cantidadPagos: 1,
          ultimoEstado: pago.estado_pago
        });
        tutoriasMap[key].totalEstudiantes++;
      } else {
        if (pago.estado_pago === 'completado') {
          estudianteExiste.totalPagado += parseFloat(pago.monto || 0);
        } else {
          estudianteExiste.totalPendiente += parseFloat(pago.monto || 0);
        }
        estudianteExiste.cantidadPagos++;
        estudianteExiste.ultimoEstado = pago.estado_pago;
      }
    });

    const tutoriasArray = Object.values(tutoriasMap);
    const totalGeneral = tutoriasArray.reduce((sum, tutoria) => sum + tutoria.totalRecaudado, 0);
    const totalPendienteGeneral = tutoriasArray.reduce((sum, tutoria) => sum + tutoria.totalPendiente, 0);
    
    return {
      tipo: 'gerente',
      totalGeneral,
      totalPendienteGeneral,
      totalTutorias: tutoriasArray.length,
      totalEstudiantes: new Set(pagos.map(p => p.id_estudiante)).size,
      totalPagos: pagos.length,
      pagosCompletados: pagosCompletados.length,
      pagosPendientes: pagosPendientes.length,
      tutorias: tutoriasArray,
      institucion: pagos[0]?.institucion_nombre || 'Mi Institución'
    };
  };

  // Procesar datos para ADMIN
  const procesarDatosAdmin = (pagos) => {
    const pagosCompletados = pagos.filter(pago => pago.estado_pago === 'completado');
    const pagosPendientes = pagos.filter(pago => pago.estado_pago === 'pendiente');
    
    const institucionesMap = {};
    
    pagos.forEach(pago => {
      const instKey = pago.institucion_nombre;
      if (!institucionesMap[instKey]) {
        institucionesMap[instKey] = {
          nombre: instKey,
          totalRecaudado: 0,
          totalPendiente: 0,
          totalTutorias: 0,
          totalEstudiantes: 0,
          tutorias: {}
        };
      }
      
      if (pago.estado_pago === 'completado') {
        institucionesMap[instKey].totalRecaudado += parseFloat(pago.monto || 0);
      } else {
        institucionesMap[instKey].totalPendiente += parseFloat(pago.monto || 0);
      }
      
      const tutoriaKey = pago.id_tutoria;
      if (!institucionesMap[instKey].tutorias[tutoriaKey]) {
        institucionesMap[instKey].tutorias[tutoriaKey] = {
          id_tutoria: pago.id_tutoria,
          nombre_tutoria: pago.nombre_tutoria,
          sigla: pago.sigla,
          tutor_nombre: pago.tutor_nombre,
          totalRecaudado: 0,
          totalPendiente: 0,
          estudiantes: new Set()
        };
        institucionesMap[instKey].totalTutorias++;
      }
      
      if (pago.estado_pago === 'completado') {
        institucionesMap[instKey].tutorias[tutoriaKey].totalRecaudado += parseFloat(pago.monto || 0);
      } else {
        institucionesMap[instKey].tutorias[tutoriaKey].totalPendiente += parseFloat(pago.monto || 0);
      }
      
      institucionesMap[instKey].tutorias[tutoriaKey].estudiantes.add(pago.id_estudiante);
    });

    Object.values(institucionesMap).forEach(inst => {
      Object.values(inst.tutorias).forEach(tutoria => {
        tutoria.totalEstudiantes = tutoria.estudiantes.size;
        tutoria.estudiantes = Array.from(tutoria.estudiantes);
        inst.totalEstudiantes += tutoria.totalEstudiantes;
      });
      inst.tutorias = Object.values(inst.tutorias);
    });

    const institucionesArray = Object.values(institucionesMap);
    const totalGeneral = institucionesArray.reduce((sum, inst) => sum + inst.totalRecaudado, 0);
    const totalPendienteGeneral = institucionesArray.reduce((sum, inst) => sum + inst.totalPendiente, 0);
    
    return {
      tipo: 'admin',
      totalGeneral,
      totalPendienteGeneral,
      totalInstituciones: institucionesArray.length,
      totalTutorias: institucionesArray.reduce((sum, inst) => sum + inst.totalTutorias, 0),
      totalEstudiantes: institucionesArray.reduce((sum, inst) => sum + inst.totalEstudiantes, 0),
      totalPagos: pagos.length,
      pagosCompletados: pagosCompletados.length,
      pagosPendientes: pagosPendientes.length,
      instituciones: institucionesArray,
      pagos: pagos
    };
  };

  const agruparPorTutoria = (pagos) => {
    const grupos = {};
    pagos.forEach(pago => {
      const key = pago.id_tutoria;
      if (!grupos[key]) {
        grupos[key] = {
          nombre_tutoria: pago.nombre_tutoria,
          sigla: pago.sigla,
          total: 0,
          cantidad: 0
        };
      }
      grupos[key].total += parseFloat(pago.monto || 0);
      grupos[key].cantidad++;
    });
    return Object.values(grupos);
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(monto || 0);
  };

  const filtrarPagosPorEstado = (pagos) => {
    if (filtroEstado === 'todos') return pagos;
    return pagos.filter(pago => pago.estado_pago === filtroEstado);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando reportes financieros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg">
            <div className="flex items-center mb-2">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <strong className="text-lg">Error al cargar reportes</strong>
            </div>
            <p className="mb-4">{error}</p>
            <div className="flex space-x-4">
              <button 
                onClick={cargarReportes}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
              >
                Reintentar
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
              >
                Recargar página
              </button>
            </div>
          </div>
          
          {/* Información de diagnóstico */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Información para diagnóstico:</h3>
            <p className="text-yellow-700 text-sm">
              • Usuario: {user?.username}<br/>
              • Rol: {user?.id_rol}<br/>
              • Email: {user?.email}<br/>
              • Token: {user?.token ? 'Presente' : 'Ausente'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reportes Financieros
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {user?.id_rol === 4 && 'Mis pagos y estados financieros'}
            {user?.id_rol === 3 && 'Reportes de tutorías - Ingresos por estudiantes'}
            {user?.id_rol === 2 && 'Reportes institucionales - Todas las tutorías'}
            {user?.id_rol === 1 && 'Reportes generales del sistema'}
          </p>
        </div>

        {/* Botón de recarga */}
        <div className="mb-6">
          <button 
            onClick={cargarReportes}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Actualizar Datos
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtrar por Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="todos">Todos los estados</option>
                <option value="completado">Completados</option>
                <option value="pendiente">Pendientes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mostrar datos según el rol */}
        {reporteData?.tipo === 'sin_datos' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay datos financieros
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {reporteData.mensaje}
            </p>
            <button 
              onClick={cargarReportes}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Reintentar
            </button>
          </div>
        )}

        {reporteData?.tipo === 'tutor' && (
          <VistaTutor 
            datos={reporteData} 
            formatearMoneda={formatearMoneda}
            filtroEstado={filtroEstado}
            filtrarPagosPorEstado={filtrarPagosPorEstado}
          />
        )}

        {reporteData?.tipo === 'estudiante' && (
          <VistaEstudiante 
            datos={reporteData} 
            formatearMoneda={formatearMoneda}
            filtroEstado={filtroEstado}
            filtrarPagosPorEstado={filtrarPagosPorEstado}
          />
        )}

        {reporteData?.tipo === 'gerente' && (
          <VistaGerente 
            datos={reporteData} 
            formatearMoneda={formatearMoneda}
            filtroEstado={filtroEstado}
            filtrarPagosPorEstado={filtrarPagosPorEstado}
          />
        )}

        {reporteData?.tipo === 'admin' && (
          <VistaAdmin 
            datos={reporteData} 
            formatearMoneda={formatearMoneda}
            filtroEstado={filtroEstado}
            filtrarPagosPorEstado={filtrarPagosPorEstado}
          />
        )}
      </div>
    </div>
  );
};

// Componente para la vista de ESTUDIANTE - ACTUALIZADO
const VistaEstudiante = ({ datos, formatearMoneda, filtroEstado, filtrarPagosPorEstado }) => {
  const pagosFiltrados = filtrarPagosPorEstado(datos.pagos);
  
  return (
    <div className="space-y-6">
      {/* Resumen General */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Resumen de Mis Pagos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {datos.totalPagos}
            </p>
            <p className="text-gray-600 dark:text-gray-400">Total Pagos</p>
          </div>
          <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatearMoneda(datos.totalPagado)}
            </p>
            <p className="text-gray-600 dark:text-gray-400">Total Pagado</p>
          </div>
          <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {formatearMoneda(datos.totalPendiente)}
            </p>
            <p className="text-gray-600 dark:text-gray-400">Total Pendiente</p>
          </div>
          <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {datos.resumenPorTutoria?.length || 0}
            </p>
            <p className="text-gray-600 dark:text-gray-400">Tutorías</p>
          </div>
        </div>
      </div>

      {/* Detalle por Tutoría */}
      {datos.resumenPorTutoria && datos.resumenPorTutoria.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Detalle por Tutoría
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400">Tutoría</th>
                  <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">Total Pagado</th>
                  <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400">Cantidad de Pagos</th>
                </tr>
              </thead>
              <tbody>
                {datos.resumenPorTutoria.map((tutoria, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {tutoria.nombre_tutoria}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {tutoria.sigla}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600 dark:text-green-400">
                      {formatearMoneda(tutoria.total)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">
                      {tutoria.cantidad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historial de Pagos */}
      {pagosFiltrados && pagosFiltrados.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Historial de Pagos ({filtroEstado === 'todos' ? 'Todos' : filtroEstado})
          </h3>
          <div className="space-y-4">
            {pagosFiltrados.map((pago) => (
              <div key={pago.nro_pago} className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {pago.concepto}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {pago.fecha_de_pago ? 
                      new Date(pago.fecha_de_pago).toLocaleDateString('es-BO') : 
                      'Pendiente de pago'
                    }
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tutoría: {pago.nombre_tutoria} ({pago.sigla})
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {formatearMoneda(pago.monto)}
                  </p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    pago.estado_pago === 'completado' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {pago.estado_pago === 'completado' ? 'Completado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No se encontraron pagos {filtroEstado !== 'todos' ? `con estado "${filtroEstado}"` : ''}.
          </p>
        </div>
      )}
    </div>
  );
};

// Componente para la vista de TUTOR - ACTUALIZADO
const VistaTutor = ({ datos, formatearMoneda, filtroEstado, filtrarPagosPorEstado }) => {
  const pagosFiltrados = filtrarPagosPorEstado(datos.pagos);
  
  return (
    <div className="space-y-6">
      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Recaudado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatearMoneda(datos.totalGeneral)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pendiente</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatearMoneda(datos.totalPendienteGeneral)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tutorías</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {datos.totalTutorias}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Estudiantes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {datos.totalEstudiantes}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Tutorías con sus estudiantes */}
      {datos.tutorias && datos.tutorias.length > 0 ? (
        datos.tutorias.map((tutoria) => (
          <div key={tutoria.id_tutoria} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {/* Header de la Tutoría */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">{tutoria.nombre_tutoria}</h3>
                  <p className="text-blue-100">{tutoria.sigla}</p>
                </div>
                <div className="text-right text-white">
                  <p className="text-2xl font-bold">{formatearMoneda(tutoria.totalRecaudado)}</p>
                  <p className="text-blue-100">
                    Recaudado: {formatearMoneda(tutoria.totalRecaudado)} | 
                    Pendiente: {formatearMoneda(tutoria.totalPendiente)}
                  </p>
                  <p className="text-blue-100">
                    {tutoria.totalEstudiantes} estudiante{tutoria.totalEstudiantes !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de Estudiantes */}
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Estudiantes Inscritos
              </h4>
              <div className="space-y-3">
                {tutoria.estudiantes.map((estudiante, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {estudiante.nombre}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {estudiante.email} • {estudiante.cantidadPagos} pago{estudiante.cantidadPagos !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        Pagado: {formatearMoneda(estudiante.totalPagado)}
                      </p>
                      <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                        Pendiente: {formatearMoneda(estudiante.totalPendiente)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay datos financieros
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Aún no hay pagos registrados para tus tutorías.
          </p>
        </div>
      )}

      {/* Historial de Pagos */}
      {pagosFiltrados && pagosFiltrados.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Historial de Pagos ({filtroEstado === 'todos' ? 'Todos' : filtroEstado})
          </h3>
          <div className="space-y-4">
            {pagosFiltrados.map((pago) => (
              <div key={pago.nro_pago} className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {pago.concepto}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Estudiante: {pago.estudiante_nombre} {pago.estudiante_paterno}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {pago.fecha_de_pago ? 
                      `Pagado: ${new Date(pago.fecha_de_pago).toLocaleDateString('es-BO')}` : 
                      'Pendiente de pago'
                    }
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {formatearMoneda(pago.monto)}
                  </p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    pago.estado_pago === 'completado' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {pago.estado_pago === 'completado' ? 'Completado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para la vista de GERENTE - NUEVO
const VistaGerente = ({ datos, formatearMoneda, filtroEstado, filtrarPagosPorEstado }) => {
  const pagosFiltrados = filtrarPagosPorEstado(datos.pagos);
  
  return (
    <div className="space-y-6">
      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Recaudado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatearMoneda(datos.totalGeneral)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pendiente</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatearMoneda(datos.totalPendienteGeneral)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tutorías</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {datos.totalTutorias}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Estudiantes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {datos.totalEstudiantes}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Tutorías con sus estudiantes */}
      {datos.tutorias && datos.tutorias.length > 0 ? (
        datos.tutorias.map((tutoria) => (
          <div key={tutoria.id_tutoria} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {/* Header de la Tutoría */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white">{tutoria.nombre_tutoria}</h3>
                  <p className="text-blue-100">{tutoria.sigla}</p>
                  <p className="text-blue-100">Tutor: {tutoria.tutor_nombre}</p>
                </div>
                <div className="text-right text-white">
                  <p className="text-2xl font-bold">{formatearMoneda(tutoria.totalRecaudado)}</p>
                  <p className="text-blue-100">
                    Recaudado: {formatearMoneda(tutoria.totalRecaudado)} | 
                    Pendiente: {formatearMoneda(tutoria.totalPendiente)}
                  </p>
                  <p className="text-blue-100">
                    {tutoria.totalEstudiantes} estudiante{tutoria.totalEstudiantes !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de Estudiantes */}
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Estudiantes Inscritos
              </h4>
              <div className="space-y-3">
                {tutoria.estudiantes.map((estudiante, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {estudiante.nombre}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {estudiante.email} • {estudiante.cantidadPagos} pago{estudiante.cantidadPagos !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600 dark:text-green-400">
                        Pagado: {formatearMoneda(estudiante.totalPagado)}
                      </p>
                      <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                        Pendiente: {formatearMoneda(estudiante.totalPendiente)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay datos financieros
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Aún no hay pagos registrados en tu institución.
          </p>
        </div>
      )}

      {/* Historial de Pagos */}
      {pagosFiltrados && pagosFiltrados.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Historial de Pagos ({filtroEstado === 'todos' ? 'Todos' : filtroEstado})
          </h3>
          <div className="space-y-4">
            {pagosFiltrados.map((pago) => (
              <div key={pago.nro_pago} className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {pago.concepto}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Estudiante: {pago.estudiante_nombre} {pago.estudiante_paterno}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Tutor: {pago.tutor_nombre} • Tutoría: {pago.nombre_tutoria}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {pago.fecha_de_pago ? 
                      `Pagado: ${new Date(pago.fecha_de_pago).toLocaleDateString('es-BO')}` : 
                      'Pendiente de pago'
                    }
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {formatearMoneda(pago.monto)}
                  </p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    pago.estado_pago === 'completado' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {pago.estado_pago === 'completado' ? 'Completado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para la vista de ADMIN
const VistaAdmin = ({ datos, formatearMoneda }) => {
  return (
    <div className="space-y-6">
      {/* Lista de Instituciones */}
      {datos.instituciones && datos.instituciones.map((institucion) => (
        <div key={institucion.nombre} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Header de la Institución */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-white">{institucion.nombre}</h3>
                <p className="text-purple-100">
                  {institucion.totalTutorias} tutorías • {institucion.totalEstudiantes} estudiantes
                </p>
              </div>
              <div className="text-right text-white">
                <p className="text-2xl font-bold">{formatearMoneda(institucion.totalRecaudado)}</p>
                <p className="text-purple-100">Total Recaudado</p>
              </div>
            </div>
          </div>

          {/* Tutorías de la Institución */}
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tutorías
            </h4>
            <div className="space-y-4">
              {institucion.tutorias.map((tutoria) => (
                <div key={tutoria.id_tutoria} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h5 className="font-semibold text-gray-900 dark:text-white">
                        {tutoria.nombre_tutoria}
                      </h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {tutoria.sigla} • Tutor: {tutoria.tutor_nombre}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatearMoneda(tutoria.totalRecaudado)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {tutoria.totalEstudiantes} estudiantes
                      </p>
                    </div>
                  </div>
                  
                  {/* Estudiantes de esta tutoría */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estudiantes:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {tutoria.estudiantes.slice(0, 5).map((estudiante, index) => (
                        <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                          {estudiante}
                        </span>
                      ))}
                      {tutoria.estudiantes.length > 5 && (
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                          +{tutoria.estudiantes.length - 5} más
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {(!datos.instituciones || datos.instituciones.length === 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay datos financieros
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No se encontraron pagos en el sistema.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReporteFinanciero;