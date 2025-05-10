import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, Phone } from 'lucide-react';
import Footer from '@/components/layouts/Footer';
import { useLoading } from '@/contexts/LoadingContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { startLoading, stopLoading } = useLoading();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [hasNavigatedAway, setHasNavigatedAway] = useState(false);
  const planId = location.state?.planId || 'unknown';
  const amount = planId === 'premium' ? '500' : planId === 'enterprise' ? '1000' : '100';
  // Disable mock mode to use actual backend API calls
  const isMockMode = false; // Set to false to use real backend API

  useEffect(() => {
    if (!location.state?.planId) {
      toast({
        title: "Error",
        description: "No plan selected for payment.",
        variant: "destructive"
      });
      navigate('/subscription');
    }
  }, [location, navigate, toast]);

  const checkPaymentStatus = useCallback(async (refId: string) => {
    // Prevent checking status if we've already navigated away
    if (hasNavigatedAway) return;
    
    try {
      if (isMockMode) {
        // Simulate successful payment in mock mode after a short delay
        setTimeout(() => {
          setPaymentStatus('SUCCESSFUL');
          toast({
            title: "Payment Successful (Mock)",
            description: `Your payment for the ${planId} plan has been confirmed! (This is a mock response for testing.)`
          });
          stopLoading();
          setHasNavigatedAway(true);
          navigate('/dashboard');
        }, 2000);
        return;
      }
      
      const response = await api.get(`/payments/status/${refId}`);
      const status = response.data.status;
      setPaymentStatus(status);
      
      if (status === 'SUCCESSFUL' || status === 'Successful') {
        toast({
          title: "Payment Successful",
          description: `Your payment for the ${planId} plan has been confirmed!`
        });
        stopLoading();
        setHasNavigatedAway(true);
        navigate('/dashboard');
      } else if (status === 'FAILED' || status === 'Failed') {
        toast({
          title: "Payment Failed",
          description: "Your payment could not be completed. Please try again.",
          variant: "destructive"
        });
        stopLoading();
        setIsProcessing(false);
      } else {
        // Payment is still pending, check again after a delay
        setTimeout(() => {
          checkPaymentStatus(refId);
        }, 3000);
      }
    } catch (error) {
      toast({
        title: "Status Check Error",
        description: "Could not check payment status. Please try again later.",
        variant: "destructive"
      });
      console.error(error);
      stopLoading();
      setIsProcessing(false);
    }
  }, [toast, planId, navigate, stopLoading, isMockMode, hasNavigatedAway]);

  useEffect(() => {
    if (referenceId) {
      startLoading("Checking payment status...");
      checkPaymentStatus(referenceId);
    }
  }, [referenceId, checkPaymentStatus, startLoading]);

  const handlePayment = async () => {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    startLoading("Processing payment...");
    try {
      // Initiate payment request to MTN MoMo via backend
      const response = await api.post('/payments/request', {
        amount: amount,
        phone_number: phoneNumber,
        payer_message: `Payment for ${planId} plan`,
        payee_note: `Subscription payment for ${planId}`
      });
      
      console.log('Payment response:', response.data);
      
      toast({
        title: "Payment Initiated",
        description: `Your payment for the ${planId} plan has been initiated. Please complete the payment on your phone.`
      });
      
      // Store the reference_id from the backend response for status checking
      setReferenceId(response.data.reference_id);
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an error initiating your payment. Please try again.",
        variant: "destructive"
      });
      stopLoading();
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow max-w-2xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-4">Complete Payment</h1>
          <p className="text-xl text-muted-foreground">Pay with MTN MoMo for your {planId} plan</p>
        </div>

        <div className="bg-card rounded-lg shadow-md p-6">
          <div className="mb-6">
            <Label htmlFor="phoneNumber" className="mb-2 block">MTN MoMo Phone Number</Label>
            <div className="flex items-center border rounded-md border-input px-3 py-2">
              <Phone className="h-5 w-5 text-muted-foreground mr-2" />
              <Input 
                id="phoneNumber" 
                placeholder="2376XXXXXXXX" 
                value={phoneNumber} 
                onChange={(e) => setPhoneNumber(e.target.value)} 
                className="border-0 focus-visible:ring-0"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Enter your MTN MoMo registered phone number</p>
          </div>

          <div className="border-t border-muted pt-4 mt-6 mb-6"/>
          
          <div className="flex justify-between mb-2">
            <span className="text-muted-foreground">Plan:</span>
            <span className="font-medium capitalize">{planId}</span>
          </div>
          <div className="flex justify-between mb-6 text-lg font-bold">
            <span>Total:</span>
            <span>{planId === 'premium' ? '500 XAF' : planId === 'enterprise' ? '1000 XAF' : '100 XAF'}</span>
          </div>

          <Button 
            onClick={handlePayment} 
            disabled={isProcessing || !phoneNumber} 
            className="w-full bg-shelf-400 hover:bg-shelf-600"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {isProcessing ? 'Processing...' : 'Pay with MTN MoMo'}
          </Button>
          
          <p className="text-center text-xs text-muted-foreground mt-4">
            By proceeding, you agree to MTN MoMo's terms and conditions.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Payment;
