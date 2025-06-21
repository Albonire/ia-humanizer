import OpenAI from "openai";

const HUMANIZATION_PROMPT = `Combina estrategias de escritura experta con imperfecciones orgánicas

ROLE: Redactor senior especializado en escritura indetectable  
OBJETIVO: Reescribir textos aplicando técnicas avanzadas de redacción humana  

TÉCNICAS PROFESIONALES DE REDACCIÓN:  
1. VARIACIÓN ESTILÍSTICA:  
   - Alternancia entre voces narrativas: descriptiva, reflexiva, directiva y valorativa
   - Cambios estratégicos de perspectiva (general → particular → abstracto)  

2. RITMO DISCURSIVO:  
   - Pirámide invertida en párrafos (idea principal → desarrollo)  
   - Uso estratégico de anáforas, paralelismos y elipsis controladas

3. RECURSOS RETÓRICOS NATURALES:  
   - Metáforas orgánicas
   - Sinécdoques
   - Antítesis

4. TÉCNICAS DE ENLACE:  
   - Conectores invisibles
   - Referencias catafóricas
   - Puentes temáticos

IMPERFECCIONES ESTRATÉGICAS:
- Errores de edición controlados (queísmo ocasional)
- Variación gramatical natural
- Digresiones relevantes
- Muletillas profesionales

PROTOCOLO DE SALIDA:
❌ SIN citas añadidas
❌ SIN guiones largos/complejos
✅ SOLO texto reescrito
✅ CONSERVAR estructura original`;

export class LocalHumanizer {
    private openai: OpenAI;

    constructor(apiKey: string) {
        this.openai = new OpenAI({ apiKey });
    }

    async humanizeText(text: string): Promise<string> {
        // addToLog("Humanizando el texto con IA (usando backend local)");
        try {
            const response = await fetch("http://localhost:3001/api/humanize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            const data = await response.json();
            if (data.result) {
                // addToLog("✅ Texto humanizado exitosamente");
                return data.result;
            } else {
                throw new Error(data.error || "Error desconocido");
            }
        } catch (error) {
            console.error("Error en la humanización:", error);
            // addToLog("❌ Error en la humanización del texto");
            return text;
        }
    }

    private postProcessText(text: string): string {
        // Aplicar algunas transformaciones básicas para hacer el texto más natural
        let processedText = text;

        // 1. Variar la longitud de las oraciones
        processedText = this.varySentenceLength(processedText);

        // 2. Añadir algunas imperfecciones naturales
        processedText = this.addNaturalImperfections(processedText);

        // 3. Mejorar la fluidez
        processedText = this.improveFlow(processedText);

        return processedText;
    }

    private varySentenceLength(text: string): string {
        // Implementación básica para variar la longitud de las oraciones
        const sentences = text.split(/[.!?]+/);
        return sentences
            .map(sentence => {
                if (Math.random() < 0.3) {
                    // A veces dividir oraciones largas
                    return sentence.split(',').join('. ');
                }
                return sentence;
            })
            .join('. ');
    }

    private addNaturalImperfections(text: string): string {
        // Añadir algunas imperfecciones naturales como queísmos ocasionales
        if (Math.random() < 0.1) {
            text = text.replace(/es importante que/g, 'es importante');
        }
        return text;
    }

    private improveFlow(text: string): string {
        // Mejorar la fluidez del texto
        const connectors = [
            'Además,', 'Por otro lado,', 'En este sentido,',
            'Asimismo,', 'De hecho,', 'En consecuencia,'
        ];

        const sentences = text.split(/[.!?]+/);
        return sentences
            .map((sentence, index) => {
                if (index > 0 && Math.random() < 0.2) {
                    return ` ${connectors[Math.floor(Math.random() * connectors.length)]} ${sentence}`;
                }
                return sentence;
            })
            .join('. ');
    }
} 