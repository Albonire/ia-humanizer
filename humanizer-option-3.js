// ============================================================================
// OPCIÓN 3: ENHANCED DEEPSEEK PROMPT - Solo mejora del prompt
// Sin código adicional, todo lo hace el LLM
// Tiempo: 30 minutos, Costo: +5% API DeepSeek, Nuevas deps: 0
// ============================================================================

// SIMPLEMENTE REEMPLAZA la constante HUMANIZATION_PROMPT existente
// en humanizer-backend.js con esta versión mejorada:

const HUMANIZATION_PROMPT_OPTION_3 = (text) => `ROLE: Expert text humanizer and writing specialist
OBJECTIVE: Transform AI-generated text into authentic, natural, human-like writing
LANGUAGE: Preserve original language (maintain any non-English elements)
OUTPUT FORMAT: Only rewritten text, no explanations or analysis

═══════════════════════════════════════════════════════════════════════

CRITICAL TRANSFORMATIONS (MUST APPLY ALL):

1. CONTRACTION EXPANSION (100% - HIGHEST PRIORITY)
   Expand EVERY contraction to formal equivalent:
   • "don't" → "do not"
   • "won't" → "will not"
   • "can't" → "cannot"
   • "it's" → "it is"
   • "I'm" → "I am"
   • "you're" → "you are"
   • "we're" → "we are"
   • "they're" → "they are"
   • "I've" → "I have"
   • "you've" → "you have"
   • "we've" → "we have"
   • "they've" → "they have"
   • "I'll" → "I will"
   • "you'll" → "you will"
   • "we'll" → "we will"
   • "they'll" → "they will"
   • "wouldn't" → "would not"
   • "couldn't" → "could not"
   • "shouldn't" → "should not"
   • "isn't" → "is not"
   • "aren't" → "are not"
   • "wasn't" → "was not"
   • "weren't" → "were not"
   • "haven't" → "have not"
   • "hasn't" → "has not"

   RULE: Expansion MUST occur in EVERY instance.

═══════════════════════════════════════════════════════════════════════

2. ACADEMIC TONE ELEVATION (HIGH PRIORITY)
   Replace casual/informal language with formal alternatives:
   
   • "use" → "utilize" / "employ" / "leverage"
   • "help" → "facilitate" / "assist" / "aid"
   • "show" → "demonstrate" / "illustrate" / "exhibit"
   • "make" → "produce" / "generate" / "create"
   • "need" → "require" / "necessitate" / "demand"
   • "about" → "concerning" / "regarding" / "pertaining to"
   • "a lot" → "numerous" / "substantial" / "considerable"
   • "very" → "considerably" / "significantly" / "remarkably"
   • "good" → "beneficial" / "advantageous" / "favorable"
   • "bad" → "adverse" / "detrimental" / "unfavorable"
   • "easy" → "straightforward" / "facile" / "uncomplicated"
   • "hard" → "challenging" / "difficult" / "arduous"
   • "get" → "obtain" / "acquire" / "gain"
   • "think" → "consider" / "contemplate" / "regard"
   • "say" → "assert" / "maintain" / "contend"

   RULE: Apply 3-5 substitutions per 100 words. Maintain naturalness.

═══════════════════════════════════════════════════════════════════════

3. ACADEMIC TRANSITIONS (MEDIUM PRIORITY)
   Insert scholarly connectors naturally (1-2 per paragraph):
   At appropriate sentence beginnings, add occasionally:
   
   • "Moreover," - introduces additional point
   • "Additionally," - adds to previous statement
   • "Furthermore," - provides further support
   • "In addition," - introduces supplementary info
   • "Consequently," - shows result/effect
   • "Therefore," - indicates logical conclusion
   • "Thus," - confirms result
   • "Hence," - shows consequence
   • "However," - introduces contrast
   • "Nevertheless," - presents counter-point
   • "Nonetheless," - acknowledges contradiction
   • "Rather," - corrects previous statement
   • "Conversely," - shows opposite perspective
   • "On the other hand," - alternative viewpoint
   • "In fact," - emphasizes truth
   • "Indeed," - confirms statement

   RULE: Use in ~30-35% of sentences. Must flow naturally and not feel forced.

═══════════════════════════════════════════════════════════════════════

4. PASSIVE VOICE CONVERSION (MEDIUM PRIORITY - 15-25%)
   Convert some active sentences to passive when appropriate:
   
   PATTERNS:
   • "The researcher discovered X" → "X was discovered"
   • "Studies show Y" → "It has been shown that Y"
   • "We conducted Z" → "Z was conducted"
   • "The team identified A" → "A was identified"
   • "I found it helpful" → "It was found to be helpful"

   DO NOT overuse passive voice - maintain 70% active, 30% passive.
   ONLY convert when grammatically natural and meaningful.

═══════════════════════════════════════════════════════════════════════

5. SENTENCE STRUCTURE VARIATION (MEDIUM PRIORITY)
   Mix sentence lengths and types for natural flow:
   
   • 30% SHORT sentences (5-10 words)
   • 40% MEDIUM sentences (10-20 words)
   • 30% LONG sentences (20+ words)
   
   TECHNIQUES:
   • Break up repetitive sentence patterns
   • Occasionally combine related ideas with semicolons
   • Vary beginning structures (not always Subject-Verb)
   • Use occasional em-dashes for emphasis
   • Mix simple, compound, and complex sentences

═══════════════════════════════════════════════════════════════════════

6. LEXICAL SOPHISTICATION (LOW PRIORITY)
   Subtle improvements in word choice:
   
   • "thing" → "element" / "component" / "factor"
   • "place" → "environment" / "setting" / "context"
   • "way" → "manner" / "approach" / "method"
   • "however" → "nonetheless" / "yet"
   • "important" → "significant" / "critical" / "substantial"

   RULE: Don't overdo - maintain authenticity and naturalness.

═══════════════════════════════════════════════════════════════════════

FORBIDDEN ACTIONS (NON-NEGOTIABLE):
❌ DO NOT add explanations or meta-commentary
❌ DO NOT change paragraph count or structure
❌ DO NOT add/remove sections or change flow
❌ DO NOT include citations you didn't see
❌ DO NOT use formatting (bold, italics, bullets)
❌ DO NOT change the core meaning or facts
❌ DO NOT make text obviously over-processed
❌ DO NOT add em-dashes randomly
❌ DO NOT use uncommon words just to sound smart

═══════════════════════════════════════════════════════════════════════

QUALITY GATES (MUST SATISFY):
✓ Same paragraph structure and count
✓ Same logical flow and sequence
✓ ±10% word count variance
✓ 100% of contractions expanded
✓ Natural reading flow maintained
✓ Original tone elevated, not changed
✓ No grammatical errors introduced
✓ Meaning precisely preserved
✓ No jarring or artificial-sounding phrases

═══════════════════════════════════════════════════════════════════════

EXAMPLE (Few-shot Learning):

INPUT:
"I don't think AI models can understand human emotion. They're just algorithms that follow patterns. But they've become really good at mimicking it."

EXPECTED OUTPUT:
"It is not evident that artificial intelligence models can comprehend human emotion. Rather, they are sophisticated algorithms that identify and replicate linguistic patterns. Nevertheless, they have demonstrated considerable proficiency in simulating emotional understanding."

ANALYSIS OF EXAMPLE:
• "don't" → "is not" (contraction expanded)
• "think" → removed (strengthened phrasing)
• "I" implicit (more formal)
• "They're" → "they are" (contraction expanded)
• "good at" → "proficiency in" (synonym elevation)
• Added "Rather," (academic transition)
• Added "Nevertheless," (academic transition)
• "become really good" → "demonstrated considerable proficiency" (formal elevation)

═══════════════════════════════════════════════════════════════════════

YOUR TASK:
Transform the following text applying ALL the rules above.
Output ONLY the transformed text.
Maintain authenticity while elevating formality and academic tone.
NO explanations, NO meta-commentary, ONLY rewritten text.

TEXT TO TRANSFORM:

\${text}`;

// ============================================================================
// CÓMO USAR ESTA OPCIÓN 3
// ============================================================================

/*
EN humanizer-backend.js, SIMPLEMENTE reemplaza:

DE:
const HUMANIZATION_PROMPT = (text) => ` ROLE: Strict word processor...

A:
const HUMANIZATION_PROMPT = HUMANIZATION_PROMPT_OPTION_3;

ESO ES TODO. No hay que cambiar más nada.

El endpoint /api/humanize seguirá funcionando igual, pero con mejoras.

═══════════════════════════════════════════════════════════════════════

VENTAJAS:
✓ 30 minutos de implementación
✓ Cero código nuevo
✓ Cero nuevas dependencias
✓ Todo lo hace DeepSeek
✓ Fácil de revertir
✓ +10-15% mejor humanización

DESVENTAJAS:
• Costo API +5-10% (más tokens)
• No tienes control fino
• Todo depende de DeepSeek

═══════════════════════════════════════════════════════════════════════
*/

export { HUMANIZATION_PROMPT_OPTION_3 };
