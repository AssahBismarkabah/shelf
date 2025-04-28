import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Info, 
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/contexts/DocumentContext';
import { format } from 'date-fns';
import PDFViewer from '@/components/documents/PDFViewer';

const ViewPDF = () => {
  const { id } = useParams<{ id: string }>();
  const { documents } = useDocuments();
  const navigate = useNavigate();
  const [infoOpen, setInfoOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  // Find document by ID
  const document = documents.find(doc => doc.id === Number(id));
  
  useEffect(() => {
    if (!document) {
      navigate('/dashboard');
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
  
  const handleDownload = async () => {
    if (!document) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/documents/${document.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.filename;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };
  
  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };
  
  if (!document) {
    return null;
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to dashboard</span>
            </Link>
          </Button>
          <h1 className="text-lg font-medium truncate max-w-[200px] sm:max-w-md">
            {document.filename}
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
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <span className="min-w-[80px] text-center text-sm">
              {`${currentPage} / ${totalPages}`}
            </span>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
          <Button variant="outline" size="icon" onClick={handleDownload}>
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
        <div className="flex-1 overflow-auto bg-muted/30 p-4">
          <div className="mx-auto max-w-3xl">
            <PDFViewer
              url={`/api/documents/${document.id}`}
              scale={zoom}
              pageNumber={currentPage}
              onLoadSuccess={setTotalPages}
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
        
        {/* Document Info Sidebar */}
        {infoOpen && (
          <div className="w-72 overflow-y-auto border-l bg-card p-4">
            <h3 className="mb-4 font-medium">Document Information</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Filename</h4>
                <p>{document.filename}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                <p className="break-words">{document.mime_type}</p>
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
                <p>{totalPages}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Storage Location</h4>
                <p className="break-all text-sm">{document.s3_key}</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile Controls */}
      <div className="flex items-center justify-between border-t px-4 py-2 md:hidden">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePreviousPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
          <span className="min-w-[60px] text-center text-sm">
            {`${currentPage} / ${totalPages}`}
          </span>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
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
