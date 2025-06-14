
import { Card } from "@/components/ui/card";

interface ProcessProgressProps {
  steps: string[];
  currentStep: number;
  isProcessing: boolean;
}

const ProcessProgress = ({ steps, currentStep, isProcessing }: ProcessProgressProps) => {
  return (
    <Card className="p-6 bg-white border-green-200 shadow-lg">
      <h3 className="text-xl font-semibold mb-4 text-green-800">Progreso del Proceso</h3>
      
      <div className="space-y-3">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;
          const isPending = currentStep < stepNumber;
          
          return (
            <div 
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                isCompleted 
                  ? 'bg-green-100 border border-green-300' 
                  : isCurrent 
                    ? 'bg-emerald-100 border border-emerald-300 shadow-sm' 
                    : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                isCompleted 
                  ? 'bg-green-600 text-white' 
                  : isCurrent 
                    ? 'bg-emerald-600 text-white animate-pulse' 
                    : 'bg-gray-300 text-gray-600'
              }`}>
                {isCompleted ? '✓' : stepNumber}
              </div>
              
              <div className="flex-1">
                <div className={`font-medium ${
                  isCompleted 
                    ? 'text-green-800' 
                    : isCurrent 
                      ? 'text-emerald-800' 
                      : 'text-gray-500'
                }`}>
                  {step}
                </div>
                
                {isCurrent && isProcessing && (
                  <div className="text-sm text-emerald-700 mt-1">
                    Procesando...
                  </div>
                )}
                
                {isCompleted && (
                  <div className="text-sm text-green-700 mt-1">
                    Completado
                  </div>
                )}
              </div>
              
              {isCurrent && isProcessing && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-green-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        ></div>
      </div>
      
      <div className="text-center mt-2 text-sm text-green-700">
        Paso {Math.min(currentStep, steps.length)} de {steps.length}
      </div>
    </Card>
  );
};

export default ProcessProgress;
