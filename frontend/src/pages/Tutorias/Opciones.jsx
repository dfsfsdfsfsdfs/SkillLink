import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Opciones = ({ preguntaId, preguntaDescripcion, onClose }) => {
  const [opciones, setOpciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingOpcion, setEditingOpcion] = useState(null);
  const { getAuthToken, user } = useAuth();

  // Estado del formulario
  const [formData, setFormData] = useState({
    respuesta_opcion: ''
  });

  // Determinar permisos según el rol
  const userRole = user?.id_rol;
  const isAdmin = userRole === 1;
  const isGerente = userRole === 2;
  const isTutor = userRole === 3;

  const getToken = () => {
    return getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
  };

  // Cargar opciones de la pregunta - URL CORREGIDA
// Cargar opciones de la pregunta - con múltiples opciones de prueba
const cargarOpciones = async () => {
  try {
    setLoading(true);
    setError(null);
    const token = getToken();
    
    console.log('Cargando opciones para pregunta:', preguntaId);
    
    // Opción 1: Endpoint original
    let response = await fetch(`http://localhost:3000/opciones/pregunta/${preguntaId}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Si falla, intentar con el endpoint de debug
    if (!response.ok) {
      console.log('Endpoint principal falló, intentando con debug...');
      response = await fetch(`http://localhost:3000/opciones/debug/pregunta/${preguntaId}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('Response status:', response.status);

    if (response.ok) {
      const opcionesData = await response.json();
      console.log('Opciones cargadas:', opcionesData);
      setOpciones(opcionesData);
    } else {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      throw new Error(errorData.error || `Error ${response.status}`);
    }
  } catch (err) {
    console.error('Error completo:', err);
    setError('Error al cargar opciones: ' + err.message);
    setOpciones([]);
  } finally {
    setLoading(false);
  }
};

  // Validar permisos para crear/editar opciones
  const puedeGestionarOpciones = () => {
    return isAdmin || isGerente || isTutor;
  };

  // Crear nueva opción
  const crearOpcion = async (formData) => {
    try {
      if (!puedeGestionarOpciones()) {
        setError('No tienes permisos para crear opciones');
        return;
      }

      const token = getToken();
      const response = await fetch('http://localhost:3000/opciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          numero_preg: parseInt(preguntaId) // Asegurar que es número
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear opción');
      }

      await cargarOpciones(); // Recargar las opciones
      setShowModal(false);
      resetForm();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Actualizar opción
  const actualizarOpcion = async (formData) => {
    try {
      if (!puedeGestionarOpciones()) {
        setError('No tienes permisos para editar opciones');
        return;
      }

      const token = getToken();
      const response = await fetch(`http://localhost:3000/opciones/${editingOpcion.inciso}/${preguntaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar opción');
      }

      await cargarOpciones(); // Recargar las opciones
      setShowModal(false);
      setEditingOpcion(null);
      resetForm();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Eliminar opción (soft delete)
  const eliminarOpcion = async (inciso) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta opción?')) {
      return;
    }

    try {
      if (!puedeGestionarOpciones()) {
        setError('No tienes permisos para eliminar opciones');
        return;
      }

      const token = getToken();
      const response = await fetch(`http://localhost:3000/opciones/${inciso}/${preguntaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar opción');
      }

      await cargarOpciones(); // Recargar las opciones
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      respuesta_opcion: ''
    });
  };

  const abrirModalCrear = () => {
    if (!puedeGestionarOpciones()) {
      setError('No tienes permisos para crear opciones');
      return;
    }
    setShowModal(true);
    setEditingOpcion(null);
    resetForm();
  };

  const abrirModalEditar = (opcion) => {
    if (!puedeGestionarOpciones()) {
      setError('No tienes permisos para editar opciones');
      return;
    }
    setEditingOpcion(opcion);
    setFormData({
      respuesta_opcion: opcion.respuesta_opcion
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingOpcion) {
      actualizarOpcion(formData);
    } else {
      crearOpcion(formData);
    }
  };

  useEffect(() => {
    if (preguntaId) {
      cargarOpciones();
    }
  }, [preguntaId]);

  // Modal para crear/editar opción
  const OpcionModal = () => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingOpcion ? 'Editar Opción' : 'Crear Nueva Opción'}
            </h2>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <p>Pregunta: {preguntaDescripcion}</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Texto de la Opción *
              </label>
              <textarea
                required
                value={formData.respuesta_opcion}
                onChange={(e) => setFormData({...formData, respuesta_opcion: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Escribe el texto de la opción aquí..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingOpcion(null);
                  resetForm();
                }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                {editingOpcion ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const getIncisoBadge = (inciso) => {
    // Convertir número a letra (1->a, 2->b, etc.)
    const letraInciso = String.fromCharCode(96 + parseInt(inciso)); // 97 = 'a' en ASCII
    
    const colores = {
      'a': 'blue', 'b': 'green', 'c': 'yellow', 'd': 'purple', 
      'e': 'pink', 'f': 'indigo', 'g': 'red', 'h': 'orange'
    };
    const color = colores[letraInciso] || 'gray';
    
    return (
      <span className={`px-2 py-1 text-xs bg-${color}-100 text-${color}-800 dark:bg-${color}-900 dark:text-${color}-300 rounded-full font-medium`}>
        {letraInciso.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando opciones...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Opciones de Respuesta
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {preguntaDescripcion}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Pregunta ID: {preguntaId}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto">
          {/* Mensaje de error */}
          {error && (
            <div className="m-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botón de crear */}
          {puedeGestionarOpciones() && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={abrirModalCrear}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Nueva Opción</span>
              </button>
            </div>
          )}

          {/* Lista de opciones */}
          <div className="p-4 space-y-3">
            {opciones.length > 0 ? (
              opciones.map((opcion) => (
                <div 
                  key={`${opcion.inciso}-${opcion.numero_preg}`} 
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getIncisoBadge(opcion.inciso)}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Opción {opcion.inciso}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {opcion.respuesta_opcion}
                      </p>
                    </div>
                    
                    {puedeGestionarOpciones() && (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => abrirModalEditar(opcion)}
                          className="text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 font-medium transition-colors px-2 py-1 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => eliminarOpcion(opcion.inciso)}
                          className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium transition-colors px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  No hay opciones
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {puedeGestionarOpciones() 
                    ? 'Comienza creando la primera opción para esta pregunta' 
                    : 'Aún no se han creado opciones para esta pregunta'
                  }
                </p>
                {puedeGestionarOpciones() && (
                  <button
                    onClick={abrirModalCrear}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Crear Primera Opción
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <OpcionModal />
    </div>
  );
};

export default Opciones;