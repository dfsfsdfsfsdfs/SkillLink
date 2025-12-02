import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext"; // Importar el contexto de autenticación


// Iconos SVG como componentes React con tamaños consistentes
const BuildingIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const AcademicCapIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M12 14l9-5-9-5-9 5 9 5z" />
    <path d="M12 14l9-5-9-5-9 5 9 5z" opacity="0.5" />
    <path d="M12 14v6l9-5-9-5-9 5 9 5z" opacity="0.25" />
  </svg>
);

const BookOpenIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const CalendarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CreditCardIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const ChevronDownIcon = ({ className = "" }) => (
  <svg 
    className={`w-3 h-3 ${className}`} 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const HorizontalDots = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
  </svg>
);

const navItems = [
  {
    icon: <BuildingIcon />,
    name: "Institución",
    subItems: [
      { name: "Lista de Instituciones", path: "/dashboard/instituciones", pro: false }
    ],
  },
  {
    icon: <AcademicCapIcon />,
    name: "Tutorias",
    subItems: [
      { name: "Lista de Tutorias", path: "/dashboard/tutorias", pro: false }
    ],
  },
  {
    icon: <UserActivation />,
    name: "Tutores",
    subItems: [
      { name: "Lista de Tutores", path: "/dashboard/tutores", pro: false }, // Agregado /dashboard

    ],
  },
  {
    icon: <UsersIcon />,
    name: "Usuarios",
    subItems: [
      { name: "Lista de Usuarios", path: "/dashboard/users", pro: false }, // Agregado /dashboard

    ],
  },


  {
    icon: <CreditCardIcon />,
    name: "Pagos",
    subItems: [
      { name: "Historial de Pagos", path: "/pagos/historial", pro: false },
      { name: "Reportes Financieros", path: "/pagos/reportes", pro: false }
    ],
  },
    {
    icon: <UsersIcon />,
    name: "Editar Perfil",
    subItems: [
      { name: "Editar Perfil", path: "/dashboard/profile", pro: false }, // Agregado /dashboard

    ],
  },
];

const AppSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();

  const [openSubmenus, setOpenSubmenus] = useState({});

  // Determinar el rol del usuario
  const userRole = user?.id_rol;
  const isAdmin = userRole === 1;
  const isGerente = userRole === 2;
  const isTutor = userRole === 3;
  const isEstudiante = userRole === 4;

  // Función para obtener los subitems de Pagos según el rol
  const getPagosSubItems = () => {
    if (isAdmin || isGerente) {
      // Admin y Gerente ven todo
      return [
        { name: "Historial de Pagos", path: "/dashboard/pagos/historial", pro: false },
        { name: "Reportes Financieros", path: "/dashboard/pagos/reportes", pro: false }
      ];
    } else if (isTutor) {
      // Tutor ve solo Reportes Financieros
      return [
        { name: "Reportes Financieros", path: "/dashboard/pagos/reportes", pro: false }
      ];
    } else if (isEstudiante) {
      // Estudiante ve solo Realizar Pago y Historial de Pagos
      return [
        { name: "Historial de Pagos", path: "/dashboard/pagos/historial", pro: false }
      ];
    }
    
    // Por defecto, mostrar opciones básicas
    return [
      { name: "Historial de Pagos", path: "/dashboard/pagos/historial", pro: false }
    ];
  };

  // Definir los items de navegación según el rol
  const getNavItems = () => {
    const baseItems = [
      {
        icon: <BuildingIcon />,
        name: "Institución",
        subItems: [
          { name: "Lista de Instituciones", path: "/dashboard/instituciones", pro: false }
        ],
      },
      {
        icon: <AcademicCapIcon />,
        name: "Tutorias",
        subItems: [
          { name: "Lista de Tutorias", path: "/dashboard/tutorias", pro: false }
        ],
      },
      {
        icon: <UsersIcon />,
        name: "Tutores",
        subItems: [
          { name: "Lista de Tutores", path: "/dashboard/tutores", pro: false }
        ],
      },
      {
        icon: <UsersIcon />,
        name: "Usuarios",
        subItems: [
          { name: "Lista de Usuarios", path: "/dashboard/users", pro: false },
        ],
      },
      {
        icon: <CreditCardIcon />,
        name: "Pagos",
        subItems: getPagosSubItems(), // Usar la función dinámica
      },
      {
        icon: <UsersIcon />,
        name: "Editar Perfil",
        subItems: [
          { name: "Editar Perfil", path: "/dashboard/profile", pro: false },
        ],
      },
    ];

    // Filtrado según el rol - mantener solo los items que corresponden
    if (isAdmin) {
      return baseItems; // Admin ve todo
    } else if (isGerente) {
      return baseItems.filter(item => item.name !== "Usuarios"); // Gerente sin Usuarios
    } else if (isTutor) {
      // Tutor ve: Instituciones, Tutorias, Pagos (solo Reportes), Editar Perfil
      return baseItems.filter(item => 
        ["Institución", "Tutorias", "Pagos", "Editar Perfil"].includes(item.name)
      );
    } else if (isEstudiante) {
      // Estudiante ve: Instituciones, Tutorias, Pagos (solo Realizar Pago y Historial), Editar Perfil
      return baseItems.filter(item => 
        ["Institución", "Tutorias", "Pagos", "Editar Perfil"].includes(item.name)
      );
    }

    // Por defecto, mostrar menú básico
    return [
      {
        icon: <BuildingIcon />,
        name: "Institución",
        subItems: [
          { name: "Lista de Instituciones", path: "/dashboard/instituciones", pro: false }
        ],
      },
      {
        icon: <AcademicCapIcon />,
        name: "Tutorias",
        subItems: [
          { name: "Lista de Tutorias", path: "/dashboard/tutorias", pro: false }
        ],
      },
      {
        icon: <UsersIcon />,
        name: "Editar Perfil",
        subItems: [
          { name: "Editar Perfil", path: "/dashboard/profile", pro: false },
        ],
      },
    ];
  };

  const navItems = getNavItems();

  const isActive = (path) => location.pathname === path;

  const toggleSubmenu = (index) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const renderMenuItems = () => (
    <ul className="flex flex-col gap-1">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <>
              <button
                onClick={() => toggleSubmenu(index)}
                className={`flex items-center w-full px-3 py-3 text-left transition-all duration-200 rounded-lg group ${
                  openSubmenus[index]
                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-l-4 border-indigo-400 text-white"
                    : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                } ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span
                  className={`flex-shrink-0 transition-colors duration-200 ${
                    openSubmenus[index]
                      ? "text-indigo-400"
                      : "text-gray-400 group-hover:text-indigo-400"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="ml-3 font-medium flex-1 text-sm">
                    {nav.name}
                  </span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && nav.subItems && nav.subItems.length > 0 && (
                  <ChevronDownIcon
                    className={`flex-shrink-0 transition-transform duration-200 ml-1 ${
                      openSubmenus[index]
                        ? "rotate-180 text-indigo-400"
                        : "text-gray-400"
                    }`}
                  />
                )}
              </button>
              
              {/* Submenú */}
              {(isExpanded || isHovered || isMobileOpen) && openSubmenus[index] && nav.subItems && nav.subItems.length > 0 && (
                <div className="mt-1">
                  <ul className="py-2 space-y-1 ml-9">
                    {nav.subItems.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path}
                          className={`flex items-center justify-between px-3 py-2 text-sm transition-all duration-200 rounded-lg group ${
                            isActive(subItem.path)
                              ? "bg-indigo-500/20 text-indigo-300 font-medium"
                              : "text-gray-400 hover:text-indigo-300 hover:bg-gray-800/30"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              isActive(subItem.path) 
                                ? "bg-indigo-400" 
                                : "bg-gray-500 group-hover:bg-indigo-400"
                            }`} />
                            {subItem.name}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`flex items-center w-full px-3 py-3 transition-all duration-200 rounded-lg group ${
                  isActive(nav.path) 
                    ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-l-4 border-indigo-400 text-white" 
                    : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                } ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span
                  className={`flex-shrink-0 transition-colors duration-200 ${
                    isActive(nav.path)
                      ? "text-indigo-400"
                      : "text-gray-400 group-hover:text-indigo-400"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="ml-3 font-medium text-sm">
                    {nav.name}
                  </span>
                )}
              </Link>
            )
          )}
        </li>
      ))}
    </ul>
  );

  // Mostrar información del usuario actual
  const renderUserInfo = () => {
    if (!isExpanded && !isHovered && !isMobileOpen) return null;

    const roleNames = {
      1: "Administrador",
      2: "Gerente", 
      3: "Tutor",
      4: "Estudiante"
    };

    return (
      <div className="px-3 py-4 mb-4 bg-gray-800/30 rounded-lg border border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user?.nombre?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.nombre || "Usuario"}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {roleNames[userRole] || "Usuario"}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-4 left-0 bg-[#151622] border-r border-gray-700 text-white h-screen transition-all duration-300 ease-in-out z-50
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 shadow-lg`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-6 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/" className="flex items-center">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                src="/logoFinal2.0.png"
                alt="SkillLink Logo"
                className="h-16 object-contain"
              />
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                SkillLink
              </span>
            </>
          ) : (
            <img
              src="/logoFinal2.0.png"
              alt="SkillLink Logo"
              className="h-8 w-8 object-contain"
            />
          )}
        </Link>
      </div>
      
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
        {/* Información del usuario */}
        {renderUserInfo()}
        
        <nav className="mb-6">
          <div className="flex flex-col gap-1">
            <div>
              <h2
                className={`mb-3 text-xs uppercase flex leading-[20px] text-gray-400 font-semibold ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start px-3"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Sistema Académico"
                ) : (
                  <HorizontalDots />
                )}
              </h2>
              {renderMenuItems()}
            </div>
          </div>
        </nav>
        
        {/* Footer del sidebar */}
        <div className="mt-auto py-6 border-t border-gray-700">
          <div className={`text-center ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"} ${isExpanded || isHovered || isMobileOpen ? "px-3" : "px-0"}`}>
            <p className="text-xs text-gray-400">
              {isExpanded || isHovered || isMobileOpen ? (
                <>
                  SkillLink v1.0<br />
                  <span className="text-gray-500">Sistema de Tutorías</span>
                </>
              ) : (
                "v1.0"
              )}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;