// src/app/track-order/page.tsx
'use client';

import { useState } from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { OrderStatusTracker } from '@/components/order/OrderStatusTracker';
import { CheckCircle, Search, AlertCircle } from 'lucide-react';

interface TrackedOrder {
  id: string;
  orderNumber: string;
  fullName: string;
  customerEmail: string;
  orderStatus: string;
  paymentStatus: string;
  kycStatus: string;
  total: number;
  createdAt: string;
  productName: string | null;
  productCategory: string | null;
  productDuration: number | null;
}

export default function TrackOrderPage() {
  const [searchType, setSearchType] = useState<'order' | 'email'>('order');
  const [searchValue, setSearchValue] = useState('');
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setOrders([]);

    try {
      const params = searchType === 'order'
        ? `?orderNumber=${encodeURIComponent(searchValue)}`
        : `?email=${encodeURIComponent(searchValue)}`;

      const response = await fetch(`/api/orders/track${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to track order');
      }

      setOrders(data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to track order');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Track Your Order</h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">Enter your order number or email to check the current status</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-2xl">
          {/* Search Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <form onSubmit={handleTrack}>
              {/* Search Type Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => { setSearchType('order'); setSearchValue(''); }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    searchType === 'order' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Order Number
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchType('email'); setSearchValue(''); }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    searchType === 'email' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Email Address
                </button>
              </div>

              <div className="mb-4">
                <input
                  type={searchType === 'email' ? 'email' : 'text'}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchType === 'order' ? 'e.g., ORD-1775286788200-8720' : 'e.g., your@email.com'}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !searchValue}
                className="w-full py-2.5 px-4 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Tracking...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Track Order
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* No Results */}
          {hasSearched && orders.length === 0 && !error && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-500 text-sm">Try a different order number or email address</p>
            </div>
          )}

          {/* Results */}
          {orders.length > 0 && (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Order Number</p>
                      <p className="font-mono font-semibold text-gray-900">{order.orderNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-semibold text-gray-900">{formatPrice(order.total)}</p>
                    </div>
                  </div>

                  {/* Status Tracker */}
                  <OrderStatusTracker
                    orderStatus={order.orderStatus as any}
                    kycStatus={order.kycStatus as any}
                    kycAttempts={0}
                  />

                  {/* Order Info */}
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Product</p>
                      <p className="font-medium text-gray-900">{order.productName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Payment</p>
                      <p className={`font-medium capitalize ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                        {order.paymentStatus}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Date</p>
                      <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">KYC Status</p>
                      <p className="font-medium capitalize text-gray-900">{order.kycStatus.replace('_', ' ')}</p>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <a
                      href={`/order/${order.id}`}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      View Full Order Details
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
