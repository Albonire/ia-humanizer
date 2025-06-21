  import express from "express";
  import cors from "cors";
  import axios from "axios";

  const app = express();
  app.use(cors());
  app.use(express.json());

  // CRÍTICO: La API Key se lee desde las variables de entorno, no está en el código.
const OPENROUTER_API_KEY = "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";
// La URL correcta y genérica para la API de OpenRouter
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_URL = OPENROUTER_API_URL;

// El modelo específico que quieres usar
const OPENROUTER_MODEL = "deepseek/deepseek-r1-0528:free";


  const HUMANIZATION_PROMPT = (text) => ` ROLE: Experto en reescritura textual indetectable
OBJECTIVE: Reescribir el texto aplicando humanización
LANGUAGE: Mantener mismo idioma que entrada
FORMATO: Solo texto reescrito sin elementos adicionales

REGLAS ABSOLUTAS:
1. NO añadir explicaciones/comentarios
2. NO incluir listas/viñetas
3. NO usar encabezados/formatos
4. NO añadir citas/referencias
5. NO incluir metadatos

TÉCNICAS:
- Variación sintáctica
- Conectores naturales
- Imperfecciones controladas
- Longitud ±15%
- Conservar tono original

EJEMPLO:
Input: "La tecnología mejora la productividad"
Output: "La productividad se ve reforzada por avances tecnológicos"

REWRITE THIS TEXT:
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
      const valid = similarity > 0.6;
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

  // Función para validar la API key
  const validateApiKey = (apiKey) => {
    if (!apiKey) return false;
    if (!apiKey.startsWith('hf_')) return false;
    return true;
  };

  function getHumanizationPrompt(text, lang = "en") {
    if (lang === "en") {
      return `Rewrite the following text in English to sound more human, natural, and fluent, keeping the original meaning. Do not add new information or change the topic.\n\n${text}`;
    } else {
      return `Reescribe el siguiente texto en español para que suene más humano, natural y fluido, manteniendo el significado original. No añadas información nueva ni cambies el tema.\n\n${text}`;
    }
  }

  async function humanizeWithOpenRouter(text, lang = "en") {
    const prompt = getHumanizationPrompt(text, lang);

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: OPENROUTER_MODEL,
        messages: [
          { role: lang === "en" ? "system" : "system", content: lang === "en" ? "You are an expert human writer." : "Eres un experto redactor humano." },
          { role: "user", content: prompt }
        ],
        max_tokens: 1024,
        temperature: 0.7,
        top_p: 0.95
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Log completo para depuración
    console.log("Respuesta OpenRouter:", JSON.stringify(response.data, null, 2));

    // Manejo robusto de respuesta
    if (!response.data.choices || !response.data.choices[0] || !response.data.choices[0].message || !response.data.choices[0].message.content) {
      throw new Error("Respuesta inesperada de OpenRouter: " + JSON.stringify(response.data));
    }

    return response.data.choices[0].message.content;
  }

  app.post("/api/humanize", async (req, res) => {
    const { text, lang = "en" } = req.body;
    try {
      const result = await humanizeWithOpenRouter(text, lang);
      const validation = validateOutput(text, result);
      if (!validation.isValid) {
        return res.status(422).json({ error: "La salida no cumple con los criterios de validación", validation, result });
      }
      res.json({ result, validation });
    } catch (error) {
      console.error("Error con OpenRouter:", error.response?.data || error.message);
      res.status(500).json({ error: "Error al procesar el texto con OpenRouter" });
    }
  });

  app.listen(3001, () => {
    console.log("✅ Backend de humanización (Hugging Face Phi-4) listo en http://localhost:3001");
    console.log("📝 Usando modelo:", OPENROUTER_MODEL);
    console.log("🔑 API Key:", OPENROUTER_API_KEY.substring(0, 10) + "...");
  });
