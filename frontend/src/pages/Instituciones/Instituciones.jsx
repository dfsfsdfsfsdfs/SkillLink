import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

// Componente Badge reutilizable
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

// Modal para agregar/editar institución con funcionalidad de logo
const InstitucionModal = ({ isOpen, onClose, onSave, institucion, isEdit = false, isGerente = false }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    tipo_institucion: '',
    horario_atencion: '',
    id_usuario_gerente: '',
    logo_base64: ''
  });
  const [usuariosGerentes, setUsuariosGerentes] = useState([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [gerenteInfo, setGerenteInfo] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const { getAuthToken, user } = useAuth();

  const getToken = () => {
    return getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
  };

  // Función para obtener iniciales del nombre
  const getIniciales = (nombre) => {
    if (!nombre || typeof nombre !== 'string') return 'UN';
    const palabras = nombre.split(' ').filter(word => word.trim() !== '');
    let iniciales = '';
    
    if (palabras.length === 0) return 'UN';
    
    const palabrasSignificativas = palabras.filter(palabra => 
      palabra.length > 2 && 
      !['de', 'del', 'la', 'las', 'los', 'y', 'e', 'en', 'el'].includes(palabra.toLowerCase())
    );
    
    if (palabrasSignificativas.length >= 2) {
      iniciales = palabrasSignificativas[0].charAt(0) + palabrasSignificativas[1].charAt(0);
    } else if (palabras.length >= 2) {
      iniciales = palabras[0].charAt(0) + palabras[1].charAt(0);
    } else {
      iniciales = nombre.substring(0, 2);
    }
    
    return iniciales.toUpperCase();
  };

  // Función para obtener color del logo
  const getColorLogo = (nombre) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-green-500 to-green-600',
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-red-500 to-red-600',
      'bg-gradient-to-br from-yellow-500 to-yellow-600',
      'bg-gradient-to-br from-indigo-500 to-indigo-600',
      'bg-gradient-to-br from-pink-500 to-pink-600',
      'bg-gradient-to-br from-teal-500 to-teal-600'
    ];
    
    if (!nombre || typeof nombre !== 'string') return colors[0];
    
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    
    return colors[index];
  };

  // Manejar subida de archivo
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido. Solo se permiten imágenes JPEG, PNG, GIF y WebP.');
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es demasiado grande. El tamaño máximo permitido es 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setFormData(prev => ({ ...prev, logo_base64: base64 }));
      setPreviewImage(base64);
    };
    reader.readAsDataURL(file);
  };

  // Eliminar logo
  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo_base64: '' }));
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cargar información del gerente actual
  const fetchGerenteInfo = async (gerenteId) => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/instituciones/gerente/${gerenteId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const perfil = await response.json();
        setGerenteInfo(perfil);
      }
    } catch (error) {
      console.error('Error cargando información del gerente:', error);
    }
  };

  // Cargar usuarios gerentes con información de perfil
  const fetchUsuariosGerentes = async () => {
    try {
      setLoadingUsuarios(true);
      const token = getToken();
      
      // Si es gerente editando, cargar solo su información
      if (isGerente && isEdit && institucion) {
        await fetchGerenteInfo(institucion.id_usuario_gerente);
        setLoadingUsuarios(false);
        return;
      }

      // Para admin, cargar todos los gerentes
      const usuariosResponse = await fetch('http://localhost:3000/usuarios/todos', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!usuariosResponse.ok) {
        throw new Error('Error al cargar usuarios');
      }

      const usuarios = await usuariosResponse.json();
      
      // Filtrar solo usuarios gerentes activos y aprobados
      const gerentesIds = usuarios
        .filter(usuario => 
          usuario.id_rol === 2 && 
          usuario.activo === true && 
          usuario.pendiente_aprobacion === false
        )
        .map(gerente => gerente.id_usuario);

      if (gerentesIds.length === 0) {
        setUsuariosGerentes([]);
        return;
      }

      // Obtener información de perfil de los gerentes
      const gerentesConPerfil = await Promise.all(
        gerentesIds.map(async (id) => {
          try {
            const perfilResponse = await fetch(`http://localhost:3000/instituciones/gerente/${id}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (perfilResponse.ok) {
              const perfil = await perfilResponse.json();
              const usuario = usuarios.find(u => u.id_usuario === id);
              return {
                ...usuario,
                perfil: perfil
              };
            }
            
            // Si no hay perfil específico, devolver solo datos de usuario
            const usuario = usuarios.find(u => u.id_usuario === id);
            return usuario;
          } catch (error) {
            console.error(`Error cargando perfil para gerente ${id}:`, error);
            const usuario = usuarios.find(u => u.id_usuario === id);
            return usuario;
          }
        })
      );

      setUsuariosGerentes(gerentesConPerfil);
    } catch (error) {
      console.error('Error al cargar usuarios gerentes:', error);
      setUsuariosGerentes([]);
    } finally {
      setLoadingUsuarios(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setGerenteInfo(null);
      setPreviewImage(null);
      fetchUsuariosGerentes();
      
      if (isEdit && institucion) {
        setFormData({
          nombre: institucion.nombre || '',
          direccion: institucion.direccion || '',
          telefono: institucion.telefono || '',
          tipo_institucion: institucion.tipo_institucion || '',
          horario_atencion: institucion.horario_atencion || '',
          id_usuario_gerente: institucion.id_usuario_gerente || '',
          logo_base64: institucion.logo_base64 || ''
        });

        if (institucion.logo_base64) {
          setPreviewImage(institucion.logo_base64);
        }

        if (isGerente) {
          fetchGerenteInfo(institucion.id_usuario_gerente);
        }
      } else {
        setFormData({
          nombre: '',
          direccion: '',
          telefono: '',
          tipo_institucion: '',
          horario_atencion: '',
          id_usuario_gerente: '',
          logo_base64: ''
        });
      }
    }
  }, [isEdit, institucion, isOpen, isGerente]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Solo validar gerente para admin creando nueva institución
    if (!isGerente && !formData.id_usuario_gerente) {
      alert('Por favor selecciona un usuario gerente');
      return;
    }
    
    onSave(formData);
  };

  // Función para formatear el nombre del gerente
  const getNombreGerente = (gerente) => {
    if (gerente.perfil) {
      return `${gerente.perfil.nombre || ''} ${gerente.perfil.apellido_paterno || ''}`.trim();
    }
    return gerente.username || gerente.email || `Usuario ${gerente.id_usuario}`;
  };

  // Función para obtener el nombre del gerente actual
  const getNombreGerenteActual = () => {
    if (gerenteInfo) {
      return `${gerenteInfo.nombre || ''} ${gerenteInfo.apellido_paterno || ''}`.trim() || 
             user?.username || 
             user?.email || 
             `Usuario ${formData.id_usuario_gerente}`;
    }
    return user?.username || user?.email || `Usuario ${formData.id_usuario_gerente}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Editar Institución' : 'Agregar Nueva Institución'}
          </h2>
          {isGerente && isEdit && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Modo gerente: Solo puedes editar los datos de tu institución
            </p>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Sección de Logo */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Logo de la Institución
            </label>
            
            <div className="flex flex-col items-center space-y-4">
              {/* Preview del Logo */}
              <div className="relative">
                {previewImage ? (
                  <div className="relative">
                    <img 
                      src={previewImage} 
                      alt="Logo preview" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className={`w-24 h-24 rounded-full ${getColorLogo(formData.nombre)} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                    {getIniciales(formData.nombre)}
                  </div>
                )}
              </div>

              {/* Botón de subir archivo */}
              <div className="flex flex-col space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm text-center"
                >
                  {previewImage ? 'Cambiar Logo' : 'Subir Logo'}
                </label>
                
                {previewImage && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Eliminar Logo
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Formatos: JPEG, PNG, GIF, WebP<br />
                Tamaño máximo: 5MB
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Nombre de la institución"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Institución
            </label>
            <select
              value={formData.tipo_institucion}
              onChange={(e) => setFormData({...formData, tipo_institucion: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Seleccionar tipo</option>
              <option value="Universidad Pública">Universidad Pública</option>
              <option value="Universidad Privada">Universidad Privada</option>
              <option value="Instituto Técnico">Instituto Técnico</option>
              <option value="Colegio">Colegio</option>
              <option value="Centro de Formación">Centro de Formación</option>
            </select>
          </div>

          {/* Campo de Gerente - Diferente comportamiento para admin vs gerente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Usuario Gerente {!isGerente && '*'}
            </label>
            
            {isGerente && isEdit ? (
              // Para gerente editando: mostrar información de solo lectura
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {getNombreGerenteActual()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.email || `ID: ${formData.id_usuario_gerente}`}
                    </p>
                  </div>
                  <Badge color="blue" size="sm">
                    Tú
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Como gerente, no puedes cambiar la asignación de esta institución
                </p>
                <input
                  type="hidden"
                  value={formData.id_usuario_gerente}
                  onChange={(e) => setFormData({...formData, id_usuario_gerente: e.target.value})}
                />
              </div>
            ) : (
              // Para admin: selector normal
              <select
                required={!isGerente}
                value={formData.id_usuario_gerente}
                onChange={(e) => setFormData({...formData, id_usuario_gerente: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Seleccionar gerente</option>
                {loadingUsuarios ? (
                  <option value="" disabled>Cargando gerentes...</option>
                ) : usuariosGerentes.length === 0 ? (
                  <option value="" disabled>No hay gerentes disponibles</option>
                ) : (
                  usuariosGerentes.map((gerente) => (
                    <option key={gerente.id_usuario} value={gerente.id_usuario}>
                      {getNombreGerente(gerente)} - {gerente.email} (ID: {gerente.id_usuario})
                    </option>
                  ))
                )}
              </select>
            )}
            
            {!isGerente && usuariosGerentes.length === 0 && !loadingUsuarios && (
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-300">
                  <strong>No hay gerentes disponibles</strong><br />
                  Para asignar un gerente, primero debe:
                </p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-400 mt-1 list-disc list-inside">
                  <li>Crear un usuario con rol "Gerente"</li>
                  <li>Aprobar el usuario desde la gestión de usuarios</li>
                  <li>Asegurarse de que el usuario esté activo</li>
                </ul>
              </div>
            )}

            {!isGerente && usuariosGerentes.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {usuariosGerentes.length} gerente(s) disponible(s)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => setFormData({...formData, direccion: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Dirección completa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.telefono}
              onChange={(e) => setFormData({...formData, telefono: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Número de teléfono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Horario de Atención
            </label>
            <input
              type="text"
              value={formData.horario_atencion}
              onChange={(e) => setFormData({...formData, horario_atencion: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ej: 08:00-18:00"
            />
          </div>

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
              disabled={(!isGerente && !formData.id_usuario_gerente) || loadingUsuarios || uploadingLogo}
              className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {uploadingLogo && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>
                {isEdit ? 'Actualizar' : 'Crear'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Instituciones = () => {
  const [instituciones, setInstituciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInstitucion, setEditingInstitucion] = useState(null);
  const { isAuthenticated, user, getAuthToken } = useAuth();

  // Función para verificar si es admin
  const isAdmin = user?.id_rol === 1 || user?.rol === 'administrador';
  
  // Función para verificar si es gerente
  const isGerente = user?.id_rol === 2 || user?.rol === 'gerente';

  // Función para obtener el token
  const getToken = () => {
    return getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
  };

  // Cargar instituciones
  const fetchInstituciones = async () => {
    try {
      const token = getToken();
      const response = await fetch('http://localhost:3000/instituciones', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar las instituciones');
      }
      
      const data = await response.json();
      setInstituciones(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching instituciones:', err);
    } finally {
      setLoading(false);
    }
  };

  // Crear institución (solo admin)
  const crearInstitucion = async (formData) => {
    try {
      const token = getToken();
      const response = await fetch('http://localhost:3000/instituciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear institución');
      }

      const nuevaInstitucion = await response.json();
      setInstituciones(prev => [...prev, nuevaInstitucion]);
      setModalOpen(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Actualizar institución
  const actualizarInstitucion = async (formData) => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/instituciones/${editingInstitucion.id_institucion}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar institución');
      }

      const institucionActualizada = await response.json();
      setInstituciones(prev => 
        prev.map(inst => 
          inst.id_institucion === institucionActualizada.id_institucion ? institucionActualizada : inst
        )
      );
      setModalOpen(false);
      setEditingInstitucion(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

// Activar/desactivar institución (solo admin) - VERSIÓN CON REACTIVACIÓN
const toggleInstitucionEstado = async (idInstitucion, estadoActual) => {
  try {
    setUpdating(idInstitucion);
    const token = getToken();
    
    // SI SE VA A DESACTIVAR
    if (estadoActual) {
      // Primero intentar sin desactivar dependencias
      const response = await fetch(`http://localhost:3000/instituciones/${idInstitucion}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          activo: false,
          desactivar_dependencias: false 
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        // Si hay error por dependencias, mostrar opciones
        if (response.status === 400 && result.detalles?.necesita_confirmacion) {
          const confirmar = window.confirm(
            `⚠️ No se puede desactivar esta institución porque tiene:\n\n` +
            `• ${result.detalles.aulas_activas} aula(s) activa(s)\n` +
            `• ${result.detalles.tutorias_activas} tutoría(s) activa(s)\n\n` +
            `¿Deseas desactivar la institución junto con todas sus aulas y tutorías?\n\n` +
            `📌 Nota: Las aulas y tutorías solo se DESACTIVARÁN temporalmente.\n` +
            `Podrás reactivarlas junto con la institución más tarde.`
          );
          
          if (confirmar) {
            // Intentar con desactivación de dependencias
            const responseConDependencias = await fetch(`http://localhost:3000/instituciones/${idInstitucion}/estado`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ 
                activo: false,
                desactivar_dependencias: true 
              })
            });

            if (!responseConDependencias.ok) {
              const errorData = await responseConDependencias.json();
              throw new Error(errorData.error || 'Error al desactivar con dependencias');
            }

            const resultConDependencias = await responseConDependencias.json();
            
            // Actualizar el estado local
            setInstituciones(prev => 
              prev.map(inst => 
                inst.id_institucion === idInstitucion 
                  ? { ...inst, activo: false }
                  : inst
              )
            );
            
            setError(null);
            
            // Mostrar resumen
            if (resultConDependencias.resumen) {
              alert(
                `✅ Institución desactivada correctamente.\n\n` +
                `Resumen:\n` +
                `• Instituciones desactivadas: 1\n` +
                `• Aulas desactivadas: ${resultConDependencias.resumen.aulas_desactivadas}\n` +
                `• Tutorías desactivadas: ${resultConDependencias.resumen.tutorias_desactivadas}\n\n` +
                `📌 Todas las aulas y tutorías fueron DESACTIVADAS temporalmente.`
              );
            }
            return;
          } else {
            throw new Error('Operación cancelada por el usuario');
          }
        }
        throw new Error(result.error || 'Error al cambiar estado');
      }

      // Si no hubo dependencias, actualizar normalmente
      setInstituciones(prev => 
        prev.map(inst => 
          inst.id_institucion === idInstitucion 
            ? { ...inst, activo: false }
            : inst
        )
      );
      setError(null);
      alert(`✅ Institución desactivada correctamente.`);
    } 
    // SI SE VA A ACTIVAR
    else {
      const confirmarReactivar = window.confirm(
        `¿Deseas activar esta institución?\n\n` +
        `Opciones:\n` +
        `1. Solo activar la institución (las aulas/tutorías permanecerán desactivadas)\n` +
        `2. Activar la institución y reactivar todas sus aulas y tutorías`
      );
      
      if (confirmarReactivar) {
        const reactivarDependencias = window.confirm(
          `¿Deseas reactivar también todas las aulas y tutorías de esta institución?\n\n` +
          `• "Cancelar": Solo activa la institución\n` +
          `• "Aceptar": Activa la institución y todas sus aulas/tutorías`
        );
        
        // Activar con o sin reactivación de dependencias
        const response = await fetch(`http://localhost:3000/instituciones/${idInstitucion}/estado`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            activo: true,
            reactivar_dependencias: reactivarDependencias
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al activar institución');
        }

        const result = await response.json();
        
        // Actualizar el estado local
        setInstituciones(prev => 
          prev.map(inst => 
            inst.id_institucion === idInstitucion 
              ? { ...inst, activo: true }
              : inst
          )
        );
        
        setError(null);
        
        // Mostrar mensaje apropiado
        if (reactivarDependencias && result.resumen) {
          alert(
            `✅ Institución activada correctamente.\n\n` +
            `Resumen:\n` +
            `• Instituciones activadas: 1\n` +
            `• Aulas reactivadas: ${result.resumen.aulas_reactivadas}\n` +
            `• Tutorías reactivadas: ${result.resumen.tutorias_reactivadas}`
          );
        } else {
          alert(`✅ Institución activada correctamente.\n\n📌 Las aulas y tutorías permanecen desactivadas.`);
        }
      } else {
        throw new Error('Operación cancelada por el usuario');
      }
    }
    
  } catch (err) {
    setError(err.message);
    console.error('Error en toggleInstitucionEstado:', err);
  } finally {
    setUpdating(null);
  }
};


  // Eliminar institución (solo admin)
  const eliminarInstitucion = async (idInstitucion) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta institución? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setUpdating(idInstitucion);
      const token = getToken();
      const response = await fetch(`http://localhost:3000/instituciones/${idInstitucion}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar institución');
      }

      setInstituciones(prev => prev.filter(inst => inst.id_institucion !== idInstitucion));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  // Función para verificar si el gerente puede editar esta institución
  const puedeEditarInstitucion = (institucion) => {
    if (isAdmin) return true;
    if (isGerente && institucion.id_usuario_gerente === user.id_usuario) return true;
    return false;
  };

  // Abrir modal de edición
  const handleEdit = (institucion) => {
    if (!puedeEditarInstitucion(institucion)) {
      alert('No tienes permisos para editar esta institución');
      return;
    }
    setEditingInstitucion(institucion);
    setModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingInstitucion(null);
  };

  // Guardar institución (crear o actualizar)
  const handleSave = (formData) => {
    if (editingInstitucion) {
      actualizarInstitucion(formData);
    } else {
      crearInstitucion(formData);
    }
  };

  useEffect(() => {
    fetchInstituciones();
  }, []);

  // Funciones auxiliares
  const getIniciales = (nombre) => {
    if (!nombre || typeof nombre !== 'string') return 'UN';
    const palabras = nombre.split(' ').filter(word => word.trim() !== '');
    let iniciales = '';
    
    if (palabras.length === 0) return 'UN';
    
    const palabrasSignificativas = palabras.filter(palabra => 
      palabra.length > 2 && 
      !['de', 'del', 'la', 'las', 'los', 'y', 'e', 'en', 'el'].includes(palabra.toLowerCase())
    );
    
    if (palabrasSignificativas.length >= 2) {
      iniciales = palabrasSignificativas[0].charAt(0) + palabrasSignificativas[1].charAt(0);
    } else if (palabras.length >= 2) {
      iniciales = palabras[0].charAt(0) + palabras[1].charAt(0);
    } else {
      iniciales = nombre.substring(0, 2);
    }
    
    return iniciales.toUpperCase();
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
      'bg-gradient-to-br from-teal-500 to-teal-600'
    ];
    
    if (!nombre || typeof nombre !== 'string') return colors[0];
    
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    
    return colors[index];
  };

  const getTipoColor = (tipo) => {
    if (!tipo) return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    
    const colors = {
      'Universidad Pública': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      'Universidad Privada': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
      'Instituto Técnico': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
      'Colegio': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
      'Centro de Formación': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
      'default': 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
    };
    
    return colors[tipo] || colors.default;
  };

  // Calcular estadísticas
  const estadisticas = {
    total: instituciones.length,
    activas: instituciones.filter(inst => inst.activo).length,
    inactivas: instituciones.filter(inst => !inst.activo).length,
    tipos: new Set(instituciones.map(inst => inst.tipo_institucion)).size
  };

  // Mostrar mensaje especial para gerentes
  const getHeaderMessage = () => {
    if (isGerente) {
      return instituciones.length > 0 
        ? "Tu institución asignada" 
        : "No tienes una institución asignada";
    }
    return "Gestiona todas las instituciones del sistema";
  };

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
                  Error al cargar las instituciones
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                  {error}
                </p>
                <button 
                  onClick={fetchInstituciones}
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
        {/* Header con botón de agregar */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {isGerente ? 'Mi Institución' : 'Instituciones Educativas'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {getHeaderMessage()}
            </p>
          </div>
          
          {isAdmin && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Agregar Institución</span>
            </button>
          )}
        </div>

        {/* Estadísticas - Solo mostrar para admin */}
        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {estadisticas.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Total Instituciones
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                {estadisticas.activas}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Instituciones Activas
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                {estadisticas.inactivas}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Instituciones Inactivas
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {estadisticas.tipos}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Tipos Diferentes
              </div>
            </div>
          </div>
        )}

        {/* Grid de Instituciones */}
        <div className={`grid gap-6 ${isAdmin ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 max-w-4xl mx-auto'}`}>
          {instituciones.map((institucion) => (
            <div 
              key={institucion.id_institucion}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border ${
                institucion.activo 
                  ? 'border-gray-200 dark:border-gray-700' 
                  : 'border-red-200 dark:border-red-800'
              } ${isGerente && institucion.id_usuario_gerente === user.id_usuario ? 'ring-2 ring-blue-500' : ''}`}
            >
              {/* Header con logo y nombre */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {institucion.logo_base64 ? (
                      <img 
                        src={institucion.logo_base64} 
                        alt={`Logo ${institucion.nombre}`}
                        className="w-16 h-16 rounded-xl object-cover shadow-lg border-2 border-white dark:border-gray-800"
                      />
                    ) : (
                      <div className={`w-16 h-16 rounded-xl ${getColorLogo(institucion.nombre)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                        {getIniciales(institucion.nombre)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 break-words">
                      {institucion.nombre}
                    </h3>
                    <div className="flex items-center justify-between mb-2">
                      <Badge color={institucion.activo ? "green" : "red"}>
                        {institucion.activo ? "Activa" : "Inactiva"}
                      </Badge>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTipoColor(institucion.tipo_institucion)}`}>
                        {institucion.tipo_institucion || 'Sin tipo'}
                      </span>
                    </div>
                    {isGerente && institucion.id_usuario_gerente === user.id_usuario && (
                      <Badge color="blue" size="sm">
                        Tu institución
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="p-6 space-y-3">
                {institucion.direccion && (
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20" className="w-4 h-4">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
                        {institucion.direccion}
                      </p>
                    </div>
                  </div>
                )}

                {institucion.telefono && (
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-gray-500">
                      <svg fill="currentColor" viewBox="0 0 20 20" className="w-4 h-4">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {institucion.telefono}
                      </p>
                    </div>
                  </div>
                )}

                {institucion.horario_atencion && (
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-5 h-5 text-gray-400 dark:text-gray-500">
                      <svg fill="currentColor" viewBox="0 0 20 20" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {institucion.horario_atencion}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer con acciones */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {institucion.id_institucion}
                  </span>
                  
                  {/* Mostrar acciones solo si tiene permisos */}
                  {(isAdmin || (isGerente && institucion.id_usuario_gerente === user.id_usuario)) && (
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEdit(institucion)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        disabled={updating === institucion.id_institucion}
                      >
                        Editar
                      </button>
                      
                      {/* Solo admin puede activar/desactivar y eliminar */}
                      {isAdmin && (
                        <>
                          <button 
                            onClick={() => toggleInstitucionEstado(institucion.id_institucion, institucion.activo)}
                            disabled={updating === institucion.id_institucion}
                            className={`text-sm font-medium transition-colors px-3 py-1 rounded-lg ${
                              institucion.activo
                                ? 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30'
                                : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30'
                            } disabled:opacity-50`}
                          >
                            {updating === institucion.id_institucion ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : institucion.activo ? (
                              'Desactivar'
                            ) : (
                              'Activar'
                            )}
                          </button>

                          <button 
                            onClick={() => eliminarInstitucion(institucion.id_institucion)}
                            disabled={updating === institucion.id_institucion}
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {instituciones.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {isGerente ? 'No tienes una institución asignada' : 'No hay instituciones disponibles'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {isAdmin 
                ? 'Comienza agregando la primera institución al sistema.' 
                : isGerente
                ? 'Contacta al administrador para que te asigne una institución.'
                : 'No se encontraron instituciones para mostrar en este momento.'
              }
            </p>
            {isAdmin && (
              <button 
                onClick={() => setModalOpen(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agregar Primera Institución
              </button>
            )}
          </div>
        )}

        {/* Modal */}
        <InstitucionModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          onSave={handleSave}
          institucion={editingInstitucion}
          isEdit={!!editingInstitucion}
          isGerente={isGerente}
        />
      </div>
    </div>
  );
};

export default Instituciones;