import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";
import { pipeline, cos_sim } from "@xenova/transformers";

dotenv.config();

// ============================================================================
// ADVANCED NLP TEXT HUMANIZER CON POS TAGGING, EMBEDDINGS Y VOZ PASIVA
// ============================================================================

// Inicializar wink-nlp para POS tagging
const nlp = winkNLP(model);
const its = nlp.its;

// Variable global para el pipeline de embeddings (se carga lazy)
let embeddingPipeline = null;

class AdvancedTextHumanizer {
  constructor() {
    // Mapas de contracciones
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

    // Transiciones académicas
    this.academicTransitions = [
      "Además,",
      "Asimismo,",
      "Por lo tanto,",
      "En consecuencia,",
      "Sin embargo,",
      "No obstante,",
      "Igualmente,",
      "De hecho,",
      "En realidad,",
      "Incluso,",
      "Por el contrario,",
      "Más aún,",
      "A su vez,",
      "En tal sentido,"
    ];

    // Diccionario de sinónimos por categoría POS
    this.synonymsByPOS = {
      VERB: {
        "use": ["utilize", "employ", "leverage"],
        "help": ["facilitate", "assist", "aid"],
        "show": ["demonstrate", "illustrate", "exhibit"],
        "make": ["produce", "generate", "create"],
        "need": ["require", "necessitate", "demand"],
        "get": ["obtain", "acquire", "gain"],
        "give": ["provide", "supply", "offer"],
        "take": ["acquire", "seize", "capture"],
        "find": ["discover", "locate", "identify"],
        "think": ["consider", "contemplate", "ponder"]
      },
      ADJ: {
        "good": ["beneficial", "advantageous", "favorable", "excellent"],
        "bad": ["adverse", "detrimental", "unfavorable", "poor"],
        "easy": ["straightforward", "facile", "uncomplicated", "simple"],
        "hard": ["challenging", "difficult", "arduous", "complex"],
        "nice": ["pleasant", "agreeable", "delightful", "excellent"],
        "big": ["large", "substantial", "considerable", "significant"],
        "small": ["minor", "modest", "limited", "diminutive"],
        "important": ["significant", "crucial", "vital", "essential"]
      },
      NOUN: {
        "thing": ["matter", "subject", "object", "element"],
        "stuff": ["material", "substance", "content", "items"],
        "problem": ["issue", "challenge", "difficulty", "concern"],
        "idea": ["concept", "notion", "thought", "proposition"],
        "way": ["method", "approach", "manner", "technique"]
      },
      ADV: {
        "very": ["exceptionally", "extremely", "remarkably", "particularly"],
        "really": ["truly", "genuinely", "actually", "indeed"],
        "quickly": ["rapidly", "swiftly", "promptly", "expeditiously"],
        "slowly": ["gradually", "steadily", "leisurely", "deliberately"]
      }
    };

    // Diccionario de traducción ES <-> EN
    this.translationDict = {
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
        "posible": "possible"
      },
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
        "possible": "posible"
      }
    };
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

  expandContractions(text) {
    let result = text;
    for (const [contraction, expansion] of Object.entries(this.contractions)) {
      const regex = new RegExp(`\\b${contraction}\\b`, "gi");
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

  // Traducción local básica
  async translateLocal(text, fromLang, toLang) {
    const direction = `${fromLang}-${toLang}`;
    const dict = this.translationDict[direction];

    if (!dict) return text;

    let result = text;
    const words = text.toLowerCase().split(/\s+/);
    
    for (const word of words) {
      if (dict[word]) {
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        result = result.replace(regex, dict[word]);
      }
    }

    return result;
  }

  // Mejorador de escritura
  improveWritingLocal(text) {
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

    let result = text;
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
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences.map(s => s.trim()).join(" ");
  }

  // Detector de IA local
  detectAILocal(text) {
    let aiScore = 0;
    const checks = [];

    const contractionCount = (text.match(/\b(can't|won't|don't|isn't|aren't|it's|I'm|you're|we're|they're)\b/gi) || []).length;
    if (contractionCount === 0) {
      aiScore += 15;
      checks.push("Sin contracciones (rasgo de IA)");
    }

    const academicWords = (text.match(/\b(moreover|furthermore|consequently|notwithstanding|heretofore|utilize|facilitate|leverage)\b/gi) || []).length;
    if (academicWords > 3) {
      aiScore += 10;
      checks.push("Demasiadas palabras académicas");
    }

    const confidence = Math.min(aiScore, 100);
    const isAI = confidence > 50;

    return { isAI, confidence, checks };
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
    const aiDetection = humanizer.detectAILocal(transformed);

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
    const { text, lang = "en" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Se requiere el campo 'text'" });
    }

    console.log(`[HUMANIZE] Procesando: "${text.substring(0, 50)}..."`);

    // Aplicar transformación avanzada con configuración por defecto
    let transformed = await humanizer.transformAdvanced(text, {
      useEmbeddings: false,
      usePassiveVoice: false,
      usePOSTagging: true
    });

    // Corregir concordancia de género (para español)
    if (lang === "es" || text.match(/[áéíóúñü]/)) {
      transformed = humanizer.fixGenderConcordance(transformed);
    }

    res.json({
      result: transformed,
      message: "Texto humanizado exitosamente"
    });
  } catch (error) {
    console.error("[HUMANIZE] Error:", error);
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

    const detection = humanizer.detectAILocal(text);

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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n🚀 Advanced Text Humanizer API corriendo en http://localhost:${PORT}`);
  console.log(`\n✨ Características avanzadas:`);
  console.log(`   ✓ POS Tagging con wink-nlp`);
  console.log(`   ✓ Semantic Embeddings con Transformers.js`);
  console.log(`   ✓ Conversión a Voz Pasiva`);
  console.log(`   ✓ Reemplazo inteligente de sinónimos`);
  console.log(`\n📚 Endpoints disponibles:`);
  console.log(`   POST /api/humanize-advanced`);
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
