import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Componente Badge (se mantiene igual)
const Badge = ({ children, color = "gray", size = "sm" }) => {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm"
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorClasses[color]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
};

const TutoresTutoria = () => {
  const [tutores, setTutores] = useState([]);
  const [tutoresFiltrados, setTutoresFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const { isAuthenticated, user, getAuthToken } = useAuth();

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    busqueda: ''
  });

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [tutoresPorPagina, setTutoresPorPagina] = useState(10);

  // Verificar permisos
  const isAdmin = user?.id_rol === 1;
  const isGerente = user?.id_rol === 2;
  const puedeGestionar = isAdmin || isGerente;

  const getToken = () => {
    return getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
  };

  // Cargar tutores (ACTUALIZADO - usa el nuevo endpoint)
  const fetchTutores = async () => {
    try {
      const token = getToken();
      const response = await fetch('http://localhost:3000/tutores/gestion/todos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar los tutores');
      }
      
      const data = await response.json();
      setTutores(data || []);
      setTutoresFiltrados(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching tutores:', err);
    } finally {
      setLoading(false);
    }
  };

  // Activar/desactivar tutor (solo admin y gerentes)
  const toggleTutorEstado = async (tutorId, currentEstado) => {
    if (!puedeGestionar) return;
    
    if (updating === tutorId) return;
    
    setUpdating(tutorId);
    
    try {
      const token = getToken();
      
      // Si está activo, desactivar (soft delete)
      if (currentEstado) {
        const response = await fetch(`http://localhost:3000/tutores/${tutorId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al desactivar tutor');
        }
      } else {
        // Si está inactivo, reactivar
        const response = await fetch(`http://localhost:3000/tutores/${tutorId}/activar`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al activar tutor');
        }
      }

      // Recargar la lista de tutores
      await fetchTutores();
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    let filtered = [...tutores];

    // Filtro por estado
    if (filtros.estado !== 'todos') {
      filtered = filtered.filter(tutor => 
        filtros.estado === 'activos' ? tutor.activo : !tutor.activo
      );
    }

    // Filtro por búsqueda
    if (filtros.busqueda) {
      const searchTerm = filtros.busqueda.toLowerCase();
      filtered = filtered.filter(tutor => 
        tutor.nombre?.toLowerCase().includes(searchTerm) ||
        tutor.apellido_paterno?.toLowerCase().includes(searchTerm) ||
        tutor.email?.toLowerCase().includes(searchTerm) ||
        tutor.especialidad?.toLowerCase().includes(searchTerm)
      );
    }

    setTutoresFiltrados(filtered);
    setPaginaActual(1);
  };

  // Calcular estadísticas
  const estadisticas = {
    total: tutores.length,
    activos: tutores.filter(t => t.activo).length,
    inactivos: tutores.filter(t => !t.activo).length
  };

  // Paginación
  const indexUltimoTutor = paginaActual * tutoresPorPagina;
  const indexPrimerTutor = indexUltimoTutor - tutoresPorPagina;
  const tutoresPaginados = tutoresFiltrados.slice(indexPrimerTutor, indexUltimoTutor);
  const totalPaginas = Math.ceil(tutoresFiltrados.length / tutoresPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const cambiarTutoresPorPagina = (cantidad) => {
    setTutoresPorPagina(cantidad);
    setPaginaActual(1);
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      estado: 'todos',
      busqueda: ''
    });
  };

  useEffect(() => {
    if (puedeGestionar) {
      fetchTutores();
    }
  }, [puedeGestionar]);

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, tutores]);

  // Si no tiene permisos, mostrar mensaje
  if (!puedeGestionar) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                  Acceso restringido
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                  Solo administradores y gerentes pueden acceder a esta página.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
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
                  Error al cargar los tutores
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                  {error}
                </p>
                <button 
                  onClick={fetchTutores}
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Gestión de Tutores
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Activa o desactiva tutores del sistema.
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{estadisticas.total}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Tutores</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{estadisticas.activos}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Activos</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{estadisticas.inactivos}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Inactivos</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Buscar por nombre, email o especialidad..."
                value={filtros.busqueda}
                onChange={(e) => setFiltros({...filtros, busqueda: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <select
                value={filtros.estado}
                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="todos">Todos los tutores</option>
                <option value="activos">Solo activos</option>
                <option value="inactivos">Solo inactivos</option>
              </select>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {tutoresFiltrados.length} de {estadisticas.total} tutores
            </div>
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Controles de paginación superior */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Página {paginaActual} de {totalPaginas} • 
            Mostrando {indexPrimerTutor + 1}-{Math.min(indexUltimoTutor, tutoresFiltrados.length)} de {tutoresFiltrados.length} tutores
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Mostrar:</span>
            <select
              value={tutoresPorPagina}
              onChange={(e) => cambiarTutoresPorPagina(Number(e.target.value))}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        {/* Tabla de Tutores */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] mb-6">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 dark:border-white/[0.05]">
                <tr>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                    Tutor
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                    Contacto
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                    Especialidad
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                    Estado
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {tutoresPaginados.map((tutor) => (
                  <tr key={tutor.id_tutor} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-4 sm:px-6 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {tutor.nombre?.charAt(0).toUpperCase() || 'T'}
                          </span>
                        </div>
                        <div>
                          <span className="block font-medium text-gray-800 text-sm dark:text-white/90">
                            {tutor.nombre} {tutor.apellido_paterno} {tutor.apellido_materno}
                          </span>
                          <span className="block text-gray-500 text-xs dark:text-gray-400">
                            ID: {tutor.id_tutor}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-start text-sm dark:text-gray-400">
                      <div>{tutor.email}</div>
                      {tutor.celular && (
                        <div className="text-xs text-gray-400">{tutor.celular}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-start">
                      <Badge color="blue">
                        {tutor.especialidad || 'Sin especialidad'}
                      </Badge>
                      {tutor.nivel_academico && (
                        <div className="text-xs text-gray-500 mt-1">{tutor.nivel_academico}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-start">
                      <Badge color={tutor.activo ? "green" : "red"}>
                        {tutor.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-start">
                      <div className="flex space-x-2">
                        {/* Botón para activar/desactivar */}
                        <button
                          onClick={() => toggleTutorEstado(tutor.id_tutor, tutor.activo)}
                          disabled={updating === tutor.id_tutor}
                          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                            tutor.activo
                              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
                          } disabled:opacity-50`}
                        >
                          {updating === tutor.id_tutor ? (
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : tutor.activo ? (
                            'Desactivar'
                          ) : (
                            'Activar'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación inferior */}
        {totalPaginas > 1 && (
          <div className="flex justify-between items-center">
            <button
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => cambiarPagina(page)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    paginaActual === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}

        {tutoresFiltrados.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay tutores que coincidan con los filtros
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {tutores.length === 0 
                ? 'No se encontraron tutores en el sistema.' 
                : 'Intenta ajustar los filtros de búsqueda.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TutoresTutoria;