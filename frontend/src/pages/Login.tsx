import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      toast({
        title: "Login successful",
        description: "Welcome back to Shelf!",
      });
      navigate('/dashboard');
    } catch (err) {
      toast({
        title: "Login failed",
        description: error || "An error occurred while trying to log in",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-shelf-50 p-4 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Link to="/" className="mb-4 flex items-center gap-2">
            <Book className="h-10 w-10 text-shelf-400" />
            <span className="text-3xl font-bold">Shelf</span>
          </Link>
          <h1 className="text-center text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-center text-muted-foreground">
            Sign in to your Shelf account
          </p>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a href="#" className="text-xs text-shelf-600 hover:underline">
                Forgot password?
              </a>
            </div>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-shelf-400 hover:bg-shelf-600"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Sign in"}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-shelf-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
