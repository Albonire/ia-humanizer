import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import { pipeline, cos_sim } from "@xenova/transformers";

dotenv.config();

// ============================================================================
// OUTPUT VALIDATOR - QUALITY VALIDATOR SYSTEM
// ============================================================================

class OutputValidator {
  /**
   * it validates there're no new add sections
   * it allows difference til one section
   */
  static noNewSections(original, generated) {
    const originalSections = original.split('\n\n').filter(s => s.trim().length > 0).length;
    const generatedSections = generated.split('\n\n').filter(s => s.trim().length > 0).length;
    const valid = Math.abs(originalSections - generatedSections) <= 1;

    if (!valid) {
      console.warn(`[VALIDATOR] Secciones - Original: ${originalSections}, Generado: ${generatedSections}`);
    }
    return valid;
  }

  /**
   * Valida que se mantenga el tema principal
   * theme similarity must be > 0.50
   */
  static maintainsTopic(original, generated) {
    const originalWords = original
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3);
    const generatedWords = generated
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 3);

    const originalSet = new Set(originalWords);
    const generatedSet = new Set(generatedWords);
    const intersection = new Set([...originalSet].filter(x => generatedSet.has(x)));
    const similarity = intersection.size / Math.max(originalSet.size, generatedSet.size);
    const valid = similarity > 0.50;

    if (!valid) {
      console.warn(`[VALIDATOR] Similitud temática: ${(similarity * 100).toFixed(2)}%`);
    }
    return valid;
  }

  /**
   * Valida que la longitud esté dentro de rango aceptable
   * Permite entre 80% y 120% de la longitud original
   */
  static validLength(original, generated) {
    const ratio = generated.length / original.length;
    const valid = ratio >= 0.80 && ratio <= 1.20;

    if (!valid) {
      console.warn(`[VALIDATOR] Longitud - Original: ${original.length}chars, Generado: ${generated.length}chars, Ratio: ${ratio.toFixed(2)}`);
    }
    return valid;
  }

  /**
   * Valida que no haya comillas agregadas
   */
  static noQuotes(generated) {
    const hasQuotes = generated.includes('"') || generated.includes('"') || generated.includes('"');
    const valid = !hasQuotes;

    if (!valid) {
      console.warn(`[VALIDATOR] Comillas detectadas en texto generado`);
    }
    return valid;
  }

  /**
   * validates there are no em dashes or long dashes
   */
  static noLongDashes(generated) {
    const hasLongDashes = generated.includes('—');
    const valid = !hasLongDashes;

    if (!valid) {
      console.warn(`[VALIDATOR] Guiones largos detectados en texto generado`);
    }
    return valid;
  }

  /**
   * Ejecuta todas las validaciones y retorna resultado completo
   */
  static validateAll(original, generated) {
    const validations = {
      noNewSections: OutputValidator.noNewSections(original, generated),
      maintainsTopic: OutputValidator.maintainsTopic(original, generated),
      validLength: OutputValidator.validLength(original, generated),
      noQuotes: OutputValidator.noQuotes(generated),
      noLongDashes: OutputValidator.noLongDashes(generated)
    };

    const passed = Object.values(validations).every(v => v === true);
    const passedCount = Object.values(validations).filter(v => v === true).length;
    const totalCount = Object.values(validations).length;
    const score = Math.round((passedCount / totalCount) * 100);

    const result = {
      passed,
      details: validations,
      score,
      passedValidations: passedCount,
      totalValidations: totalCount
    };

    console.log(`[VALIDATOR] Score final: ${score}% (${passedCount}/${totalCount} validaciones pasadas)`);
    return result;
  }
}

// ============================================================================
// ADVANCED NLP TEXT HUMANIZER CON POS TAGGING, EMBEDDINGS & PASIVE VOICE 
// ============================================================================

// Initialize wink-nlp for POS tagging
const nlp = winkNLP(model);
const its = nlp.its;

// Variable global para el pipeline de embeddings (se carga lazy)
let embeddingPipeline = null;

// Importar el servicio de traducción modular
import TranslationFactory from "./src/services/translation/TranslationFactory.js";
const translationService = TranslationFactory.createService("local");

// Importar el servicio de parafraseo modular (T5 local, nativo)
import ParaphrasingFactory from "./src/services/paraphrasing/ParaphrasingFactory.js";
const paraphrasingService = ParaphrasingFactory.createService("local");

// Importar detector local de IA basado en GPT-2 (perplejidad real + burstiness)
import { LocalAIDetector } from "./src/services/analysis/LocalAIDetector.js";
const localAIDetector = new LocalAIDetector();

// Importar listas de palabras expandidas
import { ACADEMIC_TRANSITIONS, SYNONYMS_BY_POS, WEAK_WORDS_MAP } from "./src/data/wordLists.js";

// Importar servicios avanzados de NLP
import perplexityService from "./src/services/analysis/PerplexityService.js";
import contextualSynonymService from "./src/services/nlp/ContextualSynonymService.js";

class AdvancedTextHumanizer {
  constructor() {
    // Mapas de contracciones
    this.contractions = {
      "cannot": "can't",
      "do not": "don't",
      "will not": "won't",
      "should not": "shouldn't",
      "could not": "couldn't",
      "would not": "wouldn't",
      "is not": "isn't",
      "are not": "aren't",
      "it is": "it's",
      "that is": "that's",
      "there is": "there's",
      "what is": "what's",
      "who is": "who's",
      "i am": "I'm",
      "you are": "you're",
      "we are": "we're",
      "they are": "they're",
      "i have": "I've",
      "you have": "you've",
      "we have": "we've",
      "they have": "they've",
      "i will": "I'll",
      "you will": "you'll",
      "we will": "we will",
      "they will": "they'll"
    };

    // Palabras de transición académicas (Importado)
    this.academicTransitions = ACADEMIC_TRANSITIONS;

    // Mapas de sinónimos por categoría gramatical (Importado)
    this.synonymsByPOS = SYNONYMS_BY_POS;

    // Diccionario de traducción eliminado a favor de TranslationService
    this.translationDict = {};

    // Configuración de OpenRouter
    this.openrouterApiKey = process.env.OPENROUTER_API_KEY;
    this.openrouterUrl = "https://openrouter.ai/api/v1/chat/completions";
    this.model = "openai/gpt-3.5-turbo";
  }

  // ============================================================================
  // INTEGRACIÓN CON OPENROUTER - HUMANIZACIÓN CON IA
  // ============================================================================

  /**
   * Construye el prompt de humanización con Few-shot learning
   */
  getHumanizationPrompt(text) {
    return `ROLE: Advanced Text Humanizer
OBJECTIVE: Rewrite text to sound more natural and human-like WITHOUT adding new information
LANGUAGE: Keep the original language
OUTPUT FORMAT: Only rewritten text without any additions or explanations

**ABSOLUTE RULES (NON-NEGOTIABLE)**:
1. ❌ DO NOT add explanations, comments, or metadata
2. ❌ DO NOT use formats like headings, lists, quotes, or code blocks
3. ✅ STRUCTURE:
   - Same number of paragraphs as original
   - Same logical sequence
   - ±15% word count variation
4. ✅ CONTENT:
   - Retain all original data and information
   - Maintain tone and academic style
   - Natural language flow

**ALLOWED TECHNIQUES**:
- Syntactic variation (mix simple and compound sentences)
- Natural transition words (therefore, likewise, however)
- Strategic word substitution
- Active voice preference
- Varied sentence length and structure

**FEW-SHOT EXAMPLES**:

[Example 1 - Input]
"AI is used in many applications. It helps companies improve efficiency. The technology is important."

[Example 1 - VALID Output]
"Various applications leverage artificial intelligence to enhance organizational efficiency. This technology has become increasingly important across industries."

[Example 2 - Input]
"The study showed results. The data was significant. We need more research."

[Example 2 - VALID Output]
"The study's results demonstrated statistical significance, underscoring the necessity for continued investigation in this domain."

[INVALID Output Examples]
❌ "The study findings: • Key results • Statistical significance • Need for research"
❌ "Improved text: The research demonstrated significance requiring further investigation."
❌ "**Analysis**: The study showed important results..."

**TEXT TO HUMANIZE**:
${text}

**RESPONSE**:
Provide ONLY the rewritten text, nothing else. Start directly with the humanized content.`;
  }

  /**
   * Humaniza texto usando OpenRouter con GPT-3.5-turbo
   */
  async humanizeWithAI(text) {
    if (!this.openrouterApiKey) {
      console.error("[IA] Error: OPENROUTER_API_KEY no configurada");
      return {
        success: false,
        error: "API Key not configured",
        originalText: text
      };
    }

    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: "Empty text provided",
        originalText: text
      };
    }

    try {
      console.log("[IA] Inicializando humanización con OpenRouter...");
      console.log(`[IA] Modelo: ${this.model}`);
      console.log(`[IA] Longitud entrada: ${text.length} caracteres`);

      const prompt = this.getHumanizationPrompt(text);

      const response = await axios.post(
        this.openrouterUrl,
        {
          model: this.model,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          top_p: 0.95,
          max_tokens: Math.min(text.length * 1.5, 4000),
          top_k: 0,
          frequency_penalty: 0.0,
          presence_penalty: 0.0
        },
        {
          headers: {
            "Authorization": `Bearer ${this.openrouterApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "IA Humanizer v2"
          },
          timeout: 30000
        }
      );

      const humanizedText = response.data?.choices?.[0]?.message?.content || "";

      if (!humanizedText) {
        console.warn("[IA] No content returned from API");
        return {
          success: false,
          error: "Empty response from API",
          originalText: text
        };
      }

      console.log("[IA] ✅ Humanización completada");
      console.log(`[IA] Longitud salida: ${humanizedText.length} caracteres`);

      return {
        success: true,
        originalText: text,
        humanizedText: humanizedText.trim(),
        model: this.model,
        inputLength: text.length,
        outputLength: humanizedText.length
      };
    } catch (error) {
      console.error("[IA] Error en humanización:", error.message);

      const errorDetails = error.response?.data || error.message;
      console.error("[IA] Detalles error:", errorDetails);

      return {
        success: false,
        error: error.message,
        details: errorDetails,
        originalText: text
      };
    }
  }

  // ============================================================================
  // 1. POS TAGGING AVANZADO CON WINK-NLP
  // ============================================================================

  async getPOSTags(text) {
    try {
      const doc = nlp.readDoc(text);
      const tokens = doc.tokens();
      const posData = [];

      tokens.each((token) => {
        posData.push({
          word: token.out(),
          pos: token.out(its.pos),
          lemma: token.out(its.lemma) || token.out(),
          normal: token.out(its.normal)
        });
      });

      return posData;
    } catch (error) {
      console.error("Error en POS tagging:", error);
      return [];
    }
  }

  // ============================================================================
  // 2. EMBEDDINGS SEMÁNTICOS CON TRANSFORMERS.JS
  // ============================================================================

  async initEmbeddingPipeline() {
    if (!embeddingPipeline) {
      console.log("Inicializando pipeline de embeddings...");
      embeddingPipeline = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2"
      );
      console.log("Pipeline de embeddings listo!");
    }
    return embeddingPipeline;
  }

  async getEmbedding(text) {
    try {
      const pipe = await this.initEmbeddingPipeline();
      const output = await pipe(text, { pooling: "mean", normalize: true });
      return output.data;
    } catch (error) {
      console.error("Error generando embedding:", error);
      return null;
    }
  }

  async calculateSimilarity(text1, text2) {
    try {
      const [emb1, emb2] = await Promise.all([
        this.getEmbedding(text1),
        this.getEmbedding(text2)
      ]);

      if (!emb1 || !emb2) return 0;

      // Calcular similitud coseno
      let dotProduct = 0;
      let norm1 = 0;
      let norm2 = 0;

      for (let i = 0; i < emb1.length; i++) {
        dotProduct += emb1[i] * emb2[i];
        norm1 += emb1[i] * emb1[i];
        norm2 += emb2[i] * emb2[i];
      }

      norm1 = Math.sqrt(norm1);
      norm2 = Math.sqrt(norm2);

      return dotProduct / (norm1 * norm2);
    } catch (error) {
      console.error("Error calculando similitud:", error);
      return 0;
    }
  }

  async selectBestSynonymWithEmbeddings(originalWord, synonyms) {
    try {
      if (!synonyms || synonyms.length === 0) return null;

      const similarities = await Promise.all(
        synonyms.map(async (synonym) => ({
          word: synonym,
          similarity: await this.calculateSimilarity(originalWord, synonym)
        }))
      );

      // Ordenar por similitud descendente
      similarities.sort((a, b) => b.similarity - a.similarity);

      // Retornar el sinónimo más similar (pero no idéntico)
      const best = similarities.find(s => s.similarity < 0.99);
      return best ? best.word : synonyms[0];
    } catch (error) {
      console.error("Error seleccionando sinónimo:", error);
      return synonyms[0];
    }
  }

  // ============================================================================
  // 3. REEMPLAZO DE SINÓNIMOS CON POS TAGGING + EMBEDDINGS
  // ============================================================================

  async replaceSynonymsAdvanced(text, useEmbeddings = true) {
    try {
      const posData = await this.getPOSTags(text);
      let result = text;
      let offset = 0;

      for (const token of posData) {
        const pos = token.pos;
        const word = token.word.toLowerCase();

        // Verificar si tenemos sinónimos para esta palabra y POS
        if (this.synonymsByPOS[pos] && this.synonymsByPOS[pos][word]) {
          const synonyms = this.synonymsByPOS[pos][word];

          // Seleccionar sinónimo (con o sin embeddings)
          let selectedSynonym;
          if (useEmbeddings) {
            selectedSynonym = await this.selectBestSynonymWithEmbeddings(word, synonyms);
          } else {
            selectedSynonym = synonyms[Math.floor(Math.random() * synonyms.length)];
          }

          if (selectedSynonym && Math.random() < 0.3) {
            // Preservar capitalización
            const isCapitalized = token.word[0] === token.word[0].toUpperCase();
            const replacement = isCapitalized
              ? selectedSynonym.charAt(0).toUpperCase() + selectedSynonym.slice(1)
              : selectedSynonym;

            // Encontrar y reemplazar la palabra
            const regex = new RegExp(`\\b${token.word}\\b`, "i");
            const match = result.substring(offset).match(regex);

            if (match) {
              const index = offset + match.index;
              result = result.substring(0, index) + replacement + result.substring(index + token.word.length);
              offset = index + replacement.length;
            }
          }
        }
      }

      return result;
    } catch (error) {
      console.error("Error reemplazando sinónimos:", error);
      return text;
    }
  }

  // ============================================================================
  // 4. CONVERSIÓN A VOZ PASIVA CON POS TAGGING
  // ============================================================================

  async convertToPassiveVoice(text) {
    try {
      const doc = nlp.readDoc(text);
      const sentences = doc.sentences();
      const transformedSentences = [];

      sentences.each((sentence) => {
        const sentenceText = sentence.out();
        const tokens = sentence.tokens();
        const posData = [];

        tokens.each((token) => {
          posData.push({
            word: token.out(),
            pos: token.out(its.pos),
            lemma: token.out(its.lemma) || token.out()
          });
        });

        // Intentar convertir a voz pasiva
        const passiveSentence = this.transformToPassive(posData, sentenceText);
        transformedSentences.push(passiveSentence || sentenceText);
      });

      return transformedSentences.join(" ");
    } catch (error) {
      console.error("Error convirtiendo a voz pasiva:", error);
      return text;
    }
  }

  transformToPassive(posData, originalSentence) {
    try {
      // Buscar patrón: NOUN/PRON + VERB + NOUN (sujeto + verbo + objeto)
      let subjectIdx = -1;
      let verbIdx = -1;
      let objectIdx = -1;

      for (let i = 0; i < posData.length; i++) {
        const pos = posData[i].pos;

        if ((pos === "NOUN" || pos === "PROPN" || pos === "PRON") && subjectIdx === -1) {
          subjectIdx = i;
        } else if (pos === "VERB" && subjectIdx !== -1 && verbIdx === -1) {
          verbIdx = i;
        } else if ((pos === "NOUN" || pos === "PROPN") && verbIdx !== -1 && objectIdx === -1) {
          objectIdx = i;
          break;
        }
      }

      // Si encontramos la estructura, convertir a pasiva
      if (subjectIdx !== -1 && verbIdx !== -1 && objectIdx !== -1) {
        const subject = posData[subjectIdx].word;
        const verb = posData[verbIdx].word;
        const verbLemma = posData[verbIdx].lemma;
        const object = posData[objectIdx].word;

        // Determinar forma del verbo "to be"
        const beForm = this.getBEForm(verb);
        const pastParticiple = this.getPastParticiple(verbLemma);

        // Construir oración pasiva: Object + be + past participle + by + subject
        const passiveSentence = `${object.charAt(0).toUpperCase() + object.slice(1)} ${beForm} ${pastParticiple} by ${subject.toLowerCase()}`;

        // Solo retornar si hace sentido (random 30% del tiempo)
        if (Math.random() < 0.3) {
          return passiveSentence + ".";
        }
      }

      return null;
    } catch (error) {
      console.error("Error transformando a pasiva:", error);
      return null;
    }
  }

  getBEForm(verb) {
    const lowerVerb = verb.toLowerCase();

    // Tiempo presente
    if (lowerVerb.endsWith("s") || lowerVerb.endsWith("es")) {
      return "is";
    }

    // Tiempo pasado
    if (lowerVerb.endsWith("ed") || this.isIrregularPast(lowerVerb)) {
      return "was";
    }

    // Por defecto
    return "is";
  }

  isIrregularPast(verb) {
    const irregularPast = ["went", "took", "made", "gave", "had", "was", "were", "saw", "came", "thought"];
    return irregularPast.includes(verb);
  }

  getPastParticiple(lemma) {
    // Verbos irregulares comunes
    const irregularVerbs = {
      "be": "been",
      "have": "had",
      "do": "done",
      "say": "said",
      "go": "gone",
      "get": "gotten",
      "make": "made",
      "know": "known",
      "think": "thought",
      "take": "taken",
      "see": "seen",
      "come": "come",
      "want": "wanted",
      "use": "used",
      "find": "found",
      "give": "given",
      "tell": "told",
      "work": "worked",
      "call": "called",
      "try": "tried",
      "ask": "asked",
      "need": "needed",
      "feel": "felt",
      "become": "become",
      "leave": "left",
      "put": "put",
      "mean": "meant",
      "keep": "kept",
      "let": "let",
      "begin": "begun",
      "seem": "seemed",
      "help": "helped",
      "show": "shown",
      "hear": "heard",
      "play": "played",
      "run": "run",
      "move": "moved",
      "live": "lived",
      "believe": "believed",
      "bring": "brought",
      "write": "written",
      "sit": "sat",
      "stand": "stood",
      "lose": "lost",
      "pay": "paid",
      "meet": "met",
      "include": "included",
      "continue": "continued",
      "set": "set",
      "learn": "learned",
      "change": "changed",
      "lead": "led",
      "understand": "understood",
      "watch": "watched",
      "follow": "followed",
      "stop": "stopped",
      "create": "created",
      "speak": "spoken",
      "read": "read",
      "spend": "spent",
      "grow": "grown",
      "open": "opened",
      "walk": "walked",
      "win": "won",
      "teach": "taught",
      "offer": "offered",
      "remember": "remembered",
      "consider": "considered",
      "appear": "appeared",
      "buy": "bought",
      "serve": "served",
      "die": "died",
      "send": "sent",
      "build": "built",
      "stay": "stayed",
      "fall": "fallen",
      "cut": "cut",
      "reach": "reached",
      "kill": "killed",
      "raise": "raised",
      "pass": "passed",
      "sell": "sold",
      "decide": "decided",
      "return": "returned",
      "explain": "explained",
      "develop": "developed",
      "carry": "carried",
      "break": "broken",
      "receive": "received",
      "agree": "agreed",
      "support": "supported",
      "hit": "hit",
      "produce": "produced",
      "eat": "eaten",
      "cover": "covered",
      "catch": "caught",
      "draw": "drawn"
    };

    if (irregularVerbs[lemma]) {
      return irregularVerbs[lemma];
    }

    // Reglas regulares
    if (lemma.endsWith("e")) {
      return lemma + "d";
    } else if (lemma.endsWith("y") && !/[aeiou]y$/.test(lemma)) {
      return lemma.slice(0, -1) + "ied";
    } else {
      return lemma + "ed";
    }
  }

  // ============================================================================
  // MÉTODOS BÁSICOS MEJORADOS
  // ============================================================================

  // ============================================================================
  // HUMANIZACIÓN NATIVA: EXPANSIÓN DE CONTRACCIONES (inglés)
  // Los detectores de IA asocian la ausencia de contracciones con texto humano.
  // Este mapa va SIEMPRE en dirección contraction -> expanded.
  // ============================================================================

  static get CONTRACTIONS_TO_EXPANDED() {
    return {
      "cannot": "can not",
      "won't": "will not",
      "don't": "do not",
      "doesn't": "does not",
      "didn't": "did not",
      "isn't": "is not",
      "aren't": "are not",
      "wasn't": "was not",
      "weren't": "were not",
      "haven't": "have not",
      "hasn't": "has not",
      "hadn't": "had not",
      "wouldn't": "would not",
      "couldn't": "could not",
      "shouldn't": "should not",
      "mustn't": "must not",
      "needn't": "need not",
      "shan't": "shall not",
      "it's": "it is",
      "that's": "that is",
      "there's": "there is",
      "here's": "here is",
      "what's": "what is",
      "who's": "who is",
      "when's": "when is",
      "where's": "where is",
      "how's": "how is",
      "let's": "let us",
      "one's": "one is",
      "i'm": "I am",
      "i've": "I have",
      "i'll": "I will",
      "i'd": "I would",
      "you're": "you are",
      "you've": "you have",
      "you'll": "you will",
      "you'd": "you would",
      "we're": "we are",
      "we've": "we have",
      "we'll": "we will",
      "we'd": "we would",
      "they're": "they are",
      "they've": "they have",
      "they'll": "they will",
      "they'd": "they would",
      "he's": "he is",
      "she's": "she is",
      "he'll": "he will",
      "she'll": "she will",
      "he'd": "he would",
      "she'd": "she would"
    };
  }

  expandContractions(text) {
    let result = text;
    for (const [contraction, expansion] of Object.entries(AdvancedTextHumanizer.CONTRACTIONS_TO_EXPANDED)) {
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

  // Corrector de concordancia de género (español)
  fixGenderConcordance(text) {
    // Lista de palabras femeninas comunes
    const feminineWords = [
      "inteligencia", "matemática", "estadística", "ciencia", "máquina",
      "tecnología", "arquitectura", "teoría", "base", "estructura",
      "capacidad", "habilidad", "forma", "manera", "cosa", "imagen",
      "realidad", "verdad", "prueba", "razón", "suerte", "muerte",
      "vida", "salud", "enfermedad", "persona", "gente", "sociedad",
      "cultura", "historia", "lengua", "palabra", "frase", "oración"
    ];

    let result = text;

    // Corregir "el" + palabra femenina a "la"
    for (const word of feminineWords) {
      const regex = new RegExp(`\\bel\\s+${word}\\b`, "gi");
      result = result.replace(regex, (match) => {
        const isCapitalized = match[0] === match[0].toUpperCase();
        return isCapitalized ? `La ${word}` : `la ${word}`;
      });
    }

    // Corregir "de el" a "del" (contracción correcta)
    result = result.replace(/\bde\s+el\b/gi, "del");

    // Corregir "de el" + palabra femenina a "de la"
    for (const word of feminineWords) {
      const regex = new RegExp(`\\bde\\s+el\\s+${word}\\b`, "gi");
      result = result.replace(regex, (match) => {
        return `de la ${word}`;
      });
    }

    return result;
  }

  addAcademicTransitions(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    return sentences.map((sentence, index) => {
      if (index > 0 && Math.random() < 0.4) {
        const transition = this.academicTransitions[
          Math.floor(Math.random() * this.academicTransitions.length)
        ];
        return ` ${transition} ${sentence.trim()}`;
      }
      return sentence;
    }).join("");
  }

  // Reemplazo de sinónimos contextual con BERT
  async replaceSynonymsContextual(text) {
    try {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      let resultSentences = [];

      for (const sentence of sentences) {
        let newSentence = sentence;
        const words = sentence.split(/\s+/);

        // Intentar reemplazar 1 o 2 palabras clave por oración
        for (let i = 0; i < words.length; i++) {
          const word = words[i].replace(/[^a-zA-Z]/g, "");
          if (word.length > 4 && Math.random() < 0.3) { // Solo palabras largas y 30% chance
            const synonyms = await contextualSynonymService.getSynonyms(sentence, word);
            if (synonyms.length > 0) {
              const bestSynonym = synonyms[0];
              // Reemplazo simple (se podría mejorar preservando case)
              newSentence = newSentence.replace(word, bestSynonym);
              break; // Solo un cambio por oración para no romperla
            }
          }
        }
        resultSentences.push(newSentence);
      }
      return resultSentences.join(" ");
    } catch (error) {
      console.error("Error en BERT synonyms:", error);
      return text;
    }
  }

  // Parafraseo local usando T5 (Transformers.js)
  async paraphraseLocal(text) {
    try {
      console.log("[PARAPHRASE] Iniciando parafraseo con T5...");
      const result = await paraphrasingService.paraphrase(text);
      return result;
    } catch (error) {
      console.error("[PARAPHRASE] Error en servicio de parafraseo:", error);
      return text;
    }
  }

  // Traducción local avanzada usando Transformers.js
  async translateLocal(text, fromLang, toLang) {
    try {
      console.log(`[TRANSLATION] Traduciendo de ${fromLang} a ${toLang}...`);
      const result = await translationService.translate(text, fromLang, toLang);
      return result;
    } catch (error) {
      console.error("[TRANSLATION] Error en servicio de traducción:", error);
      return text; // Fallback al original en caso de error
    }
  }

  // Mejorador de escritura: sustituye palabras débiles por alternativas fuertes.
  // WEAK_WORDS_MAP ya trae patrones \b...\b y formas conjugadas exactas,
  // por lo que se respeta el patrón original y solo se preserva la capitalización.
  improveWritingLocal(text) {
    let result = text;
    for (const [pattern, strong] of Object.entries(WEAK_WORDS_MAP)) {
      if (Math.random() < 0.5) {
        const regex = new RegExp(pattern, "gi");
        result = result.replace(regex, (match) => {
          let replacement = strong;
          if (match[0] === match[0].toUpperCase() && strong[0] !== strong[0].toUpperCase()) {
            replacement = strong.charAt(0).toUpperCase() + strong.slice(1);
          }
          return replacement;
        });
      }
    }

    return result;
  }

  // Detector de IA local NATIVO: perplejidad GPT-2 + burstiness + heurísticas
  async detectAILocal(text) {
    try {
      return await localAIDetector.detect(text);
    } catch (error) {
      console.error("[DETECT-AI] Error en detector nativo:", error.message);
      // Fallback heurístico mínimo si el modelo no pudo cargarse
      let aiScore = 40;
      const checks = ["Fallback heurístico (modelo no disponible)"];
      const contractionCount = (text.match(/\b(can't|won't|don't|isn't|aren't|it's|I'm|you're|we're|they're)\b/gi) || []).length;
      if (contractionCount === 0) aiScore += 15;
      const academicWords = (text.match(/\b(moreover|furthermore|consequently|notwithstanding|heretofore|utilize|facilitate|leverage)\b/gi) || []).length;
      if (academicWords > 3) aiScore += 10;
      return { isAI: aiScore > 50, confidence: Math.min(aiScore, 100), checks };
    }
  }

  // Transformación completa con todas las técnicas avanzadas
  async transformAdvanced(text, options = {}) {
    const {
      useEmbeddings = true,
      usePassiveVoice = false,
      usePOSTagging = true
    } = options;

    let result = text;

    // 1. Expandir contracciones
    result = this.expandContractions(result);

    // 2. Reemplazo de sinónimos con POS tagging y embeddings
    if (usePOSTagging) {
      result = await this.replaceSynonymsAdvanced(result, useEmbeddings);
    }

    // 3. Añadir transiciones académicas
    result = this.addAcademicTransitions(result);

    // 4. Conversión a voz pasiva (opcional)
    if (usePassiveVoice) {
      result = await this.convertToPassiveVoice(result);
    }

    return result.trim();
  }

  async getStats(original, transformed) {
    const originalWords = original.split(/\s+/).length;
    const transformedWords = transformed.split(/\s+/).length;
    const originalContractions = (original.match(/\b(can't|won't|don't|isn't|aren't|it's|I'm|you're|we're|they're|I've|wouldn't|couldn't|shouldn't|haven't|hasn't)\b/gi) || []).length;
    const transformedContractions = (transformed.match(/\b(can't|won't|don't|isn't|aren't|it's|I'm|you're|we're|they're|I've|wouldn't|couldn't|shouldn't|haven't|hasn't)\b/gi) || []).length;

    // Obtener POS tags
    const originalPOS = await this.getPOSTags(original);
    const transformedPOS = await this.getPOSTags(transformed);

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
      },
      posTagging: {
        originalTags: originalPOS.length,
        transformedTags: transformedPOS.length,
        uniquePOSOriginal: [...new Set(originalPOS.map(p => p.pos))].length,
        uniquePOSTransformed: [...new Set(transformedPOS.map(p => p.pos))].length
      }
    };
  }

  // ============================================================================
  // PIPELINE COMPLETO - HUMANIZACIÓN CON IA + VALIDACIÓN + NLP
  // ============================================================================

  /**
   * Pipeline completo que orquesta:
   * 1. Humanización con IA (OpenRouter)
   * 2. Validación de salida (OutputValidator)
   * 3. Mejoras NLP (POS tagging, etc)
   * 4. Correcciones gramaticales y finales
   */
  async humanizeComplete(text, options = {}) {
    const startTime = Date.now();
    const result = {
      original: text,
      stages: {},
      success: false,
      error: null,
      executionTime: 0
    };

    try {
      console.log("\n" + "=".repeat(70));
      console.log("🚀 INICIANDO PIPELINE COMPLETO DE HUMANIZACIÓN");
      console.log("=".repeat(70));

      // ======== STAGE 1: VALIDACIÓN DE ENTRADA ========
      console.log("\n[STAGE 1] Validando entrada...");
      if (!text || text.trim().length === 0) {
        throw new Error("Texto vacío no permitido");
      }
      if (text.length > 5000) {
        console.warn(`[STAGE 1] Texto muy largo (${text.length}), truncando a 5000 caracteres`);
        result.original = text.substring(0, 5000);
      }
      result.stages.inputValidation = { passed: true };
      console.log("✅ Entrada validada correctamente");

      // ======== STAGE 2: HUMANIZACIÓN NATIVA (PARAFRASEO T5 LOCAL) ========
      let iaResult;
      var humanizedText; // eslint-disable-line no-var

      if (options.useAI === true && this.openrouterApiKey) {
        // Opcional: enriquecer con IA externa solo si hay clave y se pide explícitamente
        console.log("\n[STAGE 2] Humanizando con IA externa (OpenRouter)...");
        iaResult = await this.humanizeWithAI(result.original);
      } else {
        // Modo por defecto: humanización NATIVA con modelo FLAN-T5 local (Transformers.js)
        console.log("\n[STAGE 2] Humanizando con parafraseo nativo (FLAN-T5 local)...");
        try {
          const t5Text = await paraphrasingService.paraphrase(result.original);
          if (t5Text && t5Text.trim().length > 0 && t5Text !== result.original) {
            iaResult = { success: true, humanizedText: t5Text, model: "Xenova/flan-t5-base (local)" };
          } else {
            iaResult = { success: false, error: "El parafraseo nativo no produjo cambios" };
          }
        } catch (error) {
          iaResult = { success: false, error: error.message };
        }
      }

      if (!iaResult.success) {
        console.warn(`[STAGE 2] ⚠️ Humanización principal falló: ${iaResult.error}`);
        console.warn("[STAGE 2] Continuando con transformaciones NLP locales...");
        result.stages.iaHumanization = {
          applied: false,
          reason: iaResult.error,
          text: result.original
        };
        humanizedText = result.original;
      } else {
        humanizedText = iaResult.humanizedText;
        result.stages.iaHumanization = {
          applied: true,
          model: iaResult.model,
          inputLength: iaResult.inputLength,
          outputLength: iaResult.outputLength,
          text: humanizedText
        };
        console.log("✅ Humanización IA completada");

        // Limpieza de artefactos (bullets, markdown residual)
        if (humanizedText.includes("•") || humanizedText.includes("*")) {
          console.log("  - Limpiando artefactos de lista/markdown...");
          humanizedText = humanizedText.replace(/^[•\-\*]\s+/gm, "").replace(/\*\*/g, "");
        }
      }

      // ======== STAGE 3: VALIDACIÓN DE SALIDA ========
      console.log("\n[STAGE 3] Validando salida de IA...");
      const validation = OutputValidator.validateAll(result.original, humanizedText);
      result.stages.outputValidation = validation;

      if (!validation.passed) {
        console.warn(`[STAGE 3] ⚠️ Algunas validaciones fallaron (Score: ${validation.score}%)`);
      } else {
        console.log(`✅ Validación completada (Score: ${validation.score}%)`);
      }

      // ======== STAGE 3.5: ANÁLISIS DE PERPLEJIDAD NATIVA (GPT-2 LOCAL) ========
      console.log("\n[STAGE 3.5] Analizando Perplejidad nativa (GPT-2 local)...");
      const pplAnalysis = await localAIDetector.calculatePerplexity(humanizedText);
      const perplexityScore = pplAnalysis ? pplAnalysis.perplexity : null;
      console.log(`  - Perplejidad GPT-2: ${perplexityScore !== null ? perplexityScore.toFixed(2) : "N/D"}`);

      let aggressiveMode = false;
      if (perplexityScore !== null && perplexityScore < 20) { // texto muy predecible = rasgo de IA
        console.log("  ⚠️ Texto detectado como muy predecible (Posible IA). Activando MODO AGRESIVO.");
        aggressiveMode = true;
      } else if (perplexityScore === null) {
        // Fallback a la heurística léxica si el modelo no pudo cargarse
        const legacyScore = await perplexityService.calculatePerplexity(humanizedText);
        aggressiveMode = legacyScore < 40;
      }

      // ======== STAGE 4: MEJORAS NLP ========
      console.log("\n[STAGE 4] Aplicando mejoras NLP avanzadas...");
      let nlpEnhanced = humanizedText;

      // Convertir a voz pasiva selectively (DESACTIVADO POR DEFECTO para evitar frases robóticas)
      if (options.usePassiveVoice === true) {
        console.log("  - Analizando voz pasiva...");
        nlpEnhanced = await this.convertToPassiveVoice(nlpEnhanced);
      }

      // Reemplazar sinónimos con embeddings o BERT
      if (options.useEmbeddings || aggressiveMode) {
        console.log("  - Mejorando sinónimos con Contextual BERT...");
        // Usamos el servicio contextual si está disponible, sino fallback al viejo
        nlpEnhanced = await this.replaceSynonymsContextual(nlpEnhanced);
      } else {
        console.log("  - Reemplazando sinónimos (POS-based)...");
        nlpEnhanced = await this.replaceSynonymsAdvanced(nlpEnhanced, false);
      }

      // Corregir concordancia de género para español
      if (result.original.match(/[áéíóúñü]/)) {
        console.log("  - Corrigiendo concordancia de género (español)...");
        nlpEnhanced = this.fixGenderConcordance(nlpEnhanced);
      }

      result.stages.nlpEnhancements = {
        applied: true,
        passiveVoiceApplied: options.usePassiveVoice !== false,
        embeddingsApplied: options.useEmbeddings || false,
        text: nlpEnhanced
      };
      console.log("✅ Mejoras NLP completadas");

      // ======== STAGE 5: CORRECCIONES FINALES ========
      console.log("\n[STAGE 5] Aplicando correcciones finales...");
      let finalText = nlpEnhanced;

      // 5.1 Expandir contracciones (rasgo humano clave para detectores de IA)
      console.log("  - Expandiendo contracciones (humanización nativa)...");
      finalText = this.expandContractions(finalText);

      // 5.2 Variación natural del ritmo de oraciones (burstiness humana):
      // las IA escriben con ritmos uniformes; aquí se fusiona ocasionalmente
      // un remate corto con la oración larga anterior para crear ritmo irregular.
      {
        const sentences = finalText.match(/[^.!?]+[.!?]+/g) || [finalText];
        const varied = [];
        for (let i = 0; i < sentences.length; i++) {
          const current = sentences[i].trim();
          const words = current.split(/\s+/).length;
          const next = sentences[i + 1] ? sentences[i + 1].trim() : null;
          const nextWords = next ? next.split(/\s+/).length : 0;

          if (next && words >= 18 && nextWords <= 6 && Math.random() < 0.5) {
            varied.push(`${current.replace(/[.!?]$/, "")}, ${next.charAt(0).toLowerCase()}${next.slice(1)}`);
            i++; // consumir la siguiente
          } else {
            varied.push(current);
          }
        }
        finalText = varied.join(" ");
      }

      // 5.3 Conectores naturales del discurso (moderados), en lugar de
      // plantillas académicas rígidas que delatan escritura de IA.
      if (options.addTransitions !== false) {
        console.log("  - Agregando conectores naturales...");
        const naturalConnectors = [
          "That said,", "Still,", "Then again,", "In practice,", "On top of that,",
          "At the same time,", "More often than not,", "For what it is worth,",
          "To be fair,", "As things stand,"
        ];
        const sentences = finalText.match(/[^.!?]+[.!?]+/g) || [finalText];
        finalText = sentences
          .map((sentence, index) => {
            if (index === 0) return sentence;
            if (Math.random() < 0.15) {
              const transition = naturalConnectors[
                Math.floor(Math.random() * naturalConnectors.length)
              ];
              const trimmed = sentence.trim();
              return transition + " " + trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
            }
            return sentence;
          })
          .join(" ");
      }

      result.stages.finalCorrections = { applied: true };
      console.log("✅ Correcciones finales completadas");

      // ======== RESUMEN FINAL ========
      result.finalText = finalText.trim();
      result.success = true;
      result.executionTime = Date.now() - startTime;

      console.log("\n" + "=".repeat(70));
      console.log("✅ PIPELINE COMPLETADO EXITOSAMENTE");
      console.log("=".repeat(70));
      console.log(`⏱️  Tiempo total: ${result.executionTime}ms`);
      console.log(`📊 Validación: ${validation.score}%`);
      console.log(`📝 Entrada: ${result.original.length} caracteres`);
      console.log(`📄 Salida: ${finalText.length} caracteres`);
      console.log("=".repeat(70) + "\n");

      return result;

    } catch (error) {
      console.error("\n❌ ERROR EN PIPELINE:", error.message);
      result.success = false;
      result.error = error.message;
      result.executionTime = Date.now() - startTime;
      return result;
    }
  }
}

// ============================================================================
// EXPRESS SERVER
// ============================================================================

const app = express();
const PORT = process.env.PORT || 3001;
const humanizer = new AdvancedTextHumanizer();

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Advanced Text Humanizer API - con POS Tagging, Embeddings y Voz Pasiva",
    version: "3.0.0",
    features: [
      "POS Tagging con wink-nlp",
      "Semantic Embeddings con @xenova/transformers",
      "Conversión a Voz Pasiva",
      "Reemplazo inteligente de sinónimos",
      "Detección de IA",
      "Traducción local"
    ],
    endpoints: [
      "/api/humanize-advanced",
      "/api/pos-tags",
      "/api/passive-voice",
      "/api/synonyms-embeddings",
      "/api/translate",
      "/api/improve-writing",
      "/api/paraphrase",
      "/api/detect-ai"
    ]
  });
});

// Endpoint principal - Humanización avanzada
app.post("/api/humanize-advanced", async (req, res) => {
  try {
    const { text, options = {} } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Se requiere el campo 'text'" });
    }

    console.log(`[HUMANIZE-ADVANCED] Procesando: "${text.substring(0, 50)}..."`);

    const transformed = await humanizer.transformAdvanced(text, options);
    const stats = await humanizer.getStats(text, transformed);
    const aiDetection = await humanizer.detectAILocal(transformed);

    res.json({
      result: transformed,
      stats,
      aiDetection,
      options: options,
      transformations: {
        contractions_expanded: stats.contractions.expanded,
        word_count_change: stats.wordCount.diff,
        ratio: stats.wordCount.ratio,
        pos_diversity: stats.posTagging.uniquePOSTransformed
      }
    });
  } catch (error) {
    console.error("[HUMANIZE-ADVANCED] Error:", error);
    res.status(500).json({
      error: "Error procesando la humanización avanzada",
      details: error.message
    });
  }
});

// Endpoint compatible - Humanización simple (para compatibilidad con frontend)
app.post("/api/humanize", async (req, res) => {
  try {
    const {
      text,
      lang = "en",
      useEmbeddings = false,
      usePassiveVoice = true,
      addTransitions = true
    } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Se requiere el campo 'text'" });
    }

    console.log(`[HUMANIZE-COMPLETE] Procesando: "${text.substring(0, 50)}..."`);

    // Usar el pipeline completo con todas las mejoras
    const pipelineResult = await humanizer.humanizeComplete(text, {
      useEmbeddings,
      usePassiveVoice,
      addTransitions,
      useAI: req.body.useAI === true
    });

    if (!pipelineResult.success) {
      return res.status(500).json({
        error: "Error en pipeline de humanización",
        details: pipelineResult.error,
        stages: pipelineResult.stages
      });
    }

    // Respuesta compatible con frontend (mantener formato esperado)
    res.json({
      result: pipelineResult.finalText,
      message: "Texto humanizado exitosamente con IA + NLP",
      original: pipelineResult.original,
      validation: pipelineResult.stages.outputValidation,
      stats: {
        executionTime: pipelineResult.executionTime,
        inputLength: pipelineResult.original.length,
        outputLength: pipelineResult.finalText.length,
        iaHumanizationApplied: pipelineResult.stages.iaHumanization.applied,
        validationScore: pipelineResult.stages.outputValidation.score,
        model: pipelineResult.stages.iaHumanization.model || "local"
      },
      stages: pipelineResult.stages
    });
  } catch (error) {
    console.error("[HUMANIZE-COMPLETE] Error:", error);
    res.status(500).json({
      error: "Error procesando la humanización",
      details: error.message
    });
  }
});

// Endpoint - POS Tagging
app.post("/api/pos-tags", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Se requiere el campo 'text'" });
    }

    const posData = await humanizer.getPOSTags(text);

    res.json({
      tokens: posData,
      count: posData.length,
      uniquePOS: [...new Set(posData.map(p => p.pos))],
      summary: posData.reduce((acc, item) => {
        acc[item.pos] = (acc[item.pos] || 0) + 1;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error("[POS-TAGS] Error:", error);
    res.status(500).json({
      error: "Error obteniendo POS tags",
      details: error.message
    });
  }
});

// Endpoint - Conversión a voz pasiva
app.post("/api/passive-voice", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Se requiere el campo 'text'" });
    }

    const passiveText = await humanizer.convertToPassiveVoice(text);

    res.json({
      original: text,
      passive: passiveText,
      changed: text !== passiveText
    });
  } catch (error) {
    console.error("[PASSIVE-VOICE] Error:", error);
    res.status(500).json({
      error: "Error convirtiendo a voz pasiva",
      details: error.message
    });
  }
});

// Endpoint - Reemplazo de sinónimos con embeddings
app.post("/api/synonyms-embeddings", async (req, res) => {
  try {
    const { text, useEmbeddings = true } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Se requiere el campo 'text'" });
    }

    const result = await humanizer.replaceSynonymsAdvanced(text, useEmbeddings);

    res.json({
      original: text,
      result: result,
      useEmbeddings: useEmbeddings,
      changed: text !== result
    });
  } catch (error) {
    console.error("[SYNONYMS-EMBEDDINGS] Error:", error);
    res.status(500).json({
      error: "Error reemplazando sinónimos",
      details: error.message
    });
  }
});

// Endpoint - Traducción
app.post("/api/translate", async (req, res) => {
  try {
    const { text, fromLang = "es", toLang = "en" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Se requiere el campo 'text'" });
    }

    const translated = await humanizer.translateLocal(text, fromLang, toLang);

    res.json({
      result: translated,
      original: text,
      fromLang,
      toLang
    });
  } catch (error) {
    console.error("[TRANSLATE] Error:", error);
    res.status(500).json({
      error: "Error traduciendo texto",
      details: error.message
    });
  }
});

// Endpoint - Mejora de escritura
app.post("/api/improve-writing", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Se requiere el campo 'text'" });
    }

    const improved = humanizer.improveWritingLocal(text);

    res.json({
      result: improved,
      original: text
    });
  } catch (error) {
    console.error("[IMPROVE-WRITING] Error:", error);
    res.status(500).json({
      error: "Error mejorando escritura",
      details: error.message
    });
  }
});

// Endpoint - Parafraseo
app.post("/api/paraphrase", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Se requiere el campo 'text'" });
    }

    const paraphrased = humanizer.paraphraseLocal(text);

    res.json({
      result: paraphrased,
      original: text
    });
  } catch (error) {
    console.error("[PARAPHRASE] Error:", error);
    res.status(500).json({
      error: "Error parafraseando texto",
      details: error.message
    });
  }
});

// Endpoint - Detección de IA
app.post("/api/detect-ai", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Se requiere el campo 'text'" });
    }

    const detection = await humanizer.detectAILocal(text);

    res.json({
      text: text.substring(0, 100) + "...",
      ...detection
    });
  } catch (error) {
    console.error("[DETECT-AI] Error:", error);
    res.status(500).json({
      error: "Error detectando IA",
      details: error.message
    });
  }
});

// Endpoint - Humanización con IA (OpenRouter)
app.post("/api/humanize-ai", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Se requiere el campo 'text'" });
    }

    console.log(`[HUMANIZE-AI] Procesando con OpenRouter: "${text.substring(0, 50)}..."`);

    const iaResult = await humanizer.humanizeWithAI(text);

    res.json({
      ...iaResult,
      endpoint: "/api/humanize-ai"
    });
  } catch (error) {
    console.error("[HUMANIZE-AI] Error:", error);
    res.status(500).json({
      error: "Error en humanización con IA",
      details: error.message
    });
  }
});

// Endpoint - Validar salida de humanización
app.post("/api/validate-humanization", async (req, res) => {
  try {
    const { original, humanized } = req.body;

    if (!original || !humanized) {
      return res.status(400).json({
        error: "Se requieren ambos campos: 'original' y 'humanized'"
      });
    }

    console.log(`[VALIDATE] Validando humanización...`);

    const validation = OutputValidator.validateAll(original, humanized);

    res.json({
      original: original.substring(0, 100) + "...",
      humanized: humanized.substring(0, 100) + "...",
      validation: validation,
      endpoint: "/api/validate-humanization"
    });
  } catch (error) {
    console.error("[VALIDATE] Error:", error);
    res.status(500).json({
      error: "Error validando humanización",
      details: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Advanced Text Humanizer API corriendo en http://localhost:${PORT}`);
  console.log(`\n✨ Características avanzadas:`);
  console.log(`   ✓ POS Tagging con wink-nlp`);
  console.log(`   ✓ Semantic Embeddings con Transformers.js`);
  console.log(`   ✓ Humanización con IA (OpenRouter - GPT-3.5-turbo)`);
  console.log(`   ✓ Validación de salida avanzada`);
  console.log(`   ✓ Conversión a Voz Pasiva`);
  console.log(`   ✓ Corrección de concordancia de género (ES)`);
  console.log(`   ✓ Reemplazo inteligente de sinónimos`);
  console.log(`\n📚 Endpoints principales:`);
  console.log(`   POST /api/humanize (completo: IA + NLP + Validación)`);
  console.log(`   POST /api/humanize-ai (solo IA)`);
  console.log(`   POST /api/validate-humanization (validar salida)`);
  console.log(`   POST /api/humanize-advanced (NLP avanzado)`);
  console.log(`   POST /api/pos-tags`);
  console.log(`   POST /api/passive-voice`);
  console.log(`   POST /api/synonyms-embeddings`);
  console.log(`   POST /api/translate`);
  console.log(`   POST /api/improve-writing`);
  console.log(`   POST /api/paraphrase`);
  console.log(`   POST /api/detect-ai`);
  console.log(`\n✅ Servidor listo para recibir peticiones\n`);
});

export default app;
