import ParaphrasingFactory from "./src/services/paraphrasing/ParaphrasingFactory.js";

async function testParaphrasing() {
    console.log("🚀 Starting Paraphrasing Service Test...");

    try {
        const service = ParaphrasingFactory.createService("local");
        await service.initialize();

        const text = "The quick brown fox jumps over the lazy dog.";
        console.log(`\n📝 Input: "${text}"`);

        const paraphrased = await service.paraphrase(text);
        console.log(`✨ Output: "${paraphrased}"`);

        const complexText = "Artificial intelligence is rapidly transforming the way we live and work, offering new opportunities and challenges.";
        console.log(`\n📝 Input (Complex): "${complexText}"`);

        const complexParaphrased = await service.paraphrase(complexText);
        console.log(`✨ Output (Complex): "${complexParaphrased}"`);

        console.log("\n✅ Test Completed Successfully!");
    } catch (error) {
        console.error("\n❌ Test Failed:", error);
    }
}

testParaphrasing();
