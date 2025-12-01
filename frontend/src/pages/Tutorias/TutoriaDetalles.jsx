import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Badge from './Badge';
import Actividad from './Actividad';
import Preguntas from './Preguntas';
import Evaluaciones from './Evaluaciones';
import TablaEstudiantes from './TablaEstudiantes';


const TutoriaDetalles = () => {
  
  const { id } = useParams();
  const navigate = useNavigate();
  const [tutoria, setTutoria] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [showInscribirModal, setShowInscribirModal] = useState(false);
  const [editingAsignacion, setEditingAsignacion] = useState(null);
  const [aulas, setAulas] = useState([]);
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState([]);
  const [inscripcionesPendientes, setInscripcionesPendientes] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  // Agrega este estado con los otros estados
  const [estudiantesCompleto, setEstudiantesCompleto] = useState([]);
  const [loadingAulas, setLoadingAulas] = useState(false);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false);
  const { getAuthToken, user } = useAuth();
  const [showActividadModal, setShowActividadModal] = useState(false);
  // Agrega estos estados con los otros estados
  const [contadorActividades, setContadorActividades] = useState(0);
  const [contadorPreguntas, setContadorPreguntas] = useState(0);
  const [estudianteInscrito, setEstudianteInscrito] = useState(false);

  const [estudiantesInscritos, setEstudiantesInscritos] = useState([]);
  const [loadingEstudiantesInscritos, setLoadingEstudiantesInscritos] = useState(false);
  // Determinar permisos según el rol
  const userRole = user?.id_rol;
  const isAdmin = userRole === 1;
  const isGerente = userRole === 2;
  const isTutor = userRole === 3;
  const isEstudiante = userRole === 4;

  // NUEVO: Funciones de verificación de permisos específicos
// Reemplaza estas funciones de verificación:

// CORREGIR: Comparar id_usuario del usuario con id_tutor de la tutoría
// CORREGIR: Funciones de verificación de permisos específicos
const esTutorDeEstaTutoria = () => {
  if (!user || !tutoria) return false;
  return isTutor && tutoria.tutor_pertenece_al_usuario === true;
};
// Busca donde tienes las otras funciones de permisos y agrega esta:

// 🔥 NUEVA FUNCIÓN: Permisos para gestionar preguntas
const puedeGestionarPreguntas = () => {
  if (!tutoria) return false;

  if (isAdmin) return true; // Admin puede en cualquier tutoría
  
  if (isGerente) {
    // Gerente solo si la tutoría es de su institución
    return tutoria.gerente_pertenece_a_institucion === true;
  }
  
  if (isTutor) {
    // Tutor solo si está dando esa tutoría
    return tutoria.tutor_pertenece_al_usuario === true;
  }
  
  return false;
};
// 🔥 NUEVAS FUNCIONES: Permisos para VER las secciones
// 🔥 MEJORADO: Funciones de permisos más específicas
const puedeVerActividades = () => {
  if (!tutoria) return false;

  if (isAdmin) return true;
  if (isGerente && tutoria.gerente_pertenece_a_institucion === true) return true;
  if (isTutor && tutoria.tutor_pertenece_al_usuario === true) return true;
  if (isEstudiante && estudianteInscrito) return true;
  
  return false;
};

const puedeVerEvaluaciones = () => {
  if (!tutoria) return false;

  if (isAdmin) return true;
  if (isGerente && tutoria.gerente_pertenece_a_institucion === true) return true;
  if (isTutor && tutoria.tutor_pertenece_al_usuario === true) return true;
  if (isEstudiante && estudianteInscrito) return true;
  
  return false;
};

const puedeVerGestionEstudiantes = () => {
  if (!tutoria) return false;

  // Admin puede ver todo
  if (isAdmin) return true;
  
  // Gerente solo si la tutoría es de su institución
  if (isGerente) {
    return tutoria.gerente_pertenece_a_institucion === true;
  }
  
  // Tutor solo si está dando esa tutoría
  if (isTutor) {
    return tutoria.tutor_pertenece_al_usuario === true;
  }
  
  // Estudiantes NO pueden ver la gestión de estudiantes
  if (isEstudiante) {
    return false;
  }
  
  return false;
};
const gerentePerteneceAInstitucion = () => {
  if (!user || !tutoria) return false;
  return isGerente && tutoria.gerente_pertenece_a_institucion === true;
};

// 🔥 NUEVA FUNCIÓN: Permisos para gestionar actividades
const puedeGestionarActividades = () => {
  if (!tutoria) return false;

  if (isAdmin) return true; // Admin puede en cualquier tutoría
  
  if (isGerente) {
    // Gerente solo si la tutoría es de su institución
    return tutoria.gerente_pertenece_a_institucion === true;
  }
  
  if (isTutor) {
    // Tutor solo si está dando esa tutoría
    return tutoria.tutor_pertenece_al_usuario === true;
  }
  
  return false;
};


  // 🔥 VERSIÓN DEFINITIVA - LOS TUTORES NO PUEDEN GESTIONAR HORARIOS
  const puedeGestionarHorarios = () => {
    console.log('🔍 Verificando permisos de horarios...');
    console.log(' - Rol usuario:', userRole);
    console.log(' - Es tutor?:', isTutor);
    
    // REGLA PRINCIPAL: Los tutores NUNCA pueden gestionar horarios
    if (isTutor) {
      console.log('❌ Tutor detectado - SIN permisos para horarios');
      return false;
    }
    
    // Solo admin y gerente pueden continuar
    if (isAdmin) {
      console.log('✅ Admin - CON permisos para horarios');
      return true;
    }
    
    if (isGerente && gerentePerteneceAInstitucion()) {
      console.log('✅ Gerente de institución - CON permisos para horarios');
      return true;
    }
    
    console.log('❌ Usuario sin permisos para horarios');
    return false;
  };
const puedeVerInscritos = () => {
  if (tutoria?.permisos?.puede_ver_estudiantes !== undefined) {
    return tutoria.permisos.puede_ver_estudiantes;
  }
  return isAdmin || 
         (isGerente && gerentePerteneceAInstitucion()) || 
         (isTutor && esTutorDeEstaTutoria());
};

const puedeInscribirEstudiantes = () => {
  if (tutoria?.permisos?.puede_inscribir_estudiantes !== undefined) {
    return tutoria.permisos.puede_inscribir_estudiantes;
  }
  return isAdmin || 
         (isGerente && gerentePerteneceAInstitucion()) || 
         (isTutor && esTutorDeEstaTutoria());
};

const puedeAprobarInscripciones = () => {
  return isAdmin || 
         (isGerente && gerentePerteneceAInstitucion()) || 
         (isTutor && esTutorDeEstaTutoria());
};

const puedeVerPendientes = () => {
  return isAdmin || 
         (isGerente && gerentePerteneceAInstitucion()) || 
         (isTutor && esTutorDeEstaTutoria());
};

  // Estado para el formulario de asignación
  const [formData, setFormData] = useState({
    id_aula: '',
    dia: '',
    hora_inicio: '',
    hora_fin: ''
  });

  // Estado para el formulario de inscripción
  const [inscripcionData, setInscripcionData] = useState({
    id_estudiante: '',
    estado_inscripcion: 'pendiente'
  });

  const getToken = () => {
    return getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
  };

  // Cargar aulas disponibles - MODIFICADO para filtrar por institución si es gerente
  const cargarAulas = async () => {
    try {
      setLoadingAulas(true);
      const token = getToken();
      
      let url = 'http://localhost:3000/aulas';
      // Si es gerente, cargar solo aulas de su institución
      if (isGerente && tutoria) {
        url = `http://localhost:3000/aulas/institucion/${tutoria.id_institucion}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const aulasData = await response.json();
        setAulas(aulasData);
      }
    } catch (err) {
      console.error('Error cargando aulas:', err);
    } finally {
      setLoadingAulas(false);
    }
  };

  // Cargar estudiantes disponibles para inscripción
  const cargarEstudiantesDisponibles = async () => {
    try {
      setLoadingEstudiantes(true);
      const token = getToken();
      const response = await fetch('http://localhost:3000/usuarios/estudiantes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const estudiantesData = await response.json();
        setEstudiantesDisponibles(estudiantesData);
      }
    } catch (err) {
      console.error('Error cargando estudiantes:', err);
    } finally {
      setLoadingEstudiantes(false);
    }
  };
  // Cargar todos los estudiantes (incluyendo estados)
const cargarEstudiantesCompleto = async () => {
  try {
    const token = getToken();
    const response = await fetch(`http://localhost:3000/inscripciones/tutoria/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const estudiantesData = await response.json();
      setEstudiantesCompleto(estudiantesData);
    }
  } catch (err) {
    console.error('Error cargando estudiantes completos:', err);
  }
};
  // Agrega estas funciones con las otras funciones de carga
  const cargarContadorActividades = async () => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/actividades/tutoria/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const actividadesData = await response.json();
        setContadorActividades(actividadesData.length);
      }
    } catch (err) {
      console.error('Error cargando contador de actividades:', err);
    }
  };
  // Función para cargar evaluaciones
const cargarEvaluaciones = async () => {
  try {
    const token = getToken();
    const response = await fetch(`http://localhost:3000/evaluaciones/tutoria/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const evaluacionesData = await response.json();
      setEvaluaciones(evaluacionesData);
    }
  } catch (err) {
    console.error('Error cargando evaluaciones:', err);
  }
};

  const cargarContadorPreguntas = async () => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/preguntas/tutoria/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const preguntasData = await response.json();
        setContadorPreguntas(preguntasData.length);
      }
    } catch (err) {
      console.error('Error cargando contador de preguntas:', err);
    }
  };

  // Cargar inscripciones pendientes
  const cargarInscripcionesPendientes = async () => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/inscripciones/tutoria/${id}/pendientes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const pendientesData = await response.json();
        setInscripcionesPendientes(pendientesData);
      }
    } catch (err) {
      console.error('Error cargando inscripciones pendientes:', err);
    }
  };

const cargarDetallesTutoria = async () => {
  try {
    setLoading(true);
    const token = getToken();
    
    const tutoriaResponse = await fetch(`http://localhost:3000/tutorias/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!tutoriaResponse.ok) {
      throw new Error('Error al cargar detalles de la tutoría');
    }

    const tutoriaCompleta = await tutoriaResponse.json();

    // 🔥 CORREGIDO: El backend ahora devuelve los estudiantes si el usuario tiene permisos
    // Ya no necesitamos hacer una llamada adicional
    const estudiantes = tutoriaCompleta.estudiantes || [];

    // Obtener asignaciones (visibles para todos)
    let asignaciones = [];
    try {
      const asignacionesResponse = await fetch('http://localhost:3000/asigna', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (asignacionesResponse.ok) {
        const todasLasAsignaciones = await asignacionesResponse.json();
        asignaciones = todasLasAsignaciones.filter(
          asig => asig.id_tutoria === parseInt(id) && asig.activo === true
        );

        // Enriquecer con información del aula
        for (const asignacion of asignaciones) {
          try {
            const aulaResponse = await fetch(`http://localhost:3000/aulas/${asignacion.id_aula}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (aulaResponse.ok) {
              const aulaData = await aulaResponse.json();
              asignacion.aula_lugar = aulaData.lugar;
              asignacion.aula_tipo = aulaData.tipo_aula;
              asignacion.aula_capacidad = aulaData.capacidad;
              asignacion.institucion_nombre = aulaData.institucion_nombre;
            }
          } catch (aulaError) {
            console.warn('No se pudo cargar información del aula:', aulaError);
          }
        }
      }
    } catch (asignacionesError) {
      console.warn('No se pudieron cargar las asignaciones:', asignacionesError);
    }

    const tutoriaConDetalles = {
      ...tutoriaCompleta,
      estudiantes: estudiantes,
      asignaciones: asignaciones,
      cupos_disponibles: tutoriaCompleta.cupo - estudiantes.length,
      inscritos_actuales: estudiantes.length
    };

    setTutoria(tutoriaConDetalles);
  } catch (err) {
    console.error('Error al cargar detalles:', err);
    setError('Error al cargar detalles completos de la tutoría: ' + err.message);
  } finally {
    setLoading(false);
  }
};

  // Crear asignación - MODIFICADO con validación de permisos
  const crearAsignacion = async (formData) => {
    try {
      // Validar permisos específicos
      if (!puedeGestionarHorarios()) {
        setError('No tienes permisos para gestionar horarios de esta tutoría');
        return;
      }

      const token = getToken();
      const asignacionData = {
        ...formData,
        id_tutoria: parseInt(id),
        id_tutor: tutoria.id_tutor
      };

      const response = await fetch('http://localhost:3000/asigna', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(asignacionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear asignación');
      }

      await cargarDetallesTutoria();
      setShowAsignarModal(false);
      resetForm();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Actualizar asignación - MODIFICADO con validación de permisos
  const actualizarAsignacion = async (formData) => {
    try {
      // Validar permisos específicos
      if (!puedeGestionarHorarios()) {
        setError('No tienes permisos para gestionar horarios de esta tutoría');
        return;
      }

      const token = getToken();
      const response = await fetch(
        `http://localhost:3000/asigna/${editingAsignacion.id_aula}/${editingAsignacion.id_tutoria}/${editingAsignacion.id_tutor}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar asignación');
      }

      await cargarDetallesTutoria();
      setShowAsignarModal(false);
      setEditingAsignacion(null);
      resetForm();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Eliminar asignación - MODIFICADO con validación de permisos
  const eliminarAsignacion = async (asignacion) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta asignación?')) {
      return;
    }

    try {
      // Validar permisos específicos
      if (!puedeGestionarHorarios()) {
        setError('No tienes permisos para gestionar horarios de esta tutoría');
        return;
      }

      const token = getToken();
      const response = await fetch(
        `http://localhost:3000/asigna/${asignacion.id_aula}/${asignacion.id_tutoria}/${asignacion.id_tutor}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar asignación');
      }

      await cargarDetallesTutoria();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Inscribir estudiante - MODIFICADO con validación de permisos
  const inscribirEstudiante = async (inscripcionData) => {
    try {
      // Validar permisos específicos
      if (!puedeInscribirEstudiantes()) {
        setError('No tienes permisos para inscribir estudiantes en esta tutoría');
        return;
      }

      const token = getToken();
      const inscripcionCompleta = {
        ...inscripcionData,
        id_tutoria: parseInt(id),
        fecha_inscripcion: new Date().toISOString().split('T')[0]
      };

      const response = await fetch('http://localhost:3000/inscripciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(inscripcionCompleta)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al inscribir estudiante');
      }

      await cargarDetallesTutoria();
      setShowInscribirModal(false);
      setInscripcionData({ id_estudiante: '', estado_inscripcion: 'pendiente' });
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Aprobar inscripción pendiente - MODIFICADO con validación de permisos
  const aprobarInscripcion = async (idInscripcion) => {
    try {
      // Validar permisos específicos
      if (!puedeAprobarInscripciones()) {
        setError('No tienes permisos para aprobar inscripciones');
        return;
      }

      const token = getToken();
      const response = await fetch(`http://localhost:3000/inscripciones/${idInscripcion}/aprobar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al aprobar inscripción');
      }

      await cargarDetallesTutoria();
      await cargarInscripcionesPendientes();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Rechazar inscripción pendiente - MODIFICADO con validación de permisos
  const rechazarInscripcion = async (idInscripcion) => {
    try {
      // Validar permisos específicos
      if (!puedeAprobarInscripciones()) {
        setError('No tienes permisos para rechazar inscripciones');
        return;
      }

      const token = getToken();
      const response = await fetch(`http://localhost:3000/inscripciones/${idInscripcion}/rechazar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al rechazar inscripción');
      }

      await cargarInscripcionesPendientes();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      id_aula: '',
      dia: '',
      hora_inicio: '',
      hora_fin: ''
    });
  };

  const abrirModalAsignar = () => {
    // Validar permisos antes de abrir el modal
    if (!puedeGestionarHorarios()) {
      setError('No tienes permisos para gestionar horarios de esta tutoría');
      return;
    }
    cargarAulas();
    setShowAsignarModal(true);
    setEditingAsignacion(null);
    resetForm();
  };

  const abrirModalInscribir = () => {
    // Validar permisos antes de abrir el modal
    if (!puedeInscribirEstudiantes()) {
      setError('No tienes permisos para inscribir estudiantes en esta tutoría');
      return;
    }
    cargarEstudiantesDisponibles();
    setShowInscribirModal(true);
  };
// 🔥 CORREGIR: Usa SOLO UNA opción - ELIMINA las otras
const abrirModalCrearActividad = () => {
  if (!puedeGestionarActividades()) {
    setError('No tienes permisos para crear actividades en esta tutoría');
    return;
  }
  
  // SOLO esta línea - elimina las otras opciones
  setShowActividadModal(true);
};
  const abrirModalEditar = (asignacion) => {
    // Validar permisos antes de abrir el modal
    if (!puedeGestionarHorarios()) {
      setError('No tienes permisos para gestionar horarios de esta tutoría');
      return;
    }
    setEditingAsignacion(asignacion);
    setFormData({
      id_aula: asignacion.id_aula,
      dia: asignacion.dia,
      hora_inicio: asignacion.hora_inicio,
      hora_fin: asignacion.hora_fin
    });
    cargarAulas();
    setShowAsignarModal(true);
  };

  const handleSubmitAsignacion = (e) => {
    e.preventDefault();
    if (editingAsignacion) {
      actualizarAsignacion(formData);
    } else {
      crearAsignacion(formData);
    }
  };

  const handleSubmitInscripcion = (e) => {
    e.preventDefault();
    inscribirEstudiante(inscripcionData);
  };
  // 🔥 FUNCIÓN PARA VERIFICAR ESTUDIANTES INSCRITOS
const verificarEstudiantesInscritos = async () => {
  try {
    setLoadingEstudiantesInscritos(true);
    const token = getToken();
    
    console.log(`🔄 Verificando estudiantes inscritos para tutoría ${id}...`);
    
    const response = await fetch(`http://localhost:3000/inscripciones/tutoria/${id}/completo`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${data.length} estudiantes inscritos encontrados`);
      
      // Filtrar solo los estudiantes inscritos
      const inscritos = data.filter(est => est.estado_solicitud === "inscrito");
      setEstudiantesInscritos(inscritos);
      
      return inscritos;
    } else {
      // Fallback a la versión básica si falla
      await verificarEstudiantesInscritosBasico();
    }
  } catch (err) {
    console.error('❌ Error verificando estudiantes inscritos:', err);
    await verificarEstudiantesInscritosBasico();
  } finally {
    setLoadingEstudiantesInscritos(false);
  }
};

// Función fallback para verificación básica
const verificarEstudiantesInscritosBasico = async () => {
  try {
    const token = getToken();
    const response = await fetch(`http://localhost:3000/inscripciones/tutoria/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const dataNormal = await response.json();
      const inscritos = dataNormal.filter(est => est.estado_solicitud === "inscrito");
      console.log(`🔄 Cargados ${inscritos.length} estudiantes inscritos (básico)`);
      setEstudiantesInscritos(inscritos);
    } else {
      throw new Error('No se pudieron verificar los estudiantes inscritos');
    }
  } catch (err) {
    console.error('❌ Error en verificación básica:', err);
    setEstudiantesInscritos([]);
  }
};

  // Agrega esta función con las otras funciones de carga
// 🔥 CORREGIDO: Función simplificada que solo usa el endpoint de verificación
// 🔥 CORREGIDO: Usa el endpoint existente /verificar-inscripcion
const verificarInscripcionEstudiante = async () => {
  if (!isEstudiante || !id) {
    console.log('❌ No es estudiante o falta ID de tutoría');
    setEstudianteInscrito(false);
    return;
  }
  
  try {
    const token = getToken();
    console.log(`🔍 Verificando inscripción estudiante para tutoría ${id}...`);

    // 🔥 CAMBIA ESTA LÍNEA: usa el endpoint existente
    const response = await fetch(`http://localhost:3000/inscripciones/verificar-inscripcion/${id}`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Respuesta de verificación:', data);
      // El endpoint actual devuelve 'inscrito' y 'aprobado'
      setEstudianteInscrito(data.inscrito || false);
    } else {
      const errorData = await response.json();
      console.error('❌ Error en la respuesta:', errorData);
      setEstudianteInscrito(false);
    }
  } catch (err) {
    console.error('❌ Error en verificación:', err);
    setEstudianteInscrito(false);
  }
};
// 🔥 NUEVA: Función de fallback para verificar en lista de estudiantes
const verificarInListaEstudiantes = async () => {
  try {
    const token = getToken();
    const response = await fetch(`http://localhost:3000/tutorias/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      const tutoriaData = await response.json();
      const estudiantes = tutoriaData.estudiantes || [];
      
      // Buscar por ID de usuario o email
      const estudianteEncontrado = estudiantes.find(est => 
        est.id_usuario === user.id_usuario || est.email === user.email
      );
      
      console.log('🔍 Estudiante encontrado en lista:', estudianteEncontrado);
      setEstudianteInscrito(!!estudianteEncontrado);
    } else {
      setEstudianteInscrito(false);
    }
  } catch (err) {
    console.error('Error en verificación fallback:', err);
    setEstudianteInscrito(false);
  }
};
useEffect(() => {
  if (id) {
    cargarDetallesTutoria();
    if (puedeVerPendientes()) {
      cargarInscripcionesPendientes();
      cargarEstudiantesCompleto();
    }
    
    cargarContadorActividades();
    cargarContadorPreguntas();
    cargarEvaluaciones();
    
    if (puedeVerGestionEstudiantes()) {
      verificarEstudiantesInscritos();
    }
  }
}, [id]);

// 🔥 NUEVO: Efecto específico para verificar cuando la tutoría esté cargada
useEffect(() => {
  if (tutoria && isEstudiante) {
    console.log('🎓 Tutoría cargada, verificando inscripción del estudiante...');
    verificarInscripcionEstudiante();
  }
}, [tutoria, isEstudiante]);
// 🔥 NUEVO: Debug del estado de inscripción
useEffect(() => {
  console.log('🔄 Estado de estudianteInscrito actualizado:', estudianteInscrito);
  console.log('🔍 Puede ver actividades:', puedeVerActividades());
  console.log('🔍 Puede ver evaluaciones:', puedeVerEvaluaciones());
}, [estudianteInscrito]);

  // Recargar aulas cuando cambie la tutoría (para gerentes)
  useEffect(() => {
    if (tutoria && isGerente) {
      cargarAulas();
    }
  }, [tutoria, isGerente]);

  // Agrega esto después de cargar la tutoría para ver qué está pasando
useEffect(() => {
  if (tutoria) {
    console.log('🔍 DEPURACIÓN DE PERMISOS:');
    console.log('User Role:', userRole);
    console.log('isAdmin:', isAdmin);
    console.log('isGerente:', isGerente);
    console.log('isTutor:', isTutor);
    console.log('isEstudiante:', isEstudiante);
    console.log('puedeGestionarHorarios():', puedeGestionarHorarios());
    console.log('tutoria.permisos:', tutoria.permisos);
    console.log('gerentePerteneceAInstitucion():', gerentePerteneceAInstitucion());
  }
}, [tutoria]);

  const getIniciales = (nombre) => {
    if (!nombre) return 'TU';
    const palabras = nombre.split(' ').filter(word => word.trim() !== '');
    if (palabras.length >= 2) {
      return (palabras[0].charAt(0) + palabras[1].charAt(0)).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  };

  const getColorLogo = (nombre) => {
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-green-500 to-green-600',
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-red-500 to-red-600',
      'bg-gradient-to-br from-yellow-500 to-yellow-600',
    ];
    if (!nombre) return colors[0];
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
      hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Modal para asignar/editar aula - MEJORADO con información de permisos
// Modal para asignar/editar aula - MEJORADO con validación de disponibilidad
// Modal para asignar/editar aula - ACTUALIZADO con nueva información de permisos
const AsignarAulaModal = () => {
  const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false);
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);

  const verificarDisponibilidad = async () => {
    if (!formData.id_aula || !formData.dia || !formData.hora_inicio || !formData.hora_fin) {
      return;
    }

    try {
      setVerificandoDisponibilidad(true);
      const token = getToken();
      
      const response = await fetch(
        `http://localhost:3000/asigna/disponibilidad?id_aula=${formData.id_aula}&dia=${formData.dia}&hora_inicio=${formData.hora_inicio}&hora_fin=${formData.hora_fin}&id_tutoria=${id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDisponibilidad(data);
      }
    } catch (error) {
      console.error('Error verificando disponibilidad:', error);
    } finally {
      setVerificandoDisponibilidad(false);
    }
  };

  const cargarHorariosDisponibles = async (aulaId, dia) => {
    if (!aulaId || !dia) return;
    
    try {
      const token = getToken();
      const response = await fetch(
        `http://localhost:3000/asigna/horarios-disponibles/${aulaId}?dia=${dia}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHorariosDisponibles(data);
      }
    } catch (error) {
      console.error('Error cargando horarios disponibles:', error);
    }
  };

  // Verificar disponibilidad cuando cambien los campos relevantes
  useEffect(() => {
    if (formData.id_aula && formData.dia && formData.hora_inicio && formData.hora_fin) {
      const timer = setTimeout(() => {
        verificarDisponibilidad();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [formData.id_aula, formData.dia, formData.hora_inicio, formData.hora_fin]);

  // Cargar horarios disponibles cuando cambie el aula o día
  useEffect(() => {
    if (formData.id_aula && formData.dia) {
      cargarHorariosDisponibles(formData.id_aula, formData.dia);
    }
  }, [formData.id_aula, formData.dia]);

  if (!showAsignarModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editingAsignacion ? 'Editar Asignación' : 'Asignar Aula'}
          </h2>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {/* 🔥 ACTUALIZADO: Información de permisos */}
              {isAdmin && <p>🔧 Modificando horarios como administrador</p>}
              {isGerente && gerentePerteneceAInstitucion() && (
                <p>🏢 Gestionando horarios para tutoría de tu institución</p>
              )}
            {/* 🔥 ELIMINADO: Mensaje para tutores */}
          </div>
        </div>
        
        <form onSubmit={handleSubmitAsignacion} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Aula *
            </label>
            <select
              required
              value={formData.id_aula}
              onChange={(e) => setFormData({...formData, id_aula: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Seleccionar aula</option>
              {loadingAulas ? (
                <option value="" disabled>Cargando aulas...</option>
              ) : aulas.map((aula) => (
                <option key={aula.id_aula} value={aula.id_aula}>
                  {aula.lugar} - {aula.tipo_aula} (Capacidad: {aula.capacidad}) - {aula.institucion_nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Día de la semana *
            </label>
            <select
              required
              value={formData.dia}
              onChange={(e) => setFormData({...formData, dia: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Seleccionar día</option>
              <option value="Lunes">Lunes</option>
              <option value="Martes">Martes</option>
              <option value="Miércoles">Miércoles</option>
              <option value="Jueves">Jueves</option>
              <option value="Viernes">Viernes</option>
              <option value="Sábado">Sábado</option>
              <option value="Domingo">Domingo</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora inicio *
              </label>
              <input
                type="time"
                required
                value={formData.hora_inicio}
                onChange={(e) => setFormData({...formData, hora_inicio: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hora fin *
              </label>
              <input
                type="time"
                required
                value={formData.hora_fin}
                onChange={(e) => setFormData({...formData, hora_fin: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Indicador de disponibilidad */}
          {disponibilidad && (
            <div className={`p-3 rounded-lg ${
              disponibilidad.disponible 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center">
                {verificandoDisponibilidad ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                ) : disponibilidad.disponible ? (
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className={`text-sm font-medium ${
                  disponibilidad.disponible ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                }`}>
                  {disponibilidad.disponible 
                    ? 'Aula disponible en el horario seleccionado' 
                    : 'Aula no disponible - Existen conflictos de horario'
                  }
                </span>
              </div>
            </div>
          )}

          {/* Horarios disponibles sugeridos */}
          {horariosDisponibles.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                Horarios disponibles sugeridos:
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {horariosDisponibles.map((horario, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      hora_inicio: horario.hora_inicio,
                      hora_fin: horario.hora_fin
                    })}
                    className="w-full text-left px-2 py-1 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800 rounded"
                  >
                    {horario.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowAsignarModal(false);
                setEditingAsignacion(null);
                resetForm();
                setDisponibilidad(null);
                setHorariosDisponibles([]);
              }}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!disponibilidad?.disponible && !editingAsignacion}
              className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingAsignacion ? 'Actualizar' : 'Asignar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

  // Modal para inscribir estudiante - MEJORADO con información de permisos
  const InscribirEstudianteModal = () => {
    if (!showInscribirModal) return null;

    return (
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Inscribir Estudiante
            </h2>
            {/* Información de permisos */}
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {isTutor && (
                <p>💡 Inscribiendo estudiante en tu tutoría</p>
              )}
              {isGerente && (
                <p>💡 Inscribiendo estudiante en tutoría de tu institución</p>
              )}
              {isAdmin && (
                <p>💡 Inscribiendo estudiante como administrador</p>
              )}
            </div>
          </div>
          
          <form onSubmit={handleSubmitInscripcion} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estudiante *
              </label>
              <select
                required
                value={inscripcionData.id_estudiante}
                onChange={(e) => setInscripcionData({...inscripcionData, id_estudiante: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Seleccionar estudiante</option>
                {loadingEstudiantes ? (
                  <option value="" disabled>Cargando estudiantes...</option>
                ) : estudiantesDisponibles.map((estudiante) => (
                  <option key={estudiante.id_usuario} value={estudiante.id_usuario}>
                    {estudiante.nombre} {estudiante.apellido_paterno} {estudiante.apellido_materno} - {estudiante.email}
                  </option>
                ))}
              </select>
            </div>
// En tu return, agrega esto temporalmente para debugging
{isEstudiante && (
  <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
    <div className="flex items-center">
      <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <div>
        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
          Estado de inscripción: {estudianteInscrito ? '✅ Inscrito' : '❌ No inscrito'}
        </p>
        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
          ID Tutoría: {id} | Rol: Estudiante
        </p>
      </div>
    </div>
  </div>
)}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado de Inscripción
              </label>
              <select
                value={inscripcionData.estado_inscripcion}
                onChange={(e) => setInscripcionData({...inscripcionData, estado_inscripcion: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="pendiente">Pendiente</option>
                <option value="aprobada">Aprobada</option>
                <option value="rechazada">Rechazada</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowInscribirModal(false);
                  setInscripcionData({ id_estudiante: '', estado_inscripcion: 'pendiente' });
                }}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              >
                Inscribir
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  // Componente para secciones colapsables
// Componente para secciones colapsables
const CollapsibleSection = ({ title, count, icon, color, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const colorClasses = {
    blue: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800',
    purple: 'from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-100 dark:border-purple-800',
    green: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-100 dark:border-green-800',
    orange: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-100 dark:border-orange-800'
  };

  const iconColors = {
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    green: 'text-green-500',
    orange: 'text-orange-500'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl border shadow-sm overflow-hidden`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex justify-between items-center hover:bg-white/50 dark:hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm ${iconColors[color]}`}>
            {icon}
          </div>
          <div className="text-left">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            {count !== undefined && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {count} {count === 1 ? 'elemento' : 'elementos'}
              </span>
            )}
          </div>
        </div>
        <svg 
          className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="px-6 pb-6">
          {children}
        </div>
      )}
    </div>
  );
};
// Agrega este modal después de los otros modales
const ActividadModal = () => {
  if (!showActividadModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Gestión de Actividades
            </h2>
            <button
              onClick={() => setShowActividadModal(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <Actividad />
        </div>
      </div>
    </div>
  );
};
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !tutoria) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                  Error al cargar los detalles
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                  {error}
                </p>
                <button 
                  onClick={() => navigate('/dashboard/tutorias')}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Volver a Tutorías
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tutoria) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Tutoría no encontrada
            </h1>
            <button 
              onClick={() => navigate('/dashboard/tutorias')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver a Tutorías
            </button>
          </div>
        </div>
      </div>
    );
  }
  const mostrarSeccionActividades = () => {
    if (!tutoria) return false;
    return puedeVerActividades();
  };

  const mostrarSeccionEvaluaciones = () => {
    if (!tutoria) return false;
    return puedeVerEvaluaciones();
  };

  const mostrarSeccionGestionEstudiantes = () => {
    if (!tutoria) return false;
    return puedeVerGestionEstudiantes();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header con portada */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            onClick={() => navigate('/dashboard/tutorias')}
            className="flex items-center space-x-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Volver a Tutorías</span>
          </button>
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Logo de la tutoría */}
            <div className={`flex-shrink-0 w-24 h-24 rounded-2xl ${getColorLogo(tutoria.nombre_tutoria)} flex items-center justify-center text-white font-bold text-2xl shadow-2xl`}>
              {getIniciales(tutoria.nombre_tutoria)}
            </div>
            
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{tutoria.nombre_tutoria}</h1>
              <p className="text-xl text-indigo-100 mb-4">{tutoria.sigla}</p>
              <div className="flex flex-wrap gap-3">
                <Badge color={tutoria.activo ? "green" : "red"}>
                  {tutoria.activo ? "Activa" : "Inactiva"}
                </Badge>
                <Badge color="blue">
                  {tutoria.inscritos_actuales || 0}/{tutoria.cupo} Estudiantes
                </Badge>
                <Badge color="purple">
                  {tutoria.institucion_nombre}
                </Badge>
                {/* Indicador de permisos */}
                {esTutorDeEstaTutoria() && (
                  <Badge color="yellow">
                    Tu Tutoría
                  </Badge>
                )}
                {gerentePerteneceAInstitucion() && (
                  <Badge color="orange">
                    Tu Institución
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {/* Mensaje de error */}
  {error && (
    <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            {error}
          </p>
        </div>
      </div>
    </div>
  )}

  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
    {/* Columna principal - Ocupa 3/4 */}
    <div className="lg:col-span-3 space-y-6">
      {/* Header Información Básica */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Información del Tutor */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Información del Tutor</h2>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {getIniciales(tutoria.tutor_nombre)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {tutoria.tutor_nombre} {tutoria.tutor_apellido_paterno} {tutoria.tutor_apellido_materno}
                  </h3>
                  <p className="text-blue-600 dark:text-blue-400 font-medium">{tutoria.tutor_especialidad}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{tutoria.tutor_email}</p>
                </div>
              </div>
            </div>
            
            {/* Información Rápida */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Resumen</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{tutoria.inscritos_actuales || 0}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Inscritos</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{tutoria.cupos_disponibles || tutoria.cupo}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Disponibles</p>
                </div>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Descripción del Curso</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {tutoria.descripcion_tutoria || 'Esta tutoría no tiene descripción disponible.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Secciones Colapsables */}
      <div className="space-y-4">
        {/* Horarios y Aulas - Sección Colapsable */}
        <CollapsibleSection 
          title="Horarios y Aulas" 
          count={tutoria.asignaciones ? tutoria.asignaciones.length : 0}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="blue"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gestión de Horarios
            </h3>
          {/* En la sección de Horarios y Aulas */}
          {puedeGestionarHorarios() && (
            <button
              onClick={abrirModalAsignar}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Nuevo Horario</span>
            </button>
          )}
          </div>
          
          {tutoria.asignaciones && tutoria.asignaciones.length > 0 ? (
            <div className="grid gap-3">
              {tutoria.asignaciones.map((asignacion) => (
                <div 
                  key={`${asignacion.id_aula}-${asignacion.id_tutoria}-${asignacion.id_tutor}`} 
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {asignacion.aula_lugar} - {asignacion.aula_tipo}
                        </h4>
                        <Badge color="blue" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          Cap: {asignacion.aula_capacidad}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{asignacion.dia}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{asignacion.hora_inicio} - {asignacion.hora_fin}</span>
                        </span>
                      </div>
                    </div>
                    {puedeGestionarHorarios() && (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => abrirModalEditar(asignacion)}
                          className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          title="Editar horario"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => eliminarAsignacion(asignacion)}
                          className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                          title="Eliminar horario"
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
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-4">No hay horarios asignados para esta tutoría</p>
              {puedeGestionarHorarios() && (
                <button
                  onClick={abrirModalAsignar}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                >
                  Asignar Primer Horario
                </button>
              )}
            </div>
          )}
        </CollapsibleSection>

        {/* Actividades - Sección Colapsable */}
              {/* Actividades y Tareas - VISIBLE SEGÚN PERMISOS */}
              {mostrarSeccionActividades() && (
                <CollapsibleSection 
                  title="Actividades y Tareas" 
                  count={contadorActividades}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  color="purple"
                >
                  <Actividad />
                </CollapsibleSection>
              )}


        {/* Preguntas - Sección Colapsable */}
              {mostrarSeccionEvaluaciones() && (
                <CollapsibleSection 
                  title="Evaluaciones y Preguntas" 
                  count={evaluaciones.length}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  color="green"
                >
                  <div id="evaluaciones-section">
                    <Evaluaciones />
                  </div>
                </CollapsibleSection>
              )}

        {/* Estudiantes Inscritos - Sección Colapsable */}
{/* Estudiantes Inscritos - Sección Colapsable */}
{/* Gestión de Estudiantes - Sección Colapsable */}
              {mostrarSeccionGestionEstudiantes() && (
                <CollapsibleSection 
                  title="Gestión de Estudiantes" 
                  count={estudiantesCompleto.length}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  }
                  color="orange"
                >
                  {puedeVerInscritos() ? (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Gestión Completa de Estudiantes
                        </h3>
                      </div>
                      
                      <TablaEstudiantes 
                        tutoriaId={id}
                        puedeAprobarInscripciones={puedeAprobarInscripciones()}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-white mb-2">Información restringida</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Solo el tutor asignado y administradores pueden ver la lista de estudiantes
                      </p>
                    </div>
                  )}
                </CollapsibleSection>
              )}
      </div>
    </div>

    {/* Sidebar de Acciones - Ocupa 1/4 */}
    <div className="lg:col-span-1">
      <div className="sticky top-8 space-y-6">
        {/* Panel de Acciones */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Acciones Rápidas</span>
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard/tutorias')}
              className="w-full px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 transition-all flex items-center space-x-3 shadow-sm"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Volver a Tutorías</span>
            </button>
            
            
            {/* Solo mostrar el botón de Gestionar Horarios a quienes tengan permiso */}
            {puedeGestionarHorarios() && (
              <button 
                onClick={abrirModalAsignar}
                className="w-full px-4 py-3 text-sm bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 rounded-xl transition-all flex items-center space-x-3 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Gestionar Horarios</span>
              </button>
            )}
            
            {puedeGestionarActividades() && (
              <button 
                onClick={abrirModalCrearActividad}
                className="w-full px-4 py-3 text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 rounded-xl transition-all flex items-center space-x-3 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Asignar Tareas</span>
              </button>
            )}

            {/* NUEVO: Botón para Gestionar Preguntas */}
            {puedeGestionarPreguntas() && (
              <button 
                onClick={() => {
                  // Aquí puedes agregar la lógica para abrir el modal de preguntas
                  // o navegar a la sección de preguntas
                  const preguntasSection = document.getElementById('preguntas-section');
                  if (preguntasSection) {
                    preguntasSection.scrollIntoView({ behavior: 'smooth' });
                    // También puedes abrir la sección colapsable si está cerrada
                    const collapsibleSection = preguntasSection.closest('.bg-gradient-to-br');
                    const button = collapsibleSection?.querySelector('button');
                    if (button && !collapsibleSection.querySelector('.px-6.pb-6')) {
                      button.click();
                    }
                  }
                }}
                className="w-full px-4 py-3 text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 rounded-xl transition-all flex items-center space-x-3 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Gestionar Preguntas</span>
              </button>
            )}
          </div>
        </div>

        {/* Estado de la Tutoría */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Estado</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Estado</span>
              <Badge color={tutoria.activo ? "green" : "red"} className="text-xs">
                {tutoria.activo ? "Activa" : "Inactiva"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Cupo Total</span>
              <span className="font-semibold text-gray-900 dark:text-white">{tutoria.cupo}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Inscritos</span>
              <span className="font-semibold text-gray-900 dark:text-white">{tutoria.inscritos_actuales || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Disponibles</span>
              <span className={`font-semibold ${(tutoria.cupos_disponibles || tutoria.cupo) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {tutoria.cupos_disponibles || tutoria.cupo}
              </span>
            </div>
          </div>
        </div>

        {/* NUEVO: Panel de Estadísticas Rápidas */}
        {/* Panel de Estadísticas Rápidas */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Estadísticas</span>
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {tutoria.asignaciones ? tutoria.asignaciones.length : 0}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Horarios</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {tutoria.estudiantes ? tutoria.estudiantes.length : 0}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Estudiantes</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {contadorActividades}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Actividades</p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {contadorPreguntas}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Preguntas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Modales */}
      <AsignarAulaModal />
      <InscribirEstudianteModal />
      <ActividadModal/>
    </div>
  );
};

export default TutoriaDetalles;