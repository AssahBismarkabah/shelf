import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Grid,
  List,
  Search,
  Upload,
  FileText,
  MoreVertical,
  Download,
  Trash2,
  Eye,
  Award,
  HardDrive,
  Database,
  ArrowRight,
  FolderOpen, // Added
  SearchX     // Added
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useDocuments } from '@/contexts/DocumentContext';
import { useToast } from '@/components/ui/use-toast';
import FileUploader from '@/components/documents/FileUploader';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import PDFThumbnail from '@/components/documents/PDFThumbnail';
import Footer from '@/components/layouts/Footer';
import { useLoading } from '@/contexts/LoadingContext';
import { CenteredSpinner } from '@/components/ui/loading-overlay';
import { subscriptionApi } from '@/lib/api';
import { Progress } from '@/components/ui/progress';

const Dashboard = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploader, setShowUploader] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const [animateItemsIn, setAnimateItemsIn] = useState(false);
  const [subscription, setSubscription] = useState<{ plan: string; storageLimitBytes: number; storageUsageBytes: number } | null>(null);
  const { documents, isLoading, deleteDocument } = useDocuments();
  const { toast } = useToast();
  const { startLoading, stopLoading } = useLoading();
  
  useEffect(() => {
    if (isLoading) {
      startLoading('Loading your documents...');
      setAnimateItemsIn(false); // Reset animation trigger while loading
    } else {
      stopLoading();
      // Trigger animation shortly after loading stops to ensure items are ready
      setTimeout(() => setAnimateItemsIn(true), 50); 
    }
  }, [isLoading, startLoading, stopLoading]);

  useEffect(() => {
    setIsHeaderVisible(true);
    const fetchSubscription = async () => {
      try {
        const data = await subscriptionApi.get();
        setSubscription({
          plan: data.plan,
          storageLimitBytes: data.storage_limit_bytes,
          storageUsageBytes: data.storage_usage_bytes || 0,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch subscription data.",
          variant: "destructive"
        });
      }
    };
    fetchSubscription();
  }, [toast, documents]);
  
  const filteredDocuments = documents.filter(doc => 
    doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleDeleteDocument = async (id: number) => {
    try {
      await deleteDocument(id);
      toast({
        title: "Document deleted",
        description: "The document has been successfully deleted."
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete document.",
        variant: "destructive"
      });
    }
  };
  
  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const storagePercentage = subscription ? (subscription.storageUsageBytes / subscription.storageLimitBytes) * 100 : 0;

  if (isLoading) {
    return <CenteredSpinner />;
  }

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row">
        <div className={`transition-all duration-700 ease-out ${isHeaderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">My Documents</h1>
          <p className="text-muted-foreground">
            Manage and organize your PDF documents
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className={`transition-colors duration-200 active:scale-95 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}`}
          >
            <Grid className="h-5 w-5" />
            <span className="sr-only">Grid view</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            className={`transition-colors duration-200 active:scale-95 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}`}
          >
            <List className="h-5 w-5" />
            <span className="sr-only">List view</span>
          </Button>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground cursor-pointer"
              onClick={() => setShowSearch(true)}
            />
            <Input
              placeholder="Search documents..."
              className="pl-10 w-[250px] transition-shadow duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-1 dark:focus:ring-offset-black"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
            />
          </div>
          <Button
            className="group bg-primary hover:bg-primary/80 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md active:scale-95"
            onClick={() => setShowUploader(true)}
          >
            <Upload className="mr-2 h-4 w-4 group-hover:animate-pulse" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Subscription and Storage Information */}
      {subscription && (
        <div className="mb-8 p-6 bg-card border border-border rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-3 flex items-center">
            <Award className="inline-block h-5 w-5 mr-2 text-primary" />
            Subscription Plan: {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
          </h2>
          <p className="text-sm text-muted-foreground mb-1 flex items-center">
            <HardDrive className="inline-block h-4 w-4 mr-2 text-muted-foreground" />
            Storage Limit: <span className="font-medium text-foreground ml-1">{formatFileSize(subscription.storageLimitBytes)}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-1 flex items-center">
            <Database className="inline-block h-4 w-4 mr-2 text-muted-foreground" />
            Storage Used: <span className="font-medium text-foreground ml-1">{formatFileSize(subscription.storageUsageBytes)}</span>
          </p>
          <Progress value={storagePercentage} className="w-full mt-3 [&>div]:bg-primary [&>div]:transition-all [&>div]:duration-1000 [&>div]:ease-out" />
          <p className="text-xs text-muted-foreground mt-2">{Math.round(storagePercentage)}% of storage used</p>
          {subscription.plan.toLowerCase() !== 'enterprise' && (
             <Link to="/subscription" className="text-xs font-medium text-primary hover:underline mt-3 inline-block">
               Upgrade Plan <ArrowRight className="inline-block h-3 w-3 ml-1" />
             </Link>
          )}
        </div>
      )}

      {filteredDocuments.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDocuments.map((document, index) => (
              <div
                key={document.id}
                className={`group overflow-hidden rounded-lg border bg-card shadow-md transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1.5 
                            ${animateItemsIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                style={{ transitionDelay: `${index * 75}ms` }}
              >
                <div className="relative aspect-[3/4] bg-muted">
                  <PDFThumbnail
                    documentId={document.id}
                    className="w-full h-full object-cover rounded-t-lg" 
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    <Link 
                      to={`/view/${document.id}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm transition-transform hover:scale-110"
                    >
                      <Eye className="h-5 w-5 text-shelf-600" />
                    </Link>
                  </div>
                  <div className="absolute right-2 top-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full bg-white/90 shadow-sm opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/view/${document.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteDocument(document.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium">
                    <Link
                      to={`/view/${document.id}`}
                      className="hover:text-shelf-600 hover:underline truncate"
                    >
                      {document.filename}
                    </Link>
                  </h3>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatFileSize(document.file_size)}</span>
                    <span>{format(new Date(document.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-card shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Preview</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Size</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((document, index) => (
                    <tr
                      key={document.id}
                      className={`border-b transition-opacity duration-300 ease-out hover:bg-slate-100 dark:hover:bg-slate-800/60 
                                  ${animateItemsIn ? 'opacity-100' : 'opacity-0'}`}
                      style={{ transitionDelay: `${index * 50}ms` }}
                    >
                      <td className="px-4 py-3 w-[58px]">
                        <PDFThumbnail documentId={document.id} isList={true} className="h-14 w-10 object-contain shadow rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">
                              <Link
                                to={`/view/${document.id}`}
                                className="hover:text-shelf-600 hover:underline truncate"
                              >
                                {document.filename}
                              </Link>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatFileSize(document.file_size)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatFileSize(document.file_size)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {format(new Date(document.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="transition-colors duration-150 hover:bg-muted hover:text-foreground"
                          >
                            <Link to={`/view/${document.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="transition-colors duration-150 hover:bg-muted hover:text-foreground"
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDocument(document.id)}
                            className="transition-colors duration-150 hover:bg-red-100 dark:hover:bg-red-800/30 hover:text-red-600 dark:hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" /> {/* Removed text-red-600 from here to apply on hover */}
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="flex h-72 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed bg-card p-12 text-center">
          {searchQuery ? (
            <SearchX className="mb-4 h-20 w-20 text-muted-foreground/50" />
          ) : (
            <FolderOpen className="mb-4 h-20 w-20 text-muted-foreground/50" />
          )}
          <h3 className="text-xl sm:text-2xl font-semibold mb-2">
            {searchQuery ? "No documents match your search" : "No documents yet"}
          </h3>
          <p className="text-base text-center text-muted-foreground mb-6">
            {searchQuery 
              ? "Try adjusting your search terms or upload a new document." 
              : "Get started by uploading your first document."}
          </p>
          <Button
            className="group bg-primary text-primary-foreground shadow-md transition-all duration-200 ease-in-out hover:bg-primary/80 hover:scale-105 hover:shadow-lg active:scale-95"
            onClick={() => setShowUploader(true)}
          >
            <Upload className="mr-2 h-4 w-4 group-hover:animate-pulse" />
            Upload Document
          </Button>
        </div>
      )}
      
      {showUploader && (
        <FileUploader onClose={() => setShowUploader(false)} />
      )}

      <CommandDialog open={showSearch} onOpenChange={setShowSearch}>
        <CommandInput 
          placeholder="Search documents..." 
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          {filteredDocuments.length === 0 && (
            <CommandEmpty>No documents found.</CommandEmpty>
          )}
          <CommandGroup heading="Documents">
            {filteredDocuments.map((doc) => (
              <CommandItem 
                key={doc.id}
                onSelect={() => {
                  window.location.href = `/view/${doc.id}`;
                  setShowSearch(false);
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>{doc.filename}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
      <Footer />
    </div>
  );
};

export default Dashboard;
