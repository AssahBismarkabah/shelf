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

  useEffect(() => {
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

    fetchSubscription();
  }, [toast, startLoading, stopLoading]);

  const plans: SubscriptionPlan[] = [
    {
      name: 'Basic',
      price: 'Free',
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
      // This would be replaced with actual payment API call to MTN MoMo
      // await paymentApi.initiatePayment(planId);
      toast({
        title: "Payment Initiated",
        description: `Payment process started for ${planId} plan. You will be redirected to MTN MoMo.`
      });
      // Navigate to a payment processing page or modal in the future
      navigate('/payment', { state: { planId } });
    } catch (error) {
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
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">Select the perfect plan for your PDF storage needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative rounded-2xl shadow-lg overflow-hidden border ${currentPlan === plan.planId ? 'border-shelf-500 border-2' : 'border-gray-200 dark:border-gray-700'}`}>
              {currentPlan === plan.planId && (
                <div className="absolute top-0 w-full bg-shelf-500 text-white text-center py-1 text-sm font-medium">Current Plan</div>
              )}
              <div className={`p-6 ${currentPlan === plan.planId ? 'pt-8' : ''}`}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h2>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{plan.price}</p>
                <p className="text-muted-foreground mb-4">Storage: {plan.storage}</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full bg-shelf-400 hover:bg-shelf-600" 
                  onClick={() => handleUpgrade(plan.planId)}
                  disabled={currentPlan === plan.planId}
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
