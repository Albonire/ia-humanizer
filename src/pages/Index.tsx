
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import ProcessProgress from "@/components/ProcessProgress";
import ResultDisplay from "@/components/ResultDisplay";

const Index = () => {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [processSteps, setProcessSteps] = useState<string[]>([]);
  const [finalResult, setFinalResult] = useState<string>("");
  const [processLog, setProcessLog] = useState<string[]>([]);

  const steps = [
    "Traduciendo a inglés",
    "Mejorando escritura",
    "Parafraseando texto", 
    "Eliminando formato",
    "Humanizando con IA",
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
    // Simulación de traducción - en producción usarías una API real
    addToLog(`Traduciendo de ${fromLang} a ${toLang}`);
    await delay(1500);
    
    // Para demostración, devolvemos el texto con un indicador
    if (toLang === 'en') {
      return `[TRANSLATED TO EN] ${text}`;
    } else {
      return `[TRANSLATED TO ES] ${text.replace('[TRANSLATED TO EN]', '').replace('[HUMANIZED]', '').replace('[PARAPHRASED]', '').replace('[IMPROVED]', '')}`;
    }
  };

  const improveWriting = async (text: string): Promise<string> => {
    addToLog("Mejorando la escritura del texto");
    await delay(1200);
    return `[IMPROVED] ${text}`;
  };

  const paraphraseText = async (text: string): Promise<string> => {
    addToLog("Parafraseando el texto");
    await delay(1800);
    return `[PARAPHRASED] ${text}`;
  };

  const removeFormatting = async (text: string): Promise<string> => {
    addToLog("Eliminando formato del texto");
    await delay(800);
    // Simulamos la eliminación de formato
    return text.replace(/\[.*?\]/g, '').trim();
  };

  const humanizeText = async (text: string): Promise<string> => {
    addToLog("Humanizando el texto con IA");
    await delay(2000);
    return `[HUMANIZED] ${text}`;
  };

  const detectAI = async (text: string): Promise<{ isAI: boolean; confidence: number }> => {
    addToLog("Detectando contenido de IA");
    await delay(1000);
    // Simulación de detección - en producción usarías APIs reales
    const confidence = Math.random() * 100;
    return {
      isAI: confidence > 50,
      confidence: Math.round(confidence)
    };
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
      
      // Paso 1: Traducir a inglés
      setCurrentStep(1);
      currentText = await translateText(currentText, 'es', 'en');
      
      // Paso 2: Mejorar escritura
      setCurrentStep(2);
      currentText = await improveWriting(currentText);
      
      // Paso 3: Parafrasear
      setCurrentStep(3);
      currentText = await paraphraseText(currentText);
      
      // Paso 4: Eliminar formato
      setCurrentStep(4);
      currentText = await removeFormatting(currentText);
      
      // Paso 5: Humanizar
      setCurrentStep(5);
      currentText = await humanizeText(currentText);
      
      // Paso 6: Traducir de vuelta al español
      setCurrentStep(6);
      currentText = await translateText(currentText, 'en', 'es');
      
      // Paso 7: Detectar IA
      setCurrentStep(7);
      const aiDetection = await detectAI(currentText);
      
      // Paso 8: Verificación final
      setCurrentStep(8);
      addToLog(`Proceso completado. Detección de IA: ${aiDetection.confidence}%`);
      
      if (aiDetection.isAI && aiDetection.confidence > 70) {
        addToLog("⚠️ Texto todavía detectado como IA. Se recomienda repetir el proceso.");
        toast({
          title: "Advertencia",
          description: "El texto aún se detecta como IA. Considera ejecutar el proceso nuevamente.",
          variant: "destructive"
        });
      } else {
        addToLog("✅ Texto humanizado exitosamente");
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
        description: "Hubo un error durante el proceso de humanización",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🤖 Agente Humanizador de IA
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Transforma texto generado por IA en contenido más natural y humano usando un proceso automatizado de múltiples pasos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de entrada */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Texto Original</h2>
            <Textarea
              placeholder="Pega aquí el texto generado por IA que quieres humanizar..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[300px] mb-4"
              disabled={isProcessing}
            />
            
            <div className="flex gap-3">
              <Button 
                onClick={startHumanizationProcess}
                disabled={isProcessing || !inputText.trim()}
                className="flex-1"
              >
                {isProcessing ? "Procesando..." : "🚀 Iniciar Humanización"}
              </Button>
              
              <Button 
                variant="outline"
                onClick={resetProcess}
                disabled={isProcessing}
              >
                🔄 Limpiar
              </Button>
            </div>
          </Card>

          {/* Panel de resultado */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Resultado Humanizado</h2>
            
            {finalResult ? (
              <ResultDisplay result={finalResult} />
            ) : (
              <div className="min-h-[300px] flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                El texto humanizado aparecerá aquí
              </div>
            )}
          </Card>
        </div>

        {/* Progreso del proceso */}
        {isProcessing && (
          <div className="mt-6">
            <ProcessProgress 
              steps={steps}
              currentStep={currentStep}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {/* Log del proceso */}
        {processLog.length > 0 && (
          <Card className="mt-6 p-6">
            <h3 className="text-xl font-semibold mb-4">📋 Registro del Proceso</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
              {processLog.map((log, index) => (
                <div key={index} className="text-sm text-gray-700 mb-1">
                  {log}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Información sobre el proceso */}
        <Alert className="mt-6">
          <AlertDescription>
            <strong>Nota:</strong> Esta es una versión de demostración que simula el proceso de humanización. 
            En la versión completa, se integrarían APIs reales de traducción, parafraseo y detección de IA para obtener resultados reales.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default Index;
