import { createContext, useContext, useState, useEffect } from "react";

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      console.log("🖥️ Resize detected - mobile:", mobile);
      setIsMobile(mobile);
      
      if (!mobile) {
        // En desktop, asegurar que el sidebar esté expandido
        setIsExpanded(true);
        setIsMobileOpen(false);
      } else {
        // En móvil, asegurar que el sidebar esté colapsado
        setIsExpanded(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    console.log("🔄 toggleSidebar llamado - isMobile:", isMobile);
    if (isMobile) {
      console.log("📱 Modo móvil - toggleMobileSidebar");
      setIsMobileOpen(prev => !prev);
    } else {
      console.log("💻 Modo desktop - toggleExpanded");
      setIsExpanded(prev => !prev);
    }
  };

  const toggleMobileSidebar = () => {
    console.log("📱 toggleMobileSidebar llamado");
    setIsMobileOpen(prev => !prev);
  };

  return (
    <SidebarContext.Provider
      value={{
        isExpanded: isMobile ? false : isExpanded, // En móvil siempre colapsado
        isMobileOpen,
        isMobile,
        isHovered,
        toggleSidebar,
        toggleMobileSidebar,
        setIsHovered,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};