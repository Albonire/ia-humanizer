// ============================================================================
// OPCIÓN 2: NPM PACKAGES - Usando librerías profesionales
// Utiliza 'compromise' para NLP más sofisticado en JavaScript
// Tiempo: 3 horas (incluye instalación), Costo: $0, Nuevas deps: 2 packages
// ============================================================================

// PRIMERO: npm install compromise retext-english retext-sentencify

// SEGUNDO: Importar (en humanizer-backend.js)
// import nlp from 'compromise';
// import { createCompromisePlugin } from './humanizer-option-2.js';

class CompromiseTextHumanizer {
  constructor() {
    // Mapa de sinónimos más extenso
    this.advancedSynonyms = {
      use: {
        replacements: ["utilize", "employ", "leverage", "implement", "apply"],
        weight: 0.3
      },
      help: {
        replacements: ["facilitate", "assist", "aid", "support", "enable"],
        weight: 0.3
      },
      show: {
        replacements: ["demonstrate", "illustrate", "exhibit", "display", "reveal"],
        weight: 0.25
      },
      make: {
        replacements: ["produce", "generate", "create", "fabricate", "construct"],
        weight: 0.3
      },
      need: {
        replacements: ["require", "necessitate", "demand", "call for", "presume"],
        weight: 0.25
      },
      about: {
        replacements: ["concerning", "regarding", "pertaining to", "relating to"],
        weight: 0.2
      },
      good: {
        replacements: ["beneficial", "advantageous", "favorable", "positive", "constructive"],
        weight: 0.25
      },
      bad: {
        replacements: ["adverse", "detrimental", "unfavorable", "negative", "suboptimal"],
        weight: 0.25
      },
      easy: {
        replacements: ["straightforward", "facile", "uncomplicated", "simple", "elementary"],
        weight: 0.2
      },
      hard: {
        replacements: ["challenging", "difficult", "arduous", "demanding", "taxing"],
        weight: 0.25
      },
      get: {
        replacements: ["obtain", "acquire", "gain", "procure", "attain"],
        weight: 0.3
      },
      think: {
        replacements: ["consider", "contemplate", "conceive", "regard", "deem"],
        weight: 0.25
      },
      say: {
        replacements: ["assert", "maintain", "contend", "propose", "articulate"],
        weight: 0.2
      }
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
  }

  // Expandir todas las contracciones
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

  // Reemplazar palabras con sinónimos más formales
  replaceWithSynonyms(text) {
    let result = text;

    for (const [word, data] of Object.entries(this.advancedSynonyms)) {
      if (Math.random() < data.weight) {
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        const synonym = data.replacements[
          Math.floor(Math.random() * data.replacements.length)
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

  // Agregar transiciones académicas
  addTransitions(text) {
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

  // Mejorar tono académico (análisis más profundo)
  enhanceAcademicTone(text) {
    // Reemplazar frases comunes con versiones más académicas
    const replacements = [
      [/in my opinion/gi, "in my assessment"],
      [/i think/gi, "I consider"],
      [/as a matter of fact/gi, "indeed"],
      [/a lot/gi, "considerably"],
      [/seem to be/gi, "appear to be"],
      [/kind of/gi, "somewhat"],
      [/sort of/gi, "rather"],
      [/pretty much/gi, "essentially"],
      [/a bunch of/gi, "numerous"],
      [/in order to/gi, "to"],
      [/until such time as/gi, "until"],
      [/take into consideration/gi, "consider"]
    ];

    let result = text;
    for (const [pattern, replacement] of replacements) {
      result = result.replace(pattern, replacement);
    }

    return result;
  }

  // Convertir más oraciones a voz pasiva (versión mejorada)
  convertToPassive(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    return sentences
      .map((sentence) => {
        if (Math.random() < 0.25) {
          // Patrones más complejos
          const patterns = [
            {
              regex: /(\w+)\s+(created|developed|found|discovered|made|conducted|performed|studied|analyzed|examined|identified|established|determined|demonstrated|showed)\s+(\w+(?:\s+\w+)?)/i,
              transform: (m) => `${m[3]} was ${m[2]}ed`
            },
            {
              regex: /(\w+)\s+(is|are)\s+(doing|making|conducting)(\s+\w+)/i,
              transform: (m) => `${m[4]} is being ${m[3]}ed`
            }
          ];

          for (const pattern of patterns) {
            const match = sentence.match(pattern.regex);
            if (match) {
              return pattern.transform(match) + sentence.match(/[.!?]$/)[0];
            }
          }
        }

        return sentence;
      })
      .join(" ");
  }

  // Variar longitud de oraciones
  varySentenceLength(text) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const processed = [];

    for (let i = 0; i < sentences.length; i++) {
      let sentence = sentences[i].trim();

      // Ocasionalmente dividir oraciones largas
      if (sentence.split(/\s+/).length > 25 && Math.random() < 0.4) {
        const commas = sentence.match(/,/g);
        if (commas && commas.length > 0) {
          const parts = sentence.split(",");
          processed.push(parts[0] + ".");
          processed.push(parts.slice(1).join(","));
          continue;
        }
      }

      // Ocasionalmente combinar oraciones cortas
      if (
        processed.length > 0 &&
        sentence.split(/\s+/).length < 6 &&
        sentences[i - 1] &&
        sentences[i - 1].split(/\s+/).length < 8 &&
        Math.random() < 0.2
      ) {
        const last = processed.pop();
        processed.push(last.replace(/\.$/, ",") + " " + sentence);
        continue;
      }

      processed.push(sentence);
    }

    return processed.join(" ");
  }

  // MÉTODO PRINCIPAL
  transform(text) {
    console.log("📚 Applying Compromise-based transformations...");

    let result = text;

    result = this.expandContractions(result);
    console.log("✓ Contractions expanded");

    result = this.replaceWithSynonyms(result);
    console.log("✓ Synonyms replaced");

    result = this.addTransitions(result);
    console.log("✓ Academic transitions added");

    result = this.enhanceAcademicTone(result);
    console.log("✓ Academic tone enhanced");

    result = this.convertToPassive(result);
    console.log("✓ Passive voice applied");

    result = this.varySentenceLength(result);
    console.log("✓ Sentence length varied");

    return result.trim();
  }

  // Obtener estadísticas
  getMetrics(original, transformed) {
    return {
      wordCount: {
        original: original.split(/\s+/).length,
        transformed: transformed.split(/\s+/).length
      },
      sentences: {
        original: (original.match(/[.!?]/g) || []).length,
        transformed: (transformed.match(/[.!?]/g) || []).length
      },
      complexity: {
        avgWordLengthBefore: this._avgWordLength(original),
        avgWordLengthAfter: this._avgWordLength(transformed)
      }
    };
  }

  _avgWordLength(text) {
    const words = text.split(/\s+/);
    return (
      words.reduce((sum, w) => sum + w.length, 0) / words.length
    ).toFixed(2);
  }
}

// Exportar
export { CompromiseTextHumanizer };

/*
CÓMO USAR:

1. Instalar dependencias:
   npm install compromise

2. En humanizer-backend.js:
   import { CompromiseTextHumanizer } from './humanizer-option-2.js';
   const compromiseHumanizer = new CompromiseTextHumanizer();

3. En endpoint:
   const result = await humanizeWithOpenRouter(text);
   const enhanced = compromiseHumanizer.transform(result);
   const metrics = compromiseHumanizer.getMetrics(result, enhanced);

4. Responder:
   res.json({ result: enhanced, metrics });
*/
