import { pipeline, env } from "@xenova/transformers";
import TranslationService from "./TranslationService.js";

// Skip local model checks to speed up first load if models are not present
env.allowLocalModels = false;
env.useBrowserCache = false;

/**
 * Local Translation Service using Hugging Face models via Transformers.js.
 * Runs completely offline after initial model download.
 */
class LocalTranslationService extends TranslationService {
    constructor() {
        super();
        this.pipelines = {};
        this.models = {
            "es-en": "Xenova/opus-mt-es-en",
            "en-es": "Xenova/opus-mt-en-es"
        };
        this.isInitializing = false;
    }

    /**
     * Initialize the translation pipelines.
     * This is loaded lazily, but can be called explicitly to pre-warm models.
     */
    async initialize() {
        if (this.isInitializing) return;
        this.isInitializing = true;

        console.log("[LocalTranslationService] Initializing models...");
        try {
            // Pre-load both directions
            await this.getPipeline("es", "en");
            await this.getPipeline("en", "es");
            console.log("[LocalTranslationService] Models initialized successfully.");
        } catch (error) {
            console.error("[LocalTranslationService] Initialization failed:", error);
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Get or create a translation pipeline for the given language pair.
     */
    async getPipeline(source, target) {
        const key = `${source}-${target}`;

        if (this.pipelines[key]) {
            return this.pipelines[key];
        }

        const modelName = this.models[key];
        if (!modelName) {
            throw new Error(`No local model available for translation from ${source} to ${target}`);
        }

        console.log(`[LocalTranslationService] Loading model: ${modelName}...`);
        this.pipelines[key] = await pipeline("translation", modelName);
        return this.pipelines[key];
    }

    /**
     * Translate text using local models.
     * @param {string} text - Text to translate.
     * @param {string} fromLang - Source language code.
     * @param {string} toLang - Target language code.
     * @returns {Promise<string>}
     */
    async translate(text, fromLang, toLang) {
        if (!text || !text.trim()) return "";

        // Normalize language codes
        const source = fromLang.toLowerCase().substring(0, 2);
        const target = toLang.toLowerCase().substring(0, 2);

        if (source === target) return text;

        try {
            const pipe = await this.getPipeline(source, target);

            // Run translation
            // Transformers.js returns an array of objects: [{ translation_text: "..." }]
            const output = await pipe(text);

            if (output && output[0] && output[0].translation_text) {
                return output[0].translation_text;
            }

            return text;
        } catch (error) {
            console.error(`[LocalTranslationService] Translation error (${source}->${target}):`, error);
            throw error;
        }
    }
}

export default LocalTranslationService;
