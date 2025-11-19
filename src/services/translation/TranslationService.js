/**
 * Abstract base class for Translation Services.
 * Follows the Interface Segregation Principle (ISP) by defining a simple contract.
 */
class TranslationService {
    constructor() {
        if (this.constructor === TranslationService) {
            throw new Error("Cannot instantiate abstract class TranslationService");
        }
    }

    /**
     * Translate text from source language to target language.
     * @param {string} text - The text to translate.
     * @param {string} fromLang - Source language code (e.g., 'es', 'en').
     * @param {string} toLang - Target language code (e.g., 'en', 'es').
     * @returns {Promise<string>} - The translated text.
     */
    async translate(text, fromLang, toLang) {
        throw new Error("Method 'translate()' must be implemented.");
    }

    /**
     * Initialize the service (e.g., load models).
     * @returns {Promise<void>}
     */
    async initialize() {
        // Optional initialization
    }
}

export default TranslationService;
