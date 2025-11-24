import { motion } from "framer-motion";

const Img1 = "../image-3.png";
const Img2 = "/tutoria-ciencias.png";
const Img3 = "/tutoria-idiomas.png";

const ServicesData = [
  {
    id: 1,
    img: Img1,
    name: "Tutorías de Matemáticas",
    description: "Álgebra, cálculo, estadística y matemáticas avanzadas con tutores especializados de la UMSA y UCB.",
    subjects: ["Cálculo I, II, III", "Álgebra Lineal", "Estadística", "Matemáticas Financieras"],
    level: "Universitario",
    aosDelay: "100",
  },
  {
    id: 2,
    img: Img2,
    name: "Tutorías de Ciencias",
    description: "Física, química, biología y ciencias básicas con metodologías prácticas y efectivas.",
    subjects: ["Física General", "Química Orgánica", "Biología Celular", "Termodinámica"],
    level: "Pregrado",
    aosDelay: "300",
  },
  {
    id: 3,
    img: Img3,
    name: "Tutorías de Idiomas",
    description: "Inglés, francés, portugués y otros idiomas con enfoque académico y conversacional.",
    subjects: ["Inglés Técnico", "Francés Básico", "Portugués", "Comunicación"],
    level: "Todos los niveles",
    aosDelay: "500",
  },
];

const Services = () => {
  return (
    <section id="services" className="py-20 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold font-cursive text-gray-800 mb-4"
          >
            Nuestras Áreas de Tutoría
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            Especialistas en las principales áreas académicas de las universidades de La Paz
          </motion.p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 place-items-center">
          {ServicesData.map((service) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: parseInt(service.aosDelay) / 1000 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="rounded-2xl bg-white hover:bg-gradient-to-br from-cyan-50 to-blue-100 border border-gray-200 relative shadow-lg hover:shadow-xl duration-300 group max-w-[350px] w-full overflow-hidden"
            >
              <div className="h-[140px] bg-gradient-to-r from-cyan-500 to-blue-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                  <motion.div 
                    className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 duration-300 overflow-hidden border-2 border-white"
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <img 
                      src={service.img} 
                      alt={service.name}
                      className="w-20 h-20 object-cover rounded-full"
                    />
                  </motion.div>
                </div>
              </div>

              <div className="p-6 text-center mt-8">
                <h1 className="text-xl font-bold text-gray-800 mb-2">{service.name}</h1>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{service.description}</p>

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Materias principales:</h3>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {service.subjects.map((subject, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-cyan-600 bg-cyan-50 px-2 py-1 rounded-full">
                    {service.level}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Ver Tutores
                  </motion.button>
                </div>
              </div>

              <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-cyan-200 duration-300 pointer-events-none"></div>
            </motion.div>
          ))}
        </div>

        {/* Extra Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-16 bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            ¿No encuentras tu materia?
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Contamos con tutores para más de 50 materias diferentes de todas las carreras universitarias. 
            Contáctanos y encontraremos el tutor perfecto para ti.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-full shadow-lg border border-green-300/30"
          >
            Ver más
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default Services;