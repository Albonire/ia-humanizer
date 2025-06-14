
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
    <div className="space-y-4">
      <Textarea
        value={result}
        readOnly
        className="min-h-[300px] bg-green-50 border-green-200 text-green-900"
      />
      
      <div className="flex justify-between items-center text-sm text-green-700">
        <div>
          <span className="font-medium">{wordCount}</span> palabras • 
          <span className="font-medium ml-1">{charCount}</span> caracteres
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className={`border-green-300 text-green-700 hover:bg-green-50 ${
              isCopied ? "bg-green-100 text-green-800" : ""
            }`}
          >
            {isCopied ? "✓ Copiado" : "Copiar"}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={downloadText}
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            Descargar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
