// components/ResolverEvaluacion.jsx - VERSIÓN CORREGIDA
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';

// Componentes separados fuera del componente principal
const PreguntaDesarrollo = React.memo(({ pregunta, index, respuesta, onChange }) => {
  return (
    <div className="space-y-6">
      {/* Enunciado */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800">
        <p className="text-gray-800 dark:text-gray-200 text-xl leading-relaxed font-semibold">
          {pregunta.descripcion || pregunta.enunciado}
        </p>
        {pregunta.descripcion && pregunta.enunciado && pregunta.enunciado !== pregunta.descripcion && (
          <p className="text-gray-600 dark:text-gray-400 mt-3 text-base">
            {pregunta.enunciado}
          </p>
        )}
      </div>

      {/* Área de texto para respuesta */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-lg font-semibold text-gray-900 dark:text-white">
            📝 Tu respuesta:
          </label>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
            {respuesta?.respuesta_desarrollo?.length || 0} caracteres
          </span>
        </div>
        
        <div className="relative">
          <textarea
            className="w-full min-h-[200px] p-4 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 focus:outline-none transition-all duration-200 resize-y"
            placeholder="Escribe tu respuesta detallada aquí..."
            value={respuesta?.respuesta_desarrollo || ""}
            onChange={(e) => onChange(index, e.target.value)}
            rows={8}
          />
        </div>
        
        {/* Consejos para desarrollo */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">💡</span>
            </div>
            <div>
              <p className="text-amber-800 dark:text-amber-300 text-sm font-medium">
                Consejo: Sé claro y detallado en tu respuesta. Incluye ejemplos cuando sea posible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const PreguntaVerdaderoFalso = React.memo(({ pregunta, index, respuesta, onChange }) => {
  return (
    <div className="space-y-6">
      {/* Enunciado */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
        <p className="text-gray-800 dark:text-gray-200 text-xl leading-relaxed font-semibold">
          {pregunta.descripcion || pregunta.enunciado}
        </p>
        {pregunta.descripcion && pregunta.enunciado && pregunta.enunciado !== pregunta.descripcion && (
          <p className="text-gray-600 dark:text-gray-400 mt-3 text-base">
            {pregunta.enunciado}
          </p>
        )}
      </div>

      {/* Opciones V/F con diseño mejorado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pregunta.opciones && pregunta.opciones.map((opcion) => (
          <label 
            key={opcion.id}
            className={`relative flex items-center justify-center p-6 rounded-2xl border-3 cursor-pointer transition-all transform hover:scale-105 ${
              respuesta?.inciso_seleccionado === opcion.inciso
                ? opcion.inciso === 'V' 
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-lg'
                  : 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 shadow-lg'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <input
              type="radio"
              name={`pregunta-${index}`}
              value={opcion.inciso}
              checked={respuesta?.inciso_seleccionado === opcion.inciso}
              onChange={() => onChange(index, opcion.inciso)}
              className="sr-only"
            />
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${
                opcion.inciso === 'V' 
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {opcion.inciso}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {opcion.texto}
              </div>
            </div>
            
            {/* Indicador de selección */}
            {respuesta?.inciso_seleccionado === opcion.inciso && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </label>
        ))}
      </div>
    </div>
  );
});

const PreguntaOpcionMultiple = React.memo(({ pregunta, index, respuesta, onChange }) => {
  return (
    <div className="space-y-6">
      {/* Enunciado */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
        <p className="text-gray-800 dark:text-gray-200 text-xl leading-relaxed font-semibold">
          {pregunta.descripcion || pregunta.enunciado}
        </p>
        {pregunta.descripcion && pregunta.enunciado && pregunta.enunciado !== pregunta.descripcion && (
          <p className="text-gray-600 dark:text-gray-400 mt-3 text-base">
            {pregunta.enunciado}
          </p>
        )}
      </div>

      {/* Opciones con diseño de tarjetas - MEJORADO */}
      <div className="grid grid-cols-1 gap-3">
        {pregunta.opciones && pregunta.opciones.map((opcion) => (
          <label 
            key={opcion.id}
            className={`relative flex items-start space-x-4 p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
              respuesta?.inciso_seleccionado === opcion.inciso
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
          >
            <input
              type="radio"
              name={`pregunta-${index}`}
              value={opcion.inciso}
              checked={respuesta?.inciso_seleccionado === opcion.inciso}
              onChange={() => onChange(index, opcion.inciso)}
              className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start space-x-3">
                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-sm font-bold flex-shrink-0 mt-1">
                  {opcion.inciso}
                </span>
                <div>
                  <span className="text-lg font-medium text-gray-900 dark:text-white block">
                    <span className="font-bold">{opcion.inciso})</span> {opcion.texto}
                  </span>
                </div>
              </div>
            </div>
            
            {respuesta?.inciso_seleccionado === opcion.inciso && (
              <div className="flex-shrink-0 text-green-500">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </label>
        ))}
      </div>
      
      {/* Debug info - solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Debug:</strong> {pregunta.opciones?.length || 0} opciones cargadas para pregunta {pregunta.numero_preg}
          </p>
        </div>
      )}
    </div>
  );
});

const ResolverEvaluacion = ({ evaluacion, inscripcionId, onFinalizar }) => {
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const { getAuthToken } = useAuth();

  const getToken = useCallback(() => {
    return getAuthToken ? getAuthToken() : localStorage.getItem('authToken');
  }, [getAuthToken]);

  // Calcular puntaje total de forma segura
  const calcularPuntajeTotal = () => {
    if (!preguntas || preguntas.length === 0) return 0;
    
    const total = preguntas.reduce((sum, p) => {
      const nota = parseFloat(p.nota_pregunta) || 1;
      return sum + nota;
    }, 0);
    
    return total.toFixed(1);
  };

  // Obtener nota de pregunta de forma segura
  const getNotaPregunta = (pregunta) => {
    return parseFloat(pregunta.nota_pregunta) || 1;
  };

  // Función para obtener el color del badge según el tipo
  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'verdadero_falso':
        return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white';
      case 'opcion_multiple':
        return 'bg-gradient-to-r from-blue-500 to-purple-500 text-white';
      case 'desarrollo':
        return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Función para obtener el icono según el tipo
  const getTipoIcono = (tipo) => {
    switch (tipo) {
      case 'verdadero_falso':
        return '✅';
      case 'opcion_multiple':
        return '🔘';
      case 'desarrollo':
        return '📝';
      default:
        return '❓';
    }
  };

  // NUEVA FUNCIÓN: Cargar opciones para una pregunta específica
  const cargarOpcionesPregunta = async (numeroPreg) => {
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3000/opciones/debug/pregunta/${numeroPreg}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const opcionesData = await response.json();
        console.log(`📋 Opciones cargadas para pregunta ${numeroPreg}:`, opcionesData);
        return opcionesData;
      } else {
        console.warn(`No se pudieron cargar opciones para pregunta ${numeroPreg}`);
        return [];
      }
    } catch (err) {
      console.error(`Error cargando opciones para pregunta ${numeroPreg}:`, err);
      return [];
    }
  };

  // Determinar tipo de pregunta basado en la estructura de datos
  const determinarTipoPregunta = (pregunta) => {
    if (pregunta.tipo_pregun === 'verdadero_falso') {
      return 'verdadero_falso';
    }
    
    if (pregunta.tipo_pregun === 'desarrollo') {
      return 'desarrollo';
    }
    
    return 'opcion_multiple';
  };

  // FUNCIÓN MEJORADA: Crear opciones con manejo robusto
  const crearOpcionesParaPregunta = async (pregunta, tipoPregunta) => {
    let opciones = [];

    if (tipoPregunta === 'verdadero_falso') {
      opciones = [
        { 
          inciso: 'V', 
          texto: 'Verdadero', 
          id: `${pregunta.numero_preg}-V`,
          inciso_original: 'V'
        },
        { 
          inciso: 'F', 
          texto: 'Falso', 
          id: `${pregunta.numero_preg}-F`,
          inciso_original: 'F'
        }
      ];
      
    } else if (tipoPregunta === 'opcion_multiple') {
      const opcionesBD = await cargarOpcionesPregunta(pregunta.numero_preg);
      
      if (opcionesBD && opcionesBD.length > 0) {
        opciones = opcionesBD.map((opcion, index) => {
          const letra = String.fromCharCode(65 + index);
          return {
            inciso: letra,
            texto: opcion.respuesta_opcion || '',
            id: `${pregunta.numero_preg}-${letra}`,
            inciso_original: letra,
            inciso_bd: opcion.inciso
          };
        });
        
        console.log(`✅ Opciones múltiple para pregunta ${pregunta.numero_preg}:`, 
          opciones.map(op => `${op.inciso} (BD:${op.inciso_bd}): ${op.texto.substring(0, 30)}...`)
        );
      } else {
        opciones = [
          { inciso: 'A', texto: 'Opción A', id: `${pregunta.numero_preg}-A`, inciso_original: 'A' },
          { inciso: 'B', texto: 'Opción B', id: `${pregunta.numero_preg}-B`, inciso_original: 'B' },
          { inciso: 'C', texto: 'Opción C', id: `${pregunta.numero_preg}-C`, inciso_original: 'C' },
          { inciso: 'D', texto: 'Opción D', id: `${pregunta.numero_preg}-D`, inciso_original: 'D' }
        ];
      }
    }

    return mezclarOpciones(opciones);
  };

  // Mezclar opciones para que no aparezcan en orden
  const mezclarOpciones = (opciones) => {
    if (!opciones || opciones.length === 0) return [];
    
    const mezcladas = [...opciones];
    for (let i = mezcladas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [mezcladas[i], mezcladas[j]] = [mezcladas[j], mezcladas[i]];
    }
    return mezcladas;
  };

  const actualizarRespuesta = (index, campo, valor) => {
    setRespuestas(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        [campo]: valor
      }
    }));
  };

const compararRespuestasConCorrectas = (preguntasArray, respuestasObj) => {
  const resultados = {};
  let puntajeTotal = 0;
  let correctas = 0;

  console.log('🚨 INICIANDO COMPARACIÓN CORREGIDA - VERSIÓN 1=VERDADERO, 2=FALSO');
  console.log('📊 PREGUNTAS:', JSON.stringify(preguntasArray, null, 2));
  console.log('📊 RESPUESTAS:', JSON.stringify(respuestasObj, null, 2));

  preguntasArray.forEach((pregunta, index) => {
    const respuesta = respuestasObj[index] || {};
    let esCorrecta = false;
    let notaObtenida = 0;
    let necesitaRevision = false;
    
    // 🎯 OBTENER las respuestas SIN normalizar aún
    const respuestaEstudianteRaw = respuesta.inciso_seleccionado;
    const respuestaCorrectaRaw = pregunta.inciso_correcto;

    console.log(`\n🔍🔍🔍 PROCESANDO PREGUNTA ${pregunta.numero_preg} (Índice: ${index})`);
    console.log(`📋 TIPO: ${pregunta.tipo}`);
    console.log(`📝 RESPUESTA ESTUDIANTE RAW: "${respuestaEstudianteRaw}" (tipo: ${typeof respuestaEstudianteRaw})`);
    console.log(`📝 RESPUESTA CORRECTA RAW: "${respuestaCorrectaRaw}" (tipo: ${typeof respuestaCorrectaRaw})`);

    // 🎯 FUNCIÓN MEJORADA PARA NORMALIZAR RESPUESTAS V/F
    // ESPECIALMENTE PARA: 1->V, 2->F
    const normalizarRespuestaVerdaderoFalso = (valor) => {
      if (valor === null || valor === undefined || valor === '') {
        return '';
      }
      
      // Convertir a string y limpiar
      let strValor = valor.toString().trim().toUpperCase();
      
      console.log(`   🔄 Normalizando V/F: "${valor}" -> "${strValor}"`);
      
      // 🎯 ESPECIAL: 1 = VERDADERO, 2 = FALSO
      if (strValor === '1') {
        console.log(`   🔢 1 → VERDADERO (V)`);
        return 'V';
      }
      if (strValor === '2') {
        console.log(`   🔢 2 → FALSO (F)`);
        return 'F';
      }
      
      // Mapeo exhaustivo para VERDADERO
      if (strValor === 'V' || strValor === 'A' || strValor === 'VERDADERO' || 
          strValor === 'TRUE' || strValor === 'SÍ' || strValor === 'SI' || 
          strValor === 'YES' || strValor === 'T' || strValor === 'V') {
        console.log(`   ✅ Convertido a VERDADERO (V)`);
        return 'V';
      }
      
      // Mapeo exhaustivo para FALSO
      if (strValor === 'F' || strValor === 'B' || strValor === 'FALSO' || 
          strValor === 'FALSE' || strValor === '0' || strValor === 'NO' || 
          strValor === 'N' || strValor === 'FALSE') {
        console.log(`   ✅ Convertido a FALSO (F)`);
        return 'F';
      }
      
      console.log(`   ⚠️ No se pudo normalizar: "${strValor}"`);
      return strValor;
    };

    const normalizarRespuestaMultiple = (valor) => {
      if (valor === null || valor === undefined || valor === '') {
        return '';
      }
      
      let strValor = valor.toString().trim().toUpperCase();
      
      console.log(`   🔄 Normalizando múltiple: "${valor}" -> "${strValor}"`);
      
      // Mapeo de números a letras
      const mapeoNumeros = {
        '1': 'A', '2': 'B', '3': 'C', '4': 'D',
        '5': 'E', '6': 'F', '7': 'G', '8': 'H'
      };
      
      if (mapeoNumeros[strValor]) {
        console.log(`   🔢 Convertido número: "${strValor}" -> "${mapeoNumeros[strValor]}"`);
        return mapeoNumeros[strValor];
      }
      
      // Si ya es letra A-H, dejarla
      if (/^[A-H]$/.test(strValor)) {
        return strValor;
      }
      
      return strValor;
    };

    // 🎯 FUNCIÓN ESPECIAL PARA COMPARAR V/F CON 1/2
    const compararVerdaderoFalsoConNumeros = (estudiante, correcta) => {
      console.log(`   🧮 Comparación especial V/F con números:`);
      console.log(`      Estudiante: "${estudiante}"`);
      console.log(`      Correcta: "${correcta}"`);
      
      // Si ambos son números, convertir a V/F primero
      if (!isNaN(estudiante) && !isNaN(correcta)) {
        const estudianteVF = estudiante === '1' ? 'V' : (estudiante === '2' ? 'F' : estudiante);
        const correctaVF = correcta === '1' ? 'V' : (correcta === '2' ? 'F' : correcta);
        console.log(`      Estudiante ${estudiante} → ${estudianteVF}`);
        console.log(`      Correcta ${correcta} → ${correctaVF}`);
        return estudianteVF === correctaVF;
      }
      
      // Si solo la correcta es número
      if (!isNaN(correcta)) {
        const correctaVF = correcta === '1' ? 'V' : (correcta === '2' ? 'F' : correcta);
        console.log(`      Correcta ${correcta} → ${correctaVF}`);
        return estudiante === correctaVF;
      }
      
      // Si solo el estudiante es número
      if (!isNaN(estudiante)) {
        const estudianteVF = estudiante === '1' ? 'V' : (estudiante === '2' ? 'F' : estudiante);
        console.log(`      Estudiante ${estudiante} → ${estudianteVF}`);
        return estudianteVF === correcta;
      }
      
      // Caso normal
      return estudiante === correcta;
    };

    // NORMALIZAR según tipo
    let respuestaEstudianteNormalizada = '';
    let respuestaCorrectaNormalizada = '';

    if (pregunta.tipo === 'verdadero_falso') {
      // Primero normalizamos
      respuestaEstudianteNormalizada = normalizarRespuestaVerdaderoFalso(respuestaEstudianteRaw);
      respuestaCorrectaNormalizada = normalizarRespuestaVerdaderoFalso(respuestaCorrectaRaw);
      
      console.log(`🔄 RESULTADO NORMALIZACIÓN V/F:`);
      console.log(`   Estudiante: "${respuestaEstudianteRaw}" -> "${respuestaEstudianteNormalizada}"`);
      console.log(`   Correcta:   "${respuestaCorrectaRaw}" -> "${respuestaCorrectaNormalizada}"`);
      
      // COMPARACIÓN V/F
      if (respuestaEstudianteNormalizada) {
        // Usar comparación especial que entiende 1/2
        esCorrecta = compararVerdaderoFalsoConNumeros(
          respuestaEstudianteNormalizada, 
          respuestaCorrectaNormalizada
        );
        
        notaObtenida = esCorrecta ? (parseFloat(pregunta.nota_pregunta) || 1) : 0;
        
        console.log(`✅✅✅ COMPARACIÓN V/F FINAL:`);
        console.log(`   "${respuestaEstudianteNormalizada}" vs "${respuestaCorrectaNormalizada}"`);
        console.log(`   RESULTADO: ${esCorrecta ? '✅ CORRECTA' : '❌ INCORRECTA'}`);
      } else {
        console.log(`⚠️ V/F: El estudiante no respondió`);
      }
      
    } else if (pregunta.tipo === 'opcion_multiple') {
      respuestaEstudianteNormalizada = normalizarRespuestaMultiple(respuestaEstudianteRaw);
      respuestaCorrectaNormalizada = normalizarRespuestaMultiple(respuestaCorrectaRaw);
      
      console.log(`🔄 RESULTADO NORMALIZACIÓN MULTIPLE:`);
      console.log(`   Estudiante: "${respuestaEstudianteRaw}" -> "${respuestaEstudianteNormalizada}"`);
      console.log(`   Correcta:   "${respuestaCorrectaRaw}" -> "${respuestaCorrectaNormalizada}"`);
      
      // COMPARACIÓN MÚLTIPLE
      if (respuestaEstudianteNormalizada) {
        esCorrecta = respuestaEstudianteNormalizada === respuestaCorrectaNormalizada;
        notaObtenida = esCorrecta ? (parseFloat(pregunta.nota_pregunta) || 1) : 0;

        console.log(`🔘🔘🔘 COMPARACIÓN MULTIPLE FINAL:`);
        console.log(`   "${respuestaEstudianteNormalizada}" vs "${respuestaCorrectaNormalizada}"`);
        console.log(`   RESULTADO: ${esCorrecta ? '✅ CORRECTA' : '❌ INCORRECTA'}`);
      } else {
        console.log(`⚠️ MULTIPLE: El estudiante no respondió`);
      }
      
    } else if (pregunta.tipo === 'desarrollo') {
      if (respuesta.respuesta_desarrollo) {
        necesitaRevision = true;
        notaObtenida = 0;
        console.log(`📝 Desarrollo: Necesita revisión manual`);
      } else {
        console.log(`📝 Desarrollo: Sin respuesta`);
      }
    } else {
      console.log(`❓ Tipo no manejado: ${pregunta.tipo}`);
    }

    // ACTUALIZAR ESTADÍSTICAS
    if (esCorrecta) correctas++;
    puntajeTotal += notaObtenida;

    // GUARDAR RESULTADO
    resultados[index] = {
      ...respuesta,
      es_correcta: esCorrecta,
      nota_obtenida: notaObtenida,
      necesita_revision: necesitaRevision,
      respuesta_estudiante_normalizada: respuestaEstudianteNormalizada,
      respuesta_correcta_normalizada: respuestaCorrectaNormalizada,
      // Información adicional para debugging
      _debug: {
        raw_estudiante: respuestaEstudianteRaw,
        raw_correcta: respuestaCorrectaRaw,
        tipo: pregunta.tipo
      }
    };

    console.log(`📝📝📝 RESULTADO FINAL PREG ${pregunta.numero_preg}: ${esCorrecta ? '✅' : '❌'}`);
    console.log('---'.repeat(20));
  });

  // 🎯 ESTADÍSTICAS FINALES
  const porcentaje = preguntasArray.length > 0 ? (correctas / preguntasArray.length) * 100 : 0;
  
  console.log('\n📊📊📊 ========== ESTADÍSTICAS FINALES ==========');
  console.log(`✅ Correctas: ${correctas} de ${preguntasArray.length}`);
  console.log(`🏆 Puntaje total: ${puntajeTotal}`);
  console.log(`📈 Porcentaje: ${porcentaje.toFixed(2)}%`);
  console.log('==============================================\n');
  
  return { 
    resultados, 
    estadisticas: { 
      correctas, 
      total: preguntasArray.length, 
      puntajeTotal,
      porcentaje 
    } 
  };
};

// 🧪 FUNCIÓN DE PRUEBA ESPECÍFICA PARA 1=V, 2=F
const probarCasosConNumeros = () => {
  console.log('🧪🧪🧪 PRUEBA ESPECIAL: 1=VERDADERO, 2=FALSO 🧪🧪🧪\n');
  
  const casosPrueba = [
    // CASOS donde la CORRECTA está como número
    { correcta: '1', estudiante: 'V', esperado: true, desc: 'Correcta=1(V), Est=V' },
    { correcta: '1', estudiante: '1', esperado: true, desc: 'Correcta=1(V), Est=1' },
    { correcta: '1', estudiante: 'VERDADERO', esperado: true, desc: 'Correcta=1(V), Est=VERDADERO' },
    { correcta: '1', estudiante: 'A', esperado: true, desc: 'Correcta=1(V), Est=A' },
    
    { correcta: '2', estudiante: 'F', esperado: true, desc: 'Correcta=2(F), Est=F' },
    { correcta: '2', estudiante: '2', esperado: true, desc: 'Correcta=2(F), Est=2' },
    { correcta: '2', estudiante: 'FALSO', esperado: true, desc: 'Correcta=2(F), Est=FALSO' },
    { correcta: '2', estudiante: 'B', esperado: true, desc: 'Correcta=2(F), Est=B' },
    
    // CASOS donde el ESTUDIANTE responde con número
    { correcta: 'V', estudiante: '1', esperado: true, desc: 'Correcta=V, Est=1(V)' },
    { correcta: 'F', estudiante: '2', esperado: true, desc: 'Correcta=F, Est=2(F)' },
    { correcta: 'A', estudiante: '1', esperado: true, desc: 'Correcta=A(V), Est=1(V)' },
    { correcta: 'B', estudiante: '2', esperado: true, desc: 'Correcta=B(F), Est=2(F)' },
    
    // CASOS INCORRECTOS
    { correcta: '1', estudiante: 'F', esperado: false, desc: 'Correcta=1(V), Est=F (INCORRECTO)' },
    { correcta: '2', estudiante: 'V', esperado: false, desc: 'Correcta=2(F), Est=V (INCORRECTO)' },
    { correcta: '1', estudiante: '2', esperado: false, desc: 'Correcta=1(V), Est=2(F) (INCORRECTO)' },
    { correcta: '2', estudiante: '1', esperado: false, desc: 'Correcta=2(F), Est=1(V) (INCORRECTO)' },
    
    // CASOS con VERDADERO/FALSO en texto
    { correcta: 'VERDADERO', estudiante: '1', esperado: true, desc: 'Correcta=VERDADERO, Est=1(V)' },
    { correcta: 'FALSO', estudiante: '2', esperado: true, desc: 'Correcta=FALSO, Est=2(F)' },
  ];

  let aciertos = 0;
  casosPrueba.forEach((caso, i) => {
    const preguntasTest = [{
      numero_preg: i + 1,
      tipo: 'verdadero_falso',
      inciso_correcto: caso.correcta,
      nota_pregunta: '1'
    }];

    const respuestasTest = {
      0: { inciso_seleccionado: caso.estudiante }
    };

    console.log(`🧪 CASO ${i + 1}: ${caso.desc}`);
    
    const resultado = compararRespuestasConCorrectas(preguntasTest, respuestasTest);
    const esCorrecto = resultado.estadisticas.correctas === (caso.esperado ? 1 : 0);
    
    if (esCorrecto) aciertos++;
    
    console.log(`   ${esCorrecto ? '✅' : '❌'} Resultado: ${resultado.estadisticas.correctas === 1 ? 'Correcto' : 'Incorrecto'} (Esperado: ${caso.esperado ? 'Correcto' : 'Incorrecto'})`);
    console.log('---'.repeat(10));
  });

  console.log(`\n📊 RESULTADO PRUEBAS: ${aciertos}/${casosPrueba.length} correctos (${((aciertos/casosPrueba.length)*100).toFixed(1)}%)`);
};

  const enviarRespuestas = async () => {
    if (enviando) return;

    const preguntasSinResponder = Object.values(respuestas).filter(r => 
      !r.inciso_seleccionado && !r.respuesta_desarrollo
    ).length;
    
    if (preguntasSinResponder > 0) {
      if (!window.confirm(`Tienes ${preguntasSinResponder} pregunta(s) sin responder. ¿Deseas enviar de todas formas?`)) {
        return;
      }
    }

    try {
      setEnviando(true);
      const token = getToken();

      let respuestasConNota, estadisticas;
      
      try {
        const resultado = compararRespuestasConCorrectas(preguntas, respuestas);
        respuestasConNota = resultado.resultados;
        estadisticas = resultado.estadisticas;
      } catch (error) {
        console.error('❌ ERROR en compararRespuestasConCorrectas:', error);
        respuestasConNota = respuestas;
        estadisticas = { correctas: 0, total: preguntas.length, puntajeTotal: 0, porcentaje: 0 };
      }

      setRespuestas(respuestasConNota);

      const resultados = [];
      const errores = [];

      for (const [index, respuesta] of Object.entries(respuestasConNota)) {
        const payload = {
          id_inscripcion: parseInt(inscripcionId),
          numero_preg: respuesta.numero_preg,
          inciso_seleccionado: respuesta.inciso_seleccionado,
          respuesta_desarrollo: respuesta.respuesta_desarrollo,
          es_correcta: respuesta.es_correcta,
          nota_obtenida: respuesta.nota_obtenida,
          fecha_respuesta: new Date().toISOString()
        };

        try {
          const response = await fetch('http://localhost:3000/respuestas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`HTTP ${response.status}: ${errorData.error || 'Error desconocido'}`);
          }
          
          const result = await response.json();
          resultados.push({ success: true, numero_preg: respuesta.numero_preg, data: result });
        } catch (error) {
          console.error(`❌ Error en pregunta ${respuesta.numero_preg}:`, error.message);
          errores.push({ 
            error: error.message, 
            numero_preg: respuesta.numero_preg,
            pregunta: index 
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const exitosas = resultados.filter(r => r.success);
      const totalPreguntas = preguntas.length;
      const puntajeTotal = preguntas.reduce((sum, p) => sum + (parseFloat(p.nota_pregunta) || 1), 0);
      const puntajeObtenido = Object.values(respuestasConNota).reduce((sum, r) => sum + (r.nota_obtenida || 0), 0);
      const preguntasDesarrollo = preguntas.filter(p => p.tipo === 'desarrollo').length;
      const preguntasParaRevisar = Object.values(respuestasConNota).filter(r => r.necesita_revision).length;

      let mensaje = `
¡Evaluación procesada! 🎉

📊 **RESULTADOS AUTOMÁTICOS:**
✅ Correctas: ${estadisticas.correctas}/${totalPreguntas}
📝 Preguntas de desarrollo: ${preguntasDesarrollo}
👨‍🏫 Para revisión del docente: ${preguntasParaRevisar}
🎯 Puntaje automático: ${puntajeObtenido.toFixed(1)}/${puntajeTotal.toFixed(1)}
📈 Porcentaje: ${estadisticas.porcentaje.toFixed(1)}%

📋 **ESTADO DEL ENVÍO:**
• Respuestas guardadas: ${exitosas.length}/${totalPreguntas}
`;

      if (errores.length > 0) {
        mensaje += `• Errores: ${errores.length} pregunta(s)\n`;
        mensaje += `• Preguntas con error: ${errores.map(e => e.numero_preg).join(', ')}\n\n`;
        mensaje += `⚠️ Las preguntas con error se guardarán localmente.`;
      } else {
        mensaje += `• ✅ Todas las respuestas guardadas correctamente\n\n`;
        mensaje += `📬 **PRÓXIMOS PASOS:**\n`;
        mensaje += `El docente revisará tus respuestas de desarrollo y completará la calificación final.`;
      }

      alert(mensaje.trim());

      if (exitosas.length >= totalPreguntas * 0.8) {
        if (onFinalizar) {
          onFinalizar();
        }
      }

    } catch (err) {
      console.error('❌ Error general al enviar respuestas:', err);
      setError('Error al enviar respuestas: ' + err.message);
      alert(`❌ Error crítico al enviar la evaluación:\n\n${err.message}`);
    } finally {
      setEnviando(false);
    }
  };

  // Cargar preguntas de la evaluación
  const cargarPreguntas = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`http://localhost:3000/preguntas/evaluacion/${evaluacion.id_evaluacion}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const preguntasData = await response.json();
        
        const preguntasActivas = preguntasData.filter(p => p.activo);

        const preguntasConOpciones = await Promise.all(
          preguntasActivas.map(async (pregunta) => {
            const tipoPregunta = determinarTipoPregunta(pregunta);
            const opciones = await crearOpcionesParaPregunta(pregunta, tipoPregunta);

            return {
              ...pregunta,
              tipo: tipoPregunta,
              opciones: opciones
            };
          })
        );

        setPreguntas(preguntasConOpciones);
        
        const respuestasIniciales = {};
        preguntasConOpciones.forEach((pregunta, index) => {
          respuestasIniciales[index] = {
            numero_preg: pregunta.numero_preg,
            inciso_seleccionado: pregunta.tipo !== 'desarrollo' ? null : '',
            respuesta_desarrollo: pregunta.tipo === 'desarrollo' ? '' : null,
            es_correcta: false,
            nota_obtenida: 0,
            necesita_revision: false
          };
        });
        setRespuestas(respuestasIniciales);
        
      } else {
        throw new Error('Error al cargar preguntas');
      }
    } catch (err) {
      setError('Error al cargar preguntas: ' + err.message);
      console.error("❌ Error completo:", err);
    } finally {
      setLoading(false);
    }
  }, [evaluacion.id_evaluacion, getToken]);

  // FUNCIÓN CORREGIDA: Manejar cambio de respuesta para desarrollo
  const handleRespuestaDesarrollo = useCallback((indexPregunta, valor) => {
    setRespuestas(prev => ({
      ...prev,
      [indexPregunta]: {
        ...prev[indexPregunta],
        respuesta_desarrollo: valor,
        inciso_seleccionado: null,
        necesita_revision: true
      }
    }));
  }, []);

  // FUNCIÓN CORREGIDA: Manejar selección de respuesta para opción múltiple y V/F
  const handleSeleccionOpcion = useCallback((indexPregunta, inciso) => {
    setRespuestas(prev => ({
      ...prev,
      [indexPregunta]: {
        ...prev[indexPregunta],
        inciso_seleccionado: inciso,
        respuesta_desarrollo: null
      }
    }));
  }, []);

  // Contador de tiempo
  useEffect(() => {
    let intervalo;
    if (evaluacion.duracion_minutos) {
      const duracionMs = evaluacion.duracion_minutos * 60 * 1000;
      const finEvaluacion = new Date().getTime() + duracionMs;
      
      intervalo = setInterval(() => {
        const ahora = new Date().getTime();
        const restante = finEvaluacion - ahora;
        
        if (restante <= 0) {
          clearInterval(intervalo);
          setTiempoRestante('Tiempo agotado');
          enviarRespuestas();
        } else {
          const minutos = Math.floor(restante / (1000 * 60));
          const segundos = Math.floor((restante % (1000 * 60)) / 1000);
          setTiempoRestante(`${minutos}:${segundos.toString().padStart(2, '0')}`);
        }
      }, 1000);
    }

    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [evaluacion.duracion_minutos]);

  useEffect(() => {
    if (evaluacion && inscripcionId) {
      cargarPreguntas();
    }
  }, [evaluacion, inscripcionId, cargarPreguntas]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 dark:text-white">Cargando evaluación</p>
          <p className="text-gray-600 dark:text-gray-400">Preparando las preguntas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Error</h3>
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header de la evaluación */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-3">{evaluacion.nombre_evaluacion}</h1>
            {evaluacion.descripcion && (
              <p className="text-blue-100 text-lg opacity-90">
                {evaluacion.descripcion}
              </p>
            )}
            <div className="flex flex-wrap gap-3 mt-4">
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                📊 {preguntas.length} Preguntas
              </span>
              {evaluacion.duracion_minutos && (
                <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                  ⏱️ {evaluacion.duracion_minutos} minutos
                </span>
              )}
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                🎯 {calcularPuntajeTotal()} Puntos totales
              </span>
            </div>
          </div>
          
          {tiempoRestante && (
            <div className="bg-white/20 backdrop-blur-sm px-6 py-4 rounded-2xl text-center lg:text-right">
              <div className="text-sm font-medium text-blue-100 mb-1">Tiempo restante</div>
              <div className="text-2xl font-mono font-bold bg-white/10 px-4 py-2 rounded-lg">
                {tiempoRestante}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{preguntas.length}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-green-200 dark:border-green-800 shadow-sm">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {Object.values(respuestas).filter(r => r.inciso_seleccionado || r.respuesta_desarrollo).length}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">Respondidas</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-orange-200 dark:border-orange-800 shadow-sm">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {Object.values(respuestas).filter(r => !r.inciso_seleccionado && !r.respuesta_desarrollo).length}
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">Pendientes</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center border border-blue-200 dark:border-blue-800 shadow-sm">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {calcularPuntajeTotal()}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Puntos totales</div>
        </div>
      </div>

      {/* Información importante */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1">
            <span className="text-white text-sm font-bold">ℹ️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
              Información importante sobre la evaluación
            </h3>
            <ul className="text-blue-700 dark:text-blue-400 space-y-1 text-sm">
              <li>• Las preguntas de <strong>opción múltiple y verdadero/falso</strong> se califican automáticamente</li>
              <li>• Las preguntas de <strong>desarrollo</strong> serán revisadas por el docente</li>
              <li>• La calificación final se completará cuando el docente revise todas las respuestas</li>
              <li>• Al enviar, recibirás un resumen de tus resultados automáticos</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Lista de preguntas */}
      <div className="space-y-8">
        {preguntas && preguntas.map((pregunta, index) => (
          <div 
            key={pregunta.numero_preg || index}
            className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden"
          >
            {/* Encabezado de la pregunta */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-8 py-6 border-b border-gray-200 dark:border-gray-600">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Pregunta {index + 1}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTipoColor(pregunta.tipo)}`}>
                        {getTipoIcono(pregunta.tipo)} {
                          pregunta.tipo === 'verdadero_falso' ? 'Verdadero/Falso' :
                          pregunta.tipo === 'opcion_multiple' ? 'Opción Múltiple' : 'Desarrollo'
                        }
                      </span>
                      <span className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-xs font-bold">
                        🎯 {getNotaPregunta(pregunta)} punto{getNotaPregunta(pregunta) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Estado de respuesta */}
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                  respuestas[index]?.inciso_seleccionado || respuestas[index]?.respuesta_desarrollo
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
                }`}>
                  {respuestas[index]?.inciso_seleccionado || respuestas[index]?.respuesta_desarrollo
                    ? '✅ Respondida' : '⏳ Pendiente'}
                </div>
              </div>
            </div>

            {/* Contenido de la pregunta */}
            <div className="p-8">
              {pregunta.tipo === 'verdadero_falso' ? (
                <PreguntaVerdaderoFalso 
                  pregunta={pregunta}
                  index={index}
                  respuesta={respuestas[index]}
                  onChange={handleSeleccionOpcion}
                />
              ) : pregunta.tipo === 'opcion_multiple' ? (
                <PreguntaOpcionMultiple 
                  pregunta={pregunta}
                  index={index}
                  respuesta={respuestas[index]}
                  onChange={handleSeleccionOpcion}
                />
              ) : (
                <PreguntaDesarrollo 
                  pregunta={pregunta}
                  index={index}
                  respuesta={respuestas[index]}
                  onChange={handleRespuestaDesarrollo}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Botón de enviar flotante */}
      <div className="sticky bottom-6 z-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-2xl backdrop-blur-sm bg-white/95 dark:bg-gray-800/95">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="text-center sm:text-left">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Progreso: {Object.values(respuestas).filter(r => r.inciso_seleccionado || r.respuesta_desarrollo).length} de {preguntas.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {Object.values(respuestas).filter(r => !r.inciso_seleccionado && !r.respuesta_desarrollo).length} preguntas pendientes
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                {preguntas.filter(p => p.tipo === 'desarrollo').length} preguntas de desarrollo para revisión del docente
              </p>
            </div>
            <button
              onClick={enviarRespuestas}
              disabled={enviando}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
            >
              {enviando ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  <span>Enviando respuestas...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Finalizar Evaluación</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResolverEvaluacion;