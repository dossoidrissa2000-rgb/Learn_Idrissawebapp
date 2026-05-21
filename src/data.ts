import { Course } from "./types";

export const DEFAULT_COURSES: Course[] = [
  {
    id: "mkt_digital_101",
    title: "Marketing Digital y Estrategia de Contenidos",
    description: "Domina el arte de crear contenido relevante para construir audiencias, diseñar campañas de SEO y optimizar conversiones en redes sociales.",
    category: "Marketing",
    level: "Intermedio",
    imageType: "Marketing",
    modulesCount: 2,
    isAIGenerated: false,
    createdBy: "system",
    createdAt: "2026-05-21T18:22:28Z",
    modules: [
      {
        title: "Modelos de Embudo y Audiencias",
        description: "Comprende a tu buyer persona y el recorrido del comprador en canales de adquisición digital.",
        lessons: [
          {
            title: "Definiendo al Buyer Persona",
            subtitle: "La base de toda estrategia",
            content: `El **Buyer Persona** es una representación semi-ficticia de tu cliente ideal basada en investigaciones de mercado y datos reales de tus clientes actuales.

### Elementos clave para definir tu avatar:
1. **Datos Demográficos**: Edad, ubicación, ingresos, nivel educativo.
2. **Dolores (Pains)**: ¿Cuáles son las frustraciones y problemas principales que enfrenta en su día a día?
3. **Objetivos**: ¿Qué intenta lograr a nivel personal o profesional?
4. **Hábitos de Medios**: ¿Dónde consume información? ¿Instagram, LinkedIn, blogs técnicos?

> **Ejemplo**: "Sofía, desarrolladora frontend de 28 años, busca ascender a arquitecta de software pero siente que carece de conocimientos de arquitectura de nube (Dolor). Investiga principalmente mediante hilos técnicos de Twitter y posts en Dev.to (Hábitos de Medios)."

---
#### 📝 Autocomprobación:
**Pregunta**: ¿Qué diferencia hay entre público objetivo y buyer persona?
**Respuesta**: El público objetivo es directo pero abstracto (ej: mujeres de 25-35 años en tecnología), mientras que el buyer persona añade motivaciones cualitativas, frustraciones y nombres detallados para humanizar el enfoque de venta.`
          },
          {
            title: "El Embudo de Conversión (AIDA)",
            subtitle: "Atención, Interés, Deseo y Acción",
            content: `El embudo o funnel representa las etapas psicológicas por las que pasa un cliente antes de efectuar una compra.

*   **A - Atención (Attention)**: Conseguir que el usuario note nuestra existencia mediante anuncios, SEO o contenido viral.
*   **I - Interés (Interest)**: Educar al cliente. Mostrar que entendemos su problema específico.
*   **D - Deseo (Desire)**: Presentar nuestro producto/servicio como la píldora mágica o la mejor solución viable.
*   **A - Acción (Action)**: El botón "Comprar", "Descargar" o "Suscribirse" (Llamado a la Acción o CTA).

### Optimización del Funnel:
Monitorea siempre el porcentaje de usuarios que pasan de una etapa a otra (Tasa de Conversión). Un cuello de botella común es tener mucha atención pero nulo interés.`
          }
        ]
      },
      {
        title: "SEO y Copywriting Magnético",
        description: "Optimiza contenido para motores de búsqueda de Google y perfecciona la escritura persuasiva.",
        lessons: [
          {
            title: "Algoritmos de Búsqueda y SEO On-Page",
            subtitle: "Cómo hablar el lenguaje del buscador de Google",
            content: `El SEO (Search Engine Optimization) On-Page consiste en optimizar factores internos de tu sitio web para mejorar la visibilidad.

### Factores Críticos:
1. **Títulos (H1, H2, H3)**: Deben contener palabras clave relevantes cerca de la izquierda.
2. **Meta Descripción**: El resumen que aparece bajo tu link en Google. Debe generar intriga y contener la palabra clave.
3. **Velocidad de Carga**: Google penaliza páginas lentas (Core Web Vitals).
4. **URL amigables**: En lugar de \`sitio.com/p?id=382\`, usa \`sitio.com/marketing/seo-onpage\`.`
          }
        ]
      }
    ]
  },
  {
    id: "foto_prof_101",
    title: "Fotografía Profesional y Dirección de Luz",
    description: "Aprende el manejo de cámaras reflex/mirrorless, composición artística, medición de luz en estudio y fotometría.",
    category: "Fotografía",
    level: "Principiante",
    imageType: "Fotografia",
    modulesCount: 2,
    isAIGenerated: false,
    createdBy: "system",
    createdAt: "2026-05-21T18:22:28Z",
    modules: [
      {
        title: "El Triángulo de Exposición",
        description: "Ajusta apertura del diafragma, velocidad de obturación e ISO para dominar la luz entrante.",
        lessons: [
          {
            title: "Apertura del Diafragma (f/)",
            subtitle: "Luz y profundidad de campo",
            content: `La apertura controla cuánta luz atraviesa el lente de la cámara mediante el diafragma. Se expresa con el número **f/**.

*   **Aperturas grandes (f/1.4, f/1.8, f/2.8)**: Pasa mucha luz. Producen una profundidad de campo reducida, ideal para retratos con fondos desenfocados (efecto *bokeh*).
*   **Aperturas pequeñas (f/8, f/11, f/16)**: Pasa menos luz. Toda la escena se ve nítida, ideal para paisajes.

> **Regla de Oro**: A menor número tras la "f", mayor será la apertura y más desenfocado estará el fondo de tu fotografía.`
          },
          {
            title: "Velocidad de Obturación",
            subtitle: "Congelar o difuminar movimiento",
            content: `El tiempo de obturación define cuánto tiempo permanece abierto el sensor al recibir la luz exterior. Se calcula en fracciones de segundo (ej: \`1/500\` o \`1/2\`).

*   **Velocidades Rápidas (\`1/1000\`, \`1/2000s\`)**: Congelan acciones rapidísimas (deportes, aves volando).
*   **Velocidades Lentas (\`1/15\`, \`1s\`, \`10s\`)**: Crean barrido de movimiento o el hermoso efecto "agua de seda" en ríos, pero requieren que utilices un **trípode** obligatorio para evitar vibraciones.`
          }
        ]
      },
      {
        title: "Composición Fotográfica Artística",
        description: "Aplica las leyes compositivas básicas para dirigir la mirada del espectador.",
        lessons: [
          {
            title: "La Regla de los Tercios",
            subtitle: "Puntos fuertes de atención",
            content: `Divide tu encuadre con dos líneas horizontales y dos verticales de igual distancia. Obtendrás 9 recuadros simétricos.

Ubica los elementos clave de tu imagen en las intersecciones (puntos fuertes), en lugar de centrar rígidamente al sujeto. Esto añade dinamismo visual y balance instantáneo a la fotografía.`
          }
        ]
      }
    ]
  },
  {
    id: "python_intro_202",
    title: "Introducción a Python y Automatización",
    description: "Aprende los conceptos fundamentales de programación utilizando Python, manipulando archivos y automatizando tareas rutinarias.",
    category: "Programación",
    level: "Avanzado",
    imageType: "Programacion",
    modulesCount: 2,
    isAIGenerated: false,
    createdBy: "system",
    createdAt: "2026-05-21T18:22:28Z",
    modules: [
      {
        title: "Estructuras de Control y Datos",
        description: "Variables, bucles loops, condicionales y listas básicas en Python.",
        lessons: [
          {
            title: "Variables y Estructuras Condicionales",
            subtitle: "Tomando decisiones con código",
            content: `En Python, el código se caracteriza por ser claro y legible. No requiere declarar el tipo de variables de forma explícita.

\`\`\`python
# Definición de variables simples
edad = 25
nombre = "Juan Perez"
es_estudiante = True

# Estructura condicional IF
if edad >= 18:
    print(f"{nombre} es mayor de edad y puede ingresar.")
else:
    print(f"{nombre} es menor de edad.")
\`\`\`

### El poder de la Indentación:
Python no utiliza llaves \`{}\` para definir bloques de código; utiliza **espacios de indentación**. Si la indentación falla, tu script fallará de inmediato. ¡Sé cuidadoso!`
          },
          {
            title: "Bucles For y While",
            subtitle: "Iterando por colecciones de datos",
            content: `Los bucles te permiten repetir instrucciones un número finito de veces.

\`\`\`python
# Iterando una lista de cursos con bucle For
categorias = ["Marketing", "Fotografía", "Diseño", "Finanzas"]
for cat in categorias:
    print(f"Me gustaría aprender sobre: {cat}")
\`\`\`

#### Caso de Uso:
El bucle \`for\` ejecuta sentencias sobre una secuencia (listas, tuplas, strings), mientras que el bucle \`while\` se repite indefinidamente hasta que una condición lógica se convierta en falsa.`
          }
        ]
      },
      {
        title: "Automatización Práctica de Escritorio",
        description: "Crea scripts utilitarios que ordenan carpetas y leen información de ficheros externos.",
        lessons: [
          {
            title: "Manejo de archivos con 'os' y 'shutil'",
            subtitle: "Organizador de carpetas inteligente",
            content: `Imagina organizar miles de descargas automáticamente por su extensión en 20 líneas de código.`
          }
        ]
      }
    ]
  },
  {
    id: "diseno_graf_303",
    title: "Diseño Gráfico, UI/UX y Wireframes",
    description: "Explora la teoría del color, tipografía digital, composición asimétrica y el diseño de interfaces web modernas.",
    category: "Diseño Gráfico",
    level: "Intermedio",
    imageType: "Diseno",
    modulesCount: 2,
    isAIGenerated: false,
    createdBy: "system",
    createdAt: "2026-05-21T18:22:28Z",
    modules: [
      {
        title: "Teoría del Color y Psicología",
        description: "Selecciona paletas cromáticas armónicas y comprende lo que evoca cada color en el usuario.",
        lessons: [
          {
            title: "La Psicología de los Colores",
            subtitle: "Evocando emociones sin palabras",
            content: `Cada color tiene un impacto neurológico específico en la comunicación:
*   **Azul**: Credibilidad, seguridad, profesionalismo (usado por Facebook, bancos).
*   **Negro**: Elegancia, premium, minimalismo (usado por Apple, marcas de lujo).
*   **Rojo**: Energía, urgencia, pasión (usado por Netflix, Coca-Cola).`
          }
        ]
      }
    ]
  },
  {
    id: "negocios_404",
    title: "Negocios, Startups Lean y Modelo Canvas",
    description: "Valida tu propuesta de valor, diseña el lienzo de modelado de negocio Canvas y planifica finanzas básicas.",
    category: "Negocios",
    level: "Intermedio",
    imageType: "Negocios",
    modulesCount: 1,
    isAIGenerated: false,
    createdBy: "system",
    createdAt: "2026-05-21T18:22:28Z",
    modules: [
      {
        title: "Metodología Lean Startup",
        description: "Aprende el ciclo Construir, Medir, Aprender para lanzar ideas de negocio con mínimo capital.",
        lessons: [
          {
            title: "El Producto Mínimo Viable (MVP)",
            subtitle: "Validación real antes del escalado",
            content: `El MVP es la versión más simplificada de tu producto que te permite recopilar la máxima cantidad de aprendizaje validado sobre los clientes con el menor esfuerzo posible.`
          }
        ]
      }
    ]
  },
  {
    id: "finanzas_505",
    title: "Finanzas Personales e Inversiones Inteligentes",
    description: "Desarrolla hábitos de ahorro sostenibles, entiende el interés compuesto y crea portafolios diversificados.",
    category: "Finanzas",
    level: "Principiante",
    imageType: "Finanzas",
    modulesCount: 1,
    isAIGenerated: false,
    createdBy: "system",
    createdAt: "2026-05-21T18:22:28Z",
    modules: [
      {
        title: "El Interés Compuesto",
        description: "Comprende la matemática financiera que acelera tu riqueza a largo plazo.",
        lessons: [
          {
            title: "La Magia de la Capitalización Continua",
            subtitle: "El factor tiempo vs monto",
            content: `El interés compuesto ocurre cuando reinviertes los intereses ganados en tu capital de forma que el saldo crece de forma exponencial con el paso de los años.`
          }
        ]
      }
    ]
  }
];
