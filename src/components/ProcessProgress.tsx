
import { Card } from "@/components/ui/card";

interface ProcessProgressProps {
  steps: string[];
  currentStep: number;
  isProcessing: boolean;
}

const ProcessProgress = ({ steps, currentStep, isProcessing }: ProcessProgressProps) => {
  return (
    <Card className="p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50 rounded-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
        <h3 className="text-2xl font-semibold text-slate-800">Progreso del Proceso</h3>
      </div>
      
      <div className="space-y-4 mb-8">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;
          const isPending = currentStep < stepNumber;
          
          return (
            <div 
              key={index}
              className={`flex items-center space-x-4 p-4 rounded-xl transition-all duration-500 ${
                isCompleted 
                  ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 shadow-sm' 
                  : isCurrent 
                    ? 'bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200 shadow-md scale-[1.02]' 
                    : 'bg-slate-50/50 border border-slate-100'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all duration-300 ${
                isCompleted 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200' 
                  : isCurrent 
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-300 animate-pulse' 
                    : 'bg-slate-200 text-slate-500'
              }`}>
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : stepNumber}
              </div>
              
              <div className="flex-1">
                <div className={`font-semibold transition-colors duration-300 ${
                  isCompleted 
                    ? 'text-emerald-800' 
                    : isCurrent 
                      ? 'text-emerald-900' 
                      : 'text-slate-500'
                }`}>
                  {step}
                </div>
                
                {isCurrent && isProcessing && (
                  <div className="text-sm text-emerald-700 mt-1 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    Procesando...
                  </div>
                )}
                
                {isCompleted && (
                  <div className="text-sm text-emerald-700 mt-1 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    Completado
                  </div>
                )}
              </div>
              
              {isCurrent && isProcessing && (
                <div className="relative">
                  <div className="w-6 h-6 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Progress Bar */}
      <div className="relative">
        <div className="bg-slate-200 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-teal-600 h-3 rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          ></div>
        </div>
        
        <div className="text-center mt-4">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full text-sm font-medium text-slate-700 shadow-sm border border-slate-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            Paso {Math.min(currentStep, steps.length)} de {steps.length}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default ProcessProgress;
