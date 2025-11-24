import Slider from "react-slick";
import { motion } from "framer-motion";

const InstitutionsData = [
  {
    id: 1,
    name: "UMSA",
    fullName: "Universidad Mayor de San Andrés",
    description: "La universidad pública más grande y antigua de Bolivia",
    logo: "/umsa-logo1.png", // Asegúrate de que estas imágenes estén en tu carpeta public
    color: "from-red-500 to-red-600",
    students: "250+",
    since: "1830"
  },
  {
    id: 2,
    name: "UCB",
    fullName: "Universidad Católica Boliviana",
    description: "Institución de educación superior privada con sedes nacionales",
    logo: "/logo-ucb.png",
    color: "from-blue-500 to-blue-600",
    students: "180+",
    since: "1966"
  },
  {
    id: 3,
    name: "UPB",
    fullName: "Universidad Privada Boliviana",
    description: "Referente en educación superior privada de calidad",
    logo: "/logo-upb.png",
    color: "from-green-500 to-green-600",
    students: "120+",
    since: "1993"
  },
  {
    id: 4,
    name: "UNIVERSIDAD DE AQUINO",
    fullName: "Universidad de Aquino Bolivia",
    description: "Institución comprometida con la excelencia académica",
    logo: "/logo-udabol.png",
    color: "from-purple-500 to-purple-600",
    students: "90+",
    since: "1990"
  },
  {
    id: 5,
    name: "UNIVALLE",
    fullName: "Universidad del Valle",
    description: "Innovación y desarrollo profesional integral",
    logo: "/logo-univalle.png",
    color: "from-orange-500 to-orange-600",
    students: "110+",
    since: "1988"
  },
  {
    id: 6,
    name: "UNIFRANZ",
    fullName: "Universidad Franz Tamayo",
    description: "Educación superior con visión internacional",
    logo: "/logo-unifranz.png",
    color: "from-cyan-500 to-cyan-600",
    students: "95+",
    since: "1993"
  }
];

const Institutions = () => {
  var settings = {
    dots: true,
    arrows: false,
    infinite: true,
    speed: 500,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    cssEase: "linear",
    pauseOnHover: true,
    pauseOnFocus: true,
    responsive: [
      {
        breakpoint: 10000,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
          infinite: true,
        },
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          initialSlide: 2,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <div className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container">
        {/* Header section */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl font-bold mb-4 text-gray-800">
            Instituciones Asociadas
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Colaboramos con las principales universidades e instituciones de educación superior de La Paz
          </p>
        </motion.div>

        {/* Institutions Slider */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Slider {...settings}>
            {InstitutionsData.map((institution) => (
              <div key={institution.id} className="px-3">
                <motion.div
                  className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-cyan-300 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col"
                  whileHover={{ 
                    y: -10,
                    scale: 1.02,
                  }}
                >
                  {/* Logo Section - AHORA CON IMAGEN REAL */}
                  <div className="text-center mb-4">
                    <div className="w-20 h-20 rounded-full bg-white mx-auto flex items-center justify-center shadow-lg mb-3 border border-gray-200">
                      {/* Imagen del logo */}
                      <img 
                        src={institution.logo} 
                        alt={`Logo ${institution.name}`}
                        className="w-16 h-16 object-contain rounded-full"
                        onError={(e) => {
                          // Fallback si la imagen no carga
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      {/* Fallback si no hay imagen */}
                      <div 
                        className={`w-16 h-16 rounded-full bg-gradient-to-r ${institution.color} hidden items-center justify-center`}
                      >
                        <span className="text-white font-bold text-sm">
                          {institution.name}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-1 text-gray-800">{institution.name}</h3>
                    <p className="text-gray-600 text-xs">{institution.fullName}</p>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 text-sm text-center mb-4 flex-grow leading-relaxed">
                    {institution.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-cyan-50 rounded-lg p-2 border border-cyan-100">
                      <div className="text-cyan-700 font-bold text-sm">{institution.students}</div>
                      <div className="text-gray-600 text-xs">Estudiantes</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                      <div className="text-blue-700 font-bold text-sm">{institution.since}</div>
                      <div className="text-gray-600 text-xs">Fundada</div>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="mt-4 text-center">
                    <span className="inline-block bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs px-3 py-1 rounded-full shadow-md">
                      Institución Afiliada
                    </span>
                  </div>
                </motion.div>
              </div>
            ))}
          </Slider>
        </motion.div>

        {/* Additional Info */}
        <motion.div 
          className="text-center mt-12 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-2xl p-8 border border-cyan-400/30 shadow-xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h3 className="text-2xl font-bold mb-4 text-white">¿Eres de otra institución?</h3>
          <p className="text-cyan-100 mb-6 max-w-2xl mx-auto">
            Estamos constantemente expandiendo nuestra red de instituciones asociadas. 
            Si perteneces a otra universidad o instituto, contáctanos para formar parte de nuestra plataforma.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-cyan-700 hover:bg-gray-100 font-semibold py-3 px-8 rounded-full shadow-lg border border-white/30"
          >
            Solicitar Afiliación
          </motion.button>
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="text-center bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="text-3xl font-bold text-cyan-600 mb-2">8+</div>
            <div className="text-gray-600">Instituciones</div>
          </div>
          <div className="text-center bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="text-3xl font-bold text-blue-600 mb-2">1,000+</div>
            <div className="text-gray-600">Estudiantes Activos</div>
          </div>
          <div className="text-center bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="text-3xl font-bold text-green-600 mb-2">50+</div>
            <div className="text-gray-600">Tutores Certificados</div>
          </div>
          <div className="text-center bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="text-3xl font-bold text-purple-600 mb-2">95%</div>
            <div className="text-gray-600">Satisfacción</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Institutions;