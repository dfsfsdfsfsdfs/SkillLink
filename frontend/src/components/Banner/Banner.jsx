import { motion } from "framer-motion";
import { GrSecure } from "react-icons/gr";
import { IoBook } from "react-icons/io5";
import { GiGraduateCap } from "react-icons/gi";
import { FaChalkboardTeacher, FaUserGraduate, FaNetworkWired, FaRocket, FaUsers } from "react-icons/fa";

const BgImg = "/education-pattern.jpg";

const bgImage = {
  backgroundImage: `url(${BgImg})`,
  backgroundColor: "#0f172a",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  height: "100%",
  width: "100%",
};

const Banner = () => {
  return (
    <>
      <span id="about"></span>
      <div style={bgImage} className="py-10">
        <div className="min-h-[550px] flex justify-center items-center py-12 sm:py-0">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* Misión */}
              <motion.div
                className="flex flex-col justify-center gap-6"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.div
                  className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-2xl p-6 text-white border-2 border-cyan-300/30 relative overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full"></div>
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <FaChalkboardTeacher className="text-3xl" />
                      <h3 className="text-xl font-bold">Misión</h3>
                    </div>
                    <p className="text-sm leading-relaxed">
                      Formar profesionales exitosos mediante tutorías personalizadas 
                      de excelencia académica, conectando estudiantes con tutores 
                      especializados de las principales universidades de La Paz.
                    </p>
                  </div>
                </motion.div>

                {/* Estadísticas */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="grid grid-cols-3 gap-4"
                >
                  <div className="text-center bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                    <div className="text-xl font-bold text-cyan-400">500+</div>
                    <div className="text-xs text-gray-300">Estudiantes</div>
                  </div>
                  <div className="text-center bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                    <div className="text-xl font-bold text-blue-400">50+</div>
                    <div className="text-xs text-gray-300">Tutores</div>
                  </div>
                  <div className="text-center bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                    <div className="text-xl font-bold text-purple-400">95%</div>
                    <div className="text-xs text-gray-300">Éxito</div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Red de Nodos Animados */}
              <motion.div
                className="relative flex justify-center items-center"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                  {/* Nodo Central - SkillLink */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full z-30 flex items-center justify-center border-4 border-cyan-300/50 shadow-2xl"
                    animate={{
                      scale: [1, 1.1, 1],
                      boxShadow: [
                        "0 0 20px rgba(34, 211, 238, 0.5)",
                        "0 0 40px rgba(34, 211, 238, 0.8)",
                        "0 0 20px rgba(34, 211, 238, 0.5)"
                      ]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <FaNetworkWired className="text-white text-xl" />
                  </motion.div>

                  {/* Nodo 1 - Conectividad */}
                  <motion.div
                    className="absolute top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full z-20 flex items-center justify-center border-2 border-green-300/50 shadow-lg"
                    animate={{
                      y: [0, -10, 0],
                      x: [0, 5, 0]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.2
                    }}
                  >
                    <FaUsers className="text-white text-sm" />
                  </motion.div>

                  {/* Nodo 2 - Tecnología */}
                  <motion.div
                    className="absolute top-1/2 right-8 transform -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full z-20 flex items-center justify-center border-2 border-purple-300/50 shadow-lg"
                    animate={{
                      x: [0, 10, 0],
                      y: [0, -5, 0]
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.4
                    }}
                  >
                    <FaRocket className="text-white text-sm" />
                  </motion.div>

                  {/* Nodo 3 - Educación */}
                  <motion.div
                    className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full z-20 flex items-center justify-center border-2 border-orange-300/50 shadow-lg"
                    animate={{
                      y: [0, 10, 0],
                      x: [0, -5, 0]
                    }}
                    transition={{
                      duration: 4.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.6
                    }}
                  >
                    <GiGraduateCap className="text-white text-sm" />
                  </motion.div>

                  {/* Nodo 4 - Innovación */}
                  <motion.div
                    className="absolute top-1/2 left-8 transform -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-full z-20 flex items-center justify-center border-2 border-yellow-300/50 shadow-lg"
                    animate={{
                      x: [0, -10, 0],
                      y: [0, 5, 0]
                    }}
                    transition={{
                      duration: 3.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.8
                    }}
                  >
                    <IoBook className="text-white text-sm" />
                  </motion.div>

                  {/* Conexiones entre nodos */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {/* Conexión central a nodo 1 */}
                    <motion.line
                      x1="50%"
                      y1="50%"
                      x2="50%"
                      y2="20%"
                      stroke="url(#gradient1)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 0.5 }}
                    />
                    
                    {/* Conexión central a nodo 2 */}
                    <motion.line
                      x1="50%"
                      y1="50%"
                      x2="75%"
                      y2="50%"
                      stroke="url(#gradient2)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 0.7 }}
                    />
                    
                    {/* Conexión central a nodo 3 */}
                    <motion.line
                      x1="50%"
                      y1="50%"
                      x2="50%"
                      y2="80%"
                      stroke="url(#gradient3)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 0.9 }}
                    />
                    
                    {/* Conexión central a nodo 4 */}
                    <motion.line
                      x1="50%"
                      y1="50%"
                      x2="25%"
                      y2="50%"
                      stroke="url(#gradient4)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 1.1 }}
                    />

                    {/* Gradientes para las conexiones */}
                    <defs>
                      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                      <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                      <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Partículas flotantes */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-cyan-400 rounded-full blur-sm"
                      style={{
                        left: `${20 + (i * 10)}%`,
                        top: `${15 + (i * 12)}%`,
                      }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.3, 0.8, 0.3],
                        x: [0, (Math.random() - 0.5) * 20],
                        y: [0, (Math.random() - 0.5) * 20],
                      }}
                      transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                      }}
                    />
                  ))}

                  {/* Anillos concéntricos */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-cyan-300/20"
                    animate={{
                      rotate: 360,
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      rotate: {
                        duration: 25,
                        repeat: Infinity,
                        ease: "linear"
                      },
                      scale: {
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  />
                </div>
              </motion.div>

              {/* Visión y características */}
              <motion.div
                className="flex flex-col justify-center gap-6"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <motion.div
                  className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-6 text-white border-2 border-blue-300/30 relative overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="absolute -top-6 -left-6 w-24 h-24 bg-white/10 rounded-full"></div>
                  <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/5 rounded-full"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <GiGraduateCap className="text-3xl" />
                      <h3 className="text-xl font-bold">Visión</h3>
                    </div>
                    <p className="text-sm leading-relaxed">
                      Ser la plataforma líder en tutorías académicas en Bolivia, 
                      transformando la educación superior y expandiendo nuestro 
                      impacto a nivel nacional con innovación y calidad educativa.
                      </p>
                    </div>
                </motion.div>

                {/* Características rápidas */}
                <div className="space-y-4">
                  <motion.div
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                  >
                    <GrSecure className="text-xl h-10 w-10 p-2 rounded-full bg-cyan-100 text-cyan-600" />
                    <div>
                      <span className="text-white font-semibold text-sm">Tutores Certificados</span>
                      <p className="text-gray-300 text-xs">Profesionales calificados</p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                  >
                    <IoBook className="text-xl h-10 w-10 p-2 rounded-full bg-blue-100 text-blue-600" />
                    <div>
                      <span className="text-white font-semibold text-sm">Todas las Carreras</span>
                      <p className="text-gray-300 text-xs">Más de 50 materias</p>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                  >
                    <FaUserGraduate className="text-xl h-10 w-10 p-2 rounded-full bg-purple-100 text-purple-600" />
                    <div>
                      <span className="text-white font-semibold text-sm">Flexibilidad</span>
                      <p className="text-gray-300 text-xs">Presencial y virtual</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Sección inferior adicional */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-12 pt-8 border-t border-white/20"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg border border-cyan-300/30"
              >
                Comenzar Ahora
              </motion.button>
              <p className="text-gray-300 text-sm mt-4">
                Únete a más de 500 estudiantes que han mejorado su rendimiento académico
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Banner;