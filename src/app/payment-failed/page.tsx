'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, RefreshCw, Clock, Mail, Phone } from 'lucide-react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';

interface OrderInfo {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  productName: string | null;
  customerEmail: string;
}

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order');
  
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/orders/track?id=${encodeURIComponent(orderId)}`);
        if (!response.ok) throw new Error('Failed to fetch order');
        const data = await response.json();
        if (data.orders && data.orders.length > 0) {
          setOrderInfo(data.orders[0]);
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleRetryPayment = async () => {
    if (!orderInfo) return;
    setIsRetrying(true);
    try {
      const paymentResponse = await fetch(`/api/orders/${orderInfo.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.error || 'Failed to initiate payment');
      }

      const paymentData = await paymentResponse.json();
      
      if (paymentData.redirect_url) {
        window.location.href = paymentData.redirect_url;
      } else {
        throw new Error('Payment redirect URL not found');
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      setIsRetrying(false);
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Payment Failed</h1>
            <p className="text-red-100 text-lg max-w-2xl mx-auto">Don't worry, your order is still saved</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-2xl">
          {isLoading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading order details...</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Was Not Successful</h2>
                  <p className="text-gray-600">
                    Your payment could not be processed. This could be due to insufficient funds, card decline, or a technical issue.
                  </p>
                </div>

                {orderInfo && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Order Number</p>
                        <p className="font-mono font-medium text-gray-900">{orderInfo.orderNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Product</p>
                        <p className="font-medium text-gray-900">{orderInfo.productName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Amount</p>
                        <p className="font-semibold text-gray-900">{formatPrice(orderInfo.total)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <p className="font-medium text-red-600 capitalize">{orderInfo.paymentStatus}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-900">Payment Window: 2 Hours</p>
                      <p className="text-amber-700 text-sm mt-1">
                        You have 2 hours from order creation to complete payment. After that, your order will expire automatically.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleRetryPayment}
                    disabled={isRetrying || !orderInfo}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-600/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
                    {isRetrying ? 'Processing...' : 'Retry Payment'}
                  </button>

                  <Link
                    href="/products"
                    className="w-full inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3.5 px-4 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Browse Other Products
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Need Help?</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>Check your email for order confirmation and payment link</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>Contact us via WhatsApp for assistance</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {!orderId && !isLoading && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Order Specified</h3>
              <p className="text-gray-500 mb-6">No order ID was provided in the URL</p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          )}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}
