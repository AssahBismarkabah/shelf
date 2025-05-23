import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { CheckCircle, CreditCard } from 'lucide-react';
import Footer from '@/components/layouts/Footer';
import { useLoading } from '@/contexts/LoadingContext';
import { CenteredSpinner } from '@/components/ui/loading-overlay';

interface SubscriptionPlan {
  name: string;
  price: string;
  storage: string;
  features: string[];
  planId: string;
}

const Subscription = () => {
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();

  const fetchSubscription = async () => {
    try {
      startLoading();
      const response = await api.get('/subscription');
      setCurrentPlan(response.data.plan);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load subscription information. Please try again later.",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      stopLoading();
      setIsLoadingPlan(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [toast, startLoading, stopLoading]);

  const plans: SubscriptionPlan[] = [
    {
      name: 'Free',
      price: '0 XAF/month',
      storage: '100 MB',
      features: ['Basic PDF storage', 'Limited features', 'Community support'],
      planId: 'none'
    },
    {
      name: 'Basic',
      price: '100 XAF/month',
      storage: '1 GB',
      features: ['Basic PDF storage', 'Limited sharing', 'Basic support'],
      planId: 'basic'
    },
    {
      name: 'Premium',
      price: '500 XAF/month',
      storage: '5 GB',
      features: ['Advanced PDF management', 'Enhanced sharing', 'Priority support'],
      planId: 'premium'
    },
    {
      name: 'Enterprise',
      price: '1000 XAF/month',
      storage: '10 GB',
      features: ['Full PDF suite', 'Advanced security', '24/7 dedicated support'],
      planId: 'enterprise'
    }
  ];

  const handleUpgrade = async (planId: string) => {
    if (currentPlan === planId) {
      toast({
        title: "Already Subscribed",
        description: `You are already on the ${planId} plan.`
      });
      return;
    }

    try {
      startLoading("Initiating payment...");
      // Navigate to payment page with plan details
      navigate('/payment', { 
        state: { 
          planId,
          amount: planId === 'basic' ? '100' : planId === 'premium' ? '500' : '1000'
        } 
      });
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: "Error",
        description: "Failed to initiate payment process.",
        variant: "destructive"
      });
    } finally {
      stopLoading();
    }
  };

  if (isLoadingPlan) {
    return <CenteredSpinner />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-gray-900/95">
      <div className="flex-grow max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">Choose Your Plan</h1>
          <p className="mt-4 text-xl text-muted-foreground">Select the perfect plan for your PDF storage needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan.name} 
              className={`
                relative rounded-2xl shadow-lg overflow-hidden 
                transition-all duration-300 ease-in-out
                ${currentPlan === plan.planId 
                  ? 'border-shelf-500 border-2 bg-shelf-50/50 dark:bg-shelf-900/30' 
                  : 'border border-gray-200 dark:border-gray-700 hover:scale-105 hover:shadow-xl'
                }
              `}
            >
              {currentPlan === plan.planId && (
                <div className="absolute top-0 left-0 right-0 bg-shelf-500 text-white text-center py-1.5 px-4 text-sm font-semibold">Current Plan</div>
              )}
              <div className={`p-8 ${currentPlan === plan.planId ? 'pt-12' : ''}`}> {/* Increased top padding for active plan banner */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h2>
                <p className="text-4xl font-extrabold text-gray-900 dark:text-white my-2">{plan.price}</p>
                <p className="text-sm text-muted-foreground mb-6">Storage: {plan.storage}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full bg-shelf-400 transition-all duration-300 ease-in-out hover:scale-105 hover:bg-shelf-500 disabled:opacity-50" 
                  onClick={() => handleUpgrade(plan.planId)}
                  disabled={currentPlan === plan.planId || plan.planId === 'none'}
                >
                  {currentPlan === plan.planId ? 'Active' : 'Select Plan'}
                  <CreditCard className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Subscription;
