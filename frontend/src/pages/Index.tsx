import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Book, Search, Smartphone, ArrowRight, Check, ChevronRight } from 'lucide-react';

const Index = () => {
  const [videoOpen, setVideoOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Hero Section with Gradient and Animation */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-shelf-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 w-full h-full">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] dark:opacity-[0.05]" />
        </div>
        <div className="container px-4 sm:px-6 relative">
          <div className={`flex flex-col items-center space-y-8 text-center transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}>
            <div className="max-w-3xl space-y-4">
              <span className="px-3 py-1 text-sm font-medium text-shelf-600 dark:text-shelf-400 bg-shelf-100/80 dark:bg-shelf-900/80 rounded-full inline-block mb-4 animate-fade-in">
                Your Documents, Reimagined
              </span>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r from-shelf-600 via-shelf-500 to-blue-600 dark:from-shelf-400 dark:to-blue-500 text-transparent bg-clip-text pb-2">
                Your Digital Library, Simplified
              </h1>
              <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto mt-6">
                Organize, read, and manage your PDFs with ease. Experience document management reimagined.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link to="/register" className="inline-flex items-center justify-center rounded-md bg-shelf-600 px-6 py-3 text-base font-medium text-white shadow-md transition-colors hover:bg-shelf-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shelf-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                Get Started
              </Link>
              <Link to="/subscription" className="inline-flex items-center justify-center rounded-md border border-shelf-600 bg-transparent px-6 py-3 text-base font-medium text-shelf-600 shadow-md transition-colors hover:bg-shelf-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-shelf-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:text-white dark:hover:bg-shelf-900">
                View Plans
              </Link>
            </div>
            <div className="relative mt-16 w-full max-w-5xl">
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10 h-[20%] bottom-0" />
              <img 
                src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=1200"
                alt="Shelf Dashboard" 
                className={`w-full rounded-xl border border-gray-200/50 shadow-2xl transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'} hover:shadow-shelf-200/20 dark:border-gray-800 dark:hover:shadow-shelf-500/10`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with Hover Effects */}
      <section className="py-24 sm:py-32 bg-white dark:bg-gray-900">
        <div className="container px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-shelf-600 to-blue-600 dark:from-shelf-400 dark:to-blue-500 text-transparent bg-clip-text">
              Powerful Features
            </h2>
            <p className="mt-4 text-xl text-muted-foreground">
              Everything you need to organize and access your documents efficiently.
            </p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <Book className="h-6 w-6" />,
                title: "Smart Organization",
                description: "AI-powered categorization and smart folders for effortless document management."
              },
              {
                icon: <Search className="h-6 w-6" />,
                title: "Advanced Search",
                description: "Find any document instantly with our powerful search capabilities."
              },
              {
                icon: <Smartphone className="h-6 w-6" />,
                title: "Mobile Access",
                description: "Access your documents anywhere, anytime, on any device."
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-shelf-50 to-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl dark:from-gray-800 dark:to-gray-900 dark:hover:shadow-shelf-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-shelf-100/0 via-shelf-100/5 to-shelf-100/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-shelf-100 text-shelf-600 transition-colors group-hover:bg-shelf-200 dark:bg-shelf-900 dark:text-shelf-400">
                    {feature.icon}
                  </div>
                  <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section with Step Animation */}
      <section className="bg-shelf-50 py-16 dark:bg-gray-800/50 sm:py-20 lg:py-24">
        <div className="container px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-bold text-shelf-600">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Simple, intuitive, and designed with you in mind.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="relative flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-shelf-400 text-white">
                1
              </div>
              <h4 className="mb-2 font-medium">Upload</h4>
              <p className="text-muted-foreground">
                Drag and drop your PDFs or import from cloud storage.
              </p>
              {/* Arrow for desktop */}
              <div className="absolute right-0 top-10 hidden translate-x-1/2 transform md:block">
                <ArrowRight className="h-6 w-6 text-shelf-400" />
              </div>
            </div>
            <div className="relative flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-shelf-400 text-white">
                2
              </div>
              <h4 className="mb-2 font-medium">Organize</h4>
              <p className="text-muted-foreground">
                Let AI categorize and tag your documents automatically.
              </p>
              {/* Arrow for desktop */}
              <div className="absolute right-0 top-10 hidden translate-x-1/2 transform md:block">
                <ArrowRight className="h-6 w-6 text-shelf-400" />
              </div>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-shelf-400 text-white">
                3
              </div>
              <h4 className="mb-2 font-medium">Access</h4>
              <p className="text-muted-foreground">
                Find and read your documents with our beautiful viewer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section with Hover Effects */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="container px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-bold text-shelf-600">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the plan that's right for you.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:max-w-4xl lg:mx-auto">
            <div className="pricing-card flex flex-col">
              <div className="mb-6">
                <h3 className="text-2xl font-bold">Free</h3>
                <p className="mt-2 text-4xl font-bold">$0</p>
                <p className="mt-1 text-muted-foreground">Forever free</p>
              </div>
              <ul className="mb-6 space-y-3 flex-grow">
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-shelf-400" />
                  <span>5GB Storage</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-shelf-400" />
                  <span>Basic Organization</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-shelf-400" />
                  <span>Mobile Access</span>
                </li>
              </ul>
              <Button asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
            <div className="pricing-card relative flex flex-col overflow-hidden border-shelf-400">
              <div className="absolute -right-12 top-7 w-40 rotate-45 bg-shelf-400 py-1 text-center text-sm text-white">
                Popular
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold">Pro</h3>
                <p className="mt-2 text-4xl font-bold">$9.99</p>
                <p className="mt-1 text-muted-foreground">per month</p>
              </div>
              <ul className="mb-6 space-y-3 flex-grow">
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-shelf-400" />
                  <span>50GB Storage</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-shelf-400" />
                  <span>Advanced Organization</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-shelf-400" />
                  <span>Mobile Access</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-shelf-400" />
                  <span>Priority Support</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-5 w-5 text-shelf-400" />
                  <span>Advanced Search</span>
                </li>
              </ul>
              <Button asChild className="bg-shelf-400 hover:bg-shelf-600">
                <Link to="/register">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-shelf-50 py-16 dark:bg-gray-800/50 sm:py-20 lg:py-24">
        <div className="container px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-bold text-shelf-600">What Our Users Say</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join thousands of satisfied users worldwide.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="feature-card">
              <div className="mb-4 flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200" 
                    alt="Sarah Johnson" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h5 className="font-medium">Dr. Sarah Johnson</h5>
                  <p className="text-sm text-muted-foreground">Research Scientist</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "Shelf has transformed how I manage my research papers. The AI organization is a game-changer!"
              </p>
            </div>
            <div className="feature-card">
              <div className="mb-4 flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200" 
                    alt="Michael Chen" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h5 className="font-medium">Michael Chen</h5>
                  <p className="text-sm text-muted-foreground">Student</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "As a student, I need to manage tons of PDFs. Shelf makes it simple and intuitive."
              </p>
            </div>
            <div className="feature-card hidden lg:block">
              <div className="mb-4 flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-gray-200">
                  <img 
                    src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200" 
                    alt="Emma Rodriguez" 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h5 className="font-medium">Emma Rodriguez</h5>
                  <p className="text-sm text-muted-foreground">Business Analyst</p>
                </div>
              </div>
              <p className="text-muted-foreground">
                "The search functionality is powerful! I can find any document within seconds now."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Gradient */}
      <section className="bg-shelf-400 py-16 text-white sm:py-20 lg:py-24">
        <div className="container px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-bold">Ready to Get Started?</h2>
            <p className="mt-4 text-lg text-white/80">
              Join thousands of users who trust Shelf for their document management needs.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link to="/register">Sign Up Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Modal - Would be implemented with a modal component */}
      {videoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-3xl rounded-lg bg-white p-6 dark:bg-gray-800">
            <button 
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
              onClick={() => setVideoOpen(false)}
            >
              <span className="sr-only">Close</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="aspect-video w-full bg-gray-200 dark:bg-gray-700">
              {/* This would be a real video in production */}
              <div className="flex h-full items-center justify-center">
                <p className="text-center text-muted-foreground">Demo video would play here</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
