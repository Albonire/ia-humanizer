// ============================================================================
// EXPANDED WORD LISTS FOR HUMANIZER
// ============================================================================

export const ACADEMIC_TRANSITIONS = [
    // Addition
    "Moreover,", "Furthermore,", "Additionally,", "In addition,", "Also,", "Likewise,",
    "Similarly,", "Besides,", "What is more,", "Equally important,", "Further,",
    "Coupled with this,", "Not only that, but", "As well as,", "Along with,",

    // Contrast
    "However,", "Nevertheless,", "Nonetheless,", "Conversely,", "On the other hand,",
    "In contrast,", "On the contrary,", "Notwithstanding,", "Alternatively,", "Otherwise,",
    "Instead,", "Yet,", "Still,", "Even so,", "Despite this,", "Be that as it may,",

    // Result/Consequence
    "Therefore,", "Consequently,", "As a result,", "Thus,", "Hence,", "Accordingly,",
    "For this reason,", "Because of this,", "So,", "Then,", "In consequence,",
    "Under these circumstances,", "That is why,",

    // Example/Illustration
    "For example,", "For instance,", "Specifically,", "To illustrate,", "In particular,",
    "Notably,", "Such as,", "Namely,", "To demonstrate,", "As an illustration,",
    "In this case,", "Take, for example,",

    // Clarification/Restatement
    "In other words,", "That is,", "To put it another way,", "Simply put,",
    "To clarify,", "Basically,", "Essentially,", "Fundamentally,", "In essence,",
    "Strictly speaking,",

    // Time/Sequence
    "Meanwhile,", "Subsequently,", "Thereafter,", "Afterward,", "Simultaneously,",
    "Concurrently,", "In the meantime,", "Previously,", "Formerly,", "Initially,",
    "Finally,", "Eventually,", "Ultimately,", "In the end,", "At first,",

    // Summary/Conclusion
    "In conclusion,", "To summarize,", "Overall,", "In summary,", "To conclude,",
    "All in all,", "On the whole,", "By and large,", "Given these points,",
    "In brief,", "In short,"
];

export const SYNONYMS_BY_POS = {
    VERB: {
        "use": ["utilize", "employ", "leverage", "apply", "harness", "exploit", "adopt", "exercise", "operate"],
        "help": ["facilitate", "assist", "aid", "support", "benefit", "serve", "encourage", "foster", "promote", "boost"],
        "show": ["demonstrate", "illustrate", "exhibit", "display", "reveal", "indicate", "manifest", "present", "depict", "expose"],
        "make": ["produce", "generate", "create", "construct", "fabricate", "form", "manufacture", "compose", "assemble", "develop"],
        "need": ["require", "necessitate", "demand", "call for", "entail", "involve", "warrant", "lack"],
        "get": ["obtain", "acquire", "gain", "procure", "secure", "attain", "derive", "fetch", "receive", "gather"],
        "give": ["provide", "supply", "offer", "grant", "present", "deliver", "impart", "furnish", "allocate", "distribute"],
        "take": ["acquire", "seize", "capture", "grasp", "snatch", "assume", "undertake", "accept"],
        "find": ["discover", "locate", "identify", "detect", "uncover", "spot", "perceive", "encounter"],
        "think": ["consider", "contemplate", "ponder", "reflect", "deliberate", "reason", "speculate", "envision", "imagine"],
        "say": ["state", "declare", "assert", "mention", "remark", "articulate", "express", "voice", "utter", "pronounce"],
        "know": ["understand", "comprehend", "perceive", "recognize", "realize", "grasp", "discern", "fathom"],
        "want": ["desire", "crave", "covet", "aspire", "seek", "wish", "long for", "yearn for"],
        "try": ["attempt", "endeavor", "strive", "undertake", "aim", "seek", "struggle"],
        "start": ["initiate", "commence", "launch", "inaugurate", "instigate", "embark", "originate"],
        "stop": ["cease", "halt", "terminate", "discontinue", "conclude", "suspend", "interrupt", "arrest"],
        "change": ["alter", "modify", "transform", "vary", "amend", "revise", "adjust", "adapt", "evolve", "convert"],
        "improve": ["enhance", "upgrade", "refine", "ameliorate", "boost", "augment", "elevate", "optimize"]
    },
    ADJ: {
        "good": ["beneficial", "advantageous", "favorable", "excellent", "superior", "valuable", "positive", "constructive", "proficient", "competent", "worthy", "admirable"],
        "bad": ["adverse", "detrimental", "unfavorable", "poor", "inferior", "substandard", "deficient", "inadequate", "harmful", "damaging", "negative", "unpleasant"],
        "easy": ["straightforward", "facile", "uncomplicated", "simple", "effortless", "manageable", "accessible", "elementary"],
        "hard": ["challenging", "difficult", "arduous", "complex", "demanding", "laborious", "strenuous", "tough", "intricate", "complicated"],
        "nice": ["pleasant", "agreeable", "delightful", "charming", "enjoyable", "lovely", "appealing", "attractive"],
        "big": ["large", "substantial", "considerable", "significant", "massive", "immense", "vast", "huge", "enormous", "extensive", "prominent"],
        "small": ["minor", "modest", "limited", "diminutive", "tiny", "minute", "slight", "insignificant", "trivial", "compact"],
        "important": ["significant", "crucial", "vital", "essential", "pivotal", "critical", "fundamental", "key", "major", "consequential", "momentous"],
        "new": ["novel", "innovative", "fresh", "modern", "contemporary", "recent", "current", "original", "cutting-edge"],
        "old": ["ancient", "aged", "elderly", "outdated", "obsolete", "archaic", "vintage", "antique", "traditional"],
        "different": ["distinct", "diverse", "various", "varied", "dissimilar", "disparate", "unique", "separate"],
        "same": ["identical", "equivalent", "indistinguishable", "uniform", "consistent", "matching", "similar"],
        "happy": ["joyful", "content", "cheerful", "delighted", "elated", "glad", "satisfied", "pleased"],
        "sad": ["unhappy", "sorrowful", "depressed", "gloomy", "miserable", "melancholy", "dejected", "despondent"]
    },
    NOUN: {
        "thing": ["matter", "subject", "object", "element", "item", "entity", "phenomenon", "factor", "detail", "aspect"],
        "stuff": ["material", "substance", "content", "items", "goods", "belongings", "paraphernalia"],
        "problem": ["issue", "challenge", "difficulty", "concern", "obstacle", "dilemma", "complication", "hurdle", "setback"],
        "idea": ["concept", "notion", "thought", "proposition", "theory", "hypothesis", "belief", "opinion", "view"],
        "way": ["method", "approach", "manner", "technique", "mode", "strategy", "procedure", "system", "style"],
        "people": ["individuals", "persons", "humans", "citizens", "populace", "public", "society", "community"],
        "place": ["location", "site", "spot", "area", "region", "zone", "venue", "setting", "environment"],
        "time": ["period", "era", "epoch", "interval", "duration", "phase", "stage", "moment", "occasion"],
        "part": ["section", "segment", "component", "portion", "fragment", "piece", "element", "fraction"],
        "lot": ["abundance", "plethora", "multitude", "quantity", "mass", "heap", "pile", "wealth"]
    },
    ADV: {
        "very": ["exceptionally", "extremely", "remarkably", "particularly", "highly", "immensely", "profoundly", "exceedingly", "incredibly"],
        "really": ["truly", "genuinely", "actually", "indeed", "undoubtedly", "certainly", "absolutely", "positively"],
        "quickly": ["rapidly", "swiftly", "promptly", "expeditiously", "hastily", "speedily", "briskly", "instantly"],
        "slowly": ["gradually", "steadily", "leisurely", "deliberately", "sluggishly", "unhurriedly"],
        "maybe": ["perhaps", "possibly", "potentially", "conceivably", "feasibly"],
        "always": ["consistently", "constantly", "invariably", "perpetually", "eternally", "forever", "unceasingly"],
        "never": ["rarely", "seldom", "scarcely", "hardly", "at no time"]
    }
};

export const WEAK_WORDS_MAP = {
    "\\bvery\\b": "exceptionally",
    "\\breally\\b": "truly",
    "\\bnice\\b": "excellent",
    "\\bthing\\b": "matter",
    "\\bstuff\\b": "material",
    "\\blot\\b": "significant number",
    "\\bkind of\\b": "somewhat",
    "\\bsort of\\b": "rather",
    "\\bbig\\b": "substantial",
    "\\bsmall\\b": "diminutive",
    "\\bgood\\b": "beneficial",
    "\\bbad\\b": "adverse",
    "\\bhappy\\b": "elated",
    "\\bsad\\b": "despondent",
    "\\bget\\b": "obtain",
    "\\bgot\\b": "obtained",
    "\\bgetting\\b": "obtaining",
    "\\bmake\\b": "construct",
    "\\bmade\\b": "constructed",
    "\\bmaking\\b": "constructing",
    "\\bdo\\b": "perform",
    "\\bdid\\b": "performed",
    "\\bdoing\\b": "performing",
    "\\bsay\\b": "state",
    "\\bsaid\\b": "stated",
    "\\bsaying\\b": "stating",
    "\\bgo\\b": "proceed",
    "\\bwent\\b": "proceeded",
    "\\bgoing\\b": "proceeding",
    "\\bcome\\b": "arrive",
    "\\bcame\\b": "arrived",
    "\\bcoming\\b": "arriving",
    "\\bsee\\b": "observe",
    "\\bsaw\\b": "observed",
    "\\bseeing\\b": "observing",
    "\\blook\\b": "examine",
    "\\blooked\\b": "examined",
    "\\blooking\\b": "examining",
    "\\bwant\\b": "desire",
    "\\bwanted\\b": "desired",
    "\\bwanting\\b": "desiring",
    "\\bneed\\b": "require",
    "\\bneeded\\b": "required",
    "\\bneeding\\b": "requiring",
    "\\bthink\\b": "believe",
    "\\bthought\\b": "believed",
    "\\bthinking\\b": "believing",
    "\\bknow\\b": "comprehend",
    "\\bknew\\b": "comprehended",
    "\\bknowing\\b": "comprehending"
};
