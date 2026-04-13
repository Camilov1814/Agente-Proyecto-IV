# GuíaEIA · Asistente Virtual de Inducción

Chatbot web para estudiantes de primer semestre de la Universidad EIA. Responde dudas sobre vida académica, trámites, bienestar universitario y cultura institucional.

**Stack:** HTML/CSS/JS vanilla + Google Gemini API (tier gratuito) + Vercel serverless.

---

## Arquitectura

```
Estudiante → index.html → /api/chat (serverless) → Gemini API
```

La API key de Gemini vive solo en el servidor (variable de entorno en Vercel), nunca se expone al frontend.

---

## Deploy paso a paso

### 1. Obtener API key de Gemini (gratis, 3 min)

1. Entra a [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Inicia sesión con tu cuenta Google
3. Clic en **"Create API key"** → selecciona o crea un proyecto
4. Copia la clave (empieza con `AIza...`)

> El tier gratuito de `gemini-2.5-flash` tiene límites generosos: suficiente para que 20–50 compañeros lo prueben durante la inducción.

### 2. Subir el código a GitHub

```bash
cd guiaeia
git init
git add .
git commit -m "Primer deploy de GuiaEIA"
```

Crea un repositorio nuevo en [github.com/new](https://github.com/new) (puede ser privado), luego:

```bash
git remote add origin https://github.com/TU_USUARIO/guiaeia.git
git branch -M main
git push -u origin main
```

### 3. Desplegar en Vercel (gratis, sin tarjeta)

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
2. Clic en **"Add New → Project"**
3. Importa el repo `guiaeia`
4. En **"Environment Variables"** agrega:
   - Name: `GEMINI_API_KEY`
   - Value: *(pega tu API key de Gemini)*
5. Clic en **"Deploy"**

A los ~40 segundos tendrás una URL tipo `https://guiaeia-xxx.vercel.app`. Esa es la que compartes a tus compañeros por WhatsApp.

### 4. (Opcional) Dominio personalizado

En Vercel → Settings → Domains puedes agregar uno propio si tienes, o quedarte con el `.vercel.app`.

---

## Desarrollo local

```bash
npm i -g vercel
vercel dev
```

Crea un archivo `.env.local` con:

```
GEMINI_API_KEY=tu-clave-aqui
```

Abre `http://localhost:3000`.

> **No subas `.env.local` a GitHub.** Ya está cubierto por `.gitignore` si lo creas.

---

## Personalización

### Cambiar el system prompt
Edita la constante `SYSTEM_PROMPT` al inicio de `api/chat.js`. Ahí está toda la personalidad y reglas del agente.

### Cambiar el modelo
En `api/chat.js`, línea:
```js
const model = 'gemini-2.5-flash';
```
Alternativas: `gemini-2.5-pro` (mejor calidad, más lento, límites menores en free tier), `gemini-2.0-flash`.

### Cambiar colores / branding
Las variables CSS están al inicio de `index.html` bajo `:root`. Ajusta `--eia-green`, `--eia-gold`, etc. para matchear la paleta oficial exacta.

### Preguntas sugeridas iniciales
En `index.html` busca `class="suggestion"` y edita los textos y el atributo `data-q`.

---

## Limitaciones conocidas

1. **Alucinaciones**: el modelo puede inventar fechas, montos o políticas específicas. El prompt lo mitiga pero no lo elimina al 100%. Para versión seria, cargar el reglamento como contexto (RAG).
2. **Sin memoria entre sesiones**: cada navegador mantiene su historial en memoria solo durante la sesión activa. Al recargar se pierde.
3. **Rate limits**: si muchos usan al tiempo, Gemini puede devolver 429. El frontend muestra mensaje genérico de error.
4. **Sin autenticación**: cualquiera con el link puede usarlo. Si necesitas restringir, agrega auth básica o un token simple.

---

## Estructura de archivos

```
guiaeia/
├── index.html         # Interfaz de chat (frontend)
├── api/
│   └── chat.js        # Serverless function (proxy a Gemini)
├── package.json
├── vercel.json
└── README.md
```

---

## Próximos pasos sugeridos

- [ ] Cargar PDFs del reglamento EIA como contexto (inline o RAG)
- [ ] Agregar analytics básicos (preguntas más frecuentes)
- [ ] Botón de "¿Te fue útil?" para feedback
- [ ] Persistir historial en `localStorage`
- [ ] Exportar conversación a texto
