import { BookOpen, Github, FileText, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "../theme/ThemeToggle";

export default function Footer() {
  return (
    <footer className="w-full bg-gradient-to-r from-shelf-50/80 to-blue-50/80 dark:from-shelf-950/30 dark:to-blue-950/30 border-t mt-8 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-shelf-600 dark:text-shelf-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-shelf-600 to-blue-600 dark:from-shelf-400 dark:to-blue-400 text-transparent bg-clip-text">Shelf</span>
            </div>
            <p className="text-muted-foreground max-w-xs">
              Organize, preview, and discover your documents with ease. The modern solution for your document management needs.
            </p>
          </div>
          {/* Quick links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          {/* Connect */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4 mb-4">
              <a 
                href="https://github.com/lovable-dev" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-card hover:bg-primary/10 transition-colors"
              >
                <Github className="h-5 w-5 text-muted-foreground hover:text-primary" />
                <span className="sr-only">GitHub</span>
              </a>
              <a 
                href="https://docs.lovable.dev/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-card hover:bg-primary/10 transition-colors"
              >
                <FileText className="h-5 w-5 text-muted-foreground hover:text-primary" />
                <span className="sr-only">Documentation</span>
              </a>
              <a 
                href="mailto:info@shelf.app" 
                className="p-2 rounded-full bg-card hover:bg-primary/10 transition-colors"
              >
                <Mail className="h-5 w-5 text-muted-foreground hover:text-primary" />
                <span className="sr-only">Email</span>
              </a>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <ThemeToggle />
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              &copy; {new Date().getFullYear()} Shelf. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
