
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface ResultDisplayProps {
  result: string;
}

const ResultDisplay = ({ result }: ResultDisplayProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setIsCopied(true);
      toast({
        title: "Copiado",
        description: "Texto copiado al portapapeles"
      });
      
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el texto",
        variant: "destructive"
      });
    }
  };

  const downloadText = () => {
    const element = document.createElement("a");
    const file = new Blob([result], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `texto-humanizado-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Descargado",
      description: "Archivo descargado exitosamente"
    });
  };

  const wordCount = result.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = result.length;

  return (
    <div className="space-y-6">
      <Textarea
        value={result}
        readOnly
        className="min-h-[320px] bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border-emerald-200/50 text-slate-700 resize-none leading-relaxed rounded-xl focus:ring-0 focus:border-emerald-200"
      />
      
      {/* Stats and Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-200/50">
        <div className="flex items-center gap-6 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="font-medium text-slate-700">{wordCount}</span>
            <span>palabras</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
            <span className="font-medium text-slate-700">{charCount}</span>
            <span>caracteres</span>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className={`h-10 px-6 border-slate-300 text-slate-600 hover:bg-slate-50 transition-all duration-300 rounded-lg ${
              isCopied ? "bg-emerald-50 border-emerald-300 text-emerald-700" : ""
            }`}
          >
            {isCopied ? (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Copiado
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar
              </div>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={downloadText}
            className="h-10 px-6 border-slate-300 text-slate-600 hover:bg-slate-50 transition-all duration-300 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
