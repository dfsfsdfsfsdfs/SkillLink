import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ResolverEvaluacion = () => {
  const { id, evaluacionId } = useParams();
  const navigate = useNavigate();
  const { getAuthToken, user } = useAuth();
  
  const [evaluacion, setEvaluacion] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const getToken = () => {
    return getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
  };

  // Cargar evaluación y preguntas
  const cargarEvaluacion = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      // Cargar información de la evaluación
      const evalResponse = await fetch(`http://localhost:3000/evaluaciones/${evaluacionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!evalResponse.ok) throw new Error('Error al cargar evaluación');
      const evalData = await evalResponse.json();
      setEvaluacion(evalData);

      // Cargar preguntas con opciones
      const preguntasResponse = await fetch(`http://localhost:3000/preguntas/evaluacion/${evaluacionId}/completo`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!preguntasResponse.ok) throw new Error('Error al cargar preguntas');
      const preguntasData = await preguntasResponse.json();
      setPreguntas(preguntasData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manejar selección de respuesta
  const handleSeleccionRespuesta = (preguntaId, inciso) => {
    setRespuestas(prev => ({
      ...prev,
      [preguntaId]: inciso
    }));
  };

  // Enviar evaluación
  const enviarEvaluacion = async () => {
    if (!window.confirm('¿Estás seguro de que quieres enviar la evaluación? No podrás modificarla después.')) {
      return;
    }

    try {
      setEnviando(true);
      const token = getToken();

      const respuestaData = {
        id_inscripcion: user.id_inscripcion, // Asumiendo que el usuario tiene una inscripción
        respuestas: Object.entries(respuestas).map(([numero_preg, inciso_seleccionado]) => ({
          numero_preg: parseInt(numero_preg),
          inciso_seleccionado: parseInt(inciso_seleccionado)
        }))
      };

      const response = await fetch(`http://localhost:3000/evaluaciones/${evaluacionId}/responder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(respuestaData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar evaluación');
      }

      const resultado = await response.json();
      
      // Mostrar resultados
      alert(`¡Evaluación enviada!\nTu calificación: ${resultado.calificacion_final}/${resultado.calificacion_maxima}`);
      
      // Redirigir a la página de resultados o volver
      navigate(`/tutorias/${id}/evaluaciones`);

    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    if (evaluacionId) {
      cargarEvaluacion();
    }
  }, [evaluacionId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {evaluacion?.nombre_evaluacion}
        </h1>
        {evaluacion?.descripcion && (
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {evaluacion.descripcion}
          </p>
        )}
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <span>Preguntas: {preguntas.length}</span>
          <span>•</span>
          <span>Calificación máxima: {preguntas.reduce((sum, p) => sum + (p.nota_pregunta || 1), 0)}</span>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-blue-800 dark:text-blue-300 font-medium">Instrucciones</p>
            <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
              Selecciona una respuesta para cada pregunta. Puedes cambiar tus respuestas hasta que envíes la evaluación.
            </p>
          </div>
        </div>
      </div>

      {/* Preguntas */}
      <div className="space-y-6">
        {preguntas.map((pregunta, index) => (
          <div 
            key={pregunta.numero_preg} 
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-medium">
                  Pregunta {index + 1}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Valor: {pregunta.nota_pregunta || 1} punto(s)
                </span>
              </div>
            </div>

            <p className="text-gray-900 dark:text-white text-lg mb-4 leading-relaxed">
              {pregunta.descripcion}
            </p>

            {/* Opciones de respuesta */}
            <div className="space-y-3">
              {pregunta.opciones && pregunta.opciones.map((opcion) => (
                <label 
                  key={opcion.inciso}
                  className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    respuestas[pregunta.numero_preg] === opcion.inciso
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name={`pregunta-${pregunta.numero_preg}`}
                    value={opcion.inciso}
                    checked={respuestas[pregunta.numero_preg] === opcion.inciso}
                    onChange={() => handleSeleccionRespuesta(pregunta.numero_preg, opcion.inciso)}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {String.fromCharCode(64 + opcion.inciso)}. {/* A, B, C, D */}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {opcion.respuesta_opcion}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {!respuestas[pregunta.numero_preg] && (
              <div className="mt-3 text-sm text-yellow-600 dark:text-yellow-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Sin responder
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Botón de enviar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sticky bottom-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600 dark:text-gray-400">
              Respondidas: {Object.keys(respuestas).length} de {preguntas.length}
            </p>
            {Object.keys(respuestas).length < preguntas.length && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Tienes preguntas sin responder
              </p>
            )}
          </div>
          
          <button
            onClick={enviarEvaluacion}
            disabled={enviando || Object.keys(respuestas).length === 0}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {enviando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Enviar Evaluación</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResolverEvaluacion;