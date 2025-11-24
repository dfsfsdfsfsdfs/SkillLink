import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // Importa el contexto de autenticación

const Logo = "/logoFinal2.0.png";

const Menu = [
  {
    id: 1,
    name: "Home",
    link: "/",
  },
  {
    id: 2,
    name: "Tutorials",
    link: "/#services",
  },
  {
    id: 3,
    name: "About",
    link: "/#about",
  },
];

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth(); // Usa el contexto de autenticación
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  // Si estamos en la página de login, no mostrar el navbar
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-[#151622] via-[#151622] to-[#151622] shadow-md text-white">
      <div className="container py-2">
        <div className="flex justify-between items-center">
          {/* Logo section */}
          <nav className="flex justify-between items-center px-4 py-3">
            <div data-aos="fade-down" data-aos-once="true">
              <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-3"
              >
                <img 
                  src={Logo} 
                  alt="Logo" 
                  className="h-12 md:h-16 lg:h-24 object-contain"
                />
                <span className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  SkillLink
                </span>
              </button>
            </div>
          </nav>

          {/* Link section */}
          <div
            data-aos="fade-down"
            data-aos-once="true"
            data-aos-delay="300"
            className="flex justify-between items-center gap-4"
          >
            <ul className="hidden sm:flex items-center gap-4">
              {Menu.map((menu) => (
                <li key={menu.id}>
                  <button
                    onClick={() => {
                      if (menu.link.startsWith('/')) {
                        navigate(menu.link);
                      } else {
                        // Para enlaces con hash, scroll a la sección
                        const element = document.querySelector(menu.link);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                    className="inline-block text-xl py-4 px-4 text-white/70 hover:text-[#fee319] duration-200"
                  >
                    {menu.name}
                  </button>
                </li>
              ))}
            </ul>
            
            {/* Botón Login o Información de Usuario */}
            {isAuthenticated() ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-300">
                  Hola, <span className="text-[#fee319] font-semibold">{user?.username}</span>
                </span>
                <button 
                  onClick={handleDashboard}
                  className="bg-gradient-to-r from-[#0050d8] to-[#0066ff] hover:from-[#0066ff] hover:to-[#0050d8] hover:scale-105 duration-200 text-white px-4 py-2 rounded-full flex items-center gap-2 font-semibold shadow-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </button>
                <button 
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-full flex items-center gap-2 font-semibold shadow-lg transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Salir
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleLogin}
                  className="bg-gradient-to-r from-[#0050d8] to-[#0066ff] hover:from-[#0066ff] hover:to-[#0050d8] hover:scale-105 duration-200 text-white px-6 py-3 rounded-full flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Login
                </button>
                <button 
                  onClick={() => navigate('/signup')}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 rounded-full flex items-center gap-3 font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Registrarse
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;