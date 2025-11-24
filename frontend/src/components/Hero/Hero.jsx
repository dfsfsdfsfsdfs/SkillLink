import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Globe from "react-globe.gl";
import * as THREE from "three";

const Hero = () => {
  const globeRef = useRef();
  const [arcs, setArcs] = useState([]);

  // 🌎 Coordenadas de Bolivia (centro aproximado)
  const boliviaCenter = { lat: -16.2902, lng: -63.5887 };

  // 🌍 Algunos destinos del mundo
  const destinations = [
    { lat: 40.7128, lng: -74.006, name: "New York" },
    { lat: 35.6895, lng: 139.6917, name: "Tokyo" },
    { lat: 51.5072, lng: -0.1276, name: "Londres" },
    { lat: -33.8688, lng: 151.2093, name: "Sídney" },
    { lat: -34.6037, lng: -58.3816, name: "Buenos Aires" },
    { lat: 48.8566, lng: 2.3522, name: "París" },
    { lat: 37.7749, lng: -122.4194, name: "San Francisco" },
  ];

  // 🔴 Crear arcos desde Bolivia hacia el mundo
  useEffect(() => {
    const generateArcs = () =>
      destinations.map((dest) => ({
        startLat: boliviaCenter.lat,
        startLng: boliviaCenter.lng,
        endLat: dest.lat,
        endLng: dest.lng,
        color: ["#00ffff", "#ff00ff", "#00ff88"],
      }));
    setArcs(generateArcs());

    // 🌀 Actualizar destino ligeramente para movimiento orgánico
    const interval = setInterval(() => {
      setArcs((prev) =>
        prev.map((arc) => ({
          ...arc,
          endLat: arc.endLat + (Math.random() - 0.5) * 0.5,
          endLng: arc.endLng + (Math.random() - 0.5) * 0.5,
        }))
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // 🇧🇴 Polígono de Bolivia
  const boliviaPolygon = [
    { lat: -9.68, lng: -69.58 },
    { lat: -22.90, lng: -69.58 },
    { lat: -22.90, lng: -57.45 },
    { lat: -9.68, lng: -57.45 },
    { lat: -9.68, lng: -69.58 },
  ];

  const polygonsData = [
    {
      polygon: boliviaPolygon.map((coord) => [coord.lng, coord.lat]),
      capColor: () => "rgba(0, 255, 255, 0.6)",
      sideColor: () => "rgba(0, 200, 255, 0.3)",
      strokeColor: "rgba(0, 255, 255, 1)",
      strokeWidth: 3,
    },
  ];

  // 🌀 Configuración avanzada del globo
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    // Configurar controles para rotación automática + manual
    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.enableRotate = true;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.2;

    // Configurar posición inicial enfocando Bolivia
    globe.pointOfView({ lat: -16.2902, lng: -63.5887, altitude: 2.2 }, 2000);

    // Mejorar materiales para efecto holográfico
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x00aaff,
      emissive: 0x002244,
      emissiveIntensity: 0.8,
      specular: 0x00ffff,
      shininess: 100,
      transparent: true,
      opacity: 0.95,
      wireframe: false,
    });

    if (globe.globeMaterial) {
      globe.globeMaterial = globeMaterial;
    }

  }, []);

  return (
    <section className="min-h-[550px] bg-[#010B25] flex items-center justify-center text-white relative overflow-hidden">
      {/* Fondo futurista mejorado */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#001940] via-[#002B60] to-[#010B25] opacity-95"></div>
      
      {/* Patrón de grid holográfico */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        ></div>
      </div>

      {/* Efectos de partículas luminosas */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      <div className="container grid grid-cols-1 sm:grid-cols-2 items-center gap-10 z-10">
        {/* 🧠 Texto */}
        <motion.div
          className="order-2 sm:order-1 text-center sm:text-left"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight">
            Las mejores{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400 font-cursive">
              tutorías
            </span>{" "}
            academicas Universitarias de Bolivia 
          </h1>
          <p className="text-blue-200 text-lg mt-4 max-w-md mx-auto sm:mx-0">
            Conectamos estudiantes con tutores en todo el mundo.  
            Visualiza la red de aprendizaje expandiéndose desde Bolivia.
          </p>
        </motion.div>

        {/* 🌐 Globo interactivo holográfico mejorado */}
        <motion.div
          className="order-1 sm:order-2 flex justify-center relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="relative w-[320px] sm:w-[420px] h-[420px]">
            <Globe
              ref={globeRef}
              width={420}
              height={420}
              globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
              bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
              backgroundColor="rgba(0,0,0,0)"
              
              // Configuración atmosférica mejorada
              showAtmosphere={true}
              atmosphereColor="rgba(0, 255, 255, 0.3)"
              atmosphereAltitude={0.4}
              
              // Polígonos resaltados
              polygonsData={polygonsData}
              polygonAltitude={0.03}
              polygonCapColor={(d) => d.capColor()}
              polygonSideColor={(d) => d.sideColor()}
              polygonStrokeColor={(d) => d.strokeColor}
              polygonStrokeWidth={(d) => d.strokeWidth}
              
              // Arcos con efectos neón
              arcsData={arcs}
              arcColor={(d) => d.color}
              arcDashLength={0.3}
              arcDashGap={0.1}
              arcDashInitialGap={() => Math.random()}
              arcDashAnimateTime={3000}
              arcAltitudeAutoScale={0.5}
              arcsTransitionDuration={800}
              arcStroke={1.5}
              
              // Puntos de conexión
              pointsData={[boliviaCenter]}
              pointColor={() => "rgba(255, 50, 255, 1)"}
              pointAltitude={0.04}
              pointRadius={0.5}
              
              // Efectos de iluminación
              showGraticules={true}
              graticuleColor="rgba(0, 255, 255, 0.2)"
              
              // Configuración de materiales personalizada
              onGlobeReady={() => {
                const globe = globeRef.current;
                if (globe) {
                  // Material holográfico personalizado
                  globe.globeMaterial().color = new THREE.Color(0x0088ff);
                  globe.globeMaterial().emissive = new THREE.Color(0x001133);
                  globe.globeMaterial().emissiveIntensity = 0.6;
                  globe.globeMaterial().specular = new THREE.Color(0x00ffff);
                  globe.globeMaterial().shininess = 120;
                  globe.globeMaterial().transparent = true;
                  globe.globeMaterial().opacity = 0.9;
                  
                  // Mejorar iluminación
                  globe.scene().children.forEach(child => {
                    if (child.isPointLight) {
                      child.intensity = 1.5;
                      child.color = new THREE.Color(0x00aaff);
                    }
                  });
                }
              }}
            />

            {/* Halo holográfico exterior */}
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-cyan-400/60 blur-xl"
              animate={{ 
                rotate: 360,
                borderColor: ['rgba(0, 255, 255, 0.6)', 'rgba(255, 0, 255, 0.6)', 'rgba(0, 255, 255, 0.6)']
              }}
              transition={{ 
                rotate: { repeat: Infinity, duration: 20, ease: "linear" },
                borderColor: { repeat: Infinity, duration: 3, ease: "easeInOut" }
              }}
            />

            {/* Anillos concéntricos */}
            <motion.div
              className="absolute -inset-8 rounded-full border-2 border-cyan-300/40 blur-sm"
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 35, ease: "linear" }}
            />

            {/* Efecto de pulso central */}
            <motion.div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-cyan-500/20 blur-2xl"
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            />

            {/* Indicador de interactividad */}
            <motion.div
              className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-cyan-300 text-sm border border-cyan-400/30"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
            >

            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;