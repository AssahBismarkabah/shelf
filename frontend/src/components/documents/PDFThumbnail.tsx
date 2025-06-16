import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Set the worker source path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFThumbnailProps {
  documentId: number;
  className?: string;
  isList?: boolean;
}

export default function PDFThumbnail({ documentId, className, isList = false }: PDFThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setError(false);

    if (!documentId) {
      setError(true);
      return;
    }

    const loadPdf = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError(true);
          console.error("No authentication token found");
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/documents/${documentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          setError(true);
          console.error(`Failed to load PDF: ${response.statusText}`);
          return;
        }

        const arrayBuffer = await response.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        if (canvasRef.current && isMounted) {
          const viewport = page.getViewport({ scale: isList ? 0.35 : 0.28 });
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d")!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          page.render({ canvasContext: ctx, viewport });
        }
      } catch (err) {
        console.error('Error processing PDF:', err);
        setError(true);
      }
    };

    loadPdf();

    return () => { 
      isMounted = false; 
    };
  }, [documentId, isList]);

  if (error || !documentId) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded border border-dashed h-16 w-12 ${className ? className : ""}`}>
        <FileText className="h-8 w-8 text-muted-foreground/60" />
      </div>
    );
  }
  return (
    <canvas 
      ref={canvasRef} 
      className={`rounded bg-white border shadow ${isList ? "h-16 w-12 object-contain" : ""} ${className ? className : ""}`} 
      style={{ display: 'block', margin: '0 auto' }}
    />
  );
}
