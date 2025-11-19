import { pipeline, env } from "@xenova/transformers";

// Configure environment
env.allowLocalModels = false;
env.useBrowserCache = false;

class ContextualSynonymService {
    constructor() {
        this.pipeline = null;
        this.modelName = "Xenova/bert-base-uncased";
        this.isInitializing = false;
    }

    async initialize() {
        if (this.pipeline || this.isInitializing) return;

        this.isInitializing = true;
        console.log(`[ContextualSynonymService] Loading model: ${this.modelName}...`);

        try {
            this.pipeline = await pipeline("fill-mask", this.modelName);
            console.log("[ContextualSynonymService] Model loaded successfully.");
        } catch (error) {
            console.error("[ContextualSynonymService] Initialization failed:", error);
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Find context-aware replacements for a word in a sentence.
     * @param {string} sentence - The full sentence.
     * @param {string} wordToReplace - The word to replace.
     * @returns {Promise<string[]>} List of suggested replacements.
     */
    async getSynonyms(sentence, wordToReplace) {
        if (!this.pipeline) await this.initialize();

        try {
            // Create masked sentence: "The bank is closed." -> "The [MASK] is closed."
            // Note: BERT uses [MASK] token.
            const maskedSentence = sentence.replace(wordToReplace, "[MASK]");

            if (maskedSentence === sentence) return []; // Word not found

            const results = await this.pipeline(maskedSentence, {
                topk: 5
            });

            // Filter results to exclude the original word and ensure they are valid words
            return results
                .map(r => r.token_str.trim())
                .filter(w => w.toLowerCase() !== wordToReplace.toLowerCase() && w.length > 2);
        } catch (error) {
            console.error("[ContextualSynonymService] Error:", error);
            return [];
        }
    }
}

export default new ContextualSynonymService();
