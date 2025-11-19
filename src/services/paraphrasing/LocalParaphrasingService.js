import { pipeline, env } from "@xenova/transformers";
import ParaphrasingService from "./ParaphrasingService.js";

// Configure environment
env.allowLocalModels = false;
env.useBrowserCache = false;

class LocalParaphrasingService extends ParaphrasingService {
    constructor() {
        super();
        this.pipeline = null;
        this.modelName = "Xenova/flan-t5-base"; // Upgraded from small for better quality
        this.isInitializing = false;
    }

    async initialize() {
        if (this.pipeline || this.isInitializing) return;

        this.isInitializing = true;
        console.log(`[LocalParaphrasingService] Loading model: ${this.modelName}...`);

        try {
            this.pipeline = await pipeline("text2text-generation", this.modelName);
            console.log("[LocalParaphrasingService] Model loaded successfully.");
        } catch (error) {
            console.error("[LocalParaphrasingService] Initialization failed:", error);
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    async paraphrase(text) {
        if (!text || !text.trim()) return text;

        if (!this.pipeline) {
            await this.initialize();
        }

        try {
            // Split text into sentences to avoid token limit issues and improve quality
            const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
            const results = [];

            for (const sentence of sentences) {
                if (sentence.trim().length < 10) {
                    results.push(sentence);
                    continue;
                }

                // Prompt engineering for FLAN-T5
                const prompt = `paraphrase: ${sentence.trim()}`;

                const output = await this.pipeline(prompt, {
                    max_new_tokens: 128,
                    temperature: 0.4, // Lower temperature for more deterministic output
                    top_p: 0.95,
                    repetition_penalty: 1.2,
                });

                if (output && output[0] && output[0].generated_text) {
                    const generated = output[0].generated_text;

                    // Sanity check: Length should be reasonable
                    if (generated.length < sentence.length * 0.5 || generated.length > sentence.length * 2) {
                        console.warn(`[Paraphrase] Discarding outlier output: "${generated}"`);
                        results.push(sentence);
                    } else {
                        results.push(generated);
                    }
                } else {
                    results.push(sentence);
                }
            }

            return results.join(" ");
        } catch (error) {
            console.error("[LocalParaphrasingService] Error:", error);
            return text; // Fallback
        }
    }
}

export default LocalParaphrasingService;
