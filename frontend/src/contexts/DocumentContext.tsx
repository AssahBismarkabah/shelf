import React, { createContext, useContext, useState, useEffect } from 'react';
import { documentApi } from '../lib/api';
import { useAuth } from './AuthContext';

interface Document {
  id: number;
  filename: string;
  file_size: number;
  mime_type: string;
  s3_key: string;
  created_at: string;
  updated_at: string;
}

interface DocumentContextType {
  documents: Document[];
  currentDocument: Document | null;
  isLoading: boolean;
  error: string | null;
  uploadDocument: (formData: FormData) => Promise<void>;
  getDocuments: () => Promise<void>;
  getDocument: (id: number) => Promise<void>;
  deleteDocument: (id: number) => Promise<void>;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      getDocuments();
    }
  }, [isAuthenticated]);

  const uploadDocument = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await documentApi.upload(formData);
      setDocuments(prev => [...prev, response]);
    } catch (err) {
      setError('Failed to upload document');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await documentApi.list();
      setDocuments(response);
    } catch (err) {
      setError('Failed to fetch documents');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDocument = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await documentApi.get(id.toString());
      setCurrentDocument(response);
    } catch (err) {
      setError('Failed to fetch document');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDocument = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      await documentApi.delete(id.toString());
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      if (currentDocument?.id === id) {
        setCurrentDocument(null);
      }
    } catch (err) {
      setError('Failed to delete document');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DocumentContext.Provider
      value={{
        documents,
        currentDocument,
        isLoading,
        error,
        uploadDocument,
        getDocuments,
        getDocument,
        deleteDocument,
      }}
    >
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
