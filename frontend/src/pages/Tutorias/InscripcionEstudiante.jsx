import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const InscripcionEstudiante = ({ tutoria, onClose, onInscripcionExitosa }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paso, setPaso] = useState(1); // 1: Confirmación, 2: QR, 3: Éxito
  const [inscripcionCreada, setInscripcionCreada] = useState(null);
  const [pagoQR, setPagoQR] = useState(null);
  const { getAuthToken } = useAuth();

  const getToken = () => {
    return getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
  };

  const handleInscribirse = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getToken();
      const response = await fetch('http://localhost:3000/inscripciones-estudiante', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_tutoria: tutoria.id_tutoria
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al realizar la inscripción');
      }

      setInscripcionCreada(data.inscripcion);
      setPaso(2);
      
      // Generar pago QR automáticamente
      await generarPagoQR(data.inscripcion.id_inscripcion);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generarPagoQR = async (id_inscripcion) => {
    try {
      const token = getToken();
      const monto = 50.00; // Monto fijo o podrías obtenerlo de la tutoría
      
      const response = await fetch('http://localhost:3000/pagos-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          monto: monto,
          id_inscripcion: id_inscripcion,
          concepto: `Tutoría ${tutoria.sigla} - ${tutoria.nombre_tutoria}`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar QR de pago');
      }

      setPagoQR(data);
      
    } catch (err) {
      console.error('Error generando QR:', err);
      setError('Inscripción creada pero error al generar QR: ' + err.message);
    }
  };

  const simularPago = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      const response = await fetch(`http://localhost:3000/pagos-qr/${pagoQR.nro_pago}/simular-pago`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al simular pago');
      }

      setPaso(3);
      if (onInscripcionExitosa) {
        onInscripcionExitosa();
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderPaso1 = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
          Confirmación de Inscripción
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-400">
          Estás a punto de inscribirte en esta tutoría. Deberás realizar el pago para completar el proceso.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Resumen de la Tutoría
        </h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Tutoría:</span>
            <p className="text-gray-900 dark:text-white">{tutoria.nombre_tutoria}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Sigla:</span>
            <p className="text-gray-900 dark:text-white">{tutoria.sigla}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Tutor:</span>
            <p className="text-gray-900 dark:text-white">{tutoria.tutor_nombre}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Institución:</span>
            <p className="text-gray-900 dark:text-white">{tutoria.institucion_nombre}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Cupos Disponibles:</span>
            <p className="text-green-600 dark:text-green-400 font-semibold">
              {tutoria.cupos_disponibles || tutoria.cupo}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-700 dark:text-gray-300">Monto:</span>
            <p className="text-gray-900 dark:text-white font-semibold">Bs. 50.00</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleInscribirse}
          disabled={loading}
          className="px-6 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          <span>Confirmar Inscripción</span>
        </button>
      </div>
    </div>
  );

  const renderPaso2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Pago de la Tutoría
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Escanea el código QR para realizar el pago de Bs. 50.00
        </p>
      </div>

      {pagoQR?.qr_imagen ? (
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <img 
              src={`data:image/png;base64,${pagoQR.qr_imagen}`}
              alt="Código QR para pago"
              className="w-64 h-64 mx-auto"
            />
            <div className="text-center mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Código: {pagoQR.codigo_transaccion}
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                Bs. {pagoQR.monto}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Generando código QR...</p>
        </div>
      )}

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
          Información Importante
        </h4>
        <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
          <li>• Tu inscripción está pendiente hasta que se confirme el pago</li>
          <li>• El código QR expira en 24 horas</li>
          <li>• Recibirás una confirmación por email cuando el pago sea procesado</li>
        </ul>
      </div>

      {/* Solo para desarrollo - Botón de simulación */}
      <div className="text-center">
        <button
          onClick={simularPago}
          disabled={loading || !pagoQR}
          className="px-6 py-3 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2 mx-auto"
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          <span>Simular Pago (Solo Desarrollo)</span>
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Este botón solo está disponible en modo desarrollo
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );

  const renderPaso3 = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ¡Inscripción Completada!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Tu inscripción a <strong>{tutoria.nombre_tutoria}</strong> ha sido procesada exitosamente.
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
          Detalles de tu inscripción
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p><strong>Tutoría:</strong> {tutoria.sigla} - {tutoria.nombre_tutoria}</p>
          <p><strong>Tutor:</strong> {tutoria.tutor_nombre}</p>
          <p><strong>Estado:</strong> <span className="text-green-600 dark:text-green-400">Aprobada</span></p>
          <p><strong>Fecha:</strong> {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="flex justify-center space-x-3 pt-4">
        <button
          onClick={onClose}
          className="px-6 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {paso === 1 && 'Confirmar Inscripción'}
              {paso === 2 && 'Realizar Pago'}
              {paso === 3 && 'Inscripción Exitosa'}
            </h2>
            {paso !== 3 && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Indicador de progreso */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    paso >= step 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-12 h-1 mx-2 ${
                      paso > step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {paso === 1 && renderPaso1()}
          {paso === 2 && renderPaso2()}
          {paso === 3 && renderPaso3()}
        </div>
      </div>
    </div>
  );
};

export default InscripcionEstudiante;