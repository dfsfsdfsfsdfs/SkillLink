import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Badge from '../Tutorias/Badge';

const HistorialPagos = () => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const getToken = () => {
    return localStorage.getItem('authToken');
  };

 
// En HistorialPagos.jsx - función cargarHistorialPagos actualizada
    const cargarHistorialPagos = async () => {
    try {
        setLoading(true);
        const token = getToken();
        
        console.log('🔐 Token:', token ? 'Presente' : 'Faltante');
        
        const response = await fetch('http://localhost:3000/pagos/estudiante/mis-pagos', {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
        });

        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
        const data = await response.json();
        console.log('✅ Datos recibidos:', data);
        
        // La respuesta ahora viene con estructura { pagos: [], metadata: {} }
        setPagos(data.pagos || data);
        
        // Opcional: mostrar información del rol
        if (data.metadata) {
            console.log(`👤 Rol: ${data.metadata.rol}, Total pagos: ${data.metadata.total}`);
        }
        } else {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
        }
    } catch (err) {
        console.error('💥 Error cargando pagos:', err);
        setError(err.message);
    } finally {
        setLoading(false);
    }
    };

  // Obtener color del badge para estado de pago
  const getColorEstadoPago = (estado) => {
    switch (estado) {
      case 'completado': return 'green';
      case 'pendiente': return 'yellow';
      case 'expirado': return 'red';
      case 'cancelado': return 'red';
      default: return 'gray';
    }
  };

  // Obtener texto del estado de pago
  const getEstadoPagoTexto = (estado) => {
    switch (estado) {
      case 'completado': return 'Completado';
      case 'pendiente': return 'Pendiente';
      case 'expirado': return 'Expirado';
      case 'cancelado': return 'Cancelado';
      default: return estado;
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Formatear moneda
  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(monto);
  };

  // Filtrar pagos
  const pagosFiltrados = pagos.filter(pago => {
    // Filtro por estado
    if (filtroEstado !== 'todos' && pago.estado_pago !== filtroEstado) {
      return false;
    }

    // Filtro por fecha
    if (fechaInicio && pago.fecha_de_pago) {
      const fechaPago = new Date(pago.fecha_de_pago);
      const fechaInicioFiltro = new Date(fechaInicio);
      if (fechaPago < fechaInicioFiltro) return false;
    }

    if (fechaFin && pago.fecha_de_pago) {
      const fechaPago = new Date(pago.fecha_de_pago);
      const fechaFinFiltro = new Date(fechaFin);
      fechaFinFiltro.setHours(23, 59, 59, 999);
      if (fechaPago > fechaFinFiltro) return false;
    }

    return true;
  });

  // Calcular estadísticas
  const estadisticas = {
    total: pagosFiltrados.length,
    completados: pagosFiltrados.filter(p => p.estado_pago === 'completado').length,
    pendientes: pagosFiltrados.filter(p => p.estado_pago === 'pendiente').length,
    totalPagado: pagosFiltrados
      .filter(p => p.estado_pago === 'completado')
      .reduce((sum, pago) => sum + parseFloat(pago.monto), 0),
    totalPendiente: pagosFiltrados
      .filter(p => p.estado_pago === 'pendiente')
      .reduce((sum, pago) => sum + parseFloat(pago.monto), 0)
  };

  // Generar reporte PDF general
  const generarReporteGeneralPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102);
    doc.text('REPORTE GENERAL DE PAGOS', 105, 20, { align: 'center' });
    
    // Información del estudiante
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 14, 35);
    doc.text(`Total de transacciones: ${estadisticas.total}`, 14, 45);
    
    // Estadísticas
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text('RESUMEN ESTADÍSTICO', 14, 60);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Pagos completados: ${estadisticas.completados}`, 14, 70);
    doc.text(`Pagos pendientes: ${estadisticas.pendientes}`, 14, 77);
    doc.text(`Total pagado: ${formatearMoneda(estadisticas.totalPagado)}`, 14, 84);
    doc.text(`Total pendiente: ${formatearMoneda(estadisticas.totalPendiente)}`, 14, 91);
    
    // Tabla de pagos
    const tableColumn = [
      'N° Pago', 
      'Tutoría', 
      'Concepto', 
      'Fecha Pago', 
      'Monto', 
      'Estado'
    ];
    
    const tableRows = pagosFiltrados.map(pago => [
      pago.nro_pago.toString(),
      pago.sigla || pago.nombre_tutoria,
      pago.concepto || 'Sin concepto',
      formatearFecha(pago.fecha_de_pago),
      formatearMoneda(pago.monto),
      getEstadoPagoTexto(pago.estado_pago)
    ]);
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 100,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 51, 102] },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });
    
    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${pageCount} - Generado por Sistema OLAR Tutorías`,
        105,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`reporte-pagos-general-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Generar reporte PDF individual
  const generarReporteIndividualPDF = (pago) => {
    const doc = new jsPDF();
    
    // Encabezado
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102);
    doc.text('COMPROBANTE DE PAGO', 105, 20, { align: 'center' });
    
    // Línea separadora
    doc.setDrawColor(0, 51, 102);
    doc.setLineWidth(0.5);
    doc.line(14, 25, 196, 25);
    
    // Información del pago
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    let yPosition = 40;
    
    doc.text(`N° de Transacción: ${pago.codigo_transaccion || pago.nro_pago}`, 14, yPosition);
    yPosition += 8;
    
    doc.text(`Fecha de Emisión: ${formatearFecha(new Date())}`, 14, yPosition);
    yPosition += 8;
    
    if (pago.fecha_de_pago) {
      doc.text(`Fecha de Pago: ${formatearFecha(pago.fecha_de_pago)}`, 14, yPosition);
      yPosition += 8;
    }
    
    doc.text(`Concepto: ${pago.concepto}`, 14, yPosition);
    yPosition += 8;
    
    doc.text(`Tutoría: ${pago.nombre_tutoria} (${pago.sigla})`, 14, yPosition);
    yPosition += 8;
    
    // Monto
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`MONTO: ${formatearMoneda(pago.monto)}`, 14, yPosition + 10);
    
    // Estado
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Estado: ${getEstadoPagoTexto(pago.estado_pago)}`, 14, yPosition + 20);
    
    // Código QR si está disponible
    if (pago.qr_imagen && pago.estado_pago === 'pendiente') {
      try {
        // Agregar imagen QR (si está en base64)
        const qrImage = new Image();
        qrImage.src = `data:image/png;base64,${pago.qr_imagen}`;
        
        // Esperar a que cargue la imagen
        qrImage.onload = () => {
          doc.addImage(qrImage, 'PNG', 140, 60, 50, 50);
          doc.text('Escanea para pagar', 140, 115, { align: 'center' });
          doc.save(`comprobante-pago-${pago.nro_pago}.pdf`);
        };
        
        qrImage.onerror = () => {
          // Si falla la imagen QR, guardar sin ella
          doc.save(`comprobante-pago-${pago.nro_pago}.pdf`);
        };
        
      } catch (error) {
        console.error('Error al generar QR en PDF:', error);
        doc.save(`comprobante-pago-${pago.nro_pago}.pdf`);
      }
    } else {
      doc.save(`comprobante-pago-${pago.nro_pago}.pdf`);
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltroEstado('todos');
    setFechaInicio('');
    setFechaFin('');
  };

  useEffect(() => {
    cargarHistorialPagos();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="text-red-600 dark:text-red-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-red-800 dark:text-red-300 font-semibold">Error</h3>
            <p className="text-red-700 dark:text-red-400 mt-1">{error}</p>
          </div>
        </div>
        <button 
          onClick={cargarHistorialPagos}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Historial de Pagos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gestiona y revisa todos tus pagos de tutorías
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <button
              onClick={generarReporteGeneralPDF}
              disabled={pagos.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Reporte General
            </button>
            <button
              onClick={cargarHistorialPagos}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Filtros y Estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filtros */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Filtros
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado del Pago
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="todos">Todos los estados</option>
                <option value="completado">Completados</option>
                <option value="pendiente">Pendientes</option>
                <option value="expirado">Expirados</option>
                <option value="cancelado">Cancelados</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Desde
              </label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resumen
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Pagos:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {estadisticas.total}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Completados:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {estadisticas.completados}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Pendientes:</span>
              <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                {estadisticas.pendientes}
              </span>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Pagado:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatearMoneda(estadisticas.totalPagado)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-600 dark:text-gray-400">Total Pendiente:</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {formatearMoneda(estadisticas.totalPendiente)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Pagos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  N° Pago
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tutoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Concepto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fecha Pago
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {pagosFiltrados.length > 0 ? (
                pagosFiltrados.map((pago) => (
                  <tr key={pago.nro_pago} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {pago.nro_pago}
                        </p>
                        {pago.codigo_transaccion && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {pago.codigo_transaccion}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {pago.sigla}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {pago.nombre_tutoria}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {pago.concepto || 'Sin concepto'}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatearFecha(pago.fecha_de_pago)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className={`font-semibold ${
                        pago.estado_pago === 'completado' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {formatearMoneda(pago.monto)}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge color={getColorEstadoPago(pago.estado_pago)}>
                        {getEstadoPagoTexto(pago.estado_pago)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => generarReporteIndividualPDF(pago)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs flex items-center"
                          title="Descargar comprobante"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {pagos.length === 0 ? 'No tienes pagos registrados' : 'No se encontraron pagos con los filtros seleccionados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Información adicional */}
      {pagos.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            Información del Historial de Pagos:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-300">
            <div>
              <p><strong>Completado:</strong> Pago procesado exitosamente</p>
              <p><strong>Pendiente:</strong> Pago en espera de confirmación</p>
            </div>
            <div>
              <p><strong>Expirado:</strong> Código QR vencido sin pago</p>
              <p><strong>Cancelado:</strong> Pago cancelado por el usuario</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialPagos;