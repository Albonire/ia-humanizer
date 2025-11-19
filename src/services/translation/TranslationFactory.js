import LocalTranslationService from "./LocalTranslationService.js";

/**
 * Factory for creating Translation Services.
 * Follows the Open/Closed Principle: New services can be added here without changing client code.
 */
class TranslationFactory {
    static createService(type = "local") {
        switch (type) {
            case "local":
                return new LocalTranslationService();
            // Future: case "google": return new GoogleTranslationService();
            // Future: case "deepl": return new DeepLTranslationService();
            default:
                throw new Error(`Unknown translation service type: ${type}`);
        }
    }
}

export default TranslationFactory;
