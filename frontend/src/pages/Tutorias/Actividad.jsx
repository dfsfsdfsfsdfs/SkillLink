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
  const [editingActividad, setEditingActividad] = useState(null);
  const [tutoriaInfo, setTutoriaInfo] = useState(null);

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

  // Roles
  const userRole = user?.id_rol;
  const isAdmin = userRole === 1;
  const isGerente = userRole === 2;
  const isTutor = userRole === 3;

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

  // Permisos
  const puedeGestionarActividades = useCallback(() => {
    if (!tutoriaInfo) return false;
    if (isAdmin) return true;
    if (isGerente) return tutoriaInfo.gerente_pertenece_a_institucion === true;
    if (isTutor) return tutoriaInfo.tutor_pertenece_al_usuario === true;
    return false;
  }, [tutoriaInfo, isAdmin, isGerente, isTutor]);

  // Reset form
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

  // Input change
  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Abrir modal crear
  const abrirModalCrear = useCallback(() => {
    if (!puedeGestionarActividades()) {
      setError("No tienes permisos para crear actividades en esta tutoría");
      return;
    }
    setShowModal(true);
    setEditingActividad(null);
    resetForm();
  }, [puedeGestionarActividades, resetForm]);

  // Abrir modal editar
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

  // Crear actividad
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

  // Actualizar actividad
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

  // Eliminar actividad
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

  // Enviar formulario
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (editingActividad) actualizarActividad(formData);
      else crearActividad(formData);
    },
    [editingActividad, actualizarActividad, crearActividad, formData]
  );

  // Cerrar modal
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingActividad(null);
    resetForm();
  }, [resetForm]);

  // Efectos iniciales
  useEffect(() => {
    if (id) {
      cargarTutoriaInfo();
      cargarActividades();
    }
  }, [id, cargarTutoriaInfo, cargarActividades]);

  // Cargando
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render principal
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Actividades y Tareas
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gestiona las actividades de esta tutoría
          </p>
        </div>

        {puedeGestionarActividades() && (
          <button
            onClick={abrirModalCrear}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
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

      {/* Lista */}
      {actividades.length > 0 ? (
        <div className="grid gap-4">
          {actividades.map((actividad) => (
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
                  </div>

                  {actividad.descripcion && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {actividad.descripcion}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-500">
                    <span>
                      Publicado:{" "}
                      {new Date(
                        actividad.fecha_publicacion
                      ).toLocaleDateString()}
                    </span>
                    <span>
                      Entrega:{" "}
                      {new Date(
                        actividad.fecha_presentacion
                      ).toLocaleDateString()}
                    </span>
                    {actividad.tutor_nombre && (
                      <span>Por: {actividad.tutor_nombre}</span>
                    )}
                  </div>
                </div>

                {puedeGestionarActividades() && (
                  <div className="flex space-x-2">
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
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 dark:text-gray-400">
          No hay actividades registradas.
        </p>
      )}
      {/* Modal Crear / Editar */}
{showModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6 relative">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {editingActividad ? "Editar Actividad" : "Nueva Actividad"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => handleInputChange("nombre", e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Descripción
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => handleInputChange("descripcion", e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            rows="3"
          ></textarea>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Fecha Publicación
            </label>
            <input
              type="date"
              value={formData.fecha_publicacion}
              onChange={(e) =>
                handleInputChange("fecha_publicacion", e.target.value)
              }
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Fecha Presentación
            </label>
            <input
              type="date"
              value={formData.fecha_presentacion}
              onChange={(e) =>
                handleInputChange("fecha_presentacion", e.target.value)
              }
              className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nota (opcional)
          </label>
          <input
            type="number"
            value={formData.nota_act}
            onChange={(e) => handleInputChange("nota_act", e.target.value)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={handleCloseModal}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {editingActividad ? "Actualizar" : "Crear"}
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
