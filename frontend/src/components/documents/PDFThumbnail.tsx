import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Set the worker source path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFThumbnailProps {
  url: string;
  className?: string;
  isList?: boolean;
}

export default function PDFThumbnail({ url, className, isList = false }: PDFThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setError(false);
    if (!url) return setError(true);

    pdfjsLib.getDocument(url).promise
      .then((pdf) => pdf.getPage(1))
      .then((page) => {
        if (canvasRef.current && isMounted) {
          // Increase scale for list view for better visibility
          const viewport = page.getViewport({ scale: isList ? 0.35 : 0.28 });
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d")!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          page.render({ canvasContext: ctx, viewport });
        }
      })
      .catch(() => setError(true));
    return () => { isMounted = false; };
  }, [url, isList]);

  if (error) {
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
