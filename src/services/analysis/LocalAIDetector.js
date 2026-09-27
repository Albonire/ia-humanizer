/**
 * LocalAIDetector - Detección NATIVA de texto generado por IA (100% local)
 *
 * Estrategia:
 *  1. Perplejidad REAL usando un modelo causal LM (Xenova/gpt2) cargado como
 *     sesión ONNX con @xenova/transformers (sin servicios externos).
 *     Texto de IA -> predecible -> perplejidad BAJA.
 *     Texto humano -> variado ("bursty") -> perplejidad ALTA.
 *  2. Burstiness: varianza de la longitud de las oraciones.
 *     La IA tiende a longitudes muy uniformes; los humanos varían mucho.
 *  3. Heurísticas léxicas (contracciones, palabras de relleno, conectores
 *     académicos en exceso) como señal complementaria de bajo peso.
 *
 * Combina las tres señales en una confianza 0-100 de "es contenido IA".
 */

import { AutoTokenizer, AutoModelForCausalLM, env } from "@xenova/transformers";

env.allowLocalModels = false;
env.useBrowserCache = false;

const LOG_2E = Math.LOG2E; // ln -> log2

export class LocalAIDetector {
  constructor(modelName = "Xenova/gpt2") {
    this.modelName = modelName;
    this.tokenizer = null;
    this.model = null;
    this.initializing = null; // promesa para evitar cargas dobles
    this.maxTokens = 256; // límite de tokens procesados por texto
  }

  async initialize() {
    if (this.model && this.tokenizer) return;
    if (!this.initializing) {
      this.initializing = (async () => {
        console.log(`[LocalAIDetector] Cargando modelo causal LM: ${this.modelName}...`);
        const [tokenizer, model] = await Promise.all([
          AutoTokenizer.from_pretrained(this.modelName),
          AutoModelForCausalLM.from_pretrained(this.modelName),
        ]);
        this.tokenizer = tokenizer;
        this.model = model;
        console.log("[LocalAIDetector] Modelo listo.");
      })().catch((err) => {
        this.initializing = null;
        throw err;
      });
    }
    return this.initializing;
  }

  /**
   * Aplica softmax sobre los logits del vocabulario completo.
   * Devuelve el log-probabilidad (natural) del token objetivo.
   */
  static logSoftmaxTarget(logits, dim, targetId) {
    let maxLogit = -Infinity;
    for (let i = 0; i < dim; i++) {
      if (logits[i] > maxLogit) maxLogit = logits[i];
    }
    let sumExp = 0;
    for (let i = 0; i < dim; i++) {
      sumExp += Math.exp(logits[i] - maxLogit);
    }
    // log p(target) = logit_t - max - log(sumExp)
    return logits[targetId] - maxLogit - Math.log(sumExp);
  }

  /**
   * Calcula la perplejidad media del texto con teacher forcing.
   * @returns {Promise<{perplexity:number, meanLogProbBase2:number, tokenCount:number}|null>}
   */
  async calculatePerplexity(text) {
    if (!text || !text.trim()) return null;

    try {
      await this.initialize();

      const encoded = this.tokenizer(text);
      let ids = encoded.input_ids;
      if (ids.length > this.maxTokens) ids = ids.slice(0, this.maxTokens);
      const n = ids.length;
      if (n < 2) return null;

      const input_ids = [ids]; // [batch=1, seq]
      const attention_mask = [new Array(n).fill(1)];

      const { logits } = await this.model({ input_ids, attention_mask });

      // logits: Float32Array de tamaño n * vocab
      const vocabSize = this.model.config.vocab_size;
      let totalLogProb = 0;
      let counted = 0;

      for (let t = 0; t < n - 1; t++) {
        const offset = t * vocabSize;
        // sube una vista para evitar copias grandes
        const row = logits.subarray(offset, offset + vocabSize);
        const lp = LocalAIDetector.logSoftmaxTarget(row, vocabSize, ids[t + 1]);
        totalLogProb += lp;
        counted++;
      }

      if (counted === 0) return null;

      const meanLogProb = totalLogProb / counted; // nats
      const perplexity = Math.exp(-meanLogProb);
      const meanLogProbBase2 = meanLogProb * LOG_2E;

      return { perplexity, meanLogProbBase2, tokenCount: counted };
    } catch (error) {
      console.error("[LocalAIDetector] Error calculando perplejidad:", error.message);
      return null;
    }
  }

  /**
   * Burstiness: coeficiente de variación de longitudes de oración.
   * Valores altos (> ~0.45) sugieren escritura humana.
   */
  static burstiness(text) {
    const sentences = (text.match(/[^.!?]+[.!?]+/g) || [text])
      .map((s) => s.trim().split(/\s+/).filter(Boolean).length)
      .filter((l) => l > 0);

    if (sentences.length < 2) return 0.5; // neutro para textos cortos

    const mean = sentences.reduce((a, b) => a + b, 0) / sentences.length;
    const variance =
      sentences.reduce((a, b) => a + (b - mean) ** 2, 0) / sentences.length;
    const std = Math.sqrt(variance);
    return mean > 0 ? std / mean : 0;
  }

  /**
   * Heurísticas léxicas ligeras (señal complementaria, poco peso).
   */
  static lexicalSignals(text) {
    const checks = [];
    let score = 0; // 0..100 parcial

    const contractionCount = (
      text.match(
        /\b(can't|won't|don't|doesn't|didn't|isn't|aren't|wasn't|weren't|it's|I'm|I've|I'll|you're|you've|we're|we've|they're|they've|wouldn't|couldn't|shouldn't|haven't|hasn't|there's|that's|what's)\b/gi
      ) || []
    ).length;
    const words = text.split(/\s+/).filter(Boolean).length || 1;
    const contractionRate = contractionCount / words;

    if (contractionCount === 0 && words > 25) {
      score += 18;
      checks.push("Sin contracciones (rasgo típico de IA)");
    } else if (contractionRate > 0.02) {
      score -= 10;
      checks.push("Uso natural de contracciones (rasgo humano)");
    }

    const academicWords = (
      text.match(
        /\b(moreover|furthermore|consequently|notwithstanding|heretofore|utilize|facilitate|leverage|delve|tapestry|testament|crucial|pivotal|paramount)\b/gi
      ) || []
    ).length;
    if (academicWords > 3) {
      score += 15;
      checks.push("Exceso de vocabulario académico/formal");
    }

    const fillerWords = (
      text.match(
        /\b(well|actually|honestly|basically|kind of|sort of|i mean|you know|frankly)\b/gi
      ) || []
    ).length;
    if (fillerWords >= 2) {
      score -= 10;
      checks.push("Presencia de muletillas naturales (rasgo humano)");
    }

    return { score, checks };
  }

  /**
   * Detección completa: perplejidad + burstiness + heurísticas.
   * @returns {Promise<{isAI:boolean, confidence:number, checks:string[], metrics:object}>}
   */
  async detect(text) {
    const ppl = await this.calculatePerplexity(text);
    const burst = LocalAIDetector.burstiness(text);
    const lexical = LocalAIDetector.lexicalSignals(text);
    const checks = [...lexical.checks];

    let confidence;

    if (ppl) {
      const { perplexity } = ppl;
      // Curva sigmoidea: PPL ~10 (muy IA) -> ~95%; PPL ~60 (humano) -> ~5%
      const pplScore = 100 / (1 + Math.exp((Math.log(perplexity) - Math.log(25)) * 1.6));

      // Burstiness baja (<0.3) es típica de IA; alta (>0.6) es humana
      const burstScore = 100 / (1 + Math.exp((burst - 0.42) * 12));

      confidence = 0.55 * pplScore + 0.25 * burstScore + 0.20 * Math.max(0, Math.min(100, lexical.score + 50));

      checks.unshift(
        `Perplejidad GPT-2: ${perplexity.toFixed(1)} (tokens: ${ppl.tokenCount})`,
        `Burstiness: ${burst.toFixed(2)}`
      );
    } else {
      // Sin modelo disponible: fallback a heurística pura
      confidence = Math.max(0, Math.min(100, lexical.score + 40));
      checks.push("Perplejidad no disponible (fallback heurístico)");
    }

    confidence = Math.round(Math.max(0, Math.min(100, confidence)) * 100) / 100;

    return {
      isAI: confidence >= 50,
      confidence,
      checks,
      metrics: {
        perplexity: ppl ? Number(ppl.perplexity.toFixed(2)) : null,
        burstiness: Number(burst.toFixed(3)),
        lexicalScore: lexical.score,
      },
    };
  }
}

export default LocalAIDetector;
