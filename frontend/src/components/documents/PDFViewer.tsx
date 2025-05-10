import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { FileText } from 'lucide-react';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFViewerProps {
  url: string;
  scale?: number;
  pageNumber?: number;
  onLoadSuccess?: (totalPages: number) => void;
  className?: string;
}

const PDFViewer = ({ 
  url, 
  scale = 1.0,
  pageNumber = 1,
  onLoadSuccess,
  className = ''
}: PDFViewerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the JWT token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch the PDF with authentication
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        setPdfDoc(pdf);
        if (onLoadSuccess) {
          onLoadSuccess(pdf.numPages);
        }
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [url, onLoadSuccess]);

  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
      } catch (err) {
        console.error('Error rendering PDF page:', err);
        setError(err instanceof Error ? err.message : 'Failed to render PDF page');
      }
    };

    renderPage();
  }, [pdfDoc, pageNumber, scale]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center">
          <FileText className="mb-4 h-16 w-16 animate-pulse text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center">
          <FileText className="mb-4 h-16 w-16 text-destructive/60" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`pdf-viewer ${className}`}>
      <canvas ref={canvasRef} className="max-w-full" />
    </div>
  );
};

export default PDFViewer; 