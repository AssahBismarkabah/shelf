
import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";

// Set the worker source path
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFThumbnailProps {
  url: string;
  className?: string;
}

export default function PDFThumbnail({ url, className }: PDFThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setError(false);
    if (!url) return setError(true);

    // Load and render the first page of the PDF
    pdfjsLib.getDocument(url).promise
      .then((pdf) => pdf.getPage(1))
      .then((page) => {
        if (canvasRef.current && isMounted) {
          const viewport = page.getViewport({ scale: 0.28 });
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
  }, [url]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded ${className ? className : ""}`}>
        <FileText className="h-10 w-10 text-muted-foreground/60" />
      </div>
    );
  }
  return (
    <canvas ref={canvasRef} className={`rounded bg-white ${className ? className : ""}`} />
  );
}
