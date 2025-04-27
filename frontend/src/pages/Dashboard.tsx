import { useState } from 'react';
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
  Eye
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

const Dashboard = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploader, setShowUploader] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { documents, isLoading, deleteDocument } = useDocuments();
  const { toast } = useToast();
  
  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchQuery.toLowerCase())
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

  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <h1 className="text-3xl font-bold">My Documents</h1>
          <p className="text-muted-foreground">
            Manage and organize your PDF documents
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-muted' : ''}
          >
            <Grid className="h-5 w-5" />
            <span className="sr-only">Grid view</span>
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-muted' : ''}
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
              className="pl-10 w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
            />
          </div>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowUploader(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex h-64 w-full items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-b-4 border-primary"></div>
        </div>
      ) : filteredDocuments.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDocuments.map((document) => (
              <div 
                key={document.id} 
                className="group overflow-hidden rounded-lg border bg-card shadow-sm transition-all hover:shadow"
              >
                <div className="relative aspect-[3/4] bg-muted">
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                    <FileText className="h-16 w-16 text-muted-foreground/60" />
                  </div>
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
                      className="hover:text-shelf-600 hover:underline"
                    >
                      {document.title}
                    </Link>
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {document.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatFileSize(document.file_size)}</span>
                    <span>{format(new Date(document.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border bg-card shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left text-sm font-medium">Preview</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Size</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((document) => (
                    <tr 
                      key={document.id} 
                      className="border-b transition-colors hover:bg-muted/20"
                    >
                      <td className="px-4 py-3 w-[58px]">
                        <PDFThumbnail url={document.file_path} className="h-14 w-10 object-contain shadow rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">
                              <Link 
                                to={`/view/${document.id}`}
                                className="hover:text-shelf-600 hover:underline"
                              >
                                {document.title}
                              </Link>
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {document.description}
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
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <Link to={`/view/${document.id}`}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                          >
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDocument(document.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
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
        <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <FileText className="mb-4 h-16 w-16 text-muted-foreground/60" />
          <h3 className="mb-1 text-lg font-medium">No documents found</h3>
          <p className="mb-4 text-muted-foreground">
            {searchQuery 
              ? "No documents match your search query" 
              : "Upload your first document to get started"}
          </p>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setShowUploader(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
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
                <span>{doc.title}</span>
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
