import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter, FaMapMarkerAlt, FaPhone, FaEnvelope, FaGraduationCap } from "react-icons/fa";
import { motion } from "framer-motion";

const FooterBg = "/education-pattern-dark.jpg";

const FooterLinks = [
  {
    title: "Inicio",
    link: "/#",
  },
  {
    title: "Nosotros",
    link: "/#about",
  },
  {
    title: "Tutorías",
    link: "/#services",
  },
  {
    title: "Instituciones",
    link: "/#institutions",
  },
  {
    title: "Contacto",
    link: "/#contact",
  },
];

const TutorServices = [
  {
    title: "Matemáticas",
    link: "/#matematicas",
  },
  {
    title: "Ciencias",
    link: "/#ciencias",
  },
  {
    title: "Idiomas",
    link: "/#idiomas",
  },
  {
    title: "Ingenierías",
    link: "/#ingenierias",
  },
  {
    title: "Ciencias Sociales",
    link: "/#sociales",
  },
];

const Institutions = [
  {
    title: "UMSA",
    link: "/#umsa",
  },
  {
    title: "UCB",
    link: "/#ucb",
  },
  {
    title: "UPB",
    link: "/#upb",
  },
  {
    title: "UNIVALLE",
    link: "/#univalle",
  },
  {
    title: "UNIFRANZ",
    link: "/#unifranz",
  },
];

const bgImage = {
  backgroundImage: `url(${FooterBg})`,
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
  minHeight: "500px",
  width: "100%",
};

const Footer = () => {
  return (
    <div style={bgImage} className="text-white relative overflow-hidden">
      {/* Efecto de gradiente superior */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>
      
      <div className="bg-gradient-to-br from-slate-900/95 to-blue-900/95 min-h-[500px]">
        <div className="container grid md:grid-cols-4 pb-10 pt-10 gap-8">
          {/* Logo y descripción */}
          <motion.div 
            className="py-8 px-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-3 rounded-xl">
                <FaGraduationCap className="text-2xl" />
              </div>
              <h1 className="font-bold text-2xl tracking-wide">
                Tutor<span className="text-cyan-400">Academy</span>
              </h1>
            </div>
            <p className="text-gray-300 leading-relaxed mb-6">
              Conectamos estudiantes con los mejores tutores especializados de 
              las principales universidades de La Paz. Excelencia académica al 
              alcance de todos.
            </p>
            
            {/* Botón de contacto */}
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-full text-sm shadow-lg border border-cyan-300/30"
            >
              Comenzar Ahora
            </motion.a>

            {/* Redes sociales */}
            <div className="flex items-center gap-4 mt-6">
              <motion.a 
                href="#" 
                whileHover={{ scale: 1.2, y: -2 }}
                className="bg-white/10 p-2 rounded-lg hover:bg-cyan-500 transition-colors duration-300"
              >
                <FaFacebook className="text-xl" />
              </motion.a>
              <motion.a 
                href="#" 
                whileHover={{ scale: 1.2, y: -2 }}
                className="bg-white/10 p-2 rounded-lg hover:bg-pink-500 transition-colors duration-300"
              >
                <FaInstagram className="text-xl" />
              </motion.a>
              <motion.a 
                href="#" 
                whileHover={{ scale: 1.2, y: -2 }}
                className="bg-white/10 p-2 rounded-lg hover:bg-blue-400 transition-colors duration-300"
              >
                <FaLinkedin className="text-xl" />
              </motion.a>
              <motion.a 
                href="#" 
                whileHover={{ scale: 1.2, y: -2 }}
                className="bg-white/10 p-2 rounded-lg hover:bg-sky-400 transition-colors duration-300"
              >
                <FaTwitter className="text-xl" />
              </motion.a>
            </div>
          </motion.div>

          {/* Enlaces rápidos */}
          <motion.div 
            className="py-8 px-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              Enlaces Rápidos
            </h1>
            <ul className="space-y-3">
              {FooterLinks.map((data, index) => (
                <li key={index}>
                  <motion.a
                    href={data.link}
                    whileHover={{ x: 5, color: "#22d3ee" }}
                    className="inline-block text-gray-300 hover:text-cyan-400 transition-colors duration-200 flex items-center gap-2"
                  >
                    <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                    {data.title}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Áreas de tutoría */}
          <motion.div 
            className="py-8 px-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              Áreas de Tutoría
            </h1>
            <ul className="space-y-3">
              {TutorServices.map((data, index) => (
                <li key={index}>
                  <motion.a
                    href={data.link}
                    whileHover={{ x: 5, color: "#60a5fa" }}
                    className="inline-block text-gray-300 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2"
                  >
                    <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                    {data.title}
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contacto e instituciones */}
          <motion.div 
            className="py-8 px-4"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              Contacto
            </h1>
            
            {/* Información de contacto */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-gray-300">
                <FaMapMarkerAlt className="text-cyan-400" />
                <span>Av. Villazón, Zona Central, La Paz, Bolivia</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <FaPhone className="text-cyan-400" />
                <span>+591 76543210</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300">
                <FaEnvelope className="text-cyan-400" />
                <span>info@tutoracademy.com</span>
              </div>
            </div>

            {/* Instituciones asociadas */}
            <h2 className="text-lg font-semibold mb-4 text-gray-200">Instituciones Asociadas</h2>
            <div className="flex flex-wrap gap-2">
              {Institutions.slice(0, 4).map((inst, index) => (
                <motion.span
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/10 px-3 py-1 rounded-full text-xs text-gray-300 border border-white/20 hover:border-cyan-400/50 transition-colors duration-200"
                >
                  {inst.title}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-white/20"></div>

        {/* Footer inferior */}
        <motion.div 
          className="container py-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm text-center md:text-left">
              <p>© 2024 TutorAcademy. Todos los derechos reservados.</p>
              <p className="text-xs mt-1">Excelencia académica para el futuro de Bolivia</p>
            </div>
            
            <div className="flex gap-6 text-sm text-gray-400">
              <motion.a 
                href="/privacy" 
                whileHover={{ color: "#22d3ee" }}
                className="hover:text-cyan-400 transition-colors duration-200"
              >
                Privacidad
              </motion.a>
              <motion.a 
                href="/terms" 
                whileHover={{ color: "#22d3ee" }}
                className="hover:text-cyan-400 transition-colors duration-200"
              >
                Términos
              </motion.a>
              <motion.a 
                href="/faq" 
                whileHover={{ color: "#22d3ee" }}
                className="hover:text-cyan-400 transition-colors duration-200"
              >
                FAQ
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Footer;