import { pipeline } from "@xenova/transformers";
import winkNLP from "wink-nlp";
import model from "wink-eng-lite-web-model";

const nlp = winkNLP(model);
const its = nlp.its;

// Mocking the class logic from humanizer-backend-advanced.js for isolation
class PassiveVoiceTester {
    constructor() {
        this.nlp = nlp;
    }

    getBEForm(verb) {
        const lowerVerb = verb.toLowerCase();
        if (lowerVerb.endsWith("s") || lowerVerb.endsWith("es")) return "is";
        if (lowerVerb.endsWith("ed") || ["went", "took", "made", "gave", "had", "was", "were", "saw", "came", "thought"].includes(lowerVerb)) return "was";
        return "is";
    }

    getPastParticiple(lemma) {
        const irregularVerbs = { "present": "presented", "hide": "hidden", "convert": "converted" }; // simplified
        if (irregularVerbs[lemma]) return irregularVerbs[lemma];
        return lemma.endsWith("e") ? lemma + "d" : lemma + "ed";
    }

    transformToPassive(posData, originalSentence) {
        // Logic from backend
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

        if (subjectIdx !== -1 && verbIdx !== -1 && objectIdx !== -1) {
            const subject = posData[subjectIdx].word;
            const verb = posData[verbIdx].word;
            const verbLemma = posData[verbIdx].lemma;
            const object = posData[objectIdx].word;

            const beForm = this.getBEForm(verb);
            const pastParticiple = this.getPastParticiple(verbLemma);

            return `${object.charAt(0).toUpperCase() + object.slice(1)} ${beForm} ${pastParticiple} by ${subject.toLowerCase()}.`;
        }
        return null;
    }

    convertToPassiveVoice(text) {
        const doc = this.nlp.readDoc(text);
        const sentences = doc.sentences();
        const results = [];

        sentences.each((sentence) => {
            const sentenceText = sentence.out();
            const tokens = sentence.tokens();
            const posData = [];
            tokens.each((token) => {
                posData.push({
                    word: token.out(),
                    pos: token.out(its.pos),
                    lemma: token.out(its.lemma)
                });
            });

            const passive = this.transformToPassive(posData, sentenceText);
            if (passive) {
                console.log(`[Passive Transform] "${sentenceText}" -> "${passive}"`);
                results.push(passive);
            } else {
                results.push(sentenceText);
            }
        });
        return results.join(" ");
    }
}

const text = "The cigarette presents a paradox of freedom. Its smoke hides a trap of dependence.";
console.log("Original:", text);

const tester = new PassiveVoiceTester();
const result = tester.convertToPassiveVoice(text);
console.log("Result:", result);
