import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Simple Academic Text Transformer
class AcademicTextTransformer {
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
      "they'll": "they will"
    };

    this.academicTransitions = [
      "Moreover,",
      "Additionally,",
      "Furthermore,",
      "Hence,",
      "Therefore,",
      "Consequently,",
      "Nonetheless,",
      "In addition,",
      "However,",
      "In fact,",
      "Indeed,"
    ];
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

  transform(text) {
    let result = text;
    result = this.expandContractions(result);
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

const academicTransformer = new AcademicTextTransformer();

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

// Simple y directo prompt
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
      console.warn("⚠️ Respuesta vacía de OpenRouter:", JSON.stringify(response.data));
      return text; // Retorna el texto original si está vacío
    }

    const humanizedText = response.data.choices[0].message.content.trim();
    console.log("✅ Texto humanizado:", humanizedText.substring(0, 100) + "...");
    
    return humanizedText;
  } catch (error) {
    console.error("❌ Error en OpenRouter:");
    console.error("  Status:", error.response?.status);
    console.error("  Message:", error.message);
    if (error.response?.data) {
      console.error("  Data:", JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

app.post("/api/humanize", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "El texto es requerido" });
  }

  try {
    console.log("🚀 Iniciando humanización...");
    
    // Step 1: Humanizar con OpenRouter
    console.log("Step 1: Humanizando con IA...");
    let result = await humanizeWithOpenRouter(text);
    
    // Si está vacío, usar el texto original
    if (!result || result.length === 0) {
      console.warn("⚠️ Respuesta vacía, usando transformaciones locales");
      result = text;
    }

    // Step 2: Aplicar transformaciones académicas locales
    console.log("Step 2: Aplicando transformaciones académicas...");
    const enhancedResult = academicTransformer.transform(result);

    // Step 3: Obtener estadísticas
    console.log("Step 3: Calculando estadísticas...");
    const stats = academicTransformer.getStats(result, enhancedResult);

    console.log("✅ Humanización completada!");
    
    res.json({
      result: enhancedResult,
      stats,
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
  console.log("✅ Backend de humanización listo en http://localhost:3001");
  console.log("📝 Modelo:", OPENROUTER_MODEL);
  console.log("🔑 API Key: " + OPENROUTER_API_KEY.substring(0, 20) + "...");
});
