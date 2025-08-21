import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import ProcessProgress from "@/components/ProcessProgress";
import ResultDisplay from "@/components/ResultDisplay";
import ooc from "out-of-character";
import { LocalHumanizer } from '../utils/localHumanizer';

const Index = () => {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [processSteps, setProcessSteps] = useState<string[]>([]);
  const [finalResult, setFinalResult] = useState<string>("");
  const [processLog, setProcessLog] = useState<string[]>([]);

  const steps = [
    "Traduciendo a inglés",
    "Humanizando con IA",
    "Limpiando rastros de IA (Smodin)",
    "Mejorando escritura",
    "Parafraseando texto",
    "Eliminando formato",
    "Parafraseando texto (de nuevo)",
    "Traduciendo de vuelta al español",
    "Detectando IA en resultado",
    "Verificación final"
  ];

  const addToLog = (message: string) => {
    setProcessLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const translateText = async (text: string, fromLang: string, toLang: string): Promise<string> => {
    addToLog(`Traduciendo de ${fromLang} a ${toLang} (usando Google Cloud Translation API)`);
    // --- INICIO DE INTEGRACIÓN API REAL (Google Cloud Translation API) ---
    // Para un proyecto universitario de costo cero, puedes usar los niveles gratuitos de estas APIs.
    // Asegúrate de obtener tu propia clave API y configurar el endpoint correctamente.
    // Si usas un backend, la llamada fetch iría a tu backend, no directamente a la API externa.

    const API_KEY = "AIzaSyCcvhre3XX5-sfAvXu3DSILe7I4Obl29cQ"; // Clave API proporcionada por el usuario
    const API_ENDPOINT = "https://translation.googleapis.com/language/translate/v2";

    try {
      const response = await fetch(`${API_ENDPOINT}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: fromLang,
          target: toLang,
          format: 'text'
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      const translatedText = data.data.translations[0].translatedText;
      addToLog(`Traducción exitosa a ${toLang}.`);
      return translatedText;
    } catch (error) {
      console.error("Error en la traducción:", error);
      toast({
        title: "Error de Traducción",
        description: `No se pudo traducir el texto a ${toLang}. Usando texto original.`,
        variant: "destructive"
      });
      return text; 
    }
  };

  const improveWriting = async (text: string): Promise<string> => {
    addToLog("Mejorando la escritura del texto (usando TextCortex API)");


    const TEXTCORTEX_API_KEY = "gAAAAABoVEFAHlLQNNvPQ42q23PhL1A4vUP6glSFbDqGM8_s92qNx70K3N_B8RrA36jhAFG1zSQasfeo62-Uk3VRl4xixKIDpZo_3c0_Osz9TmpORb2dggR4AZtQ18V-Nu4v7KbGUdvC80iwwydEhDYmkJg99vTY_FBUBDdBQnXG_LwkwmWnGxY=";
    const API_ENDPOINT = "https://api.textcortex.com/v1/texts/rewritings";

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEXTCORTEX_API_KEY}` 
        },
        body: JSON.stringify({
          text: text, 
          mode: "style_fluent" // <-- **Parámetro `mode` requerido añadido**
        }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage += `, message: ${errorJson.message || JSON.stringify(errorJson)}`;
        } catch {
          errorMessage += `, raw response: ${errorBody.substring(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const rawResponse = await response.text();
        console.error("Respuesta no JSON de la API de mejora de escritura:", rawResponse);
        throw new Error(`La API de mejora de escritura no devolvió JSON. Respuesta: ${rawResponse.substring(0, 100)}...`);
      }

      const data = await response.json();
      // La documentación indica que el texto reescrito está en data.data.outputs[0].text
      const improvedText = data.data && data.data.outputs && data.data.outputs[0] && data.data.outputs[0].text; 
      if (!improvedText) {
        throw new Error("La respuesta de la API de mejora de escritura no contiene el texto esperado o la propiedad es incorrecta.");
      }
      addToLog("Mejora de escritura exitosa.");
      return improvedText;
    } catch (error) {
      console.error("Error al mejorar la escritura:", error);
      toast({
        title: "Error de Mejora de Escritura",
        description: `No se pudo mejorar el texto. Detalles: ${(error as Error).message}`,
        variant: "destructive"
      });
      return text; // Retorna el texto original en caso de error
    }
  };

  const paraphraseText = async (text: string): Promise<string> => {
    addToLog("Parafraseando el texto (usando RapidAPI Paraphrasing API)");

    const RAPIDAPI_KEY = "4cc1e4b4camshcb8e9b0028cb710p1e18f2jsnde3df39a0a8e"; 
    const RAPIDAPI_HOST = "paraphrasing-and-rewriter-api.p.rapidapi.com";
    const API_ENDPOINT = `https://${RAPIDAPI_HOST}/rewrite-light`;

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY
        },
        body: JSON.stringify({
          from: "en", 
          text: text
        }),
      });
      if (!response.ok) {

        const errorBody = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage += `, message: ${errorJson.message || JSON.stringify(errorJson)}`;
        } catch {
          errorMessage += `, raw response: ${errorBody.substring(0, 100)}...`; // Limita el log
        }
        throw new Error(errorMessage);
      }
      
      const paraphrasedText = await response.text(); 
      if (!paraphrasedText) {
        throw new Error("La respuesta de la API de parafraseo no contiene el texto esperado.");
      }
      addToLog("Parafraseo exitoso.");
      return paraphrasedText;
    } catch (error) {
      console.error("Error al parafrasear:", error);
      toast({
        title: "Error de Parafraseo",
        description: `No se pudo parafrasear el texto. Detalles: ${(error as Error).message}`,
        variant: "destructive"
      });
      return text; 
    }
  };

  const removeFormatting = async (text: string): Promise<string> => {
    addToLog("Eliminando formato del texto (usando out-of-character)");
    const cleanedText = ooc.replace(text); 
    addToLog("Formato eliminado exitosamente.");
    await delay(500); // Mantener un pequeño delay para simular el procesamiento real
    return cleanedText;
    // --- FIN DE INTEGRACIÓN REAL ---
  };

  const humanizeText = async (text: string, lang: string = "en"): Promise<string> => {
    addToLog("Humanizando el texto con IA (usando backend local)");
    try {
      const response = await fetch("http://localhost:3001/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      const data = await response.json();
      if (data.result) {
        addToLog("✅ Texto humanizado exitosamente");
        return data.result;
      } else {
        throw new Error(data.error || "Error desconocido");
      }
    } catch (error) {
      console.error("Error en la humanización:", error);
      addToLog("❌ Error en la humanización del texto");
      return text;
    }
  };

  const detectAI = async (text: string): Promise<{ isAI: boolean; confidence: number }> => {
    addToLog("Detectando contenido de IA (usando Sapling.ai API)");
    // --- INICIO DE INTEGRACIÓN API REAL (Sapling.ai API) ---
    // Clave API proporcionada por el usuario.
    // Para un proyecto universitario de costo cero, puedes usar los niveles gratuitos de estas APIs.
    // Si usas un backend, la llamada fetch iría a tu backend, no directamente a la API externa.

    const SAPLING_API_KEY = "BILI5BB964HAHHZ4TFGJF6GJP5RQXFH5"; // Reemplaza con tu clave API de Sapling
    // Endpoint correcto para la detección de IA según la documentación de Sapling.ai:
    const API_ENDPOINT = "https://api.sapling.ai/api/v1/aidetect";

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // La documentación de Sapling indica que la clave API va en el body o query param
          // No suele ir en el Authorization header para este tipo de API.
        },
        body: JSON.stringify({
          key: SAPLING_API_KEY, // La clave API va en el body
          text: text,
          // Añadir otros parámetros que la API de Sapling.ai pueda requerir.
          sent_scores: true // Para obtener los scores por sentencia
        }),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage += `, message: ${errorJson.message || JSON.stringify(errorJson)}`;
        } catch {
          errorMessage += `, raw response: ${errorBody.substring(0, 100)}...`;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      // Asumiendo que la API devuelve una propiedad 'score' (general) y 'sentence_scores'
      const isAI = data.score > 0.5; // Si el score general es > 0.5, consideramos que es IA
      const confidence = data.score ? (data.score * 100) : 0; // El score es de 0 a 1, lo convertimos a %

      if (typeof isAI !== 'boolean' || typeof confidence !== 'number') {
        throw new Error("La respuesta de la API de detección de IA no tiene el formato esperado.");
      }

      addToLog(`Detección de IA exitosa: ${confidence.toFixed(2)}%`);
      return { isAI, confidence };
    } catch (error) {
      console.error("Error en la detección de IA:", error);
      toast({
        title: "Error de Detección de IA",
        description: `No se pudo detectar el contenido de IA. Detalles: ${(error as Error).message}`,
        variant: "destructive"
      });
      // Retorna un valor por defecto en caso de error para no detener el proceso
      return { isAI: true, confidence: 100 }; 
    }
    // --- FIN DE INTEGRACIÓN API REAL ---
  };

  const removeAIDetectionSmodin = async (text: string, language: string = "es"): Promise<string> => {
    addToLog("Limpiando rastros de IA con Smodin (AI Content Detection Remover)");
    const RAPIDAPI_KEY = "4cc1e4b4camshcb8e9b0028cb710p1e18f2jsnde3df39a0a8e"; // Clave API proporcionada por el usuario
    const API_ENDPOINT = "https://ai-content-detection-remover.p.rapidapi.com/recreate";
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'ai-content-detection-remover.p.rapidapi.com'
        },
        body: JSON.stringify({
          text,
          language,
          recreateType: "aiDetection"
        })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log("Respuesta Smodin:", data);
      if (!data.recreate) throw new Error("Respuesta inesperada de Smodin");
      addToLog("Texto limpiado exitosamente por Smodin.");
      return data.recreate;
    } catch (error) {
      console.error("Error con Smodin:", error);
      toast({
        title: "Error de Smodin",
        description: `No se pudo limpiar el texto con Smodin. Detalles: ${(error as Error).message}`,
        variant: "destructive"
      });
      return text; // Devuelve el texto original si falla
    }
  };

  const startHumanizationProcess = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el texto a humanizar",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStep(0);
    setProcessLog([]);
    setFinalResult("");

    try {
      let currentText = inputText;
      let retries = 0;
      const maxRetries = 3;
      let aiDetection = { isAI: true, confidence: 100 };

      // Paso 1: Traducir a inglés
      setCurrentStep(1);
      currentText = await translateText(currentText, 'es', 'en');

      // Paso 2: Humanizar con IA
      setCurrentStep(2);
      currentText = await humanizeText(currentText, 'en');

      // Paso 2.5: Limpiar rastros de IA con Smodin
      setCurrentStep(3);
      currentText = await removeAIDetectionSmodin(currentText);

      // Paso 3: Mejorar escritura
      setCurrentStep(4);
      currentText = await improveWriting(currentText);

      // Paso 4: Parafrasear
      setCurrentStep(5);
      currentText = await paraphraseText(currentText);

      // Paso 5: Eliminar formato
      setCurrentStep(6);
      currentText = await removeFormatting(currentText);

      // Paso 6: Parafrasear de nuevo
      setCurrentStep(7);
      currentText = await paraphraseText(currentText);

      // Paso 7: Traducir de vuelta al español
      setCurrentStep(8);
      currentText = await translateText(currentText, 'en', 'es');

      // Paso 8: Detectar IA
      setCurrentStep(9);
      aiDetection = await detectAI(currentText);

      // Paso 9: Verificación final
      setCurrentStep(10);
      addToLog(`Proceso completado. Detección de IA final: ${aiDetection.confidence.toFixed(2)}%`);

      if (aiDetection.isAI && aiDetection.confidence > 70) {
        addToLog("Advertencia: El texto aún se detecta como IA después de múltiples intentos.");
        toast({
          title: "Advertencia",
          description: "El texto aún se detecta como IA después de varios intentos. Considera ajustar el texto original o los parámetros.",
          variant: "destructive"
        });
      } else {
        addToLog("Texto humanizado exitosamente");
        toast({
          title: "Éxito",
          description: "Texto humanizado correctamente"
        });
      }

      setFinalResult(currentText);

    } catch (error) {
      console.error("Error en el proceso:", error);
      toast({
        title: "Error",
        description: "Hubo un error durante el proceso de humanización: " + (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setCurrentStep(0);
    }
  };

  const resetProcess = () => {
    setInputText("");
    setFinalResult("");
    setProcessLog([]);
    setCurrentStep(0);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center p-4 sm:p-6 lg:p-8 font-serif">
      <div className="w-full max-w-6xl mx-auto flex flex-col flex-grow">
        <header className="text-center mb-12 flex-shrink-0">
          <h1 className="text-4xl sm:text-5xl font-sans font-bold mb-3">
            Agente Humanizador de Texto
          </h1>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Transforma contenido generado por IA en una escritura natural, auténtica y que conecte con tu audiencia.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow">
          {/* Columna de Input */}
          <Card className="p-6 sm:p-8 shadow-lg flex flex-col">
            <label htmlFor="input-text" className="block text-lg font-sans font-semibold mb-4 text-foreground flex-shrink-0">
              Pega tu texto aquí
            </label>
            <Textarea
              id="input-text"
              placeholder="El texto de IA que deseas transformar..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-grow mb-4 text-base rounded-md resize-none"
              disabled={isProcessing}
            />
            <div className="flex flex-col sm:flex-row gap-4 mt-auto flex-shrink-0">
              <Button
                onClick={startHumanizationProcess}
                disabled={isProcessing || !inputText.trim()}
                className="w-full sm:w-auto flex-grow py-3 text-lg font-sans"
                size="lg"
              >
                {isProcessing ? "Procesando..." : "Humanizar Texto"}
              </Button>
              <Button
                variant="outline"
                onClick={resetProcess}
                disabled={isProcessing}
                className="w-full sm:w-auto py-3 text-lg font-sans"
                size="lg"
              >
                Limpiar
              </Button>
            </div>
          </Card>

          {/* Columna de Output */}
          <Card className="p-6 sm:p-8 shadow-lg flex flex-col">
            <h2 className="text-2xl font-sans font-semibold mb-4 text-foreground flex-shrink-0">Resultado Humanizado</h2>
            <div className="flex-grow flex flex-col justify-center border-2 border-dashed border-border/20 rounded-lg p-4 bg-background">
              {!finalResult && (
                <div className="text-center text-foreground/60">
                  <p>{isProcessing ? "Procesando y mejorando el texto..." : "El resultado aparecerá aquí."}</p>
                </div>
              )}
              {finalResult && <ResultDisplay result={finalResult} />}
            </div>
          </Card>
        </main>

        {(isProcessing || processLog.length > 0) &&
          <section className="w-full mt-8">
            {isProcessing && (
              <div className="w-full">
                <ProcessProgress
                  steps={steps}
                  currentStep={currentStep}
                  isProcessing={isProcessing}
                />
              </div>
            )}

            {processLog.length > 0 && (
              <Card className="mt-8 p-6 shadow-md bg-card/50">
                <h3 className="text-xl font-sans font-semibold mb-4 text-foreground">Registro del Proceso</h3>
                <div className="bg-secondary/10 rounded-lg p-4 max-h-48 overflow-y-auto border border-border">
                  {processLog.map((log, index) => (
                    <div key={index} className="text-sm text-foreground/90 mb-1 font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </section>
        }

        <footer className="text-center mt-12 flex-shrink-0">
            <Alert className="border-none bg-transparent">
              <AlertDescription className="text-foreground/60">
                <strong>Nota:</strong> Esta es una herramienta de demostración. Revisa siempre los resultados.
              </AlertDescription>
            </Alert>
        </footer>

      </div>
    </div>
  );
};

export default Index;
