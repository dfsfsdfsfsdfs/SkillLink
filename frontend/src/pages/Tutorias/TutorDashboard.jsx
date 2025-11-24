import React, { useState } from 'react';
import MisTutoriasTutor from './MisTutoriasTutor';
import ListaTutoriasTutor from './ListaTutoriasTutor';

const TutorDashboard = () => {
  const [vistaActual, setVistaActual] = useState('mis-tutorias'); // 'mis-tutorias' o 'todas'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con Navegación */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Panel del Tutor
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gestiona y consulta tutorías académicas
              </p>
            </div>
          </div>

          {/* Navegación */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setVistaActual('mis-tutorias')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                vistaActual === 'mis-tutorias'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Mis Tutorías
            </button>
            <button
              onClick={() => setVistaActual('todas')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                vistaActual === 'todas'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Todas las Tutorías
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {vistaActual === 'mis-tutorias' ? (
          <MisTutoriasTutor />
        ) : (
          <ListaTutoriasTutor />
        )}
      </div>
    </div>
  );
};

export default TutorDashboard;