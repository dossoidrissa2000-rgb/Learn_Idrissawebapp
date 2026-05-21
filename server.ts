import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client with a clear error helper if missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it via Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Ensure the server can boot even if the API key is not active yet (fails gracefully on request)
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Endpoint: Course Builder using Gemini Structured Output Schema
app.post("/api/gemini/generate-course", async (req, res) => {
  try {
    const { topic, level } = req.body;
    if (!topic) {
      res.status(400).json({ error: "El tema de estudio es requerido" });
      return;
    }

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Por favor genera un curso interactivo completo y bien estructurado en español sobre el tema: "${topic}". El nivel de dificultad debe ser: "${level || "Principiante"}". Genera lecciones detalladas y sugerentes.`,
      config: {
        systemInstruction: `Eres un educador experto de LearnAI. Tu objetivo es estructurar cursos de aprendizaje dinámicos, bien organizados y motivantes. Escribe los títulos y descripciones en español.
Elige un tipo de imagen entre estos valores exactos según la temática: 'Marketing', 'Fotografia', 'Programacion', 'Diseno', 'Negocios', 'Finanzas', 'Idiomas', 'Musica', 'Escritura', 'Video', 'Salud', 'Ciencia', 'Tecnologia' o 'DesarrolloPersonal'.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Título del curso generado" },
            category: { type: Type.STRING, description: "Categoría general en español" },
            description: { type: Type.STRING, description: "Descripción atractiva resumida del curso" },
            level: { type: Type.STRING, description: "Nivel de dificultad: Principiante, Intermedio o Avanzado" },
            imageType: { type: Type.STRING, description: "El valor del tipo de imagen exacto para mapear el icono" },
            modulesCount: { type: Type.INTEGER, description: "Número de módulos totales (recomienda entre 2 y 4)" },
            modules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Título del módulo" },
                  description: { type: Type.STRING, description: "Descripción del objetivo del módulo" },
                  lessons: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING, description: "Título de la lección" },
                        subtitle: { type: Type.STRING, description: "Subtítulo o concepto clave" },
                        content: { type: Type.STRING, description: "Contenido didáctico completo en español de la lección (usa Markdown, incluye explicaciones paso a paso, ejemplos prácticos y una pequeña pregunta de autocomprobación al final con respuesta explicada)" }
                      }
                    }
                  }
                }
              }
            }
          },
          required: ["title", "category", "description", "level", "imageType", "modulesCount", "modules"]
        },
      },
    });

    const parsedCourse = JSON.parse(response.text || "{}");
    res.json(parsedCourse);
  } catch (err: any) {
    console.error("Error generating course:", err);
    res.status(500).json({ error: err.message || "Error al generar el curso" });
  }
});

// Endpoint: AI Tutor Chat grounded in Google Search
app.post("/api/gemini/chat-tutor", async (req, res) => {
  try {
    const { messages, topicContext } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Mensajes inválidos o ausentes" });
      return;
    }

    const ai = getGeminiClient();

    // Map history to parameters
    const promptMessage = messages[messages.length - 1]?.content || "Hola";
    const systemInstruction = `Eres un tutor personal inteligente interactivo de LearnAI. Tu objetivo es explicar cualquier concepto sobre "${topicContext || "cualquier tema inteligente"}" de manera sumamente clara, pedagógica, visual y amigable en español.
Usa formato Markdown rico para tus respuestas. Si es necesario, sugiere ejemplos sencillos, analogías útiles y haz preguntas de seguimiento para animar al estudiante.
Siempre busca información veraz usando la herramienta Google Search incorporada si surgen dudas técnicas o tendencias de actualidad.`;

    // Process previous turns in conversation
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const botText = response.text || "";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.map((c: any) => ({
      title: c.web?.title || c.web?.uri,
      uri: c.web?.uri,
    })).filter((s: any) => s.uri);

    res.json({
      role: "model",
      content: botText,
      sources,
    });
  } catch (err: any) {
    console.error("Error in AI Tutor Chat:", err);
    res.status(500).json({ error: err.message || "Error al procesar el chat con el tutor" });
  }
});

// Configure Vite middleware / static assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LearnAI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
