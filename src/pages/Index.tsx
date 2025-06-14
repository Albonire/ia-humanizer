
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
    addToLog(`Traduciendo de ${fromLang} a ${toLang}`);
    await delay(1500);
    
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
      
      setCurrentStep(1);
      currentText = await translateText(currentText, 'es', 'en');
      
      setCurrentStep(2);
      currentText = await improveWriting(currentText);
      
      setCurrentStep(3);
      currentText = await paraphraseText(currentText);
      
      setCurrentStep(4);
      currentText = await removeFormatting(currentText);
      
      setCurrentStep(5);
      currentText = await humanizeText(currentText);
      
      setCurrentStep(6);
      currentText = await translateText(currentText, 'en', 'es');
      
      setCurrentStep(7);
      const aiDetection = await detectAI(currentText);
      
      setCurrentStep(8);
      addToLog(`Proceso completado. Detección de IA: ${aiDetection.confidence}%`);
      
      if (aiDetection.isAI && aiDetection.confidence > 70) {
        addToLog("Texto todavía detectado como IA. Se recomienda repetir el proceso.");
        toast({
          title: "Advertencia",
          description: "El texto aún se detecta como IA. Considera ejecutar el proceso nuevamente.",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      
      <div className="relative max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl mb-8 shadow-lg shadow-emerald-200">
            <div className="text-3xl text-white font-bold">AI</div>
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 via-emerald-800 to-teal-700 bg-clip-text text-transparent mb-6 leading-tight">
            Agente Humanizador de IA
          </h1>
          
          <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
            Transforma texto generado por IA en contenido más natural y humano usando un proceso automatizado de múltiples pasos con tecnología avanzada
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
          {/* Input Panel */}
          <Card className="group p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <h2 className="text-2xl font-semibold text-slate-800">Texto Original</h2>
            </div>
            
            <Textarea
              placeholder="Ingresa aquí el texto generado por IA que deseas humanizar..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[320px] mb-6 border-slate-200 bg-slate-50/50 focus:border-emerald-400 focus:ring-emerald-400/20 focus:ring-4 transition-all duration-300 resize-none text-slate-700 leading-relaxed rounded-xl"
              disabled={isProcessing}
            />
            
            <div className="flex gap-4">
              <Button 
                onClick={startHumanizationProcess}
                disabled={isProcessing || !inputText.trim()}
                className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all duration-300 rounded-xl"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Procesando...
                  </div>
                ) : (
                  "Iniciar Humanización"
                )}
              </Button>
              
              <Button 
                variant="outline"
                onClick={resetProcess}
                disabled={isProcessing}
                className="px-6 h-12 border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 rounded-xl"
              >
                Limpiar
              </Button>
            </div>
          </Card>

          {/* Output Panel */}
          <Card className="group p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
              <h2 className="text-2xl font-semibold text-slate-800">Resultado Humanizado</h2>
            </div>
            
            {finalResult ? (
              <ResultDisplay result={finalResult} />
            ) : (
              <div className="min-h-[320px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/30 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-4">
                  <div className="text-2xl text-slate-400">📝</div>
                </div>
                <p className="text-lg font-medium">El texto humanizado aparecerá aquí</p>
                <p className="text-sm mt-1">Inicia el proceso para ver los resultados</p>
              </div>
            )}
          </Card>
        </div>

        {/* Progress Section */}
        {isProcessing && (
          <div className="mb-12 animate-fade-in">
            <ProcessProgress 
              steps={steps}
              currentStep={currentStep}
              isProcessing={isProcessing}
            />
          </div>
        )}

        {/* Process Log */}
        {processLog.length > 0 && (
          <Card className="p-8 bg-white/60 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50 rounded-2xl mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
              <h3 className="text-xl font-semibold text-slate-800">Registro del Proceso</h3>
            </div>
            
            <div className="bg-slate-50/80 rounded-xl p-6 max-h-64 overflow-y-auto border border-slate-200/50">
              {processLog.map((log, index) => (
                <div key={index} className="text-sm text-slate-600 mb-2 font-mono leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Info Alert */}
        <Alert className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg rounded-2xl">
          <AlertDescription className="text-slate-700 leading-relaxed">
            <strong className="text-slate-800">Nota:</strong> Esta es una versión de demostración que simula el proceso de humanización. 
            En la versión completa, se integrarían APIs reales de traducción, parafraseo y detección de IA para obtener resultados reales.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default Index;
