import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Hero from "./components/Hero/Hero.jsx";
import Navbar from "./components/Navbar/Navbar.jsx";
import Services from "./components/Services/Services.jsx";
import Banner from "./components/Banner/Banner.jsx";
import Testimonials from "./components/Testimonials/Testimonials.jsx";
import Footer from "./components/Footer/Footer.jsx";
import SignInForm from "./components/Auth/SignInForm.jsx";
import SignUpForm from "./components/Auth/SignUpForm.jsx";
import AOS from "aos";
import "aos/dist/aos.css";
import AppLayout from "./layouts/AppLayout.jsx";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Instituciones from "./pages/Instituciones/Instituciones.jsx";
import Usuarios from "./pages/users/Usuarios.jsx";
import Tutorias from "./pages/Tutorias/Tutoria.jsx";
import Tutoria from "./pages/Tutorias/Tutoria.jsx";
import TutoriaDetalles from "./pages/Tutorias/TutoriaDetalles.jsx";
import TutoresTutoria from './pages/Tutorias/TutoresTutoria.jsx';
import HistorialPagos from "./pages/pagos/HistorialPagos.jsx";
// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

// Componente para redirigir si ya está autenticado
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return !isAuthenticated() ? children : <Navigate to="/dashboard" replace />;
};

// Componentes placeholder para las páginas faltantes
const DepartamentosPage = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
      Departamentos
    </h1>
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <p className="text-gray-600 dark:text-gray-400">
        Página de departamentos - pendiente de implementar
      </p>
    </div>
  </div>
);

const CarrerasPage = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
      Carreras
    </h1>
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <p className="text-gray-600 dark:text-gray-400">
        Página de carreras - pendiente de implementar
      </p>
    </div>
  </div>
);

// Placeholders para otras páginas
const TutoriasListaPage = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
      Lista de Tutorias
    </h1>
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <p className="text-gray-600 dark:text-gray-400">
        Página de lista de tutores - pendiente de implementar
      </p>
    </div>
  </div>
);

const EstudiantesListaPage = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
      Lista de Estudiantes
    </h1>
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <p className="text-gray-600 dark:text-gray-400">
        Página de lista de estudiantes - pendiente de implementar
      </p>
    </div>
  </div>
);

const App = () => {
  React.useEffect(() => {
    AOS.init({
      offset: 100,
      duration: 700,
      easing: "ease-in",
      delay: 100,
    });
    AOS.refresh();
  }, []);

  // Componente para la página principal
  const HomePage = () => (
    <div className="bg-white dark:bg-gray-900 dark:text-white duration-200 overflow-x-hidden">
      <Navbar />
      <Hero />
      <Services />
      <Banner />
      <Testimonials />
      <Footer />
    </div>
  );

  // Componente para la página de login
  const LoginPage = () => (
    <PublicRoute>
      <div className="bg-white dark:bg-gray-900 dark:text-white duration-200">
        <SignInForm />
      </div>
    </PublicRoute>
  );

  // Componente para la página de registro
  const SignUpPage = () => (
    <PublicRoute>
      <div className="bg-white dark:bg-gray-900 dark:text-white duration-200">
        <SignUpForm />
      </div>
    </PublicRoute>
  );

  // Componente para recuperar contraseña
  const ResetPasswordPage = () => (
    <PublicRoute>
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Recuperar Contraseña
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Página de recuperación de contraseña - pendiente de implementar
          </p>
          <button 
            onClick={() => window.history.back()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
          >
            Volver
          </button>
        </div>
      </div>
    </PublicRoute>
  );

  // Componente Dashboard principal
  const DashboardHome = () => (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Bienvenido al Sistema
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona las instituciones educativas desde el menú lateral.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/signin" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            
            {/* Rutas protegidas con layout */}
            // En el componente App.js - dentro de las rutas protegidas
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              {/* Ruta por defecto del dashboard */}
              <Route index element={<DashboardHome />} />
              
              {/* Rutas de Institución */}
              <Route path="instituciones" element={<Instituciones />} />
              
              {/* Rutas de Tutores */}
              <Route path="tutorias" element={<Tutoria />} />
              <Route path="tutorias/:id" element={<TutoriaDetalles />} />
              <Route path="tutores" element={<TutoresTutoria />} />
              
              {/* Rutas de Estudiantes */}
              <Route path="users" element={<Usuarios />} />
              
              {/* 🔥 NUEVO: Ruta de Historial de Pagos CORREGIDA */}
              <Route path="pagos/historial" element={<HistorialPagos />} />
              
              {/* Puedes agregar más rutas según sea necesario */}
            </Route>
            
            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;