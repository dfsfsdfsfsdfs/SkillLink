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

// Datos de roles
const roleNames = {
  1: "Administrador",
  2: "Gerente", 
  3: "Docente",
  4: "Estudiante"
};

const roleColors = {
  1: "purple",
  2: "blue",
  3: "green",
  4: "gray"
};

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const { isAuthenticated, user, getAuthToken } = useAuth();

  // Estados para filtros
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    aprobacion: 'todos',
    rol: 'todos',
    busqueda: ''
  });

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [usuariosPorPagina, setUsuariosPorPagina] = useState(10);

  // Función para verificar si es admin
  const checkIsAdmin = () => {
    if (!user) return false;
    
    const isUserAdmin = user.rol === 'administrador' || user.rol === 'admin' || user.id_rol === 1;
    
    console.log('🔍 Verificando admin:');
    console.log('🔍 user.rol:', user.rol);
    console.log('🔍 user.id_rol:', user.id_rol);
    console.log('🔍 isUserAdmin:', isUserAdmin);
    
    return isUserAdmin;
  };

  const isAdmin = checkIsAdmin();

  // Función para obtener el token de autenticación
  const getToken = () => {
    return getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
  };

  // Función para cargar TODOS los usuarios
  const fetchTodosUsuarios = async () => {
    try {
      const token = getToken();
      console.log('🔐 Token:', token);
      
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch('http://localhost:3000/usuarios/todos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        console.log('⚠️ Endpoint /todos no disponible, usando /pendientes');
        await fetchUsuariosPendientes();
        return;
      }
      
      const data = await response.json();
      console.log('✅ Todos los usuarios cargados:', data);
      setUsuarios(data || []);
      setUsuariosFiltrados(data || []);
    } catch (err) {
      console.error('💥 Error completo:', err);
      setError('Error al cargar los usuarios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función de respaldo para cargar solo pendientes
  const fetchUsuariosPendientes = async () => {
    try {
      const token = getToken();
      const response = await fetch('http://localhost:3000/usuarios/pendientes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUsuarios(data || []);
      setUsuariosFiltrados(data || []);
    } catch (err) {
      setError('Error al cargar usuarios pendientes: ' + err.message);
    }
  };

  // Función para aplicar filtros
  const aplicarFiltros = () => {
    let filtered = [...usuarios];

    // Filtro por estado (activo/inactivo)
    if (filtros.estado !== 'todos') {
      filtered = filtered.filter(usuario => 
        filtros.estado === 'activos' ? usuario.activo : !usuario.activo
      );
    }

    // Filtro por aprobación
    if (filtros.aprobacion !== 'todos') {
      filtered = filtered.filter(usuario => 
        filtros.aprobacion === 'pendientes' ? usuario.pendiente_aprobacion : !usuario.pendiente_aprobacion
      );
    }

    // Filtro por rol
    if (filtros.rol !== 'todos') {
      filtered = filtered.filter(usuario => usuario.id_rol === parseInt(filtros.rol));
    }

    // Filtro por búsqueda
    if (filtros.busqueda) {
      const searchTerm = filtros.busqueda.toLowerCase();
      filtered = filtered.filter(usuario => 
        usuario.username?.toLowerCase().includes(searchTerm) ||
        usuario.email?.toLowerCase().includes(searchTerm) ||
        roleNames[usuario.id_rol]?.toLowerCase().includes(searchTerm)
      );
    }

    setUsuariosFiltrados(filtered);
    setPaginaActual(1); // Resetear a primera página cuando cambian los filtros
  };

  // Calcular estadísticas
  const estadisticas = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.activo).length,
    inactivos: usuarios.filter(u => !u.activo).length,
    pendientes: usuarios.filter(u => u.pendiente_aprobacion).length,
    aprobados: usuarios.filter(u => !u.pendiente_aprobacion).length,
    administradores: usuarios.filter(u => u.id_rol === 1).length,
    gerentes: usuarios.filter(u => u.id_rol === 2).length,
    docentes: usuarios.filter(u => u.id_rol === 3).length,
    estudiantes: usuarios.filter(u => u.id_rol === 4).length,
  };

  // Paginación
  const indexUltimoUsuario = paginaActual * usuariosPorPagina;
  const indexPrimerUsuario = indexUltimoUsuario - usuariosPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(indexPrimerUsuario, indexUltimoUsuario);
  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const cambiarUsuariosPorPagina = (cantidad) => {
    setUsuariosPorPagina(cantidad);
    setPaginaActual(1);
  };

  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      estado: 'todos',
      aprobacion: 'todos',
      rol: 'todos',
      busqueda: ''
    });
  };

  // CORREGIDO: Función para aprobar usuario
  const aprobarUsuario = async (usuarioId) => {
    if (updating === usuarioId) return;
    
    setUpdating(usuarioId);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      console.log(`🔄 Aprobando usuario ID: ${usuarioId}`);

      const response = await fetch(`http://localhost:3000/usuarios/${usuarioId}/aprobar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('📡 Status de aprobación:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en aprobación:', errorText);
        throw new Error(`Error ${response.status}: No se pudo aprobar el usuario`);
      }

      const result = await response.json();
      console.log('✅ Usuario aprobado:', result);

      // Actualizar el estado local
      setUsuarios(prevUsuarios => 
        prevUsuarios.map(usuario => 
          usuario.id_usuario === usuarioId 
            ? { ...usuario, pendiente_aprobacion: false, activo: true }
            : usuario
        )
      );

      setError(null);
      
    } catch (err) {
      console.error('❌ Error aprobando usuario:', err);
      setError('Error al aprobar el usuario: ' + err.message);
    } finally {
      setUpdating(null);
    }
  };

  // Función para activar/desactivar usuario
  const toggleUsuarioStatus = async (usuarioId, currentStatus) => {
    if (updating === usuarioId) return;
    
    setUpdating(usuarioId);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      console.log(`🔄 ${currentStatus ? 'Desactivando' : 'Activando'} usuario ID: ${usuarioId}`);

      const response = await fetch(`http://localhost:3000/usuarios/${usuarioId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          activo: !currentStatus
        }),
      });

      console.log('📡 Status de actualización:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: No se pudo actualizar el usuario`);
      }

      const result = await response.json();
      console.log('✅ Usuario actualizado:', result);

      // Actualizar el estado local
      setUsuarios(prevUsuarios => 
        prevUsuarios.map(usuario => 
          usuario.id_usuario === usuarioId 
            ? { ...usuario, activo: !currentStatus }
            : usuario
        )
      );
      
    } catch (err) {
      console.error('❌ Error actualizando usuario:', err);
      setError('Error al actualizar el usuario: ' + err.message);
    } finally {
      setUpdating(null);
    }
  };

  // Función para rechazar usuario
  const rechazarUsuario = async (usuarioId) => {
    if (updating === usuarioId) return;
    
    setUpdating(usuarioId);
    
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      console.log(`🗑️ Rechazando usuario ID: ${usuarioId}`);

      const response = await fetch(`http://localhost:3000/usuarios/${usuarioId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: No se pudo rechazar el usuario`);
      }

      const result = await response.json();
      console.log('✅ Usuario rechazado:', result);

      // Remover el usuario de la lista
      setUsuarios(prevUsuarios => 
        prevUsuarios.filter(usuario => usuario.id_usuario !== usuarioId)
      );

      setError(null);
      
    } catch (err) {
      console.error('❌ Error rechazando usuario:', err);
      setError('Error al rechazar el usuario: ' + err.message);
    } finally {
      setUpdating(null);
    }
  };

  // Función para determinar qué acciones mostrar
  const obtenerAccionesUsuario = (usuario) => {
    if (usuario.pendiente_aprobacion) {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => aprobarUsuario(usuario.id_usuario)}
            disabled={updating === usuario.id_usuario}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating === usuario.id_usuario ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              'Aprobar'
            )}
          </button>

          <button
            onClick={() => rechazarUsuario(usuario.id_usuario)}
            disabled={updating === usuario.id_usuario}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating === usuario.id_usuario ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              'Rechazar'
            )}
          </button>
        </div>
      );
    }
    
    return (
      <div className="flex space-x-2">
        <button
          onClick={() => toggleUsuarioStatus(usuario.id_usuario, usuario.activo)}
          disabled={updating === usuario.id_usuario}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            usuario.activo
              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {updating === usuario.id_usuario ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : usuario.activo ? (
            'Desactivar'
          ) : (
            'Activar'
          )}
        </button>
      </div>
    );
  };

  // Efectos
  useEffect(() => {
    console.log('🔍 Debug - Usuario del contexto:', user);
    console.log('🔍 Debug - id_rol:', user?.id_rol);
    console.log('🔍 Debug - rol:', user?.rol);
    console.log('🔍 Debug - isAdmin:', isAdmin);
  }, [user, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchTodosUsuarios();
    }
  }, [isAdmin]);

  useEffect(() => {
    aplicarFiltros();
  }, [filtros, usuarios]);

  // Si no es admin, mostrar mensaje de acceso restringido
  if (!isAdmin) {
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
                  Solo los administradores pueden acceder a esta página.
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
                  Error al cargar los usuarios
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                  {error}
                </p>
                <div className="mt-3 space-x-2">
                  <button 
                    onClick={fetchTodosUsuarios}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
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
            Gestión de Usuarios
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Administra todos los usuarios del sistema. Aprueba solicitudes y gestiona estados.
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{estadisticas.total}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{estadisticas.activos}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Activos</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{estadisticas.inactivos}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Inactivos</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{estadisticas.pendientes}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Pendientes</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{estadisticas.administradores}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Admins</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{estadisticas.gerentes}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Gerentes</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{estadisticas.docentes}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Docentes</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{estadisticas.estudiantes}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Estudiantes</div>
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
                placeholder="Buscar por usuario, email o rol..."
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
                <option value="todos">Todos los estados</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>

            {/* Aprobación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Aprobación
              </label>
              <select
                value={filtros.aprobacion}
                onChange={(e) => setFiltros({...filtros, aprobacion: e.target.value})}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="todos">Todos</option>
                <option value="pendientes">Pendientes</option>
                <option value="aprobados">Aprobados</option>
              </select>
            </div>

            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rol
              </label>
              <select
                value={filtros.rol}
                onChange={(e) => setFiltros({...filtros, rol: e.target.value})}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="todos">Todos los roles</option>
                <option value="1">Administrador</option>
                <option value="2">Gerente</option>
                <option value="3">Docente</option>
                <option value="4">Estudiante</option>
              </select>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {usuariosFiltrados.length} de {estadisticas.total} usuarios
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
            Mostrando {indexPrimerUsuario + 1}-{Math.min(indexUltimoUsuario, usuariosFiltrados.length)} de {usuariosFiltrados.length} usuarios
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Mostrar:</span>
            <select
              value={usuariosPorPagina}
              onChange={(e) => cambiarUsuariosPorPagina(Number(e.target.value))}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] mb-6">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100 dark:border-white/[0.05]">
                <tr>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                    Usuario
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                    Email
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                    Rol
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                    Estado
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                    Aprobación
                  </th>
                  <th className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {usuariosPaginados.map((usuario) => (
                  <tr key={usuario.id_usuario} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-5 py-4 sm:px-6 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {usuario.username?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <span className="block font-medium text-gray-800 text-sm dark:text-white/90">
                            {usuario.username}
                          </span>
                          <span className="block text-gray-500 text-xs dark:text-gray-400">
                            ID: {usuario.id_usuario}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-start text-sm dark:text-gray-400">
                      {usuario.email}
                    </td>
                    <td className="px-4 py-3 text-start">
                      <Badge
                        color={roleColors[usuario.id_rol] || "gray"}
                      >
                        {roleNames[usuario.id_rol] || "Desconocido"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-start">
                      <Badge
                        color={usuario.activo ? "green" : "red"}
                      >
                        {usuario.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-start">
                      <Badge
                        color={usuario.pendiente_aprobacion ? "yellow" : "green"}
                      >
                        {usuario.pendiente_aprobacion ? "Pendiente" : "Aprobado"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-start">
                      {obtenerAccionesUsuario(usuario)}
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

        {usuariosFiltrados.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay usuarios que coincidan con los filtros
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Intenta ajustar los filtros de búsqueda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Usuarios;