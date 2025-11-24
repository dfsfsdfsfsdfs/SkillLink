import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePagoQR } from '../../hooks/usePagoQR';
import QRPago from '../../components/QRPago';

const Inscripcion = ({ tutoria, onClose, onInscripcionExitosa }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paso, setPaso] = useState(1);
  const [inscripcionId, setInscripcionId] = useState(null);
  const [datosPagoReal, setDatosPagoReal] = useState(null);
  const [pagoId, setPagoId] = useState(null);
  const { getAuthToken, user } = useAuth();
  
  // Usar el hook personalizado para pagos QR
  const { 
    loading: loadingPago, 
    error: errorPago, 
    crearPagoQR, 
    simularPago 
  } = usePagoQR();

// En tu componente Inscripcion, reemplaza esta función:
const getToken = () => {
  return localStorage.getItem('authToken'); // ✅ Usar directamente localStorage
};

  // Crear inscripción inicial MEJORADA
  const crearInscripcion = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getToken();
      
      // Obtener o crear estudiante
      let estudianteId = await obtenerOCrearEstudiante();
      
      if (!estudianteId) {
        throw new Error('No se pudo obtener la información del estudiante');
      }

      // Verificar cupos disponibles
      if (tutoria.cupos_disponibles <= 0) {
        throw new Error('No hay cupos disponibles en esta tutoría');
      }

      // Crear inscripción
      const responseInscripcion = await fetch('http://localhost:3000/inscripciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_estudiante: estudianteId,
          id_tutoria: tutoria.id_tutoria,
          estado_inscripcion: 'pendiente',
          fecha_inscripcion: new Date().toISOString()
        })
      });

      if (!responseInscripcion.ok) {
        const errorData = await responseInscripcion.json();
        throw new Error(errorData.error || 'Error al crear inscripción');
      }

      const inscripcionCreada = await responseInscripcion.json();
      setInscripcionId(inscripcionCreada.id_inscripcion);

      // ✅ NUEVO: Usar la API mejorada para crear pago QR
      try {
        const pagoData = await crearPagoQR(
          inscripcionCreada.id_inscripcion, 
          50.00, 
          `Tutoría ${tutoria.sigla} - ${tutoria.nombre_tutoria}`
        );
        
        setDatosPagoReal(pagoData.datos_qr);
        setPagoId(pagoData.nro_pago);
        
      } catch (pagoError) {
        console.warn('Error al crear pago QR:', pagoError);
        // Si falla el pago QR, continuar con el método antiguo como fallback
        const datosPagoAntiguo = {
          tutoria_id: tutoria.id_tutoria,
          tutoria_nombre: tutoria.nombre_tutoria,
          monto: 50.00,
          moneda: 'BOB',
          concepto: `Inscripción: ${tutoria.sigla} - ${tutoria.nombre_tutoria}`,
          fecha_expiracion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          codigo: `TUT-${tutoria.id_tutoria}-${Date.now()}`,
          beneficiario: 'OLAR Tutorías'
        };
        setDatosPagoReal(datosPagoAntiguo);
      }

      setPaso(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Obtener o crear estudiante (MANTENIDO)
  const obtenerOCrearEstudiante = async () => {
    try {
      const token = getToken();
      
      // Primero intentar obtener estudiante por usuario
      const response = await fetch(`http://localhost:3000/estudiantes/usuario/${user.id_usuario}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const estudianteExistente = await response.json();
        return estudianteExistente.id_estudiante;
      }

      // Si no existe, crear nuevo estudiante
      const nuevoEstudiante = {
        nombre: user.nombre || 'Estudiante',
        paterno: user.apellido_paterno || 'Usuario',
        materno: user.apellido_materno || '',
        email: user.email,
        celular: user.celular || '',
        carrera: 'Por definir',
        univer_institu: 'Por definir'
      };

      const responseCrear = await fetch('http://localhost:3000/estudiantes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(nuevoEstudiante)
      });

      if (responseCrear.ok) {
        const estudianteCreado = await responseCrear.json();
        return estudianteCreado.id_estudiante;
      }

      throw new Error('No se pudo crear el perfil de estudiante');
    } catch (error) {
      console.error('Error al obtener/crear estudiante:', error);
      throw error;
    }
  };

  // ✅ NUEVO: Verificar pago usando la API mejorada
  const verificarPago = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!pagoId) {
        throw new Error('No se encontró información del pago');
      }

      // Usar la nueva API de simulación de pago
      const resultado = await simularPago(pagoId);
      
      setPaso(3);
      
      // Notificar al componente padre
      if (onInscripcionExitosa) {
        onInscripcionExitosa();
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reintentarVerificacion = () => {
    setError(null);
    verificarPago();
  };

  const cancelarInscripcion = async () => {
    if (inscripcionId) {
      try {
        const token = getToken();
        await fetch(`http://localhost:3000/inscripciones/${inscripcionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (err) {
        console.error('Error al cancelar inscripción:', err);
      }
    }
    onClose();
  };

  // Combinar errores del hook y del componente
  const errorMostrar = error || errorPago;
  const loadingMostrar = loading || loadingPago;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {paso === 1 && 'Confirmar Inscripción'}
                {paso === 2 && 'Pago con QR'}
                {paso === 3 && '¡Inscripción Exitosa!'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {tutoria.sigla} - {tutoria.nombre_tutoria}
              </p>
            </div>
            {paso !== 3 && (
              <button
                onClick={cancelarInscripcion}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {errorMostrar && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="ml-3 text-sm text-red-700 dark:text-red-300">{errorMostrar}</p>
              </div>
              {paso === 2 && (
                <button
                  onClick={reintentarVerificacion}
                  className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Reintentar
                </button>
              )}
            </div>
          )}

          {/* Paso 1: Confirmación */}
          {paso === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                  Resumen de la Inscripción
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tutoría:</span>
                    <span className="font-medium">{tutoria.nombre_tutoria}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Sigla:</span>
                    <span className="font-medium">{tutoria.sigla}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tutor:</span>
                    <span className="font-medium">{tutoria.tutor_nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cupos disponibles:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {tutoria.cupos_disponibles || tutoria.cupo}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 dark:border-blue-700 pt-2">
                    <span className="text-gray-600 dark:text-gray-400">Costo:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">Bs. 50.00</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    <p className="font-medium">Proceso de Inscripción</p>
                    <p className="mt-1">1. Confirmar inscripción</p>
                    <p>2. Pago con QR realista</p>
                    <p>3. Verificación automática</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={cancelarInscripcion}
                  className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={crearInscripcion}
                  disabled={loadingMostrar}
                  className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loadingMostrar ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Continuar al Pago'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: QR MEJORADO */}
          {paso === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                {/* ✅ NUEVO: Usar el componente QRPagoRealista */}
                <QRPago datosPago={datosPagoReal} />
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Instrucciones de Pago
                  </h4>
                  <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside">
                    <li>Este es un sistema de simulación con QR realista</li>
                    <li>Haz clic en "Ya Pagué - Verificar" para continuar</li>
                    <li>El sistema procesará tu pago automáticamente</li>
                    <li>Recibirás confirmación inmediata</li>
                  </ol>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-green-700 dark:text-green-300">
                      Sistema de pago seguro con verificación automática
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={cancelarInscripcion}
                  className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={verificarPago}
                  disabled={loadingMostrar}
                  className="flex-1 px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {loadingMostrar ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Procesando Pago...
                    </>
                  ) : (
                    'Ya Pagué - Verificar'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Éxito */}
          {paso === 3 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  ¡Inscripción Exitosa!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Te has inscrito correctamente a <strong>{tutoria.nombre_tutoria}</strong>.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  ID de inscripción: <strong>{inscripcionId}</strong>
                </p>
                {pagoId && (
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Comprobante: <strong>{pagoId}</strong>
                  </p>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-left">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                  Próximos pasos:
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>Revisa tu correo electrónico para más detalles</li>
                  <li>El tutor se pondrá en contacto contigo</li>
                  <li>Prepárate para la primera sesión</li>
                  <li>Tu pago ha sido procesado exitosamente</li>
                </ul>
              </div>

              <button
                onClick={onClose}
                className="w-full px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inscripcion;