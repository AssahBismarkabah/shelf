
import React, { createContext, useContext, useState, useEffect } from 'react';

interface Document {
  id: number;
  title: string;
  description: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

interface DocumentContextType {
  documents: Document[];
  loadingDocuments: boolean;
  uploadDocument: (file: File, title: string, description: string) => Promise<void>;
  deleteDocument: (id: number) => Promise<void>;
  error: string | null;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

// Sample demo documents
const DEMO_DOCUMENTS: Document[] = [
  {
    id: 1,
    title: "Getting Started with Shelf",
    description: "Learn how to use Shelf to organize your PDFs effectively.",
    file_path: "https://arxiv.org/pdf/2303.18223.pdf",
    file_size: 1024 * 1024 * 2.5, // 2.5MB
    created_at: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
  },
  {
    id: 2,
    title: "Research Paper Example",
    description: "An example research paper about machine learning applications.",
    file_path: "https://arxiv.org/pdf/1706.03762.pdf",
    file_size: 1024 * 1024 * 1.2, // 1.2MB
    created_at: new Date(Date.now() - 86400000 * 7).toISOString() // 7 days ago
  },
  {
    id: 3,
    title: "Quarterly Business Report",
    description: "Q1 2024 business performance report.",
    file_path: "https://arxiv.org/pdf/2201.03545.pdf",
    file_size: 1024 * 1024 * 3.7, // 3.7MB
    created_at: new Date(Date.now() - 86400000 * 14).toISOString() // 14 days ago
  },
  {
    id: 4,
    title: "Project Proposal",
    description: "Proposal for the new Shelf Pro features.",
    file_path: "https://arxiv.org/pdf/2005.14165.pdf",
    file_size: 1024 * 1024 * 1.8, // 1.8MB
    created_at: new Date(Date.now() - 86400000 * 21).toISOString() // 21 days ago
  }
];

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load documents on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoadingDocuments(true);
      
      try {
        // This would be an actual API call in production
        // For demo purposes, we'll use sample data
        setTimeout(() => {
          setDocuments(DEMO_DOCUMENTS);
          setLoadingDocuments(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load documents');
        setLoadingDocuments(false);
      }
    };
    
    fetchDocuments();
  }, []);

  const uploadDocument = async (file: File, title: string, description: string) => {
    try {
      // This would be an actual API call in production
      // For demo purposes, we'll just add to our state
      
      const newDocument: Document = {
        id: Math.max(0, ...documents.map(d => d.id)) + 1,
        title,
        description,
        file_path: URL.createObjectURL(file),
        file_size: file.size,
        created_at: new Date().toISOString()
      };
      
      setDocuments(prev => [newDocument, ...prev]);
      
    } catch (err) {
      setError('Failed to upload document');
      throw err;
    }
  };

  const deleteDocument = async (id: number) => {
    try {
      // This would be an actual API call in production
      // For demo purposes, we'll just remove from our state
      
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      
    } catch (err) {
      setError('Failed to delete document');
      throw err;
    }
  };

  return (
    <DocumentContext.Provider value={{ 
      documents, 
      loadingDocuments, 
      uploadDocument, 
      deleteDocument, 
      error 
    }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};
