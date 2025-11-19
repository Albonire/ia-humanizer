import TranslationFactory from "./src/services/translation/TranslationFactory.js";
import ParaphrasingFactory from "./src/services/paraphrasing/ParaphrasingFactory.js";

async function debugPipeline() {
    console.log("🚀 Starting Pipeline Debug...");

    const translationService = TranslationFactory.createService("local");
    const paraphrasingService = ParaphrasingFactory.createService("local");

    await translationService.initialize();
    await paraphrasingService.initialize();

    // Case 1: "bianual" -> "bibiar"
    const text1_ES = "Programas de screening como la mamografía anual o bianual a partir de cierta edad.";
    console.log(`\n--- CASE 1: "bianual" ---`);
    console.log(`Input (ES): ${text1_ES}`);

    const text1_EN = await translationService.translate(text1_ES, "es", "en");
    console.log(`Trans (EN): ${text1_EN}`);

    const text1_Para = await paraphrasingService.paraphrase(text1_EN);
    console.log(`Para  (EN): ${text1_Para}`);

    const text1_ES_Back = await translationService.translate(text1_Para, "en", "es");
    console.log(`Back  (ES): ${text1_ES_Back}`);


    // Case 2: Meaning Inversion
    const text2_ES = "Si bien su incidencia es elevada, una de las armas más poderosas contra él es la detección temprana.";
    console.log(`\n--- CASE 2: Meaning Inversion ---`);
    console.log(`Input (ES): ${text2_ES}`);

    const text2_EN = await translationService.translate(text2_ES, "es", "en");
    console.log(`Trans (EN): ${text2_EN}`);

    const text2_Para = await paraphrasingService.paraphrase(text2_EN);
    console.log(`Para  (EN): ${text2_Para}`);

    const text2_ES_Back = await translationService.translate(text2_Para, "en", "es");
    console.log(`Back  (ES): ${text2_ES_Back}`);

}

debugPipeline();
