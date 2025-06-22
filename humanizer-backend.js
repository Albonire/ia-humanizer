  import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// CRÍTICO: La API Key se lee desde las variables de entorno.
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// La URL correcta y genérica para la API de OpenRouter
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_URL = OPENROUTER_API_URL;

// El modelo específico que quieres usar
const OPENROUTER_MODEL = "deepseek/deepseek-r1-0528:free";

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
    const { text } = req.body;
    try {
      const result = await humanizeWithOpenRouter(text);
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
