import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Opciones from './Opciones';

// 🔥 NUEVO: Modal para seleccionar entre crear nueva o reutilizar existente
const SeleccionTipoPreguntaModal = ({
  show,
  onClose,
  onCrearNueva,
  onReutilizarExistente,
  preguntasExistentes
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Crear Pregunta
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            ¿Cómo quieres crear la pregunta?
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Opción 1: Crear nueva pregunta */}
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all"
              onClick={onCrearNueva}
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Crear Nueva Pregunta
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Crear una pregunta completamente nueva desde cero
              </p>
            </div>

            {/* Opción 2: Reutilizar pregunta existente */}
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer transition-all"
              onClick={onReutilizarExistente}
            >
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Reutilizar Pregunta Existente
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Usar una pregunta ya creada anteriormente
              </p>
              {preguntasExistentes.length > 0 && (
                <div className="mt-3 text-xs text-green-600 dark:text-green-400">
                  {preguntasExistentes.length} preguntas disponibles
                </div>
              )}
            </div>
          </div>

          {/* Lista de preguntas existentes (solo lectura) */}
          {preguntasExistentes.length > 0 && (
            <div className="mt-8">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Preguntas disponibles para reutilizar:
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {preguntasExistentes.slice(0, 5).map((pregunta) => (
                  <div key={pregunta.numero_preg} className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    {pregunta.descripcion.substring(0, 80)}...
                    <span className="ml-2 text-blue-600 dark:text-blue-400">
                      ({pregunta.total_opciones} opciones)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// 🔥 ACTUALIZADO: Modal para crear pregunta con opciones dinámicas
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
  isAdmin,
  opcionesData,
  onOpcionesChange
}) => {
  if (!show) return null;

  // Generar opciones automáticas según el tipo de pregunta
const generarOpcionesAutomaticas = (tipo) => {
  switch (tipo) {
    case 'multiple':
      return [
        { inciso: 1, respuesta_opcion: '' },
        { inciso: 2, respuesta_opcion: '' },
        { inciso: 3, respuesta_opcion: '' },
        { inciso: 4, respuesta_opcion: '' }
      ];
    case 'verdadero_falso':
      return [
        { inciso: 1, respuesta_opcion: 'Verdadero' },
        { inciso: 2, respuesta_opcion: 'Falso' }
      ];
    default:
      return [];
  }
};

  const handleTipoChange = (nuevoTipo) => {
    onInputChange('tipo_pregun', nuevoTipo);
    
    // Generar opciones automáticas si es múltiple o V/F
    if (nuevoTipo === 'multiple' || nuevoTipo === 'verdadero_falso') {
      onOpcionesChange(generarOpcionesAutomaticas(nuevoTipo));
    } else {
      onOpcionesChange([]);
    }
    
    // Limpiar respuesta correcta si no es de opciones
    if (nuevoTipo === 'desarrollo') {
      onInputChange('inciso_correcto', null);
    }
  };

const handleOpcionChange = (index, campo, valor) => {
  const nuevasOpciones = [...opcionesData];
  
  // Asegurar que inciso siempre sea un número válido
  if (campo === 'inciso') {
    nuevasOpciones[index][campo] = parseInt(valor) || (index + 1);
  } else {
    nuevasOpciones[index][campo] = valor;
  }
  
  onOpcionesChange(nuevasOpciones);
};

// Corrige la función agregarOpcion:
const agregarOpcion = () => {
  const nuevoInciso = opcionesData.length > 0 
    ? Math.max(...opcionesData.map(o => o.inciso)) + 1 
    : 1;
  
  const nuevaOpcion = { 
    inciso: nuevoInciso, 
    respuesta_opcion: '' 
  };
  onOpcionesChange([...opcionesData, nuevaOpcion]);
};

// Corrige la función eliminarOpcion:
const eliminarOpcion = (index) => {
  const nuevasOpciones = opcionesData.filter((_, i) => i !== index);
  
  // Re-numerar los incisos después de eliminar
  const opcionesRenumeradas = nuevasOpciones.map((opcion, idx) => ({
    ...opcion,
    inciso: idx + 1
  }));
  
  onOpcionesChange(opcionesRenumeradas);
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingPregunta ? 'Editar Pregunta' : 'Crear Nueva Pregunta'}
          </h2>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {evaluacion && (
              <p>📝 Evaluación: <strong>{evaluacion.nombre_evaluacion}</strong></p>
            )}
          </div>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Descripción */}
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

          {/* Tipo de Pregunta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Pregunta *
            </label>
            <select
              required
              value={formData.tipo_pregun}
              onChange={(e) => handleTipoChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="multiple">Opción Múltiple</option>
              <option value="verdadero_falso">Verdadero/Falso</option>
              <option value="desarrollo">Desarrollo</option>
            </select>
          </div>

          {/* Opciones (solo para múltiple y V/F) */}
          {(formData.tipo_pregun === 'multiple' || formData.tipo_pregun === 'verdadero_falso') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Opciones de Respuesta
              </label>
              <div className="space-y-3">
                {opcionesData.map((opcion, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    {/* Mostrar letra en lugar de input numérico para inciso */}
                    <span className="w-8 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <input
                      type="text"
                      value={opcion.respuesta_opcion || ''}
                      onChange={(e) => handleOpcionChange(index, 'respuesta_opcion', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder={`Texto de la opción ${String.fromCharCode(65 + index)}`}
                      required
                    />
                    {formData.tipo_pregun === 'multiple' && opcionesData.length > 2 && (
                      <button
                        type="button"
                        onClick={() => eliminarOpcion(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                
                {formData.tipo_pregun === 'multiple' && (
                  <button
                    type="button"
                    onClick={agregarOpcion}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Agregar otra opción</span>
                  </button>
                )}
              </div>

              {/* Selección de respuesta correcta */}
              {opcionesData.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Respuesta Correcta
                    </label>
                    <select
                      value={formData.inciso_correcto || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const inciso = value === '' ? null : parseInt(value);
                        onInputChange('inciso_correcto', inciso);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Seleccionar respuesta correcta...</option>
                      {opcionesData.map((opcion, index) => (
                        <option key={index} value={opcion.inciso}>
                          {String.fromCharCode(65 + index)} - {opcion.respuesta_opcion || 'Sin texto'}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Selecciona la opción que será considerada como correcta para la calificación automática
                    </p>
                  </div>
                )}
              </div>
            )}
          {/* Nota de la pregunta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nota de la Pregunta
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={formData.nota_pregunta || 1.0}
              onChange={(e) => onInputChange('nota_pregunta', parseFloat(e.target.value) || 1.0)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="1.0"
            />
          </div>

          {/* Número de orden */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número de Orden
            </label>
            <input
              type="number"
              min="1"
              value={formData.numero_orden || 1}
              onChange={(e) => onInputChange('numero_orden', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="1"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
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

// 🔥 NUEVO: Modal para reutilizar preguntas existentes
const ReutilizarPreguntaModal = ({
  show,
  onClose,
  preguntasExistentes,
  onReutilizar,
  evaluacion
}) => {
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState(null);
  const [notaPersonalizada, setNotaPersonalizada] = useState(1);
  const [ordenPersonalizado, setOrdenPersonalizado] = useState(1);

  if (!show) return null;

  const handleReutilizar = () => {
    if (!preguntaSeleccionada) return;
    
    onReutilizar({
      numero_preg_original: preguntaSeleccionada.numero_preg,
      id_evaluacion_destino: evaluacion?.id_evaluacion,
      numero_orden: ordenPersonalizado,
      nota_pregunta: notaPersonalizada
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Reutilizar Pregunta Existente
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Selecciona una pregunta existente para usar en esta evaluación
          </p>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Lista de preguntas */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4 space-y-3">
              {preguntasExistentes.length > 0 ? (
                preguntasExistentes.map((pregunta) => (
                  <div
                    key={pregunta.numero_preg}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      preguntaSeleccionada?.numero_preg === pregunta.numero_preg
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    onClick={() => setPreguntaSeleccionada(pregunta)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                          {pregunta.descripcion.substring(0, 100)}...
                        </h3>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className={`px-2 py-1 rounded-full ${
                            pregunta.tipo_pregun === 'multiple' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                              : pregunta.tipo_pregun === 'verdadero_falso'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                          }`}>
                            {pregunta.tipo_pregun}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                            {pregunta.total_opciones} opciones
                          </span>
                          {pregunta.tiene_respuesta_correcta && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full">
                              ✓ Correcta
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay preguntas existentes para reutilizar
                </div>
              )}
            </div>
          </div>

          {/* Detalles y configuración */}
          <div className="w-1/2 p-6 space-y-4">
            {preguntaSeleccionada ? (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Pregunta Seleccionada
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {preguntaSeleccionada.descripcion}
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nota Personalizada
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={notaPersonalizada}
                        onChange={(e) => setNotaPersonalizada(parseFloat(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Orden en la Evaluación
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={ordenPersonalizado}
                        onChange={(e) => setOrdenPersonalizado(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleReutilizar}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Reutilizar Pregunta
                  </button>
                  <button
                    onClick={() => setPreguntaSeleccionada(null)}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Selecciona una pregunta para ver los detalles
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// 🔥 NUEVO: Modal para gestionar opciones con marcado de respuesta correcta
// 🔥 MEJORADO: Modal para gestionar opciones con marcado de respuesta correcta
const OpcionesModal = ({ 
  show, 
  pregunta, 
  opciones, 
  onClose, 
  onMarcarCorrecta,
  puedeGestionar 
}) => {
  if (!show) return null;

  // Función para obtener la letra del inciso
  const getLetraInciso = (inciso) => {
    return String.fromCharCode(64 + (parseInt(inciso) || 1));
  };

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
              <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {pregunta?.descripcion}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  Valor: {pregunta?.nota_pregunta || 1} punto(s)
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  pregunta?.tipo_pregun === 'multiple' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    : pregunta?.tipo_pregun === 'verdadero_falso'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                }`}>
                  {pregunta?.tipo_pregun}
                </span>
                {pregunta?.inciso_correcto && (
                  <span className="text-green-600 dark:text-green-400 font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Respuesta correcta configurada
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-4 flex-shrink-0"
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
              {opciones.map((opcion, index) => (
                <div 
                  key={opcion.inciso || index}
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
                          {getLetraInciso(opcion.inciso)}
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
                        {opcion.respuesta_opcion || 'Sin texto'}
                      </p>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay opciones configuradas
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {pregunta?.tipo_pregun === 'desarrollo' 
                  ? 'Las preguntas de desarrollo no requieren opciones de respuesta.'
                  : 'Esta pregunta no tiene opciones de respuesta configuradas.'
                }
              </p>
              {puedeGestionar && pregunta?.tipo_pregun !== 'desarrollo' && (
                <button
                  onClick={() => {
                    onClose();
                    // Aquí podrías abrir el modal de edición automáticamente
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Editar Pregunta para Agregar Opciones
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {pregunta?.inciso_correcto 
                ? `✅ Respuesta correcta: ${getLetraInciso(pregunta.inciso_correcto)}`
                : '❌ Sin respuesta correcta configurada'
              }
              {opciones.length > 0 && (
                <span className="ml-4">
                  • {opciones.length} opción(es)
                </span>
              )}
            </div>
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

// Componente principal Preguntas (actualizado)
const Preguntas = ({ evaluacion }) => {
  const { id } = useParams();
  const [preguntas, setPreguntas] = useState([]);
  const [preguntasExistentes, setPreguntasExistentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSeleccionModal, setShowSeleccionModal] = useState(false);
  const [showPreguntaModal, setShowPreguntaModal] = useState(false);
  const [showReutilizarModal, setShowReutilizarModal] = useState(false);
  const [editingPregunta, setEditingPregunta] = useState(null);
  const { getAuthToken, user } = useAuth();
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [preguntaSeleccionada, setPreguntaSeleccionada] = useState(null);
  const [opcionesPregunta, setOpcionesPregunta] = useState([]);
  const [opcionesData, setOpcionesData] = useState([]);

  // Estado del formulario
 const [formData, setFormData] = useState({
  descripcion: '',
  tipo_pregun: 'multiple',
  id_tutoria: parseInt(id),
  id_evaluacion: evaluacion?.id_evaluacion || null,
  numero_orden: 1,
  nota_pregunta: 1.0,
  inciso_correcto: null
});

  const userRole = user?.id_rol;
  const isAdmin = userRole === 1;
  const isGerente = userRole === 2;
  const isTutor = userRole === 3;
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

  // Validar permisos para gestionar preguntas
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
  

// 🔥 FUNCIÓN MEJORADA: Cargar opciones de una pregunta específica
const cargarOpcionesPregunta = async (preguntaId) => {
  try {
    console.log(`🔍 Cargando opciones para pregunta ID: ${preguntaId}`);
    const token = getToken();
    
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }

    // Intentar primero con el endpoint normal
    let response = await fetch(`http://localhost:3000/opciones/debug/pregunta/${preguntaId}`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status (endpoint normal):', response.status);
    
    // Si falla el endpoint normal, intentar con el de debug
    if (!response.ok) {
      console.log('⚠️ Endpoint normal falló, intentando con debug...');
      response = await fetch(`http://localhost:3000/opciones/debug/pregunta/${preguntaId}`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('📡 Response status (endpoint debug):', response.status);
    }

    if (response.ok) {
      const opcionesData = await response.json();
      console.log('✅ Opciones cargadas exitosamente:', opcionesData);
      
      // Si es un array, usarlo directamente
      if (Array.isArray(opcionesData)) {
        setOpcionesPregunta(opcionesData);
        return opcionesData;
      } 
      // Si es un objeto con propiedad opciones (del endpoint completo)
      else if (opcionesData.opciones) {
        setOpcionesPregunta(opcionesData.opciones);
        return opcionesData.opciones;
      }
      // Si es un objeto de diagnóstico
      else if (opcionesData.opciones !== undefined) {
        setOpcionesPregunta(opcionesData.opciones || []);
        return opcionesData.opciones || [];
      }
      // Por defecto, array vacío
      else {
        console.log('ℹ️ No se encontraron opciones en la respuesta');
        setOpcionesPregunta([]);
        return [];
      }
    } else {
      // Si ambos endpoints fallan, mostrar error específico
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
        console.error('❌ Error del servidor:', errorData);
      } catch (parseError) {
        console.warn('No se pudo parsear la respuesta de error:', parseError);
      }
      
      // Si es error 404 o 500, tratar como array vacío (no es crítico)
      if (response.status === 404 || response.status === 500) {
        console.log('ℹ️ Error del servidor, mostrando opciones vacías');
        setOpcionesPregunta([]);
        return [];
      }
      
      throw new Error(errorMessage);
    }
    
  } catch (err) {
    console.error('❌ Error completo cargando opciones:', err);
    
    // Para errores de servidor, mostrar array vacío en lugar de error
    if (err.message.includes('500') || err.message.includes('Internal Server Error')) {
      console.log('ℹ️ Error del servidor, mostrando opciones vacías');
      setOpcionesPregunta([]);
      return [];
    }
    
    // Solo mostrar error si no es un error del servidor
    if (!err.message.includes('500') && !err.message.includes('404')) {
      setError('Error al cargar opciones: ' + err.message);
    }
    
    setOpcionesPregunta([]);
    return [];
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

  // Cargar preguntas existentes para reutilizar
  const cargarPreguntasExistentes = async () => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/preguntas/existentes/tutoria/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPreguntasExistentes(data);
      }
    } catch (err) {
      console.error('Error cargando preguntas existentes:', err);
    }
  };

  // Cargar preguntas de la evaluación actual
  const cargarPreguntas = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      let url;
      if (evaluacion) {
        url = `http://localhost:3000/preguntas/evaluacion/${evaluacion.id_evaluacion}`;
      } else {
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

  // Crear nueva pregunta


  // Reutilizar pregunta existente
  const reutilizarPregunta = async (reutilizarData) => {
    try {
      const token = getToken();
      const response = await fetch('http://localhost:3000/preguntas/reutilizar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reutilizarData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al reutilizar pregunta');
      }

      await cargarPreguntas();
      setShowReutilizarModal(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };
const crearPregunta = async (formData) => {
  try {
    const token = getToken();
    
    // Validar datos antes de enviar
    const datosValidados = {
      ...formData,
      id_tutoria: parseInt(id),
      id_evaluacion: evaluacion?.id_evaluacion || null,
      opciones: opcionesData,
      // Asegurar que inciso_correcto sea número o null
      inciso_correcto: formData.inciso_correcto && !isNaN(formData.inciso_correcto) 
        ? parseInt(formData.inciso_correcto) 
        : null
    };

    console.log("📤 Enviando datos VALIDADOS para crear pregunta:", datosValidados);

    const response = await fetch('http://localhost:3000/preguntas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(datosValidados)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Error del servidor:", errorData);
      throw new Error(errorData.error || 'Error al crear pregunta');
    }

    const resultado = await response.json();
    console.log("✅ Pregunta creada exitosamente:", resultado);
    
    await cargarPreguntas();
    setShowPreguntaModal(false);
    resetForm();
    setError(null);
    
  } catch (err) {
    console.error("❌ Error creando pregunta:", err);
    setError(err.message);
  }
};
// Actualizar pregunta (MEJORADA)
const actualizarPregunta = async (formData) => {
  try {
    if (!puedeGestionarPreguntas()) {
      setError('No tienes permisos para editar preguntas en esta tutoría');
      return;
    }

    const token = getToken();
    
    // Validar datos antes de enviar
    const datosValidados = {
      ...formData,
      id_tutoria: parseInt(id),
      id_evaluacion: evaluacion?.id_evaluacion || null,
      opciones: opcionesData,
      // Asegurar que inciso_correcto sea número o null
      inciso_correcto: formData.inciso_correcto && !isNaN(formData.inciso_correcto) 
        ? parseInt(formData.inciso_correcto) 
        : null
    };

    console.log("📤 Enviando datos VALIDADOS para actualizar pregunta:", datosValidados);

    const response = await fetch(`http://localhost:3000/preguntas/${editingPregunta.numero_preg}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(datosValidados)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Error del servidor:", errorData);
      throw new Error(errorData.error || 'Error al actualizar pregunta');
    }

    const resultado = await response.json();
    console.log("✅ Pregunta actualizada exitosamente:", resultado);

    await cargarPreguntas();
    setShowPreguntaModal(false);
    setEditingPregunta(null);
    resetForm();
    setError(null);
  } catch (err) {
    console.error("❌ Error actualizando pregunta:", err);
    setError(err.message);
  }
};
// Cargar pregunta completa para editar (NUEVA FUNCIÓN)
const cargarPreguntaCompleta = async (preguntaId) => {
  try {
    const token = getToken();
    const response = await fetch(`http://localhost:3000/preguntas/${preguntaId}/completo`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const preguntaCompleta = await response.json();
      return preguntaCompleta;
    } else {
      throw new Error('Error al cargar pregunta completa');
    }
  } catch (err) {
    console.error('Error cargando pregunta completa:', err);
    throw err;
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
  try {
    setPreguntaSeleccionada(pregunta);
    setError(null); // Limpiar errores previos
    
    // Mostrar loading state
    setOpcionesPregunta([]);
    
    await cargarOpcionesPregunta(pregunta.numero_preg);
    setMostrarOpciones(true);
  } catch (err) {
    console.error('Error al abrir opciones:', err);
    // El error ya fue manejado en cargarOpcionesPregunta
  }
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
    id_tutoria: parseInt(id),
    id_evaluacion: evaluacion?.id_evaluacion || null,
    numero_orden: 1,
    nota_pregunta: 1.0,
    inciso_correcto: null
  });
  setOpcionesData([]);
};

  const abrirModalPrincipal = () => {
    setShowSeleccionModal(true);
    cargarPreguntasExistentes();
  };

  const abrirModalCrearNueva = () => {
    setShowSeleccionModal(false);
    setShowPreguntaModal(true);
    setEditingPregunta(null);
    resetForm();
  };

  const abrirModalReutilizar = () => {
    setShowSeleccionModal(false);
    setShowReutilizarModal(true);
  };

// Abrir modal de edición (MEJORADA)
const abrirModalEditar = async (pregunta) => {
  if (!puedeGestionarPreguntas()) {
    setError('No tienes permisos para editar preguntas en esta tutoría');
    return;
  }

  try {
    // Cargar la pregunta completa con sus opciones
    const preguntaCompleta = await cargarPreguntaCompleta(pregunta.numero_preg);
    
    console.log("📥 Pregunta completa cargada:", preguntaCompleta);
    
    setEditingPregunta(preguntaCompleta);
    setFormData({
      descripcion: preguntaCompleta.descripcion || '',
      tipo_pregun: preguntaCompleta.tipo_pregun || 'multiple',
      id_tutoria: parseInt(id),
      id_evaluacion: evaluacion?.id_evaluacion || null,
      numero_orden: preguntaCompleta.numero_orden || 1,
      nota_pregunta: parseFloat(preguntaCompleta.nota_pregunta) || 1.0,
      inciso_correcto: preguntaCompleta.inciso_correcto || null
    });
    
    // Cargar las opciones existentes - ASEGURAR QUE INCISO SEA NÚMERO
    if (preguntaCompleta.opciones && preguntaCompleta.opciones.length > 0) {
      const opcionesValidadas = preguntaCompleta.opciones.map(opcion => ({
        ...opcion,
        inciso: parseInt(opcion.inciso) || 1 // Asegurar que inciso sea número
      }));
      console.log("📥 Opciones validadas:", opcionesValidadas);
      setOpcionesData(opcionesValidadas);
    } else {
      // Si no hay opciones, generar automáticamente según el tipo
      if (preguntaCompleta.tipo_pregun === 'multiple' || preguntaCompleta.tipo_pregun === 'verdadero_falso') {
        const opcionesAutomaticas = generarOpcionesAutomaticas(preguntaCompleta.tipo_pregun);
        console.log("🔄 Opciones automáticas generadas:", opcionesAutomaticas);
        setOpcionesData(opcionesAutomaticas);
      } else {
        setOpcionesData([]);
      }
    }
    
    setShowPreguntaModal(true);
  } catch (err) {
    console.error('Error cargando pregunta para editar:', err);
    setError('Error al cargar la pregunta para editar: ' + err.message);
  }
};

const handleInputChange = (field, value) => {
  // Manejar conversiones específicas para cada campo
  let processedValue = value;
  
  switch (field) {
    case 'numero_orden':
      processedValue = parseInt(value) || 1;
      break;
    case 'nota_pregunta':
      processedValue = parseFloat(value) || 1.0;
      break;
    case 'inciso_correcto':
      // Si es string vacío, convertir a null
      processedValue = value === '' ? null : parseInt(value);
      // Si parseInt devuelve NaN, usar null
      processedValue = isNaN(processedValue) ? null : processedValue;
      break;
    default:
      processedValue = value;
  }
  
  setFormData(prev => ({
    ...prev,
    [field]: processedValue
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
    setShowPreguntaModal(false);
    setEditingPregunta(null);
    resetForm();
  };

  useEffect(() => {
    if (id) {
      cargarTutoriaInfo();
      cargarPreguntas();
      cargarPreguntasExistentes();
    }
  }, [id, evaluacion]);

  const getTipoPreguntaBadge = (tipo) => {
    const tipos = {
      multiple: { color: 'blue', label: 'Opción Múltiple' },
      verdadero_falso: { color: 'green', label: 'V/F' },
      desarrollo: { color: 'purple', label: 'Desarrollo' }
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {evaluacion ? `Preguntas - ${evaluacion.nombre_evaluacion}` : 'Preguntas de Evaluación'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona las preguntas y sus respuestas correctas
          </p>
        </div>
        
        <button
          onClick={abrirModalPrincipal}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Nueva Pregunta</span>
        </button>
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
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center space-x-1"
                      title="Ver opciones y gestionar respuesta correcta"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Respuesta Correcta</span>
                      {pregunta.inciso_correcto && (
                        <span className="text-green-600 dark:text-green-400 text-xs">
                          ({String.fromCharCode(64 + pregunta.inciso_correcto)})
                        </span>
                      )}
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
              onClick={abrirModalPrincipal}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Crear Primera Pregunta
            </button>
          )}
        </div>
      )}

      {/* Modales */}
      <SeleccionTipoPreguntaModal
        show={showSeleccionModal}
        onClose={() => setShowSeleccionModal(false)}
        onCrearNueva={abrirModalCrearNueva}
        onReutilizarExistente={abrirModalReutilizar}
        preguntasExistentes={preguntasExistentes}
      />

      <PreguntaModal
        show={showPreguntaModal}
        editingPregunta={editingPregunta}
        formData={formData}
        onInputChange={handleInputChange}
        onOpcionesChange={setOpcionesData}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        evaluacion={evaluacion}
        isTutor={isTutor}
        isGerente={isGerente}
        isAdmin={isAdmin}
        opcionesData={opcionesData}
      />

      <ReutilizarPreguntaModal
        show={showReutilizarModal}
        onClose={() => setShowReutilizarModal(false)}
        preguntasExistentes={preguntasExistentes}
        onReutilizar={reutilizarPregunta}
        evaluacion={evaluacion}
      />

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