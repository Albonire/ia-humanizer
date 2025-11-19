/**
 * Abstract base class for Paraphrasing Services.
 */
class ParaphrasingService {
    constructor() {
        if (this.constructor === ParaphrasingService) {
            throw new Error("Cannot instantiate abstract class ParaphrasingService");
        }
    }

    /**
     * Paraphrase the given text.
     * @param {string} text - The text to paraphrase.
     * @returns {Promise<string>} - The paraphrased text.
     */
    async paraphrase(text) {
        throw new Error("Method 'paraphrase()' must be implemented.");
    }

    /**
     * Initialize the service (load models).
     */
    async initialize() {
        // Optional
    }
}

export default ParaphrasingService;
