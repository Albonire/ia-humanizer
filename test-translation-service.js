import TranslationFactory from "./src/services/translation/TranslationFactory.js";

async function testTranslation() {
    console.log("🚀 Starting Translation Service Test...");

    try {
        const service = TranslationFactory.createService("local");
        await service.initialize();

        const textES = "La inteligencia artificial es una herramienta poderosa.";
        console.log(`\n🇪🇸 Input (ES): "${textES}"`);
        const translatedEN = await service.translate(textES, "es", "en");
        console.log(`🇺🇸 Output (EN): "${translatedEN}"`);

        const textEN = "This is a test of the local translation system.";
        console.log(`\n🇺🇸 Input (EN): "${textEN}"`);
        const translatedES = await service.translate(textEN, "en", "es");
        console.log(`🇪🇸 Output (ES): "${translatedES}"`);

        console.log("\n✅ Test Completed Successfully!");
    } catch (error) {
        console.error("\n❌ Test Failed:", error);
    }
}

testTranslation();
