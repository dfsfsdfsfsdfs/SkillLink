import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Hero from "../Hero/Hero";

// Iconos SVG como componentes React
const ChevronLeftIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeCloseIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

// Loader Component
const Loader = () => {
  return (
    <div className="flex justify-center items-center space-x-1">
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          className="w-2 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full animate-bounce"
          style={{
            animationDelay: `${index * 0.1}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
};

export default function SignUpForm({ onClose }) {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [instituciones, setInstituciones] = useState([]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Datos básicos del usuario
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    id_rol: '4', // Por defecto estudiante
    
    // Datos específicos por rol
    // Para estudiante
    nombre: '',
    paterno: '',
    materno: '',
    celular: '',
    carrera: '',
    univer_institu: '',
    
    // Para tutor
    apellido_paterno: '',
    apellido_materno: '',
    especialidad: '',
    nivel_academico: '',
    
    // Para institución
    nombre_institucion: '',
    direccion: '',
    telefono: '',
    tipo_institucion: 'Universidad Pública',
    horario_atencion: '08:00-18:00'
  });

  // Cargar instituciones para estudiantes
  useEffect(() => {
    fetchInstituciones();
  }, []);

  const fetchInstituciones = async () => {
    try {
      // CORREGIDO: Quitar /api/ de la URL
      const response = await fetch('http://localhost:3000/instituciones');
      if (response.ok) {
        const data = await response.json();
        setInstituciones(data || []);
      } else {
        console.error('Error cargando instituciones:', response.status);
      }
    } catch (error) {
      console.error('Error cargando instituciones:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setMessage('');
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  const handleSignIn = () => {
    navigate('/signin');
  };

  // Función para validar campos según el rol
  const validateForm = () => {
    // Validaciones básicas para todos los roles
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setMessage('❌ Todos los campos básicos son requeridos');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('❌ Las contraseñas no coinciden');
      return false;
    }

    if (formData.password.length < 6) {
      setMessage('❌ La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (!isChecked) {
      setMessage('❌ Debes aceptar los términos y condiciones');
      return false;
    }

    // Validaciones específicas por rol
    const rol = parseInt(formData.id_rol);
    
    if (rol === 4) { // Estudiante
      if (!formData.nombre || !formData.paterno || !formData.celular || !formData.carrera || !formData.univer_institu) {
        setMessage('❌ Todos los campos de estudiante son requeridos');
        return false;
      }
    } else if (rol === 3) { // Tutor
      if (!formData.nombre || !formData.apellido_paterno || !formData.celular || !formData.especialidad || !formData.nivel_academico) {
        setMessage('❌ Todos los campos de tutor son requeridos');
        return false;
      }
    } else if (rol === 2) { // Gerente (Institución)
      if (!formData.nombre_institucion || !formData.direccion || !formData.telefono) {
        setMessage('❌ Todos los campos de institución son requeridos');
        return false;
      }
    }

    return true;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  setLoading(true);
  setMessage('');

  try {
    // Preparar datos específicos según el rol
    const datosEnvio = {
      username: formData.username,
      password: formData.password,
      email: formData.email,
      id_rol: parseInt(formData.id_rol),
    };

    // Agregar campos específicos según el rol
    const rol = parseInt(formData.id_rol);
    if (rol === 4) { // Estudiante
      datosEnvio.nombre = formData.nombre;
      datosEnvio.paterno = formData.paterno;
      datosEnvio.materno = formData.materno;
      datosEnvio.celular = formData.celular;
      datosEnvio.carrera = formData.carrera;
      datosEnvio.univer_institu = formData.univer_institu;
    } else if (rol === 3) { // Tutor
      datosEnvio.nombre = formData.nombre;
      datosEnvio.apellido_paterno = formData.apellido_paterno;
      datosEnvio.apellido_materno = formData.apellido_materno;
      datosEnvio.celular = formData.celular;
      datosEnvio.especialidad = formData.especialidad;
      datosEnvio.nivel_academico = formData.nivel_academico;
    } else if (rol === 2) { // Gerente
      datosEnvio.nombre_institucion = formData.nombre_institucion;
      datosEnvio.direccion = formData.direccion;
      datosEnvio.telefono = formData.telefono;
      datosEnvio.tipo_institucion = formData.tipo_institucion;
      datosEnvio.horario_atencion = formData.horario_atencion;
    }

    console.log('📤 Enviando datos al backend:', datosEnvio);

    // CORREGIDO: Mejor debug de la respuesta
    const response = await fetch('http://localhost:3000/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datosEnvio),
    });

    console.log('📥 Status de respuesta:', response.status);
    console.log('📥 Headers de respuesta:', response.headers);

    // Obtener el texto de la respuesta primero
    const responseText = await response.text();
    console.log('📥 Texto de respuesta:', responseText);

    let data;
    try {
      // Intentar parsear como JSON
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Error parseando JSON:', parseError);
      console.error('📥 Respuesta recibida (texto):', responseText);
      
      // Si no es JSON, mostrar el error HTML o texto que viene del servidor
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        throw new Error('El servidor devolvió una página HTML en lugar de JSON. Revisa el backend.');
      } else {
        throw new Error(`Error del servidor: ${responseText.substring(0, 100)}...`);
      }
    }

    if (!response.ok) {
      throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
    }

    console.log('✅ Respuesta del backend:', data);

    // Mensaje personalizado según el tipo de usuario y estado de aprobación
    let mensajeExito = data.mensaje || 'Registro exitoso';
    
    setMessage(`✅ ${mensajeExito}`);
    
    // Redirigir al login después de 2 segundos si el usuario está activo
    if (data.usuario && data.usuario.activo) {
      setTimeout(() => {
        navigate('/signin');
      }, 2000);
    } else {
      // Si requiere aprobación, mostrar mensaje y opción para ir al inicio
      setTimeout(() => {
        setMessage(prev => prev + ' Serás redirigido al inicio...');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }, 3000);
    }

  } catch (error) {
    console.error('❌ Error completo en registro:', error);
    setMessage('❌ ' + error.message);
  } finally {
    setLoading(false);
  }
};

  // Renderizar campos específicos según el rol
  const renderRoleSpecificFields = () => {
    const rol = parseInt(formData.id_rol);
    
    switch (rol) {
      case 4: // Estudiante
        return (
          <div className="space-y-5 border-t border-gray-200 dark:border-gray-700 pt-5">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Información del Estudiante</h3>
            <p className="text-sm text-green-600 dark:text-green-400">
              🎓 Los estudiantes pueden iniciar sesión inmediatamente después del registro.
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Apellido Paterno <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="paterno"
                  value={formData.paterno}
                  onChange={handleChange}
                  placeholder="Apellido paterno"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Apellido Materno
                </label>
                <input
                  type="text"
                  name="materno"
                  value={formData.materno}
                  onChange={handleChange}
                  placeholder="Apellido materno"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Celular <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="celular"
                  value={formData.celular}
                  onChange={handleChange}
                  placeholder="Número de celular"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Carrera <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="carrera"
                  value={formData.carrera}
                  onChange={handleChange}
                  placeholder="Tu carrera"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Universidad/Institución <span className="text-red-500">*</span>
                </label>
                <select
                  name="univer_institu"
                  value={formData.univer_institu}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona una institución</option>
                  {instituciones.map(inst => (
                    <option key={inst.id_institucion} value={inst.nombre}>
                      {inst.nombre}
                    </option>
                  ))}
                  <option value="Otra">Otra institución</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3: // Tutor
        return (
          <div className="space-y-5 border-t border-gray-200 dark:border-gray-700 pt-5">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Información del Tutor</h3>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              👨‍🏫 Los tutores requieren aprobación del administrador antes de poder iniciar sesión.
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Apellido Paterno <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="apellido_paterno"
                  value={formData.apellido_paterno}
                  onChange={handleChange}
                  placeholder="Apellido paterno"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Apellido Materno
                </label>
                <input
                  type="text"
                  name="apellido_materno"
                  value={formData.apellido_materno}
                  onChange={handleChange}
                  placeholder="Apellido materno"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Celular <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="celular"
                  value={formData.celular}
                  onChange={handleChange}
                  placeholder="Número de celular"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Especialidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="especialidad"
                  value={formData.especialidad}
                  onChange={handleChange}
                  placeholder="Tu especialidad"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Nivel Académico <span className="text-red-500">*</span>
                </label>
                <select
                  name="nivel_academico"
                  value={formData.nivel_academico}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona nivel académico</option>
                  <option value="Bachiller">Bachiller</option>
                  <option value="Licenciado">Licenciado</option>
                  <option value="Magister">Magister</option>
                  <option value="Doctor">Doctor</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2: // Gerente (Institución)
        return (
          <div className="space-y-5 border-t border-gray-200 dark:border-gray-700 pt-5">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Información de la Institución</h3>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              🏢 Los gerentes de institución requieren aprobación del administrador antes de poder iniciar sesión.
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Nombre de la Institución <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre_institucion"
                  value={formData.nombre_institucion}
                  onChange={handleChange}
                  placeholder="Nombre de la institución"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Dirección <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Dirección completa"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="Número de teléfono"
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Tipo de Institución <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipo_institucion"
                  value={formData.tipo_institucion}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Universidad Pública">Universidad Pública</option>
                  <option value="Universidad Privada">Universidad Privada</option>
                  <option value="Instituto Técnico">Instituto Técnico</option>
                  <option value="Colegio">Colegio</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Horario de Atención
                </label>
                <input
                  type="text"
                  name="horario_atencion"
                  value={formData.horario_atencion}
                  onChange={handleChange}
                  placeholder="Ej: 08:00-18:00"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case 1: // Administrador (sin campos adicionales)
        return (
          <div className="space-y-5 border-t border-gray-200 dark:border-gray-700 pt-5">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Información de Administrador</h3>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              👑 Los administradores requieren aprobación (excepto el primer administrador del sistema).
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Como administrador, tendrás acceso completo al sistema. Los permisos adicionales serán asignados manualmente.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Lado izquierdo - Formulario de Registro */}
      <div className="flex flex-col flex-1 w-full lg:w-1/2 bg-white dark:bg-gray-900 overflow-y-auto">
        <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon className="size-5" />
            Back to Home
          </button>
        </div>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Sign Up
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create your account to get started!
              </p>
            </div>
            <div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
                <button 
                  type="button"
                  className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
                      fill="#EB4335"
                    />
                  </svg>
                  Sign up with Google
                </button>
                <button 
                  type="button"
                  className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
                >
                  <svg
                    width="21"
                    className="fill-current"
                    height="20"
                    viewBox="0 0 21 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M15.6705 1.875H18.4272L12.4047 8.75833L19.4897 18.125H13.9422L9.59717 12.4442L4.62554 18.125H1.86721L8.30887 10.7625L1.51221 1.875H7.20054L11.128 7.0675L15.6705 1.875ZM14.703 16.475H16.2305L6.37054 3.43833H4.73137L14.703 16.475Z" />
                  </svg>
                  Sign up with X
                </button>
              </div>
              <div className="relative py-3 sm:py-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                    Or
                  </span>
                </div>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  {/* Campos básicos para todos los roles */}
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                        Tipo de Usuario <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="id_rol"
                        value={formData.id_rol}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="4">🎓 Estudiante (Acceso inmediato)</option>
                        <option value="3">👨‍🏫 Tutor/Docente (Requiere aprobación)</option>
                        <option value="2">🏢 Gerente de Institución (Requiere aprobación)</option>
                        <option value="1">👑 Administrador (Requiere aprobación)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter your username"
                      required
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        minLength="6"
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <EyeCloseIcon className="size-5" />
                        ) : (
                          <EyeIcon className="size-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      required
                      minLength="6"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Campos específicos por rol */}
                  {renderRoleSpecificFields()}

                  {/* Mensajes de éxito/error */}
                  {message && (
                    <div className={`p-3 rounded-lg text-center ${
                      message.includes('❌') ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-green-100 text-green-700 border border-green-300'
                    }`}>
                      {message}
                    </div>
                  )}

                  {/* Checkbox */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => setIsChecked(e.target.checked)}
                      className="w-4 h-4 mt-1 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <p className="text-sm font-normal text-gray-500 dark:text-gray-400">
                      By creating an account means you agree to the{" "}
                      <span className="text-gray-800 dark:text-white/90">
                        Terms and Conditions,
                      </span>{" "}
                      and our{" "}
                      <span className="text-gray-800 dark:text-white">
                        Privacy Policy
                      </span>
                    </p>
                  </div>

                  {/* Button */}
                  <div>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-blue-600 shadow-theme-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader /> : 'Sign Up'}
                    </button>
                  </div>
                </div>
              </form>

              <div className="mt-5">
                <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                  Already have an account? {""}
                  <button
                    onClick={handleSignIn}
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lado derecho - Componente Hero */}
      <div className="hidden lg:flex lg:w-1/2">
        <Hero />
      </div>
    </div>
  );
}