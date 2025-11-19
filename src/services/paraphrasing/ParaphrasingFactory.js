import LocalParaphrasingService from "./LocalParaphrasingService.js";

class ParaphrasingFactory {
    static createService(type = "local") {
        switch (type) {
            case "local":
                return new LocalParaphrasingService();
            default:
                throw new Error(`Unknown paraphrasing service type: ${type}`);
        }
    }
}

export default ParaphrasingFactory;
