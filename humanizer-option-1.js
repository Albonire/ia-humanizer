// ============================================================================
// OPCIÓN 1: ACADEMIC TEXT TRANSFORMER - JavaScript Puro
// Implementa funcionalidades del proyecto Python en JavaScript nativo
// Tiempo: 2 horas, Costo: $0, Nuevas deps: 0
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
      "hasn't": "has not",
      "mightn't": "might not",
      "mustn't": "must not",
      "o'clock": "o'clock" // Don't touch this one
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
      "Conversely,",
      "On the other hand,",
      "Thus,",
      "As a result,"
    ];

    this.synonymMap = {
      "\\buse\\b": ["utilize", "employ", "leverage", "implement"],
      "\\bhelp\\b": ["facilitate", "assist", "aid", "support"],
      "\\bshow\\b": ["demonstrate", "illustrate", "exhibit", "display"],
      "\\bmake\\b": ["produce", "generate", "create", "fabricate"],
      "\\bneed\\b": ["require", "necessitate", "demand", "call for"],
      "\\babout\\b": ["concerning", "regarding", "pertaining to", "relating to"],
      "\\blot\\b": ["considerable", "substantial", "numerous", "extensive"],
      "\\bvery\\b": ["considerably", "significantly", "remarkably", "substantially"],
      "\\bgood\\b": ["beneficial", "advantageous", "favorable", "positive"],
      "\\bbad\\b": ["adverse", "detrimental", "unfavorable", "negative"],
      "\\beasy\\b": ["straightforward", "facile", "uncomplicated", "simple"],
      "\\bhard\\b": ["challenging", "difficult", "arduous", "demanding"],
      "\\bget\\b": ["obtain", "acquire", "gain", "procure"],
      "\\bthink\\b": ["consider", "contemplate", "conceive"],
      "\\bsay\\b": ["assert", "maintain", "contend", "propose"],
      "\\bdo\\b": ["perform", "execute", "conduct", "undertake"]
    };
  }

  // 1. Expandir contracciones
  expandContractions(text) {
    let result = text;
    for (const [contraction, expansion] of Object.entries(this.contractions)) {
      if (contraction === "o'clock") continue; // Skip o'clock

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

  // 2. Agregar transiciones académicas
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
          const firstChar = trimmed.charAt(0);
          const rest = trimmed.slice(1);

          return (
            transition + " " + firstChar.toLowerCase() + rest
          );
        }
        return sentence;
      })
      .join(" ");
  }

  // 3. Reemplazar con sinónimos más formales
  replaceSynonyms(text) {
    let result = text;

    for (const [pattern, synonymList] of Object.entries(this.synonymMap)) {
      if (Math.random() < 0.25) {
        const regex = new RegExp(pattern, "gi");
        const synonym = synonymList[
          Math.floor(Math.random() * synonymList.length)
        ];

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

  // 4. Convertir a voz pasiva (básico)
  convertPassiveVoice(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    return sentences
      .map((sentence) => {
        if (Math.random() < 0.2) {
          // Patrón: [Subject Noun] [Verb] [Object]
          const match = sentence.match(
            /([A-Z][a-z\s]+?)\s+(created|developed|found|discovered|made|conducted|performed|studied|analyzed|examined|identified|established|determined|demonstrated|showed)\s+([a-z\s]+?)(?=[.!?])/i
          );

          if (match) {
            const object = match[3].trim();
            const verb = match[2].toLowerCase();

            let pastParticiple = verb;
            if (verb === "found") {
              pastParticiple = "found";
            } else if (verb === "made") {
              pastParticiple = "made";
            } else if (verb.endsWith("y")) {
              pastParticiple = verb.slice(0, -1) + "ied";
            } else if (!verb.endsWith("ed")) {
              pastParticiple = verb + "ed";
            }

            const punctuation = sentence.match(/[.!?]$/)[0];
            return `${object} was ${pastParticiple}${punctuation}`;
          }
        }

        return sentence;
      })
      .join(" ");
  }

  // 5. Variar estructura de oraciones
  varyStructure(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    return sentences
      .map((sentence, index) => {
        // Ocasionalmente usar punto y coma
        if (
          index > 0 &&
          index < sentences.length - 1 &&
          Math.random() < 0.1
        ) {
          return sentence.replace(/\.$/, ";");
        }

        // Ocasionalmente combinar oraciones cortas
        if (
          index < sentences.length - 1 &&
          sentence.split(/\s+/).length < 8 &&
          Math.random() < 0.15
        ) {
          const nextSentence = sentences[index + 1];
          if (nextSentence && nextSentence.split(/\s+/).length < 8) {
            sentences.splice(index + 1, 1);
            const combined = sentence.replace(/\.$/, ",") + " " + nextSentence.trim();
            return combined;
          }
        }

        return sentence;
      })
      .join(" ");
  }

  // MÉTODO PRINCIPAL: Aplicar todas las transformaciones
  transform(text) {
    let result = text;

    console.log("📝 Applying AcademicTextTransformer transformations...");

    // Paso 1: Expandir contracciones
    result = this.expandContractions(result);
    console.log("✓ Contractions expanded");

    // Paso 2: Reemplazar sinónimos
    result = this.replaceSynonyms(result);
    console.log("✓ Synonyms elevated");

    // Paso 3: Agregar transiciones
    result = this.addAcademicTransitions(result);
    console.log("✓ Academic transitions added");

    // Paso 4: Convertir a voz pasiva
    result = this.convertPassiveVoice(result);
    console.log("✓ Passive voice applied");

    // Paso 5: Variar estructura
    result = this.varyStructure(result);
    console.log("✓ Structure variation applied");

    return result.trim();
  }

  // Métodos para estadísticas
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

// ============================================================================
// EXPORTAR PARA USAR EN humanizer-backend.js
// ============================================================================
export { AcademicTextTransformer };

/*
CÓMO USAR:

1. Importar en humanizer-backend.js:
   import { AcademicTextTransformer } from './humanizer-option-1.js';

2. Crear instancia:
   const academicTransformer = new AcademicTextTransformer();

3. En el endpoint /api/humanize:
   const enhancedResult = academicTransformer.transform(result);
   const stats = academicTransformer.getStats(result, enhancedResult);

4. Responder:
   res.json({ result: enhancedResult, stats });
*/
