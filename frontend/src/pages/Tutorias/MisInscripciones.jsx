import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Badge = ({ children, color = "gray", size = "sm" }) => {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
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

const MisInscripciones = () => {
  const [inscripciones, setInscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getAuthToken } = useAuth();

  const getToken = () => {
    return getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
  };

  const cargarInscripciones = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      const response = await fetch('http://localhost:3000/inscripciones-estudiante/mis-inscripciones', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar las inscripciones');
      }

      const data = await response.json();
      setInscripciones(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelarInscripcion = async (idInscripcion) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar esta inscripción?')) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/inscripciones-estudiante/${idInscripcion}/cancelar`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cancelar inscripción');
      }

      // Recargar la lista
      cargarInscripciones();
      
    } catch (err) {
      setError(err.message);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'aprobada': return 'green';
      case 'pendiente': return 'yellow';
      case 'rechazada': return 'red';
      default: return 'gray';
    }
  };

  const getEstadoPagoColor = (estadoPago) => {
    switch (estadoPago) {
      case 'completado': return 'green';
      case 'pendiente': return 'yellow';
      default: return 'gray';
    }
  };

  useEffect(() => {
    cargarInscripciones();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Mis Inscripciones
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona todas tus inscripciones a tutorías
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {inscripciones.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No tienes inscripciones
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Inscríbete en alguna tutoría para verlas aquí
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {inscripciones.map((inscripcion) => (
            <div key={inscripcion.id_inscripcion} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {inscripcion.nombre_tutoria}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{inscripcion.sigla}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge color={getEstadoColor(inscripcion.estado_inscripcion)}>
                          {inscripcion.estado_inscripcion}
                        </Badge>
                        {inscripcion.estado_pago && (
                          <Badge color={getEstadoPagoColor(inscripcion.estado_pago)}>
                            Pago {inscripcion.estado_pago}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Tutor:</span>
                      <p className="text-gray-900 dark:text-white">{inscripcion.tutor_nombre}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Institución:</span>
                      <p className="text-gray-900 dark:text-white">{inscripcion.institucion_nombre}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Fecha de inscripción:</span>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(inscripcion.fecha_inscripcion).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Cupo:</span>
                      <p className="text-gray-900 dark:text-white">
                        {inscripcion.inscritos_actuales}/{inscripcion.cupo} inscritos
                      </p>
                    </div>
                    {inscripcion.monto && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Monto pagado:</span>
                        <p className="text-gray-900 dark:text-white">Bs. {inscripcion.monto}</p>
                      </div>
                    )}
                    {inscripcion.fecha_de_pago && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Fecha de pago:</span>
                        <p className="text-gray-900 dark:text-white">
                          {new Date(inscripcion.fecha_de_pago).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {inscripcion.descripcion_tutoria && (
                    <div className="mt-4">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Descripción:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                        {inscripcion.descripcion_tutoria}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  {inscripcion.estado_inscripcion === 'pendiente' && (
                    <button
                      onClick={() => cancelarInscripcion(inscripcion.id_inscripcion)}
                      className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                    >
                      Cancelar Inscripción
                    </button>
                  )}
                  
                  {inscripcion.estado_inscripcion === 'aprobada' && (
                    <Badge color="green" size="md">
                      Inscripción Activa
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MisInscripciones;