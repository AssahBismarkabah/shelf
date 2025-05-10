import { useState, useRef, useEffect } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocuments } from '@/contexts/DocumentContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface FileUploaderProps {
  onClose: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [subscription, setSubscription] = useState<{ plan: string; storageLimitBytes: number; storageUsageBytes: number } | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadDocument, getDocuments } = useDocuments();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        setCheckingSubscription(true);
        const response = await api.get('/subscription');
        setSubscription({
          plan: response.data.plan,
          storageLimitBytes: response.data.storage_limit_bytes,
          storageUsageBytes: response.data.storage_usage_bytes || 0
        });
      } catch (error) {
        toast({
          title: "Subscription Check Failed",
          description: "Could not verify your subscription. Please try again.",
          variant: "destructive"
        });
        console.error(error);
      } finally {
        setCheckingSubscription(false);
      }
    };
    checkSubscription();
  }, [toast]);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (!subscription || subscription.plan === 'none') {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to upload files. Please subscribe to a plan.",
        variant: "destructive"
      });
      navigate('/subscription');
      return;
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        // Check if file size exceeds storage limit
        if (droppedFile.size + subscription.storageUsageBytes > subscription.storageLimitBytes) {
          toast({
            title: "Storage Limit Exceeded",
            description: "This file would exceed your storage limit. Please upgrade your plan or delete some files.",
            variant: "destructive"
          });
          return;
        }
        setFile(droppedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Only PDF files are supported.",
          variant: "destructive"
        });
      }
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!subscription || subscription.plan === 'none') {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to upload files. Please subscribe to a plan.",
        variant: "destructive"
      });
      navigate('/subscription');
      return;
    }
    
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        // Check if file size exceeds storage limit
        if (selectedFile.size + subscription.storageUsageBytes > subscription.storageLimitBytes) {
          toast({
            title: "Storage Limit Exceeded",
            description: "This file would exceed your storage limit. Please upgrade your plan or delete some files.",
            variant: "destructive"
          });
          return;
        }
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Only PDF files are supported.",
          variant: "destructive"
        });
      }
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subscription || subscription.plan === 'none') {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to upload files. Please subscribe to a plan.",
        variant: "destructive"
      });
      navigate('/subscription');
      return;
    }
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload.",
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      await uploadDocument(formData);
      await getDocuments();
      toast({
        title: "Document uploaded",
        description: "Your document has been successfully uploaded."
      });
      onClose();
    } catch (err) {
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Upload Document</h2>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={checkingSubscription || uploading}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        
        {checkingSubscription ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-shelf-400 border-t-transparent rounded-full" />
            <p className="ml-2 text-muted-foreground">Checking subscription...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div 
              className={`mb-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                dragActive ? 'border-shelf-400 bg-shelf-50' : 'border-border'
              }`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {file ? (
                <div className="text-center">
                  <FileText className="mx-auto mb-2 h-12 w-12 text-shelf-400" />
                  <p className="mb-1 break-all font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setFile(null)}
                  >
                    Change file
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="mb-1 font-medium">Drag and drop your PDF here</p>
                  <p className="mb-4 text-sm text-muted-foreground">
                    or
                  </p>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse files
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-shelf-400 hover:bg-shelf-600"
                disabled={!file || uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
