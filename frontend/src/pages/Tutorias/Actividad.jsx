import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Actividad = () => {
  const { id } = useParams();
  const { getAuthToken, user } = useAuth();

  // Estados principales
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEntregasModal, setShowEntregasModal] = useState(false);
  const [showCalificarModal, setShowCalificarModal] = useState(false);
  const [showEntregaModal, setShowEntregaModal] = useState(false);
  const [editingActividad, setEditingActividad] = useState(null);
  const [tutoriaInfo, setTutoriaInfo] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [entregaSeleccionada, setEntregaSeleccionada] = useState(null);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [misEntregas, setMisEntregas] = useState([]);
  const [estudianteInscrito, setEstudianteInscrito] = useState(false); // Nuevo estado

  // Datos formulario
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    fecha_publicacion: new Date().toISOString().split("T")[0],
    fecha_presentacion: "",
    nota_act: "",
    id_tutoria: id,
    id_tutor: "",
  });

  const [entregaFormData, setEntregaFormData] = useState({
    url_drive: ""
  });

  const [calificacionFormData, setCalificacionFormData] = useState({
    calificacion: "",
    comentario_tutor: ""
  });

  // Roles
  const userRole = user?.id_rol;
  const isAdmin = userRole === 1;
  const isGerente = userRole === 2;
  const isTutor = userRole === 3;
  const isEstudiante = userRole === 4;

  // Obtener token
  const getToken = useCallback(() => {
    return getAuthToken ? getAuthToken() : localStorage.getItem("authToken");
  }, [getAuthToken]);

  // Cargar información de tutoría
  const cargarTutoriaInfo = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/tutorias/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const tutoriaData = await response.json();
        setTutoriaInfo(tutoriaData);

        if (isTutor && tutoriaData.tutor_pertenece_al_usuario) {
          setFormData((prev) => ({
            ...prev,
            id_tutor: user.id_usuario,
          }));
        }
      }
    } catch (err) {
      console.error("Error cargando información de tutoría:", err);
    }
  }, [getToken, id, isTutor, user]);

  // Cargar actividades
  const cargarActividades = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(
        `http://localhost:3000/actividades/tutoria/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setActividades(data);
      } else {
        throw new Error("Error al cargar actividades");
      }
    } catch (err) {
      setError("Error al cargar actividades: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [getToken, id]);

const cargarMisEntregas = useCallback(async () => {
  if (!isEstudiante) return;
  
  try {
    const token = getToken();
    
    // Primero obtener el perfil del estudiante - CORREGIR LA URL
    const estudianteResponse = await fetch(
      `http://localhost:3000/estudiantes/mi-perfil?email=${encodeURIComponent(user.email)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!estudianteResponse.ok) {
      console.log("No se pudo obtener el perfil del estudiante");
      return;
    }

    const estudianteData = await estudianteResponse.json();
    const id_estudiante = estudianteData.id_estudiante;

    // Ahora cargar las entregas del estudiante - CORREGIR LA URL
    const response = await fetch(
      `http://localhost:3000/entregas/estudiante/mis-entregas?id_estudiante=${id_estudiante}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.ok) {
      const data = await response.json();
      setMisEntregas(data);
    }
  } catch (err) {
    console.error("Error cargando mis entregas:", err);
  }
}, [getToken, isEstudiante, user.email]);

// NUEVA FUNCIÓN: Verificar si el estudiante está inscrito en la tutoría
// FUNCIÓN ALTERNATIVA: Usando endpoint existente
const verificarInscripcionEstudiante = useCallback(async () => {
  if (!isEstudiante) return;

  try {
    const token = getToken();
    
    // Primero obtener el ID del estudiante
    const estudianteResponse = await fetch(
      `http://localhost:3000/estudiantes/mi-perfil?email=${encodeURIComponent(user.email)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!estudianteResponse.ok) {
      setEstudianteInscrito(false);
      return;
    }

    const estudianteData = await estudianteResponse.json();
    const id_estudiante = estudianteData.id_estudiante;

    // Obtener todas las inscripciones del estudiante
    const inscripcionesResponse = await fetch(
      `http://localhost:3000/inscripciones/estudiante/${id_estudiante}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (inscripcionesResponse.ok) {
      const inscripcionesData = await inscripcionesResponse.json();
      
      // Verificar si está inscrito en esta tutoría específica
      const inscripcionEnTutoria = inscripcionesData.find(
        inscripcion => inscripcion.id_tutoria === parseInt(id)
      );
      
      if (inscripcionEnTutoria) {
        // Verificar si está aprobado
        const aprobado = inscripcionEnTutoria.estado_inscripcion === 'aprobada' || 
                        inscripcionEnTutoria.estado_inscripcion === 'activa' ||
                        inscripcionEnTutoria.estado_solicitud === 'inscrito';
        
        setEstudianteInscrito(aprobado);
      } else {
        setEstudianteInscrito(false);
      }
    } else {
      setEstudianteInscrito(false);
    }
  } catch (err) {
    console.error("Error verificando inscripción:", err);
    setEstudianteInscrito(false);
  }
}, [getToken, id, isEstudiante, user.email]);

  // Cargar entregas por actividad
  const cargarEntregas = useCallback(async (id_actividad) => {
    try {
      const token = getToken();
      const response = await fetch(
        `http://localhost:3000/entregas/actividad/${id_actividad}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEntregas(data);
        setActividadSeleccionada(actividades.find(a => a.id_actividad === id_actividad));
        setShowEntregasModal(true);
      } else {
        throw new Error("Error al cargar entregas");
      }
    } catch (err) {
      setError("Error al cargar entregas: " + err.message);
    }
  }, [getToken, actividades]);

  // Permisos
  const puedeGestionarActividades = useCallback(() => {
    if (!tutoriaInfo) return false;
    if (isAdmin) return true;
    if (isGerente) return tutoriaInfo.gerente_pertenece_a_institucion === true;
    if (isTutor) return tutoriaInfo.tutor_pertenece_al_usuario === true;
    return false;
  }, [tutoriaInfo, isAdmin, isGerente, isTutor]);

  const puedeVerEntregas = useCallback((actividad) => {
    if (isAdmin) return true;
    if (isGerente) return tutoriaInfo?.gerente_pertenece_a_institucion === true;
    if (isTutor) return actividad?.id_tutor === user.id_usuario;
    return false;
  }, [tutoriaInfo, isAdmin, isGerente, isTutor, user]);

  // NUEVA FUNCIÓN: Verificar si puede entregar una actividad específica
  const puedeEntregarActividad = useCallback((actividad) => {
    if (!isEstudiante) return false;
    if (!estudianteInscrito) return false;
    
    // Verificar si la fecha de presentación ya pasó
    const fechaPresentacion = new Date(actividad.fecha_presentacion);
    const hoy = new Date();
    return hoy <= fechaPresentacion;
  }, [isEstudiante, estudianteInscrito]);

  // Reset forms
  const resetForm = useCallback(() => {
    setFormData({
      nombre: "",
      descripcion: "",
      fecha_publicacion: new Date().toISOString().split("T")[0],
      fecha_presentacion: "",
      nota_act: "",
      id_tutoria: id,
      id_tutor: isTutor ? user.id_usuario : "",
    });
  }, [id, isTutor, user]);

  const resetEntregaForm = useCallback(() => {
    setEntregaFormData({
      url_drive: ""
    });
  }, []);

  const resetCalificacionForm = useCallback(() => {
    setCalificacionFormData({
      calificacion: "",
      comentario_tutor: ""
    });
  }, []);

  // Input changes
  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleEntregaInputChange = useCallback((field, value) => {
    setEntregaFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleCalificacionInputChange = useCallback((field, value) => {
    setCalificacionFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Modal handlers
  const abrirModalCrear = useCallback(() => {
    if (!puedeGestionarActividades()) {
      setError("No tienes permisos para crear actividades en esta tutoría");
      return;
    }
    setShowModal(true);
    setEditingActividad(null);
    resetForm();
  }, [puedeGestionarActividades, resetForm]);

  const abrirModalEditar = useCallback(
    (actividad) => {
      if (!puedeGestionarActividades()) {
        setError("No tienes permisos para editar actividades en esta tutoría");
        return;
      }
      setEditingActividad(actividad);
      setFormData({
        nombre: actividad.nombre,
        descripcion: actividad.descripcion,
        fecha_publicacion: actividad.fecha_publicacion,
        fecha_presentacion: actividad.fecha_presentacion,
        nota_act: actividad.nota_act,
        id_tutoria: id,
        id_tutor: actividad.id_tutor,
      });
      setShowModal(true);
    },
    [puedeGestionarActividades, id]
  );

  const abrirModalEntrega = useCallback((actividad) => {
    // Verificar nuevamente si puede entregar
    if (!puedeEntregarActividad(actividad)) {
      setError("No puedes entregar esta tarea. Verifica tu inscripción o la fecha de entrega.");
      return;
    }
    setActividadSeleccionada(actividad);
    resetEntregaForm();
    setShowEntregaModal(true);
  }, [puedeEntregarActividad, resetEntregaForm]);

  const abrirModalCalificar = useCallback((entrega) => {
    setEntregaSeleccionada(entrega);
    setCalificacionFormData({
      calificacion: entrega.calificacion || "",
      comentario_tutor: entrega.comentario_tutor || ""
    });
    setShowCalificarModal(true);
  }, []);

  // CRUD operations (mantener igual que antes)
  const crearActividad = useCallback(
    async (formData) => {
      try {
        if (!puedeGestionarActividades()) {
          setError("No tienes permisos para crear actividades");
          return;
        }

        const token = getToken();
        const response = await fetch("http://localhost:3000/actividades", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al crear actividad");
        }

        await cargarActividades();
        setShowModal(false);
        resetForm();
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    },
    [puedeGestionarActividades, getToken, cargarActividades, resetForm]
  );

  const actualizarActividad = useCallback(
    async (formData) => {
      try {
        if (!puedeGestionarActividades()) {
          setError("No tienes permisos para editar actividades");
          return;
        }

        const token = getToken();
        const response = await fetch(
          `http://localhost:3000/actividades/${editingActividad.id_actividad}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al actualizar actividad");
        }

        await cargarActividades();
        setShowModal(false);
        setEditingActividad(null);
        resetForm();
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    },
    [
      puedeGestionarActividades,
      getToken,
      editingActividad,
      cargarActividades,
      resetForm,
    ]
  );

  const eliminarActividad = useCallback(
    async (actividadId) => {
      if (!window.confirm("¿Estás seguro de eliminar esta actividad?")) return;

      try {
        if (!puedeGestionarActividades()) {
          setError("No tienes permisos para eliminar actividades");
          return;
        }

        const token = getToken();
        const response = await fetch(
          `http://localhost:3000/actividades/${actividadId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al eliminar actividad");
        }

        await cargarActividades();
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    },
    [puedeGestionarActividades, getToken, cargarActividades]
  );

  const entregarTarea = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch("http://localhost:3000/entregas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_actividad: actividadSeleccionada.id_actividad,
          url_drive: entregaFormData.url_drive
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al entregar tarea");
      }

      await cargarMisEntregas();
      setShowEntregaModal(false);
      resetEntregaForm();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [getToken, actividadSeleccionada, entregaFormData, cargarMisEntregas, resetEntregaForm]);

  const calificarTarea = useCallback(async () => {
    try {
      const token = getToken();
      const response = await fetch(
        `http://localhost:3000/entregas/${entregaSeleccionada.id_entrega}/calificar`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(calificacionFormData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al calificar tarea");
      }

      // Recargar entregas si estamos en el modal de entregas
      if (showEntregasModal) {
        await cargarEntregas(actividadSeleccionada.id_actividad);
      }
      
      setShowCalificarModal(false);
      resetCalificacionForm();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [getToken, entregaSeleccionada, calificacionFormData, showEntregasModal, actividadSeleccionada, cargarEntregas, resetCalificacionForm]);

  // Form submissions (mantener igual)
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (editingActividad) actualizarActividad(formData);
      else crearActividad(formData);
    },
    [editingActividad, actualizarActividad, crearActividad, formData]
  );

  const handleEntregaSubmit = useCallback((e) => {
    e.preventDefault();
    entregarTarea();
  }, [entregarTarea]);

  const handleCalificacionSubmit = useCallback((e) => {
    e.preventDefault();
    calificarTarea();
  }, [calificarTarea]);

  // Close modals (mantener igual)
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingActividad(null);
    resetForm();
  }, [resetForm]);

  const handleCloseEntregasModal = useCallback(() => {
    setShowEntregasModal(false);
    setEntregas([]);
    setActividadSeleccionada(null);
  }, []);

  const handleCloseCalificarModal = useCallback(() => {
    setShowCalificarModal(false);
    setEntregaSeleccionada(null);
    resetCalificacionForm();
  }, [resetCalificacionForm]);

  const handleCloseEntregaModal = useCallback(() => {
    setShowEntregaModal(false);
    setActividadSeleccionada(null);
    resetEntregaForm();
  }, [resetEntregaForm]);

  // Efectos iniciales - AGREGAR la nueva función
  useEffect(() => {
    if (id) {
      cargarTutoriaInfo();
      cargarActividades();
      if (isEstudiante) {
        cargarMisEntregas();
        verificarInscripcionEstudiante(); // Llamar a la nueva función
      }
    }
  }, [id, cargarTutoriaInfo, cargarActividades, isEstudiante, cargarMisEntregas, verificarInscripcionEstudiante]);

  // Helper para obtener entrega de estudiante
  const obtenerMiEntrega = useCallback((id_actividad) => {
    return misEntregas.find(entrega => entrega.id_actividad === id_actividad);
  }, [misEntregas]);

  // Cargando
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Actividades y Tareas
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isEstudiante ? "Mis actividades y entregas" : "Gestiona las actividades de esta tutoría"}
            {isEstudiante && !estudianteInscrito && (
              <span className="text-yellow-600 dark:text-yellow-400 text-sm ml-2">
                (No estás inscrito en esta tutoría)
              </span>
            )}
          </p>
        </div>

        {puedeGestionarActividades() && (
          <button
            onClick={abrirModalCrear}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Nueva Actividad</span>
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Lista de Actividades */}
      {actividades.length > 0 ? (
        <div className="grid gap-4">
          {actividades.map((actividad) => {
            const miEntrega = isEstudiante ? obtenerMiEntrega(actividad.id_actividad) : null;
            const puedeEntregar = puedeEntregarActividad(actividad);
            const fechaPasada = new Date(actividad.fecha_presentacion) < new Date();
            
            return (
              <div
                key={actividad.id_actividad}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {actividad.nombre}
                      </h3>
                      {actividad.nota_act && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                          {actividad.nota_act} pts
                        </span>
                      )}
                      {isEstudiante && miEntrega && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          miEntrega.estado === 'calificado' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                        }`}>
                          {miEntrega.estado === 'calificado' ? 'Calificado' : 'Pendiente de calificación'}
                        </span>
                      )}
                      {fechaPasada && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 rounded-full">
                          Tiempo agotado
                        </span>
                      )}
                    </div>

                    {actividad.descripcion && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {actividad.descripcion}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-500">
                      <span>
                        Publicado:{" "}
                        {new Date(actividad.fecha_publicacion).toLocaleDateString()}
                      </span>
                      <span className={fechaPasada ? "text-red-600 dark:text-red-400" : ""}>
                        Entrega:{" "}
                        {new Date(actividad.fecha_presentacion).toLocaleDateString()}
                        {fechaPasada && " (Vencida)"}
                      </span>
                      {actividad.tutor_nombre && (
                        <span>Por: {actividad.tutor_nombre}</span>
                      )}
                      {isEstudiante && miEntrega && miEntrega.calificacion && (
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          Calificación: {miEntrega.calificacion}/{actividad.nota_act}
                        </span>
                      )}
                    </div>

                    {/* Información de entrega para estudiantes */}
                    {isEstudiante && miEntrega && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          <strong>Tu entrega:</strong>{" "}
                          <a href={miEntrega.url_drive} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 dark:text-blue-400 hover:underline">
                            Ver en Drive
                          </a>
                        </p>
                        {miEntrega.comentario_tutor && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            <strong>Comentario del tutor:</strong> {miEntrega.comentario_tutor}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Mensaje para estudiantes no inscritos */}
                    {isEstudiante && !estudianteInscrito && (
                      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          <strong>No estás inscrito en esta tutoría.</strong> Para entregar tareas, primero debes inscribirte y ser aprobado.
                        </p>
                      </div>
                    )}

                    {/* Mensaje para fecha vencida */}
                    {isEstudiante && estudianteInscrito && fechaPasada && !miEntrega && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-300">
                          <strong>La fecha de entrega ha vencido.</strong> Ya no puedes entregar esta tarea.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {/* Botones para docentes/administradores */}
                    {puedeGestionarActividades() && (
                      <>
                        <button
                          onClick={() => abrirModalEditar(actividad)}
                          className="text-sm text-yellow-600 hover:text-yellow-800 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarActividad(actividad.id_actividad)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          Eliminar
                        </button>
                      </>
                    )}

                    {/* Botón para ver entregas (tutores/gerentes/admin) */}
                    {puedeVerEntregas(actividad) && (
                      <button
                        onClick={() => cargarEntregas(actividad.id_actividad)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      >
                        Ver Entregas
                      </button>
                    )}

                    {/* Botón para entregar tarea (estudiantes inscritos y dentro del plazo) */}
                    {isEstudiante && puedeEntregar && (
                      <button
                        onClick={() => abrirModalEntrega(actividad)}
                        className="text-sm text-green-600 hover:text-green-800 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30"
                      >
                        {miEntrega ? 'Reenviar' : 'Entregar'}
                      </button>
                    )}

                    {/* Botón deshabilitado para estudiantes no inscritos o fuera de plazo */}
                    {isEstudiante && !puedeEntregar && estudianteInscrito && !fechaPasada && (
                      <button
                        disabled
                        className="text-sm text-gray-400 font-medium px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                        title="No puedes entregar esta tarea"
                      >
                        Entregar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-600 dark:text-gray-400">
          No hay actividades registradas.
        </p>
      )}

      {/* Modal Crear/Editar Actividad */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingActividad ? "Editar Actividad" : "Nueva Actividad"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ... (formulario de actividad existente) */}
            </form>
          </div>
        </div>
      )}

      {/* Modal Entregas */}
      {showEntregasModal && actividadSeleccionada && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Entregas - {actividadSeleccionada.nombre}
            </h3>

            {entregas.length > 0 ? (
              <div className="space-y-4">
                {entregas.map((entrega) => (
                  <div key={entrega.id_entrega} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {entrega.estudiante_nombre} {entrega.estudiante_paterno}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <a href={entrega.url_drive} target="_blank" rel="noopener noreferrer" 
                             className="text-blue-600 dark:text-blue-400 hover:underline">
                            Ver entrega en Drive
                          </a>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Entregado: {new Date(entrega.fecha_entrega).toLocaleString()}
                        </p>
                        {entrega.calificacion && (
                          <div className="mt-2">
                            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                              Calificación: {entrega.calificacion}/{actividadSeleccionada.nota_act}
                            </p>
                            {entrega.comentario_tutor && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Comentario: {entrega.comentario_tutor}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {!entrega.calificacion && (
                          <button
                            onClick={() => abrirModalCalificar(entrega)}
                            className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/30"
                          >
                            Calificar
                          </button>
                        )}
                        {entrega.calificacion && (
                          <button
                            onClick={() => abrirModalCalificar(entrega)}
                            className="text-sm text-yellow-600 hover:text-yellow-800 font-medium transition-colors px-3 py-1 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
                          >
                            Recalificar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No hay entregas para esta actividad.</p>
            )}

            <div className="flex justify-end mt-6">
              <button
                onClick={handleCloseEntregasModal}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Calificar Tarea */}
      {showCalificarModal && entregaSeleccionada && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Calificar Tarea
            </h3>

            <form onSubmit={handleCalificacionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Calificación (Máximo: {actividadSeleccionada?.nota_act} pts)
                </label>
                <input
                  type="number"
                  step="0.1"
                  max={actividadSeleccionada?.nota_act}
                  value={calificacionFormData.calificacion}
                  onChange={(e) => handleCalificacionInputChange("calificacion", e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Comentario (opcional)
                </label>
                <textarea
                  value={calificacionFormData.comentario_tutor}
                  onChange={(e) => handleCalificacionInputChange("comentario_tutor", e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  rows="3"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseCalificarModal}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Calificar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Entregar Tarea */}
      {showEntregaModal && actividadSeleccionada && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Entregar Tarea - {actividadSeleccionada.nombre}
            </h3>

            <form onSubmit={handleEntregaSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL de Google Drive
                </label>
                <input
                  type="url"
                  value={entregaFormData.url_drive}
                  onChange={(e) => handleEntregaInputChange("url_drive", e.target.value)}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="https://drive.google.com/file/d/..."
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Comparte el archivo desde Google Drive y pega el enlace aquí
                </p>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseEntregaModal}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Entregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Actividad;