import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Info, 
  ArrowLeft, 
  FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDocuments } from '@/contexts/DocumentContext';
import { format } from 'date-fns';

const ViewPDF = () => {
  const { id } = useParams<{ id: string }>();
  const { documents } = useDocuments();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  // Find document by ID
  const document = documents.find(doc => doc.id === Number(id));
  
  useEffect(() => {
    if (!document) {
      // If document not found, redirect to dashboard
      navigate('/dashboard');
    } else {
      // Simulate loading the PDF
      const timer = setTimeout(() => {
        setLoading(false);
        setTotalPages(Math.floor(Math.random() * 30) + 5); // Random pages (5-35)
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [document, navigate]);
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };
  
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };
  
  if (!document) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2 slide-in">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to dashboard</span>
            </Link>
          </Button>
          <h1 className="text-lg font-medium truncate max-w-[200px] sm:max-w-md">
            {document.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
              <span className="sr-only">Zoom out</span>
            </Button>
            <span className="min-w-[60px] text-center text-sm">
              {Math.round(zoom * 100)}%
            </span>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleZoomIn}
              disabled={zoom >= 3}
            >
              <ZoomIn className="h-4 w-4" />
              <span className="sr-only">Zoom in</span>
            </Button>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handlePreviousPage}
              disabled={loading || currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <span className="min-w-[80px] text-center text-sm">
              {loading ? "-" : `${currentPage} / ${totalPages}`}
            </span>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleNextPage}
              disabled={loading || currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setInfoOpen(!infoOpen)}
            className={infoOpen ? 'bg-muted' : ''}
          >
            <Info className="h-4 w-4" />
            <span className="sr-only">Document information</span>
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-muted/30 p-4 slide-in">
          {loading ? (
            <div className="mx-auto max-w-3xl">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
            </div>
          ) : (
            <div 
              className="mx-auto max-w-3xl"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            >
              {/* This would be a real PDF viewer in production */}
              <div className="aspect-[3/4] w-full rounded-lg border bg-white shadow-lg">
                <div className="flex h-full flex-col items-center justify-center p-8">
                  <FileText className="mb-4 h-16 w-16 text-muted-foreground/60" />
                  <h2 className="mb-2 text-xl font-medium">{document.title}</h2>
                  <p className="mb-8 text-center text-muted-foreground">
                    {document.description}
                  </p>
                  <p className="text-center text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="mt-auto text-center text-sm text-muted-foreground">
                    This is a simulated PDF viewer. In a real application, the actual PDF would be displayed here.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Document Info Sidebar */}
        {infoOpen && (
          <div className="w-72 overflow-y-auto border-l bg-card p-4 slide-in">
            <h3 className="mb-4 font-medium">Document Information</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Title</h4>
                <p>{document.title}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                <p className="break-words">{document.description || "No description"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Created</h4>
                <p>{format(new Date(document.created_at), 'PPP')}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">File Size</h4>
                <p>{formatFileSize(document.file_size)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Pages</h4>
                <p>{loading ? "Loading..." : totalPages}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">File Location</h4>
                <p className="break-all text-sm">{document.file_path}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Controls */}
      <div className="flex items-center justify-between border-t px-4 py-2 md:hidden slide-in">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePreviousPage}
            disabled={loading || currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <span className="min-w-[60px] text-center text-sm">
            {loading ? "-" : `${currentPage} / ${totalPages}`}
          </span>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNextPage}
            disabled={loading || currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
            <span className="sr-only">Zoom out</span>
          </Button>
          <span className="min-w-[40px] text-center text-sm">
            {Math.round(zoom * 100)}%
          </span>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
            <span className="sr-only">Zoom in</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ViewPDF;
