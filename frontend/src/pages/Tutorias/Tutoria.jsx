import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Inscripcion from './Inscripcion'; // Asegúrate de que esta línea esté presente

// Componente Badge mejorado (se mantiene igual)
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

// Modal para agregar/editar tutoría - MODIFICADO para tutores
const TutoriaModal = ({ isOpen, onClose, onSave, tutoria, isEdit = false, esTutor = false }) => {
  const [formData, setFormData] = useState({
    sigla: '',
    nombre_tutoria: '',
    cupo: '',
    descripcion_tutoria: '',
    id_tutor: '',
    id_institucion: ''
  });
  const [tutores, setTutores] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getAuthToken, user } = useAuth();
  const [mostrarInscripcion, setMostrarInscripcion] = useState(false);
  const [tutoriaParaInscribir, setTutoriaParaInscribir] = useState(null);

  const getToken = () => {
    return getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
  };

  const cargarRecursos = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      const [tutoresRes, institucionesRes] = await Promise.all([
        fetch('http://localhost:3000/tutores', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:3000/instituciones', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (tutoresRes.ok) {
        const tutoresData = await tutoresRes.json();
        const tutoresActivos = tutoresData.filter(tutor => tutor.activo === true);
        setTutores(tutoresActivos);
      }

      if (institucionesRes.ok) {
        const institucionesData = await institucionesRes.json();
        const institucionesActivas = institucionesData.filter(inst => inst.activo === true);
        setInstituciones(institucionesActivas);
      }
    } catch (error) {
      console.error('Error cargando recursos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      cargarRecursos();
      if (isEdit && tutoria) {
        setFormData({
          sigla: tutoria.sigla || '',
          nombre_tutoria: tutoria.nombre_tutoria || '',
          cupo: tutoria.cupo || '',
          descripcion_tutoria: tutoria.descripcion_tutoria || '',
          id_tutor: tutoria.id_tutor || '',
          id_institucion: tutoria.id_institucion || ''
        });
      } else {
        setFormData({
          sigla: '',
          nombre_tutoria: '',
          cupo: '',
          descripcion_tutoria: '',
          id_tutor: esTutor ? user.id_usuario.toString() : '',
          id_institucion: ''
        });
      }
    }
  }, [isOpen, isEdit, tutoria, esTutor, user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      cupo: parseInt(formData.cupo)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Editar Tutoría' : 'Agregar Nueva Tutoría'}
          </h2>
          {esTutor && isEdit && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
              Solo puedes editar: Sigla, Nombre, Cupo y Descripción
            </p>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sigla *
              </label>
              <input
                type="text"
                required
                value={formData.sigla}
                onChange={(e) => setFormData({...formData, sigla: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Ej: MAT101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cupo *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.cupo}
                onChange={(e) => setFormData({...formData, cupo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Número de cupos"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de la Tutoría *
            </label>
            <input
              type="text"
              required
              value={formData.nombre_tutoria}
              onChange={(e) => setFormData({...formData, nombre_tutoria: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Nombre completo de la tutoría"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.descripcion_tutoria}
              onChange={(e) => setFormData({...formData, descripcion_tutoria: e.target.value})}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Descripción detallada de la tutoría..."
            />
          </div>

          {/* Campos de Tutor e Institución - condicionales según permisos */}
          {!esTutor ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tutor *
                </label>
                <select
                  required
                  value={formData.id_tutor}
                  onChange={(e) => setFormData({...formData, id_tutor: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Seleccionar tutor</option>
                  {loading ? (
                    <option value="" disabled>Cargando tutores...</option>
                  ) : tutores.map((tutor) => (
                    <option key={tutor.id_tutor} value={tutor.id_tutor}>
                      {tutor.nombre} {tutor.apellido_paterno} {tutor.apellido_materno} - {tutor.especialidad}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Institución *
                </label>
                <select
                  required
                  value={formData.id_institucion}
                  onChange={(e) => setFormData({...formData, id_institucion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Seleccionar institución</option>
                  {loading ? (
                    <option value="" disabled>Cargando instituciones...</option>
                  ) : instituciones.map((institucion) => (
                    <option key={institucion.id_institucion} value={institucion.id_institucion}>
                      {institucion.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            // Para tutores, mostrar información no editable
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Información del Sistema (No editable)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Tutor Asignado
                    </label>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {tutoria?.tutor_nombre || 'Tú mismo'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Institución
                    </label>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {tutoria?.institucion_nombre || 'Tu institución'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isEdit ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// Componente de Detalles de Tutoría
const DetallesTutoria = ({ tutoria, onClose }) => {
  if (!tutoria) return null;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className={`flex-shrink-0 w-16 h-16 rounded-xl ${getColorLogo(tutoria.nombre_tutoria)} flex items-center justify-center text-white font-bold text-lg`}>
                {getIniciales(tutoria.nombre_tutoria)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {tutoria.nombre_tutoria}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{tutoria.sigla}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Información Principal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Información General</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {tutoria.descripcion_tutoria || 'Sin descripción disponible'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cupo Total</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium">{tutoria.cupo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Inscritos</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white font-medium">
                    {tutoria.inscritos_actuales || 0}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Disponibles</label>
                  <p className={`mt-1 text-sm font-medium ${
                    (tutoria.cupos_disponibles || tutoria.cupo) > 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {tutoria.cupos_disponibles || tutoria.cupo}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                  <Badge color={tutoria.activo ? "green" : "red"} className="mt-1">
                    {tutoria.activo ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Información del Tutor */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tutor</h3>
              
              <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {getIniciales(tutoria.tutor_nombre)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {tutoria.tutor_nombre} {tutoria.tutor_apellido_paterno} {tutoria.tutor_apellido_materno}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{tutoria.tutor_especialidad}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">{tutoria.tutor_email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Institución</label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">{tutoria.institucion_nombre}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{tutoria.institucion_direccion}</p>
              </div>
            </div>
          </div>

          {/* Asignaciones */}
          {tutoria.asignaciones && tutoria.asignaciones.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Horarios y Aulas</h3>
              <div className="space-y-3">
                {tutoria.asignaciones.map((asignacion) => (
                  <div key={`${asignacion.id_aula}-${asignacion.id_tutoria}-${asignacion.id_tutor}`} 
                       className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {asignacion.aula_lugar} - {asignacion.aula_tipo}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {asignacion.dia} • {asignacion.hora_inicio} - {asignacion.hora_fin}
                      </p>
                    </div>
                    <Badge color="blue">
                      Capacidad: {asignacion.aula_capacidad}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estudiantes Inscritos */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Estudiantes Inscritos ({tutoria.estudiantes ? tutoria.estudiantes.length : 0})
              </h3>
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                Exportar Lista
              </button>
            </div>
            
            {tutoria.estudiantes && tutoria.estudiantes.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {tutoria.estudiantes.map((estudiante) => (
                  <div key={estudiante.id_inscripcion} 
                       className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {estudiante.estudiante_nombre} {estudiante.estudiante_paterno} {estudiante.estudiante_materno}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {estudiante.estudiante_email} • {estudiante.estudiante_carrera}
                      </p>
                    </div>
                    <Badge color="green">
                      Inscrito
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p>No hay estudiantes inscritos en esta tutoría</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cerrar
            </button>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">
              Inscribir Estudiante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Tutoria = () => {
  const navigate = useNavigate();
  const [tutorias, setTutorias] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detallesOpen, setDetallesOpen] = useState(false);
  const [tutoriaSeleccionada, setTutoriaSeleccionada] = useState(null);
  const [editingTutoria, setEditingTutoria] = useState(null);
  
  // NUEVO: Estados para la inscripción
  const [mostrarInscripcion, setMostrarInscripcion] = useState(false);
  const [tutoriaParaInscribir, setTutoriaParaInscribir] = useState(null);
  
  // Estado para el filtro de vista
  const [filtroVista, setFiltroVista] = useState('todas');
  const [filtros, setFiltros] = useState({
    institucion: '',
    estado: '',
    search: ''
  });
  const { isAuthenticated, user, getAuthToken } = useAuth();

  // Verificar permisos
  const isAdmin = user?.id_rol === 1;
  const isGerente = user?.id_rol === 2;
  const isTutor = user?.id_rol === 3;
  const puedeGestionar = isAdmin || isGerente;
  const esTutor = isTutor;

  const getToken = () => {
    return getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
  };

  // Función para verificar si el gerente puede gestionar esta tutoría
  const puedeGestionarTutoria = (tutoria) => {
    if (isAdmin) return true;
    if (isGerente && tutoria.id_usuario_gerente === user.id_usuario) return true;
    return false;
  };
// Agrega esta función en tu componente Tutoria
const obtenerIdTutorUsuario = async () => {
  try {
    const token = getToken();
    const response = await fetch('http://localhost:3000/tutor/mi-info', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const tutorInfo = await response.json();
      return tutorInfo.id_tutor;
    }
    return null;
  } catch (error) {
    console.error('Error obteniendo info del tutor:', error);
    return null;
  }
};
// Función para verificar si el tutor puede editar esta tutoría
const tutorPuedeEditar = (tutoria) => {
  return esTutor && tutoria.tutor_id_usuario === user.id_usuario;
};

// Función para verificar si es mi tutoría (para el filtro y badges)
const esMiTutoria = (tutoria) => {
  return esTutor && tutoria.tutor_id_usuario === user.id_usuario;
};

  // Cargar tutorías
// En el componente Tutoria, modifica la función fetchTutorias:
const fetchTutorias = async (vista = filtroVista) => {
  try {
    const token = getToken();
    const url = `http://localhost:3000/tutorias${vista ? `?vista=${vista}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al cargar las tutorías');
    }
    
    const data = await response.json();
    setTutorias(data || []);
  } catch (err) {
    setError(err.message);
    console.error('Error fetching tutorias:', err);
  } finally {
    setLoading(false);
  }
};
// Reemplaza la función abrirInscripcion existente
const abrirInscripcion = (tutoria) => {
  // Verificar si el usuario es estudiante
  if (user?.id_rol !== 4) { // 4 = Estudiante
    alert('Solo los estudiantes pueden inscribirse en tutorías');
    return;
  }

  setTutoriaParaInscribir(tutoria);
  setMostrarInscripcion(true);
};

const cerrarInscripcion = () => {
  setMostrarInscripcion(false);
  setTutoriaParaInscribir(null);
};

const handleInscripcionExitosa = () => {
  // Recargar las tutorías para actualizar cupos disponibles
  fetchTutorias();
};

// Modifica el useEffect para recargar cuando cambie el filtroVista
useEffect(() => {
  fetchTutorias(filtroVista);
}, [filtroVista]);

// Modifica la función que cambia el filtro de vista
const handleFiltroVistaChange = (nuevaVista) => {
  setFiltroVista(nuevaVista);
  setLoading(true);
  // No llamar fetchTutorias aquí, el useEffect se encargará
};

// Actualiza el JSX del filtro de vista para tutores
{esTutor && (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6 shadow-lg">
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Vista de Tutorías
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Selecciona qué tutorías deseas visualizar
        </p>
      </div>
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
        <button
          onClick={() => handleFiltroVistaChange('mis-tutorias')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            filtroVista === 'mis-tutorias'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Mis Tutorías
        </button>
        <button
          onClick={() => handleFiltroVistaChange('todas')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            filtroVista === 'todas'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Todas las Tutorías
        </button>
      </div>
    </div>
  </div>
)}

  // Cargar instituciones para filtros
  const fetchInstituciones = async () => {
    try {
      const token = getToken();
      const response = await fetch('http://localhost:3000/tutorias/recursos/instituciones', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInstituciones(data || []);
      }
    } catch (err) {
      console.error('Error fetching instituciones:', err);
    }
  };

  // Modificar la función de edición para tutores
  const handleEdit = (tutoria) => {
    if (esTutor && !tutorPuedeEditar(tutoria)) {
      alert('Solo puedes editar las tutorías que impartes');
      return;
    }
    
    if (!esTutor && !puedeGestionarTutoria(tutoria)) {
      alert('No tienes permisos para editar esta tutoría');
      return;
    }
    
    setEditingTutoria(tutoria);
    setModalOpen(true);
  };

  // Modificar la función de cambiar estado
  const handleToggleEstado = (tutoria) => {
    if (esTutor) {
      alert('Los tutores no pueden cambiar el estado de las tutorías');
      return;
    }
    
    if (!puedeGestionarTutoria(tutoria)) {
      alert('No tienes permisos para cambiar el estado de esta tutoría');
      return;
    }
    
    toggleTutoriaEstado(tutoria.id_tutoria, tutoria.activo);
  };

  // Crear tutoría
  const crearTutoria = async (formData) => {
    try {
      const token = getToken();
      
      // Si es tutor, forzar su ID como tutor
      const datosEnvio = esTutor 
        ? { ...formData, id_tutor: user.id_usuario }
        : formData;

      const response = await fetch('http://localhost:3000/tutorias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosEnvio)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear tutoría');
      }

      const nuevaTutoria = await response.json();
      setTutorias(prev => [...prev, nuevaTutoria]);
      setModalOpen(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Actualizar tutoría - MODIFICADO para tutores
// Actualizar tutoría - MODIFICADO para tutores
const actualizarTutoria = async (formData) => {
  try {
    const token = getToken();
    
    // Para tutores, incluir todos los campos pero solo permitir editar los específicos
    const datosEnvio = esTutor ? {
      sigla: formData.sigla,
      nombre_tutoria: formData.nombre_tutoria,
      cupo: formData.cupo,
      descripcion_tutoria: formData.descripcion_tutoria,
      id_tutor: editingTutoria.id_tutor, // Mantener el tutor actual
      id_institucion: editingTutoria.id_institucion // Mantener la institución actual
    } : formData;

    console.log("📤 Datos enviados para actualizar:", datosEnvio);

    const response = await fetch(`http://localhost:3000/tutorias/${editingTutoria.id_tutoria}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datosEnvio),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al actualizar tutoría");
    }

    const tutoriaActualizada = await response.json();
    setTutorias(prev => 
      prev.map(tut => 
        tut.id_tutoria === tutoriaActualizada.id_tutoria ? tutoriaActualizada : tut
      )
    );
    setModalOpen(false);
    setEditingTutoria(null);
    setError(null);
  } catch (err) {
    setError(err.message);
  }
};

  // Cambiar estado (solo admin/gerente)
  const toggleTutoriaEstado = async (tutoriaId, currentEstado) => {
    if (updating === tutoriaId) return;
    
    setUpdating(tutoriaId);
    
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/tutorias/${tutoriaId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ activo: !currentEstado })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar estado');
      }

      const result = await response.json();
      setTutorias(prev => 
        prev.map(tut => 
          tut.id_tutoria === tutoriaId ? result.tutoria : tut
        )
      );
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  // Eliminar tutoría (solo admin)
  const eliminarTutoria = async (tutoriaId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta tutoría? Esta acción no se puede deshacer.')) {
      return;
    }

    if (updating === tutoriaId) return;
    
    setUpdating(tutoriaId);
    
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/tutorias/${tutoriaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar tutoría');
      }

      setTutorias(prev => prev.filter(tut => tut.id_tutoria !== tutoriaId));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  // Ver detalles completos
  const verDetalles = (tutoria) => {
    navigate(`/dashboard/tutorias/${tutoria.id_tutoria}`);
  };

  // Funciones auxiliares de UI (se mantienen igual)
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
      'bg-gradient-to-br from-indigo-500 to-indigo-600',
      'bg-gradient-to-br from-pink-500 to-pink-600',
    ];
    if (!nombre) return colors[0];
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getCupoColor = (cuposDisponibles) => {
    if (cuposDisponibles >= 8) return "green";
    if (cuposDisponibles >= 5) return "yellow";
    if (cuposDisponibles >= 1) return "orange";
    return "red";
  };

  // Filtros combinados
  const tutoriasFiltradas = tutorias.filter(tutoria => {
    // Filtro por vista (mis tutorías vs todas)
    const matchesVista = filtroVista === 'todas' || 
    (filtroVista === 'mis-tutorias' && esMiTutoria(tutoria));

    // Filtros existentes
    const matchesInstitucion = !filtros.institucion || tutoria.id_institucion === parseInt(filtros.institucion);
    const matchesEstado = !filtros.estado || 
      (filtros.estado === 'activas' && tutoria.activo) ||
      (filtros.estado === 'inactivas' && !tutoria.activo);
    const matchesSearch = !filtros.search || 
      tutoria.nombre_tutoria.toLowerCase().includes(filtros.search.toLowerCase()) ||
      tutoria.sigla.toLowerCase().includes(filtros.search.toLowerCase()) ||
      tutoria.tutor_nombre.toLowerCase().includes(filtros.search.toLowerCase());

     return matchesVista && matchesInstitucion && matchesEstado && matchesSearch;
  });

  const handleFiltroChange = (key, value) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
  };

  const limpiarFiltros = () => {
    setFiltros({ institucion: '', estado: '', search: '' });
  };

  // Estadísticas actualizadas
  const misTutorias = tutorias.filter(t => t.id_tutor === user.id_usuario);
  const estadisticas = {
    total: tutorias.length,
    activas: tutorias.filter(t => t.activo).length,
    misTutorias: misTutorias.length,
    misTutoriasActivas: misTutorias.filter(t => t.activo).length,
    cuposTotales: tutorias.reduce((sum, t) => sum + t.cupo, 0),
    instituciones: new Set(tutorias.map(t => t.id_institucion)).size,
    tutores: new Set(tutorias.map(t => t.id_tutor)).size
  };

  useEffect(() => {
    fetchTutorias();
    fetchInstituciones();
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
                  Error al cargar las tutorías
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                  {error}
                </p>
                <button 
                  onClick={fetchTutorias}
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
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -translate-x-12 translate-y-12"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
                Gestión de Tutorías
              </h1>
              <p className="text-lg text-indigo-100 opacity-90 max-w-2xl leading-relaxed">
                {esTutor 
                  ? 'Gestiona tus tutorías y consulta el catálogo completo'
                  : 'Administra y organiza todas las tutorías académicas del sistema de manera eficiente'
                }
              </p>
            </div>
            
            {(puedeGestionar || esTutor) && (
              <button
                onClick={() => setModalOpen(true)}
                className="group relative px-8 py-4 bg-white text-indigo-700 rounded-xl hover:bg-indigo-50 transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 font-semibold"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="relative">Nueva Tutoría</span>
              </button>
            )}
          </div>
          
          {/* Separador decorativo con stats actualizadas */}
          <div className="relative mt-6 pt-6 border-t border-white/20">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center space-x-2 text-white/80">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span>{estadisticas.activas} Tutorías Activas</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span>{estadisticas.total} Total de Tutorías</span>
              </div>
              {esTutor && (
                <div className="flex items-center space-x-2 text-white/80">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span>{estadisticas.misTutorias} Mis Tutorías</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-white/80">
                <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                <span>{estadisticas.instituciones} Instituciones</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        {/* Stats Mejoradas */}
        <div className={`grid gap-6 mb-8 ${esTutor ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-4'}`}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {estadisticas.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Total Tutorías
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
              {estadisticas.activas}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Tutorías Activas
            </div>
          </div>
          {esTutor && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                {estadisticas.misTutorias}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Mis Tutorías
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {estadisticas.instituciones}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Instituciones
            </div>
          </div>
        </div>

        {/* NUEVO: Filtro de Vista para Tutores */}
        {esTutor && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6 shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Vista de Tutorías
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Selecciona qué tutorías deseas visualizar
                </p>
              </div>
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <button
                  onClick={() => setFiltroVista('mis-tutorias')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    filtroVista === 'mis-tutorias'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Mis Tutorías
                </button>
                <button
                  onClick={() => setFiltroVista('todas')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    filtroVista === 'todas'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Todas las Tutorías
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filtros Mejorados */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-8 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={filtros.search}
                onChange={(e) => handleFiltroChange('search', e.target.value)}
                placeholder="Buscar tutoría, sigla o tutor..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
              />
            </div>

            {/* Filtro por Institución */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Institución
              </label>
              <select
                value={filtros.institucion}
                onChange={(e) => handleFiltroChange('institucion', e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
              >
                <option value="">Todas las instituciones</option>
                {instituciones.map(inst => (
                  <option key={inst.id_institucion} value={inst.id_institucion}>
                    {inst.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <select
                value={filtros.estado}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
              >
                <option value="">Todos los estados</option>
                <option value="activas">Activas</option>
                <option value="inactivas">Inactivas</option>
              </select>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mostrando {tutoriasFiltradas.length} de {estadisticas.total} tutorías
              {esTutor && filtroVista === 'mis-tutorias' && ` (${estadisticas.misTutorias} mis tutorías)`}
            </div>
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Grid de Tutorías Mejorado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutoriasFiltradas.map((tutoria) => {
            const cuposDisponibles = tutoria.cupos_disponibles !== undefined ? tutoria.cupos_disponibles : tutoria.cupo;
            const inscritosActuales = tutoria.inscritos_actuales || 0;
            const esMiTutoria = esTutor && tutoria.id_tutor === user.id_usuario;
            
            return (
              <div 
                key={tutoria.id_tutoria}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Header con logo y nombre */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800">
                  <div className="flex items-start space-x-4">
                    {/* Logo con iniciales */}
                    <div className={`flex-shrink-0 w-16 h-16 rounded-xl ${getColorLogo(tutoria.nombre_tutoria)} flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {getIniciales(tutoria.nombre_tutoria)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2 leading-tight">
                        {tutoria.nombre_tutoria}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 font-medium">
                        {tutoria.sigla}
                      </p>
                      <div className="flex items-center flex-wrap gap-2">
                        <Badge color={tutoria.activo ? "green" : "red"}>
                          {tutoria.activo ? "Activa" : "Inactiva"}
                        </Badge>
                        <Badge color={getCupoColor(cuposDisponibles)}>
                          {inscritosActuales}/{tutoria.cupo} inscritos
                        </Badge>
                        {esMiTutoria && (
                          <Badge color="blue" size="sm">
                            Mi tutoría
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información de la tutoría */}
                <div className="p-6 space-y-4">
                  {/* Descripción */}
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20" className="w-4 h-4">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                        {tutoria.descripcion_tutoria || 'Sin descripción disponible'}
                      </p>
                    </div>
                  </div>

                  {/* Tutor */}
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-gray-500">
                      <svg fill="currentColor" viewBox="0 0 20 20" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Tutor:</span> {tutoria.tutor_nombre}
                      </p>
                    </div>
                  </div>

                  {/* Institución */}
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-gray-500">
                      <svg fill="currentColor" viewBox="0 0 20 20" className="w-4 h-4">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Institución:</span> {tutoria.institucion_nombre}
                      </p>
                    </div>
                  </div>

                  {/* Cupos Disponibles */}
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-gray-500">
                      <svg fill="currentColor" viewBox="0 0 20 20" className="w-4 h-4">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${
                        cuposDisponibles > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {cuposDisponibles > 0 
                          ? `${cuposDisponibles} cupos disponibles` 
                          : 'Cupo completo'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer con acciones - MEJORADO para tutores */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      ID: {tutoria.id_tutoria}
                      {isGerente && tutoria.id_usuario_gerente === user.id_usuario && (
                        <Badge color="blue" size="sm" className="ml-2">
                          Tu institución
                        </Badge>
                      )}
                    </span>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => verDetalles(tutoria)}
                        className="group relative text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-all duration-200 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:scale-105"
                      >
                        <span className="relative z-10">Detalles</span>
                      </button>
                      
                      {/* Mostrar botón Editar SOLO en "Mis Tutorías" o si es admin/gerente */}
                      {(filtroVista === 'mis-tutorias' || puedeGestionar) && (
                        <button 
                          onClick={() => handleEdit(tutoria)}
                          className="group relative text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 font-semibold transition-all duration-200 px-3 py-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30 hover:scale-105 disabled:opacity-50"
                          disabled={updating === tutoria.id_tutoria || (esTutor && !tutorPuedeEditar(tutoria))}
                        >
                          <span className="relative z-10">Editar</span>
                        </button>
                      )}
                      
                      {/* Resto de acciones para admin/gerente */}
                      {puedeGestionar && puedeGestionarTutoria(tutoria) && (
                        <>
                          <button 
                            onClick={() => handleToggleEstado(tutoria)}
                            disabled={updating === tutoria.id_tutoria}
                            className={`group relative text-sm font-semibold transition-all duration-200 px-3 py-2 rounded-lg hover:scale-105 disabled:opacity-50 ${
                              tutoria.activo
                                ? 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30'
                                : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30'
                            }`}
                          >
                            {updating === tutoria.id_tutoria ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="relative z-10">
                                {tutoria.activo ? 'Desactivar' : 'Activar'}
                              </span>
                            )}
                          </button>

                          {isAdmin && (
                            <button 
                              onClick={() => eliminarTutoria(tutoria.id_tutoria)}
                              disabled={updating === tutoria.id_tutoria}
                              className="group relative text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold transition-all duration-200 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:scale-105 disabled:opacity-50"
                            >
                              <span className="relative z-10">Eliminar</span>
                            </button>
                          )}
                        </>
                      )}
                      
                      {/* Acciones para TUTORES en SUS tutorías */}
                      {esTutor && esMiTutoria && (
                        <button 
                          onClick={() => handleEdit(tutoria)}
                          className="group relative text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 font-semibold transition-all duration-200 px-3 py-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30 hover:scale-105 disabled:opacity-50"
                          disabled={updating === tutoria.id_tutoria}
                        >
                          <span className="relative z-10">Editar</span>
                        </button>
                      )}
                      
                      {/* Botón de inscripción para estudiantes */}
                      {!puedeGestionar && !esTutor && tutoria.cupos_disponibles > 0 && tutoria.activo && (
                        <button 
                          onClick={() => abrirInscripcion(tutoria)}
                          className="group relative text-sm text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-semibold transition-all duration-200 px-3 py-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 hover:scale-105"
                        >
                          <span className="relative z-10">Inscribirse</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mensaje si no hay tutorías */}
        {tutoriasFiltradas.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="text-gray-400 dark:text-gray-500 mb-6">
              <svg className="mx-auto h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              No hay tutorías disponibles
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-lg">
              {tutorias.length === 0 
                ? 'No se encontraron tutorías para mostrar en este momento.'
                : 'No hay tutorías que coincidan con los filtros aplicados.'
              }
            </p>
            {tutorias.length > 0 ? (
              <button 
                onClick={limpiarFiltros}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 hover:scale-105 font-semibold"
              >
                Limpiar Filtros
              </button>
            ) : (puedeGestionar || esTutor) ? (
              <button 
                onClick={() => setModalOpen(true)}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 hover:scale-105 font-semibold"
              >
                Agregar Primera Tutoría
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Modales */}
      <TutoriaModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTutoria(null);
        }}
        onSave={editingTutoria ? actualizarTutoria : crearTutoria}
        tutoria={editingTutoria}
        isEdit={!!editingTutoria}
        esTutor={esTutor}
      />

      <DetallesTutoria
        tutoria={tutoriaSeleccionada}
        onClose={() => {
          setDetallesOpen(false);
          setTutoriaSeleccionada(null);
        }}
      />
      {/* Modal de Inscripción */}
    {/* NUEVO: Modal de Inscripción */}
    {mostrarInscripcion && tutoriaParaInscribir && (
      <Inscripcion
        tutoria={tutoriaParaInscribir}
        onClose={cerrarInscripcion}
        onInscripcionExitosa={handleInscripcionExitosa}
      />
    )}
    </div>
  );
};

export default Tutoria;