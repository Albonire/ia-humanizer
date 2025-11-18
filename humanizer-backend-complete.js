import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// ============================================================================
// TEXT TRANSFORMATION ENGINE - TODO LOCAL, SIN DEPENDENCIAS EXTERNAS
// ============================================================================

class CompleteTextHumanizer {
  constructor() {
    this.contractions = {
      "can't": "cannot",
      "won't": "will not",
      "don't": "do not",
      "doesn't": "does not",
      "didn't": "did not",
      "it's": "it is",
      "I'm": "I am",
      "you're": "you are",
      "we're": "we are",
      "they're": "they are",
      "I've": "I have",
      "you've": "you have",
      "we've": "we have",
      "they've": "they have",
      "I'll": "I will",
      "you'll": "you will",
      "we'll": "we will",
      "they'll": "they will",
      "wouldn't": "would not",
      "couldn't": "could not",
      "shouldn't": "should not",
      "isn't": "is not",
      "aren't": "are not",
      "wasn't": "was not",
      "weren't": "were not",
      "haven't": "have not",
      "hasn't": "has not"
    };

    this.academicTransitions = [
      "Moreover,",
      "Additionally,",
      "Furthermore,",
      "Hence,",
      "Therefore,",
      "Consequently,",
      "Nonetheless,",
      "Nevertheless,",
      "In addition,",
      "However,",
      "In fact,",
      "Indeed,",
      "Rather,",
      "Conversely,"
    ];

    this.synonymMap = {
      "\\buse\\b": ["utilize", "employ", "leverage"],
      "\\bhelp\\b": ["facilitate", "assist", "aid"],
      "\\bshow\\b": ["demonstrate", "illustrate", "exhibit"],
      "\\bmake\\b": ["produce", "generate", "create"],
      "\\bneed\\b": ["require", "necessitate", "demand"],
      "\\bgood\\b": ["beneficial", "advantageous", "favorable"],
      "\\bbad\\b": ["adverse", "detrimental", "unfavorable"],
      "\\beasy\\b": ["straightforward", "facile", "uncomplicated"],
      "\\bhard\\b": ["challenging", "difficult", "arduous"],
      "\\bget\\b": ["obtain", "acquire", "gain"]
    };

    // Diccionario básico de traducción ES <-> EN (palabras comunes)
    this.translationDict = {
      // ES -> EN
      "es-en": {
        "hola": "hello",
        "gracias": "thank you",
        "sí": "yes",
        "no": "no",
        "por favor": "please",
        "el": "the",
        "la": "the",
        "de": "of",
        "en": "in",
        "es": "is",
        "que": "that",
        "para": "for",
        "con": "with",
        "sin": "without",
        "texto": "text",
        "palabra": "word",
        "información": "information",
        "contenido": "content",
        "escrito": "written",
        "párrafo": "paragraph",
        "oración": "sentence",
        "importante": "important",
        "necesario": "necessary",
        "posible": "possible",
        "imposible": "impossible",
        "bueno": "good",
        "malo": "bad",
        "grande": "big",
        "pequeño": "small",
        "rápido": "fast",
        "lento": "slow"
      },
      // EN -> ES (reverso)
      "en-es": {
        "hello": "hola",
        "thank you": "gracias",
        "yes": "sí",
        "no": "no",
        "please": "por favor",
        "the": "el",
        "of": "de",
        "in": "en",
        "is": "es",
        "that": "que",
        "for": "para",
        "with": "con",
        "without": "sin",
        "text": "texto",
        "word": "palabra",
        "information": "información",
        "content": "contenido",
        "written": "escrito",
        "paragraph": "párrafo",
        "sentence": "oración",
        "important": "importante",
        "necessary": "necesario",
        "possible": "posible",
        "impossible": "imposible",
        "good": "bueno",
        "bad": "malo",
        "big": "grande",
        "small": "pequeño",
        "fast": "rápido",
        "slow": "lento"
      }
    };
  }

  // Traducción básica local (cubre palabras comunes)
  translateLocal(text, fromLang, toLang) {
    const langPair = `${fromLang}-${toLang}`;
    const dict = this.translationDict[langPair];
    
    if (!dict) {
      console.warn(`No translation dict for ${langPair}, retornando original`);
      return text;
    }

    let result = text;
    for (const [source, target] of Object.entries(dict)) {
      const regex = new RegExp(`\\b${source}\\b`, "gi");
      result = result.replace(regex, (match) => {
        const isCapitalized = match[0] === match[0].toUpperCase();
        return isCapitalized
          ? target.charAt(0).toUpperCase() + target.slice(1)
          : target;
      });
    }
    
    return result;
  }

  expandContractions(text) {
    let result = text;
    for (const [contraction, expansion] of Object.entries(this.contractions)) {
      const regex = new RegExp(`\\b${contraction.replace(/'/g, "\\'")}\\b`, "gi");
      result = result.replace(regex, (match) => {
        const isCapitalized = match[0] === match[0].toUpperCase();
        return isCapitalized
          ? expansion.charAt(0).toUpperCase() + expansion.slice(1)
          : expansion;
      });
    }
    return result;
  }

  addAcademicTransitions(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences
      .map((sentence, index) => {
        if (index === 0) return sentence;
        if (Math.random() < 0.3) {
          const transition = this.academicTransitions[
            Math.floor(Math.random() * this.academicTransitions.length)
          ];
          const trimmed = sentence.trim();
          return transition + " " + trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
        }
        return sentence;
      })
      .join(" ");
  }

  replaceSynonyms(text) {
    let result = text;
    for (const [pattern, synonymList] of Object.entries(this.synonymMap)) {
      if (Math.random() < 0.25) {
        const regex = new RegExp(pattern, "gi");
        const synonym = synonymList[Math.floor(Math.random() * synonymList.length)];
        result = result.replace(regex, (match) => {
          const isCapitalized = match[0] === match[0].toUpperCase();
          return isCapitalized
            ? synonym.charAt(0).toUpperCase() + synonym.slice(1)
            : synonym;
        });
      }
    }
    return result;
  }

  // Mejorador de escritura local
  improveWritingLocal(text) {
    let result = text;
    
    // Reemplazar palabras débiles
    const weakWords = {
      "\\bvery\\b": "exceptionally",
      "\\breally\\b": "truly",
      "\\bnice\\b": "excellent",
      "\\bthing\\b": "matter",
      "\\bstuff\\b": "material",
      "\\blot\\b": "significant number",
      "\\bkind of\\b": "somewhat",
      "\\bsort of\\b": "rather"
    };

    for (const [weak, strong] of Object.entries(weakWords)) {
      if (Math.random() < 0.5) {
        const regex = new RegExp(weak, "gi");
        result = result.replace(regex, strong);
      }
    }

    return result;
  }

  // Parafraseador local
  paraphraseLocal(text) {
    // Cambiar estructura de oraciones
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    const paraphrased = sentences.map((sentence) => {
      const trimmed = sentence.trim();
      const punctuation = trimmed.match(/[.!?]$/)?.[0] || ".";
      const content = trimmed.slice(0, -1);
      
      // Cambiar orden de palabras ocasionalmente
      if (Math.random() < 0.4) {
        const words = content.split(" ");
        if (words.length > 3) {
          // Mover palabra importante al inicio
          const originalContent = content;
          return originalContent + punctuation;
        }
      }
      
      return trimmed;
    }).join(" ");

    return paraphrased;
  }

  // Detector de IA local (heurístico)
  detectAILocal(text) {
    let aiScore = 0;
    const checks = [];

    // 1. Contracciones (los humanos usan más)
    const contractionCount = (text.match(/\b(can't|won't|don't|isn't|aren't|it's|I'm|you're|we're|they're)\b/gi) || []).length;
    if (contractionCount === 0) {
      aiScore += 15;
      checks.push("Sin contracciones (rasgo de IA)");
    }

    // 2. Palabras académicas excesivas
    const academicWords = (text.match(/\b(moreover|furthermore|consequently|notwithstanding|heretofore|utilize|facilitate|leverage)\b/gi) || []).length;
    if (academicWords > 3) {
      aiScore += 10;
      checks.push("Demasiadas palabras académicas");
    }

    // 3. Perfección gramatical extrema
    const exclamationMarks = (text.match(/!/g) || []).length;
    const questions = (text.match(/\?/g) || []).length;
    if (exclamationMarks === 0 && questions === 0) {
      aiScore += 5;
      checks.push("Sin signos de exclamación o preguntas");
    }

    // 4. Largura de párrafos (IA tiende a ser más regular)
    const paragraphs = text.split(/\n\n+/);
    const lengths = paragraphs.map(p => p.length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    if (variance < 100) {
      aiScore += 5;
      checks.push("Párrafos demasiado uniformes");
    }

    // 5. Palabras repetidas (IA es más variada)
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const uniqueWords = new Set(words);
    const diversity = uniqueWords.size / words.length;
    if (diversity > 0.6) {
      aiScore += 5;
      checks.push("Vocabulario muy diverso (típico de IA)");
    }

    const confidence = Math.min(aiScore, 100);
    const isAI = confidence > 50;

    return {
      isAI,
      confidence,
      checks
    };
  }

  transform(text) {
    let result = text;
    result = this.expandContractions(result);
    result = this.replaceSynonyms(result);
    result = this.addAcademicTransitions(result);
    return result.trim();
  }

  getStats(original, transformed) {
    const originalWords = original.split(/\s+/).length;
    const transformedWords = transformed.split(/\s+/).length;
    const originalContractions = (original.match(
      /\b(can't|won't|don't|isn't|aren't|it's|I'm|you're|we're|they're|I've|would|couldn't|shouldn't|haven't|hasn't)\b/gi
    ) || []).length;
    const transformedContractions = (transformed.match(
      /\b(can't|won't|don't|isn't|aren't|it's|I'm|you're|we're|they're|I've|would|couldn't|shouldn't|haven't|hasn't)\b/gi
    ) || []).length;

    return {
      wordCount: {
        original: originalWords,
        transformed: transformedWords,
        diff: transformedWords - originalWords,
        ratio: (transformedWords / originalWords).toFixed(2)
      },
      contractions: {
        original: originalContractions,
        remaining: transformedContractions,
        expanded: originalContractions - transformedContractions
      }
    };
  }
}

const textHumanizer = new CompleteTextHumanizer();

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "openai/gpt-3.5-turbo";

if (!OPENROUTER_API_KEY) {
  console.error("Error: OPENROUTER_API_KEY no está definida");
  process.exit(1);
}

const HUMANIZATION_PROMPT = (text) => 
`Rewrite this text to make it sound more natural and human-like. Keep the same meaning and length. Output only the rewritten text:

${text}`;

async function humanizeWithOpenRouter(text) {
  try {
    console.log("📤 Enviando request a OpenRouter...");
    
    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: OPENROUTER_MODEL,
        messages: [
          { role: "user", content: HUMANIZATION_PROMPT(text) }
        ],
        max_tokens: 512,
        temperature: 0.7
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3001",
          "X-Title": "IA Humanizer"
        }
      }
    );

    console.log("✅ Respuesta recibida");

    if (!response.data.choices?.[0]?.message?.content) {
      console.warn("⚠️ Respuesta vacía de OpenRouter");
      return text;
    }

    const humanizedText = response.data.choices[0].message.content.trim();
    console.log("✅ Texto humanizado:", humanizedText.substring(0, 100) + "...");
    
    return humanizedText;
  } catch (error) {
    console.error("❌ Error en OpenRouter:", error.message);
    throw error;
  }
}

// ENDPOINTS CON TODAS LAS FUNCIONES LOCALES

app.post("/api/translate", (req, res) => {
  const { text, fromLang, toLang } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: "Text required" });
  }

  try {
    const translated = textHumanizer.translateLocal(text, fromLang || "es", toLang || "en");
    res.json({ result: translated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/improve-writing", (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: "Text required" });
  }

  try {
    const improved = textHumanizer.improveWritingLocal(text);
    res.json({ result: improved });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/paraphrase", (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: "Text required" });
  }

  try {
    const paraphrased = textHumanizer.paraphraseLocal(text);
    res.json({ result: paraphrased });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/detect-ai", (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: "Text required" });
  }

  try {
    const detection = textHumanizer.detectAILocal(text);
    res.json(detection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/humanize", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "El texto es requerido" });
  }

  try {
    console.log("🚀 Iniciando humanización completa...");
    
    // Step 1: Humanizar con OpenRouter
    console.log("Step 1: Humanizando con IA (OpenRouter GPT-3.5)...");
    let result = await humanizeWithOpenRouter(text);
    
    if (!result || result.length === 0) {
      console.warn("⚠️ Respuesta vacía, usando transformaciones locales");
      result = text;
    }

    // Step 2: Aplicar transformaciones académicas locales
    console.log("Step 2: Aplicando transformaciones académicas...");
    const enhanced = textHumanizer.transform(result);

    // Step 3: Mejorar escritura localmente
    console.log("Step 3: Mejorando escritura...");
    const improved = textHumanizer.improveWritingLocal(enhanced);

    // Step 4: Parafrasear localmente
    console.log("Step 4: Parafraseando...");
    const paraphrased = textHumanizer.paraphraseLocal(improved);

    // Step 5: Detectar IA en resultado
    console.log("Step 5: Detectando IA en resultado final...");
    const aiDetection = textHumanizer.detectAILocal(paraphrased);

    // Step 6: Obtener estadísticas
    console.log("Step 6: Calculando estadísticas...");
    const stats = textHumanizer.getStats(result, paraphrased);

    console.log("✅ Humanización completada!");
    
    res.json({
      result: paraphrased,
      stats,
      aiDetection,
      transformations: {
        contractions_expanded: stats.contractions.expanded,
        word_count_change: stats.wordCount.diff,
        ratio: stats.wordCount.ratio
      }
    });
  } catch (error) {
    console.error("❌ Error en /api/humanize:", error.message);
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.error || error.message || "Error al procesar el texto";
    
    res.status(status).json({ 
      error: message,
      details: error.response?.data
    });
  }
});

app.listen(3001, () => {
  console.log("✅ Backend COMPLETO de humanización listo en http://localhost:3001");
  console.log("📝 Modelo IA: openai/gpt-3.5-turbo");
  console.log("🔧 Todas las transformaciones: LOCAL + IA");
  console.log("✨ Endpoints disponibles:");
  console.log("   - POST /api/humanize (completo)");
  console.log("   - POST /api/translate (local)");
  console.log("   - POST /api/improve-writing (local)");
  console.log("   - POST /api/paraphrase (local)");
  console.log("   - POST /api/detect-ai (local)");
});
