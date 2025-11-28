import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Opciones from './Opciones';

// 🔥 MOVER el modal fuera del componente principal
const PreguntaModal = ({
  show,
  editingPregunta,
  formData,
  onInputChange,
  onClose,
  onSubmit,
  evaluacion,
  isTutor,
  isGerente,
  isAdmin
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingPregunta ? 'Editar Pregunta' : 'Crear Nueva Pregunta'}
          </h2>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {evaluacion && (
              <p>📝 Evaluación: <strong>{evaluacion.nombre_evaluacion}</strong></p>
            )}
            {isTutor && <p>💡 {editingPregunta ? 'Editando' : 'Creando'} pregunta para tu tutoría</p>}
            {isGerente && <p>💡 {editingPregunta ? 'Editando' : 'Creando'} pregunta para tutoría de tu institución</p>}
            {isAdmin && <p>💡 {editingPregunta ? 'Editando' : 'Creando'} pregunta como administrador</p>}
          </div>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción de la Pregunta *
            </label>
            <textarea
              required
              value={formData.descripcion}
              onChange={(e) => onInputChange('descripcion', e.target.value)}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Escribe la pregunta aquí..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Pregunta *
            </label>
            <select
              required
              value={formData.tipo_pregun}
              onChange={(e) => onInputChange('tipo_pregun', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="multiple">Opción Múltiple</option>
              <option value="verdadero_falso">Verdadero/Falso</option>
              <option value="desarrollo">Desarrollo</option>
              <option value="completar">Completar</option>
            </select>
          </div>

          {/* 🔥 NUEVO: Campo para nota de la pregunta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nota de la Pregunta
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={formData.nota_pregunta}
              onChange={(e) => onInputChange('nota_pregunta', parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="1.0"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Puntos que vale esta pregunta en la evaluación
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número de Orden
            </label>
            <input
              type="number"
              min="1"
              value={formData.numero_orden}
              onChange={(e) => onInputChange('numero_orden', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Define el orden en que aparecerá la pregunta en la evaluación
            </p>
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
              className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              {editingPregunta ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 🔥 NUEVO: Modal para gestionar opciones con marcado de respuesta correcta
const OpcionesModal = ({ 
  show, 
  pregunta, 
  opciones, 
  onClose, 
  onMarcarCorrecta,
  puedeGestionar 
}) => {
  if (!show) return null;

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
                {pregunta?.descripcion}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Valor: {pregunta?.nota_pregunta || 1} punto(s)
                </span>
                {pregunta?.inciso_correcto && (
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    ✓ Respuesta correcta configurada
                  </span>
                )}
              </div>
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

        {/* Lista de opciones */}
        <div className="flex-1 overflow-y-auto p-6">
          {opciones.length > 0 ? (
            <div className="space-y-4">
              {opciones.map((opcion) => (
                <div 
                  key={opcion.inciso}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    pregunta?.inciso_correcto === opcion.inciso
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                          pregunta?.inciso_correcto === opcion.inciso
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {String.fromCharCode(64 + opcion.inciso)} {/* A, B, C, D */}
                        </span>
                        {pregunta?.inciso_correcto === opcion.inciso && (
                          <span className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Correcta
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">
                        {opcion.respuesta_opcion}
                      </p>
                    </div>
                    
                    {puedeGestionar && (
                      <button
                        onClick={() => onMarcarCorrecta(pregunta.numero_preg, opcion.inciso)}
                        className={`ml-4 px-4 py-2 text-sm rounded-lg transition-colors ${
                          pregunta?.inciso_correcto === opcion.inciso
                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {pregunta?.inciso_correcto === opcion.inciso ? 'Correcta' : 'Marcar como Correcta'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                No hay opciones
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Esta pregunta no tiene opciones configuradas.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <span>
              {pregunta?.inciso_correcto 
                ? `Respuesta correcta: ${String.fromCharCode(64 + pregunta.inciso_correcto)}`
                : 'Sin respuesta correcta configurada'
              }
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Preguntas = ({ evaluacion }) => {
  const { id } = useParams(); // ID de la tutoría
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPregunta, setEditingPregunta] = useState(null);
  const { getAuthToken, user } = useAuth();
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState(null);
  const [opcionesPregunta, setOpcionesPregunta] = useState([]);

  // Estado del formulario - ACTUALIZADO con nota_pregunta
  const [formData, setFormData] = useState({
    descripcion: '',
    tipo_pregun: 'multiple',
    id_tutoria: id,
    id_evaluacion: evaluacion?.id_evaluacion || null,
    numero_orden: 1,
    nota_pregunta: 1.0
  });

  // Determinar permisos según el rol
  const userRole = user?.id_rol;
  const isAdmin = userRole === 1;
  const isGerente = userRole === 2;
  const isTutor = userRole === 3;

  // Estado para información de la tutoría (para validar permisos)
  const [tutoriaInfo, setTutoriaInfo] = useState(null);

  const getToken = () => {
    return getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
  };

  // Cargar información de la tutoría para validar permisos
  const cargarTutoriaInfo = async () => {
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
  };

  // 🔥 FUNCIÓN: Marcar opción como correcta
  const marcarComoCorrecta = async (preguntaId, inciso) => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/preguntas/${preguntaId}/correcta`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ inciso_correcto: inciso })
      });

      if (response.ok) {
        await cargarPreguntas();
        // Recargar opciones si estamos viendo esa pregunta
        if (preguntaSeleccionada && preguntaSeleccionada.numero_preg === preguntaId) {
          await cargarOpcionesPregunta(preguntaId);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al marcar respuesta correcta');
      }
    } catch (err) {
      setError('Error al marcar respuesta correcta: ' + err.message);
    }
  };

  // 🔥 FUNCIÓN: Cargar opciones de una pregunta específica
  const cargarOpcionesPregunta = async (preguntaId) => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/opciones/pregunta/${preguntaId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const opcionesData = await response.json();
        setOpcionesPregunta(opcionesData);
      }
    } catch (err) {
      console.error('Error cargando opciones:', err);
      setOpcionesPregunta([]);
    }
  };

  // Cargar preguntas - ACTUALIZADO para evaluaciones
  const cargarPreguntas = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      let url;
      if (evaluacion) {
        // Si hay evaluación, cargar preguntas de esa evaluación
        url = `http://localhost:3000/preguntas/evaluacion/${evaluacion.id_evaluacion}`;
      } else {
        // Si no hay evaluación, cargar preguntas generales de la tutoría
        url = `http://localhost:3000/preguntas/tutoria/${id}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const preguntasData = await response.json();
        setPreguntas(preguntasData);
      } else {
        throw new Error('Error al cargar preguntas');
      }
    } catch (err) {
      setError('Error al cargar preguntas: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Validar permisos para crear/editar preguntas
  const puedeGestionarPreguntas = () => {
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
  };

  // Crear nueva pregunta - ACTUALIZADO para evaluaciones
  const crearPregunta = async (formData) => {
    try {
      if (!puedeGestionarPreguntas()) {
        setError('No tienes permisos para crear preguntas en esta tutoría');
        return;
      }

      const token = getToken();
      const preguntaData = {
        ...formData,
        id_tutoria: parseInt(id),
        id_evaluacion: evaluacion?.id_evaluacion || null
      };

      const response = await fetch('http://localhost:3000/preguntas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preguntaData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear pregunta');
      }

      await cargarPreguntas();
      setShowModal(false);
      resetForm();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Actualizar pregunta - ACTUALIZADO para evaluaciones
  const actualizarPregunta = async (formData) => {
    try {
      if (!puedeGestionarPreguntas()) {
        setError('No tienes permisos para editar preguntas en esta tutoría');
        return;
      }

      const token = getToken();
      const preguntaData = {
        ...formData,
        id_tutoria: parseInt(id),
        id_evaluacion: evaluacion?.id_evaluacion || null
      };

      const response = await fetch(`http://localhost:3000/preguntas/${editingPregunta.numero_preg}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preguntaData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar pregunta');
      }

      await cargarPreguntas();
      setShowModal(false);
      setEditingPregunta(null);
      resetForm();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Eliminar pregunta (soft delete)
  const eliminarPregunta = async (preguntaId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
      return;
    }

    try {
      if (!puedeGestionarPreguntas()) {
        setError('No tienes permisos para eliminar preguntas en esta tutoría');
        return;
      }

      const token = getToken();
      const response = await fetch(`http://localhost:3000/preguntas/${preguntaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar pregunta');
      }

      await cargarPreguntas();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const abrirOpciones = async (pregunta) => {
    setPreguntaSeleccionada(pregunta);
    await cargarOpcionesPregunta(pregunta.numero_preg);
    setMostrarOpciones(true);
  };

  const cerrarOpciones = () => {
    setMostrarOpciones(false);
    setPreguntaSeleccionada(null);
    setOpcionesPregunta([]);
  };

  const resetForm = () => {
    setFormData({
      descripcion: '',
      tipo_pregun: 'multiple',
      id_tutoria: id,
      id_evaluacion: evaluacion?.id_evaluacion || null,
      numero_orden: 1,
      nota_pregunta: 1.0
    });
  };

  const abrirModalCrear = () => {
    if (!puedeGestionarPreguntas()) {
      setError('No tienes permisos para crear preguntas en esta tutoría');
      return;
    }
    setShowModal(true);
    setEditingPregunta(null);
    resetForm();
  };

  const abrirModalEditar = (pregunta) => {
    if (!puedeGestionarPreguntas()) {
      setError('No tienes permisos para editar preguntas en esta tutoría');
      return;
    }
    setEditingPregunta(pregunta);
    setFormData({
      descripcion: pregunta.descripcion,
      tipo_pregun: pregunta.tipo_pregun,
      id_tutoria: id,
      id_evaluacion: evaluacion?.id_evaluacion || null,
      numero_orden: pregunta.numero_orden || 1,
      nota_pregunta: pregunta.nota_pregunta || 1.0
    });
    setShowModal(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPregunta) {
      actualizarPregunta(formData);
    } else {
      crearPregunta(formData);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPregunta(null);
    resetForm();
  };

  useEffect(() => {
    if (id) {
      cargarTutoriaInfo();
      cargarPreguntas();
    }
  }, [id, evaluacion]);

  const getTipoPreguntaBadge = (tipo) => {
    const tipos = {
      multiple: { color: 'blue', label: 'Opción Múltiple' },
      verdadero_falso: { color: 'green', label: 'V/F' },
      desarrollo: { color: 'purple', label: 'Desarrollo' },
      completar: { color: 'yellow', label: 'Completar' }
    };
    
    const tipoInfo = tipos[tipo] || { color: 'gray', label: tipo };
    return (
      <span className={`px-2 py-1 text-xs bg-${tipoInfo.color}-100 text-${tipoInfo.color}-800 dark:bg-${tipoInfo.color}-900 dark:text-${tipoInfo.color}-300 rounded-full`}>
        {tipoInfo.label}
      </span>
    );
  };

  const getOrdenPreguntaBadge = (orden) => {
    return (
      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full">
        Orden: {orden}
      </span>
    );
  };

  const getNotaPreguntaBadge = (nota) => {
    return (
      <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-full">
        {nota || 1} punto(s)
      </span>
    );
  };

  const getRespuestaCorrectaBadge = (pregunta) => {
    if (!pregunta.inciso_correcto) {
      return (
        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded-full">
          Sin respuesta correcta
        </span>
      );
    }
    
    return (
      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full flex items-center">
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Correcta: {String.fromCharCode(64 + pregunta.inciso_correcto)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y botón de crear - ACTUALIZADO para evaluaciones */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {evaluacion ? `Preguntas - ${evaluacion.nombre_evaluacion}` : 'Preguntas de Evaluación'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {evaluacion 
              ? `Gestiona las preguntas para ${evaluacion.nombre_evaluacion}`
              : 'Preguntas generales de la tutoría (sin evaluación específica)'
            }
          </p>
          {evaluacion && (
            <div className="mt-2 flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{preguntas.length} pregunta(s) - Total: {preguntas.reduce((sum, p) => sum + (p.nota_pregunta || 1), 0)} puntos</span>
            </div>
          )}
        </div>
        
        {puedeGestionarPreguntas() && (
          <button
            onClick={abrirModalCrear}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Nueva Pregunta</span>
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

      {/* Lista de preguntas - ACTUALIZADO con orden y nota */}
      {preguntas.length > 0 ? (
        <div className="space-y-4">
          {preguntas
            .sort((a, b) => (a.numero_orden || 1) - (b.numero_orden || 1))
            .map((pregunta) => (
            <div 
              key={pregunta.numero_preg} 
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Pregunta #{pregunta.numero_preg}
                    </h3>
                    {getTipoPreguntaBadge(pregunta.tipo_pregun)}
                    {getOrdenPreguntaBadge(pregunta.numero_orden || 1)}
                    {getNotaPreguntaBadge(pregunta.nota_pregunta)}
                    {getRespuestaCorrectaBadge(pregunta)}
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {pregunta.descripcion}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-500">
                    <span>ID: {pregunta.numero_preg}</span>
                    <span>•</span>
                    <span>Creada: {new Date(pregunta.fecha_creacion || Date.now()).toLocaleDateString()}</span>
                    {pregunta.id_evaluacion && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600 dark:text-blue-400">En evaluación</span>
                      </>
                    )}
                  </div>
                </div>
                
                {puedeGestionarPreguntas() && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => abrirModalEditar(pregunta)}
                      className="text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                      title="Editar pregunta"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => eliminarPregunta(pregunta.numero_preg)}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                      title="Eliminar pregunta"
                    >
                      Eliminar
                    </button>
                    <button 
                      onClick={() => abrirOpciones(pregunta)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      title="Gestionar opciones y respuesta correcta"
                    >
                      Respuesta Correcta
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {evaluacion ? 'No hay preguntas en esta evaluación' : 'No hay preguntas'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {puedeGestionarPreguntas() 
              ? evaluacion 
                ? 'Comienza creando la primera pregunta para esta evaluación' 
                : 'Comienza creando la primera pregunta para evaluaciones de esta tutoría'
              : 'Aún no se han creado preguntas' + (evaluacion ? ' para esta evaluación' : '')
            }
          </p>
          {puedeGestionarPreguntas() && (
            <button
              onClick={abrirModalCrear}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Crear Primera Pregunta
            </button>
          )}
        </div>
      )}

      {/* Modal de Pregunta */}
      <PreguntaModal
        show={showModal}
        editingPregunta={editingPregunta}
        formData={formData}
        onInputChange={handleInputChange}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        evaluacion={evaluacion}
        isTutor={isTutor}
        isGerente={isGerente}
        isAdmin={isAdmin}
      />
      
      {/* 🔥 NUEVO: Modal de Opciones con Respuesta Correcta */}
      <OpcionesModal
        show={mostrarOpciones}
        pregunta={preguntaSeleccionada}
        opciones={opcionesPregunta}
        onClose={cerrarOpciones}
        onMarcarCorrecta={marcarComoCorrecta}
        puedeGestionar={puedeGestionarPreguntas()}
      />
    </div>
  );
};

export default Preguntas;