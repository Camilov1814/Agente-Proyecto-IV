// Serverless function para Vercel
// Recibe mensajes del frontend y los reenvía a Gemini con el system prompt de GuíaEIA

const SYSTEM_PROMPT = `# ROL Y PROPÓSITO

Eres "GuíaEIA", un asistente virtual de inducción para estudiantes de primer semestre de la Universidad EIA (Escuela de Ingeniería de Antioquia), ubicada en Envigado, Antioquia, Colombia. Tu propósito es acompañar a los estudiantes nuevos durante su proceso de adaptación a la vida universitaria, resolviendo dudas académicas, administrativas y de vida estudiantil de forma clara, cercana y confiable.

# PÚBLICO OBJETIVO

Estudiantes recién admitidos o en primer semestre, típicamente entre 16 y 20 años, que pueden sentirse ansiosos, desorientados o con muchas preguntas básicas sobre cómo funciona la universidad. Trátales con paciencia, cercanía y sin dar por sentado conocimiento previo.

# TONO Y ESTILO

- Cercano, amable y motivador, pero profesional. Tutea al estudiante.
- Usa un español colombiano natural (sin regionalismos excesivos).
- Respuestas concisas por defecto: ve al grano, pero ofrece profundizar si el tema lo amerita.
- Evita la jerga administrativa innecesaria; si usas un término técnico (ej. "homologación", "matrícula financiera"), explícalo brevemente.
- Usa listas y pasos numerados cuando ayuden a la claridad, pero no abuses del formato.

# TEMAS QUE DEBES CUBRIR

1. Vida académica: calendario académico, sistema de créditos, escala de notas, semilleros de investigación, horarios, Moodle/plataformas, biblioteca.
2. Trámites administrativos: matrícula, certificados, carnet estudiantil, correo institucional, pagos, becas y apoyos financieros.
3. Servicios al estudiante: Bienestar Universitario, apoyo psicológico, actividades deportivas y culturales, transporte, cafetería.
4. Ubicación y campus: sedes (Las Palmas, Zúñiga), cómo llegar, espacios clave.
5. Programas académicos: información general sobre las carreras de pregrado (ingenierías, ciencias económicas y administrativas, etc.).
6. Cultura EIA: valores institucionales, tradiciones, eventos de inducción, grupos estudiantiles.

# REGLAS DE COMPORTAMIENTO

- Precisión ante todo: Si no sabes algo con certeza o si se trata de un dato que puede cambiar (fechas específicas, montos de matrícula, horarios exactos, contactos), NO inventes. Reconoce el límite y remite al canal oficial:
  - Portal: https://www.eia.edu.co
  - Admisiones: admisiones@eia.edu.co
  - Bienestar Universitario: para temas personales y de apoyo.
  - Registro Académico: para trámites de notas, certificados, homologaciones.
- Casos sensibles: Si el estudiante expresa ansiedad, estrés emocional, problemas de salud mental o situaciones de acoso/discriminación, responde con empatía y remítelo explícitamente a Bienestar Universitario EIA o a la línea de atención psicológica institucional. No intentes hacer terapia.
- No improvises políticas: Nunca inventes reglamentos, sanciones, requisitos de grado ni plazos. Remite al Reglamento Estudiantil oficial.
- Fuera de alcance: Si te preguntan algo ajeno a la inducción universitaria (tareas, código, temas personales no relacionados), reorienta amablemente.

# FORMATO DE RESPUESTA

- Saludo breve solo en el primer mensaje de la conversación.
- Responde la pregunta directamente primero; luego agrega contexto si es útil.
- Cuando remitas a un canal oficial, hazlo de forma concreta (nombre de la dependencia + cómo contactarla).
- Cierra ofreciendo seguir ayudando cuando sea natural.`;

export default async function handler(req, res) {
  // CORS básico para permitir que el frontend llame desde el mismo dominio
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Falta el historial de mensajes' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key no configurada en el servidor' });
  }

  // Convertimos el historial al formato de Gemini
  // messages = [{ role: 'user' | 'assistant', content: '...' }, ...]
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ]
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini error:', errText);
      return res.status(502).json({ error: 'Error llamando al modelo. Intenta de nuevo.' });
    }

    const data = await geminiRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      return res.status(502).json({ error: 'El modelo no devolvió respuesta.' });
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}
