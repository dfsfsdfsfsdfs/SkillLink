// components/Evaluaciones.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Preguntas from './Preguntas';

// 🔥 MOVER el modal fuera del componente principal
const EvaluacionModal = ({
  show,
  editingEvaluacion,
  formData,
  onInputChange,
  onClose,
  onSubmit
}) => {
  if (!show) return null;

  const handleInputChange = (field, value) => {
    onInputChange(field, value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingEvaluacion ? "Editar Evaluación" : "Crear Nueva Evaluación"}
          </h2>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* NOMBRE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre de la Evaluación *
            </label>
            <input
              type="text"
              required
              value={formData.nombre_evaluacion}
              onChange={(e) => handleInputChange('nombre_evaluacion', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ej: Examen Parcial 1"
            />
          </div>

          {/* DESCRIPCIÓN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Descripción opcional..."
            />
          </div>

          {/* FECHA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha Límite
            </label>
            <input
              type="date"
              value={formData.fecha_limite}
              onChange={(e) => handleInputChange('fecha_limite', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* BOTONES */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 
              dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 
              rounded-lg transition-colors"
            >
              {editingEvaluacion ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Evaluaciones = () => {
  const { id } = useParams();
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvaluacion, setEditingEvaluacion] = useState(null);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState(null);
  const { getAuthToken, user } = useAuth();

  // 🔥 NUEVO: Estado para información de la tutoría
  const [tutoriaInfo, setTutoriaInfo] = useState(null);

  const [formData, setFormData] = useState({
    nombre_evaluacion: '',
    descripcion: '',
    fecha_limite: ''
  });

  const getToken = useCallback(() => {
    return getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
  }, [getAuthToken]);

  // Determinar permisos según el rol
  const userRole = user?.id_rol;
  const isAdmin = userRole === 1;
  const isGerente = userRole === 2;
  const isTutor = userRole === 3;

  // 🔥 NUEVO: Cargar información de la tutoría para validar permisos
  const cargarTutoriaInfo = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/tutorias/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const tutoriaData = await response.json();
        setTutoriaInfo(tutoriaData);
      }
    } catch (err) {
      console.error('Error cargando información de tutoría:', err);
    }
  }, [getToken, id]);

  // 🔥 NUEVA FUNCIÓN: Validar permisos para gestionar evaluaciones
  const puedeGestionarEvaluaciones = useCallback(() => {
    if (!tutoriaInfo) return false;

    if (isAdmin) return true; // Admin puede en cualquier tutoría
    
    if (isGerente) {
      // Gerente solo si la tutoría es de su institución
      return tutoriaInfo.gerente_pertenece_a_institucion === true;
    }
    
    if (isTutor) {
      // Tutor solo si está dando esa tutoría
      return tutoriaInfo.tutor_pertenece_al_usuario === true;
    }
    
    return false;
  }, [tutoriaInfo, isAdmin, isGerente, isTutor]);

  // Cargar evaluaciones
  const cargarEvaluaciones = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`http://localhost:3000/evaluaciones/tutoria/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const evaluacionesData = await response.json();
        setEvaluaciones(evaluacionesData);
      } else {
        throw new Error('Error al cargar evaluaciones');
      }
    } catch (err) {
      setError('Error al cargar evaluaciones: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, id]);

  // Crear evaluación - ACTUALIZADO con validación de permisos
  const crearEvaluacion = useCallback(async (formData) => {
    try {
      // 🔥 VALIDAR PERMISOS
      if (!puedeGestionarEvaluaciones()) {
        setError('No tienes permisos para crear evaluaciones en esta tutoría');
        return;
      }

      const token = getToken();
      const evaluacionData = {
        ...formData,
        id_tutoria: parseInt(id)
      };

      const response = await fetch('http://localhost:3000/evaluaciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(evaluacionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear evaluación');
      }

      await cargarEvaluaciones();
      setShowModal(false);
      resetForm();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [getToken, id, cargarEvaluaciones, puedeGestionarEvaluaciones]);

  // Actualizar evaluación - ACTUALIZADO con validación de permisos
  const actualizarEvaluacion = useCallback(async (formData) => {
    try {
      // 🔥 VALIDAR PERMISOS
      if (!puedeGestionarEvaluaciones()) {
        setError('No tienes permisos para editar evaluaciones en esta tutoría');
        return;
      }

      const token = getToken();
      const response = await fetch(`http://localhost:3000/evaluaciones/${editingEvaluacion.id_evaluacion}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar evaluación');
      }

      await cargarEvaluaciones();
      setShowModal(false);
      setEditingEvaluacion(null);
      resetForm();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [getToken, editingEvaluacion, cargarEvaluaciones, puedeGestionarEvaluaciones]);

  // Eliminar evaluación - ACTUALIZADO con validación de permisos
  const eliminarEvaluacion = useCallback(async (evaluacionId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta evaluación? Se eliminarán todas sus preguntas.')) {
      return;
    }

    try {
      // 🔥 VALIDAR PERMISOS
      if (!puedeGestionarEvaluaciones()) {
        setError('No tienes permisos para eliminar evaluaciones en esta tutoría');
        return;
      }

      const token = getToken();
      const response = await fetch(`http://localhost:3000/evaluaciones/${evaluacionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar evaluación');
      }

      await cargarEvaluaciones();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [getToken, cargarEvaluaciones, puedeGestionarEvaluaciones]);

  const resetForm = useCallback(() => {
    setFormData({
      nombre_evaluacion: '',
      descripcion: '',
      fecha_limite: ''
    });
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (editingEvaluacion) {
      actualizarEvaluacion(formData);
    } else {
      crearEvaluacion(formData);
    }
  }, [editingEvaluacion, actualizarEvaluacion, crearEvaluacion, formData]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingEvaluacion(null);
    resetForm();
  }, [resetForm]);

  const abrirModalCrear = useCallback(() => {
    // 🔥 VALIDAR PERMISOS ANTES DE ABRIR MODAL
    if (!puedeGestionarEvaluaciones()) {
      setError('No tienes permisos para crear evaluaciones en esta tutoría');
      return;
    }
    setShowModal(true);
    setEditingEvaluacion(null);
    resetForm();
  }, [resetForm, puedeGestionarEvaluaciones]);

  const abrirModalEditar = useCallback((evaluacion) => {
    // 🔥 VALIDAR PERMISOS ANTES DE ABRIR MODAL
    if (!puedeGestionarEvaluaciones()) {
      setError('No tienes permisos para editar evaluaciones en esta tutoría');
      return;
    }
    setEditingEvaluacion(evaluacion);
    setFormData({
      nombre_evaluacion: evaluacion.nombre_evaluacion,
      descripcion: evaluacion.descripcion || '',
      fecha_limite: evaluacion.fecha_limite ? evaluacion.fecha_limite.split('T')[0] : ''
    });
    setShowModal(true);
  }, [puedeGestionarEvaluaciones]);

  const abrirGestionPreguntas = useCallback((evaluacion) => {
    setEvaluacionSeleccionada(evaluacion);
  }, []);

  const cerrarGestionPreguntas = useCallback(() => {
    setEvaluacionSeleccionada(null);
  }, []);

  useEffect(() => {
    if (id) {
      cargarTutoriaInfo(); // 🔥 Cargar información de la tutoría
      cargarEvaluaciones();
    }
  }, [id, cargarEvaluaciones, cargarTutoriaInfo]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si hay una evaluación seleccionada, mostrar el componente de preguntas
  if (evaluacionSeleccionada) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={cerrarGestionPreguntas}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Volver a Evaluaciones</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Preguntas - {evaluacionSeleccionada.nombre_evaluacion}
          </h2>
        </div>
        
        <Preguntas evaluacion={evaluacionSeleccionada} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y botón de crear - ACTUALIZADO con validación de permisos */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Evaluaciones
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona las evaluaciones y sus preguntas
          </p>
          {/* 🔥 NUEVO: Indicador de permisos */}
          {tutoriaInfo && (
            <div className="mt-2 text-sm">
              {isAdmin && (
                <span className="text-green-600 dark:text-green-400">🔧 Permisos de Administrador</span>
              )}
              {isGerente && tutoriaInfo.gerente_pertenece_a_institucion && (
                <span className="text-blue-600 dark:text-blue-400">🏢 Gestión de tu institución</span>
              )}
              {isTutor && tutoriaInfo.tutor_pertenece_al_usuario && (
                <span className="text-purple-600 dark:text-purple-400">👨‍🏫 Tu tutoría</span>
              )}
              {!puedeGestionarEvaluaciones() && (
                <span className="text-gray-500 dark:text-gray-400">🔒 Solo lectura</span>
              )}
            </div>
          )}
        </div>
        
        {/* 🔥 MOSTRAR BOTÓN SOLO SI TIENE PERMISOS */}
        {puedeGestionarEvaluaciones() && (
          <button
            onClick={abrirModalCrear}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Nueva Evaluación</span>
          </button>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
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

      {/* Grid de evaluaciones */}
      {evaluaciones.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {evaluaciones.map((evaluacion) => (
            <div 
              key={evaluacion.id_evaluacion} 
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {evaluacion.nombre_evaluacion}
                </h3>
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs px-2 py-1 rounded-full">
                  {evaluacion.total_preguntas} preguntas
                </span>
              </div>
              
              {evaluacion.descripcion && (
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {evaluacion.descripcion}
                </p>
              )}
              
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-500 mb-4">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Creada: {new Date(evaluacion.fecha_creacion).toLocaleDateString()}</span>
                </div>
                
                {evaluacion.fecha_limite && (
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Límite: {new Date(evaluacion.fecha_limite).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => abrirGestionPreguntas(evaluacion)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Gestionar Preguntas
                </button>
                
                {/* 🔥 MOSTRAR BOTONES DE EDICIÓN/ELIMINACIÓN SOLO SI TIENE PERMISOS */}
                {puedeGestionarEvaluaciones() && (
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => abrirModalEditar(evaluacion)}
                      className="p-2 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 transition-colors rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                      title="Editar evaluación"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <button 
                      onClick={() => eliminarEvaluacion(evaluacion.id_evaluacion)}
                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                      title="Eliminar evaluación"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No hay evaluaciones
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {puedeGestionarEvaluaciones() 
              ? 'Crea la primera evaluación para esta tutoría'
              : 'Aún no se han creado evaluaciones para esta tutoría'
            }
          </p>
          {/* 🔥 MOSTRAR BOTÓN SOLO SI TIENE PERMISOS */}
          {puedeGestionarEvaluaciones() && (
            <button
              onClick={abrirModalCrear}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Crear Primera Evaluación
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      <EvaluacionModal
        show={showModal}
        editingEvaluacion={editingEvaluacion}
        formData={formData}
        onInputChange={handleInputChange}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default Evaluaciones;