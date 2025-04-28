import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Book, 
  Search, 
  Upload, 
  Settings, 
  Menu, 
  X, 
  Home, 
  LogOut, 
  User,
  FileText
} from 'lucide-react';
import FileUploader from '@/components/documents/FileUploader';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { useDocuments } from '@/contexts/DocumentContext';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const { documents } = useDocuments();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeSidebar();
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowUploader(true);
    closeSidebar();
  };

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSearch(true);
    closeSidebar();
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSettings(true);
    closeSidebar();
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <Book className="h-6 w-6 text-shelf-400" />
              <span className="text-xl font-bold">Shelf</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  asChild 
                  className="hidden md:flex"
                >
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout} 
                  className="hidden md:flex"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hidden md:flex"
                >
                  <User className="h-5 w-5" />
                  <span className="sr-only">Profile</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button variant="default" size="sm" asChild className="bg-shelf-400 hover:bg-shelf-600">
                  <Link to="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar for mobile */}
      <div 
        className={`fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-200 ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        } md:hidden`}
      >
        <div 
          className={`fixed inset-y-0 left-0 z-50 w-3/4 max-w-xs border-r bg-background p-6 shadow-lg transition-transform duration-200 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center gap-2" 
              onClick={closeSidebar}
            >
              <Book className="h-6 w-6 text-shelf-400" />
              <span className="text-xl font-bold">Shelf</span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={closeSidebar}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>
          <nav className="mt-8">
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    location.pathname === "/" 
                      ? "bg-shelf-100 text-shelf-600" 
                      : "hover:bg-muted"
                  }`}
                  onClick={closeSidebar}
                >
                  <Home className="h-5 w-5" />
                  Home
                </Link>
              </li>
              {isAuthenticated && (
                <>
                  <li>
                    <Link
                      to="/dashboard"
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                        location.pathname === "/dashboard" 
                          ? "bg-shelf-100 text-shelf-600" 
                          : "hover:bg-muted"
                      }`}
                      onClick={closeSidebar}
                    >
                      <Book className="h-5 w-5" />
                      My Documents
                    </Link>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
                      onClick={handleUploadClick}
                    >
                      <Upload className="h-5 w-5" />
                      Upload
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
                      onClick={handleSearchClick}
                    >
                      <Search className="h-5 w-5" />
                      Search
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
                      onClick={handleSettingsClick}
                    >
                      <Settings className="h-5 w-5" />
                      Settings
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
                      onClick={(e) => {
                        e.preventDefault();
                        handleLogout();
                      }}
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </a>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      {isAuthenticated && (
        <div className="hidden border-r bg-background md:block">
          <div className="fixed inset-y-0 left-0 z-30 w-56 pt-16">
            <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
              <nav className="space-y-1">
                <Link
                  to="/"
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    location.pathname === "/" 
                      ? "bg-shelf-100 text-shelf-600" 
                      : "hover:bg-muted"
                  }`}
                >
                  <Home className="h-5 w-5" />
                  Home
                </Link>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                    location.pathname === "/dashboard" 
                      ? "bg-shelf-100 text-shelf-600" 
                      : "hover:bg-muted"
                  }`}
                >
                  <Book className="h-5 w-5" />
                  My Documents
                </Link>
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
                  onClick={handleUploadClick}
                >
                  <Upload className="h-5 w-5" />
                  Upload
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
                  onClick={handleSearchClick}
                >
                  <Search className="h-5 w-5" />
                  Search
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted"
                  onClick={handleSettingsClick}
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </a>
              </nav>
              <div className="mt-auto">
                {user && (
                  <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm">
                    <User className="h-5 w-5" />
                    <span className="truncate">{user.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className={`flex-1 ${isAuthenticated ? "md:pl-56" : ""}`}>
        {children}
      </main>

      {/* File Uploader */}
      {showUploader && (
        <FileUploader onClose={() => setShowUploader(false)} />
      )}

      {/* Search Dialog */}
      <CommandDialog open={showSearch} onOpenChange={setShowSearch}>
        <CommandInput placeholder="Type to search for documents..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Documents">
            {documents.map((doc) => (
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

      {/* Settings Sheet */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium">Account</h3>
              <div className="mt-3 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email</span>
                  <span className="text-sm text-muted-foreground">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Name</span>
                  <span className="text-sm text-muted-foreground">{user?.name}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Appearance</h3>
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Actions</h3>
              <div className="mt-3 space-y-2">
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MainLayout;
