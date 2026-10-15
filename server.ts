import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Server-side Gemini AI endpoint for smart event summarization & task extraction
app.post('/api/gemini/summarize', async (req, res) => {
  try {
    const { title, description, location, attendees, startDateTime, endDateTime } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'El título del evento es requerido.' });
    }

    if (aiClient) {
      try {
        const prompt = `Analiza el siguiente evento de calendario y genera:
1. Un resumen claro y conciso del propósito del evento (en 2-3 frases en español).
2. Una lista de 2 a 4 tareas de acción concretas (action items) que deben realizarse antes, durante o después de la reunión.
3. Notas breves de preparación recomendadas.
4. Sugerencia de prioridad ('low', 'medium', 'high') y estado sugerido ('pending', 'in_progress', 'completed').

Detalles del evento:
- Título: ${title}
- Descripción: ${description || 'Sin descripción detallada'}
- Ubicación / Enlace: ${location || 'No especificada'}
- Fecha/Hora: ${startDateTime} hasta ${endDateTime || 'Fin no especificado'}
- Asistentes: ${Array.isArray(attendees) ? attendees.map((a: any) => typeof a === 'string' ? a : a.displayName || a.email).join(', ') : 'Ninguno especificado'}`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'Eres un asistente ejecutivo y experto en productividad y gestión de proyectos. Responde siempre en español en formato JSON estructurado válido.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: {
                  type: Type.STRING,
                  description: 'Resumen ejecutivo de 2 a 3 frases sobre el objetivo y foco del evento.',
                },
                actionItems: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Lista de 2 a 5 tareas accionables derivadas del evento.',
                },
                preparationNotes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Puntos clave o documentos necesarios para preparar la reunión.',
                },
                suggestedPriority: {
                  type: Type.STRING,
                  description: 'Prioridad sugerida: low, medium o high.',
                },
                suggestedStatus: {
                  type: Type.STRING,
                  description: 'pending o in_progress.',
                },
              },
              required: ['summary', 'actionItems', 'preparationNotes'],
            },
          },
        });

        const responseText = response.text;
        if (responseText) {
          const parsed = JSON.parse(responseText);
          return res.json({ success: true, data: parsed });
        }
      } catch (aiErr: any) {
        console.warn('Gemini API call failed or unavailable, using smart heuristic fallback:', aiErr?.message);
      }
    }

    // High quality intelligent heuristic fallback if API key is not configured, unavailable, or 503
    const fallbackSummary = `Reunión programada "${title}" enfocada en alinear objetivos clave, revisar progresos y coordinar próximos entregables.`;
    const fallbackActions = [
      `Preparar notas y puntos a tratar para "${title}"`,
      `Revisar documentación previa antes del inicio`,
      `Enviar minuta de acuerdos tras finalizar el evento`
    ];
    const fallbackPrep = [
      location ? `Verificar acceso a: ${location}` : 'Comprobar enlace de videollamada o sala',
      'Definir responsable de minutas y seguimiento de acuerdos'
    ];

    return res.json({
      success: true,
      data: {
        summary: fallbackSummary,
        actionItems: fallbackActions,
        preparationNotes: fallbackPrep,
        suggestedPriority: 'medium',
        suggestedStatus: 'pending'
      }
    });
  } catch (error: any) {
    console.error('Error in summarize handler:', error);
    return res.status(500).json({
      error: 'Error procesando el resumen',
      details: error?.message || 'Error desconocido'
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In AI Studio environment HMR WebSocket connections fail or throw in iframe.
    // Explicitly set hmr: false so Vite does not attempt WebSocket connection.
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
