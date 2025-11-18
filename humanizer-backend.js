  import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// ============================================================================
// ACADEMIC TEXT TRANSFORMER - OPCIÓN 1 (Recomendado)
// ============================================================================
class AcademicTextTransformer {
  constructor() {
    this.contractions = {
      "can't": "cannot",
      "won't": "will not",
      "don't": "do not",
      "doesn't": "does not",
      "didn't": "did not",
      "it's": "it is",
      "it'll": "it will",
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
        if (Math.random() < 0.35) {
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

  convertPassiveVoice(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences
      .map((sentence) => {
        if (Math.random() < 0.2) {
          const match = sentence.match(
            /([A-Z][a-z\s]+?)\s+(created|developed|found|discovered|made|conducted|performed|studied|analyzed|examined|identified|established|determined|demonstrated|showed)\s+([a-z\s]+?)(?=[.!?])/i
          );
          if (match) {
            const object = match[3].trim();
            const verb = match[2].toLowerCase();
            let pastParticiple = verb;
            if (!verb.endsWith("ed")) pastParticiple = verb + "ed";
            return `${object} was ${pastParticiple}${sentence.match(/[.!?]$/)[0]}`;
          }
        }
        return sentence;
      })
      .join(" ");
  }

  transform(text) {
    let result = text;
    result = this.expandContractions(result);
    result = this.replaceSynonyms(result);
    result = this.addAcademicTransitions(result);
    result = this.convertPassiveVoice(result);
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

// CRÍTICO: La API Key se lee desde las variables de entorno.
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// La URL correcta y genérica para la API de OpenRouter
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_URL = OPENROUTER_API_URL;

// El modelo específico que quieres usar
// Alternativas: meta-llama/llama-2-7b-chat:free, mistralai/mistral-7b-instruct:free
const OPENROUTER_MODEL = "meta-llama/llama-2-7b-chat:free";

if (!OPENROUTER_API_KEY) {
  console.error("Error: La variable de entorno OPENROUTER_API_KEY no está definida.");
  process.exit(1);
}


  const HUMANIZATION_PROMPT = (text) => ` ROLE: Strict word processor  
OBJECTIVE: Rewrite text applying humanization WITHOUT adding elements  
LANGUAGE: Keep original language  
OUTPUT FORMAT: Only rewritten text without any additions  

**ABSOLUTE RULES (NON-NEGOTIABLE)**:  
1. ❌ DO NOT add explanations, comments, or analysis  
2. ❌ DO NOT use formats:  
   - Headings (##, **)  
   - Lists (1., 2., -)  
   - Quotes (>)  
   - Separate blocks  
3. ❌ DO NOT include metadata or additional text  
4. ✅ STRUCTURE:  
   - Same number of paragraphs as the original entry  
   - Same logical sequence  
   - ±15% original words  
5. ✅ CONTENT:  
   - Retain all original data  
   - Maintain tone and style  

**ALLOWED TECHNIQUES**:
- Syntactic variation (mixing simple/compound sentences)  
- Natural connectors (“therefore,” “likewise”)  
- Strategic lexical substitution  
- Controlled explanatory gerunds  

**DEMONSTRATIVE EXAMPLE (FEW-SHOT)**:  
[Input]  
“Climate change affects ecosystems. We must act now.”  

[VALID Output]  
“Ecosystems suffer climate impacts, making it urgent to take immediate action.”  

[INVALID output]  
*Improved text:  
- Impact on ecosystems  
- Need for action  
Explanation: I have simplified...*  

**FINAL INSTRUCTION**:  
REWRITE THE TEXT DIRECTLY FOLLOWING THE RULES.  
DO NOT ADD PREAMBLES OR COMMENTS.  
ONLY THE REWRITTEN TEXT:

  '

  ${text}`;

  // Añadir validación de longitud
  const MAX_INPUT_LENGTH = 1000;
  const MAX_OUTPUT_LENGTH = 1500;

  // Sistema de validación de salida (más flexible y con logs detallados)
  const outputValidators = {
    // Permite una diferencia de hasta 1 sección
    noNewSections: (original, generated) => {
      const o = original.split('\n\n').length;
      const g = generated.split('\n\n').length;
      const valid = Math.abs(o - g) <= 1;
      if (!valid) console.warn(`[VALIDACIÓN] Secciones: original=${o}, generado=${g}`);
      return valid;
    },

    // Baja el umbral de similitud a 0.6
    maintainsTopic: (original, generated) => {
      const originalWords = original.toLowerCase().split(/\W+/).filter(word => word.length > 3);
      const generatedWords = generated.toLowerCase().split(/\W+/).filter(word => word.length > 3);
      const originalSet = new Set(originalWords);
      const generatedSet = new Set(generatedWords);
      const intersection = new Set([...originalSet].filter(x => generatedSet.has(x)));
      const similarity = intersection.size / Math.max(originalSet.size, generatedSet.size);
      const valid = similarity > 0.50;
      if (!valid) console.warn(`[VALIDACIÓN] Similitud temática: ${similarity.toFixed(2)}`);
      return valid;
    },

    // Permite longitud entre 80% y 120% del original
    validLength: (original, generated) => {
      const ratio = generated.length / original.length;
      const valid = ratio > 0.8 && ratio < 1.2;
      if (!valid) console.warn(`[VALIDACIÓN] Longitud: original=${original.length}, generado=${generated.length}, ratio=${ratio.toFixed(2)}`);
      return valid;
    },

    // Verifica que no haya citas añadidas
    noQuotes: (generated) => {
      const valid = !generated.includes('"') && !generated.includes('"');
      if (!valid) console.warn(`[VALIDACIÓN] Citas detectadas en el texto generado.`);
      return valid;
    },

    // Verifica que no haya guiones largos
    noLongDashes: (generated) => {
      const valid = !generated.includes('—') && !generated.includes('–');
      if (!valid) console.warn(`[VALIDACIÓN] Guiones largos detectados en el texto generado.`);
      return valid;
    }
  };

  // Función para validar la salida completa (pasa original y generado)
  const validateOutput = (original, generated) => {
    const validations = {
      noNewSections: outputValidators.noNewSections(original, generated),
      maintainsTopic: outputValidators.maintainsTopic(original, generated),
      validLength: outputValidators.validLength(original, generated),
      noQuotes: outputValidators.noQuotes(generated),
      noLongDashes: outputValidators.noLongDashes(generated)
    };

    const allValid = Object.values(validations).every(v => v === true);
    if (!allValid) {
      console.warn('[VALIDACIÓN] Resultado de validaciones:', validations);
      console.warn('[VALIDACIÓN] Texto generado:', generated);
    }
    return {
      isValid: allValid,
      validations
    };
  };


  async function humanizeWithOpenRouter(text) {
    const prompt = HUMANIZATION_PROMPT(text);

    try {
      console.log("📤 Enviando request a OpenRouter...");
      console.log("🔑 API Key (primeros 30 chars):", OPENROUTER_API_KEY.substring(0, 30) + "...");
      
      const response = await axios.post(
        OPENROUTER_URL,
        {
          model: OPENROUTER_MODEL,
          messages: [
            { role: "user", content: prompt }
          ],
          max_tokens: 1024,
          temperature: 0.7,
          top_p: 0.95
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

      // Log completo para depuración
      console.log("✅ Respuesta OpenRouter recibida:", JSON.stringify(response.data, null, 2));

      // Manejo robusto de respuesta
      if (!response.data.choices || !response.data.choices[0] || !response.data.choices[0].message || !response.data.choices[0].message.content) {
        throw new Error("Respuesta inesperada de OpenRouter: " + JSON.stringify(response.data));
      }

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("❌ Error en OpenRouter:");
      console.error("  Status:", error.response?.status);
      console.error("  Message:", error.message);
      console.error("  Data:", JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
  }

  app.post("/api/humanize", async (req, res) => {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "El texto es requerido" });
    }

    try {
      // Step 1: Humanizar con DeepSeek
      console.log("🚀 Step 1: Humanizing with DeepSeek...");
      const result = await humanizeWithOpenRouter(text);

      // Step 2: Aplicar transformaciones académicas locales (OPCIÓN 1)
      console.log("🚀 Step 2: Applying academic transformations...");
      const enhancedResult = academicTransformer.transform(result);

      // Step 3: Obtener estadísticas
      console.log("🚀 Step 3: Calculating statistics...");
      const stats = academicTransformer.getStats(result, enhancedResult);

      // Step 4: Validar
      console.log("🚀 Step 4: Validating output...");
      const validation = validateOutput(text, enhancedResult);
      if (!validation.isValid) {
        console.warn("⚠️ Validation warnings:", validation);
      }

      // Step 5: Responder
      console.log("✅ Humanization complete!");
      res.json({
        result: enhancedResult,
        validation,
        stats,
        transformations: {
          contractions_expanded: stats.contractions.expanded,
          word_count_change: stats.wordCount.diff,
          ratio: stats.wordCount.ratio
        }
      });
    } catch (error) {
      console.error("❌ Error en /api/humanize:");
      console.error("  Mensaje:", error.message);
      console.error("  Status:", error.response?.status);
      console.error("  Data:", error.response?.data);
      
      const status = error.response?.status || 500;
      const message = error.response?.data?.error || error.message || "Error al procesar el texto con OpenRouter";
      
      res.status(status).json({ 
        error: message,
        details: error.response?.data
      });
    }
  });

  app.listen(3001, () => {
    console.log("✅ Backend de humanización (Hugging Face Phi-4) listo en http://localhost:3001");
    console.log("📝 Usando modelo:", OPENROUTER_MODEL);
    console.log("🔑 API Key:", OPENROUTER_API_KEY.substring(0, 10) + "...");
  });
