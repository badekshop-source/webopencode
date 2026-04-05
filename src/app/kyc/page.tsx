// src/app/kyc/page.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Check, FileText, Smartphone, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { LandingHeader } from '@/components/landing/LandingHeader';
import { LandingFooter } from '@/components/landing/LandingFooter';

interface OrderInfo {
  id: string;
  orderNumber: string;
  fullName: string;
  customerEmail: string;
  productName: string;
  total: number;
  imeiNumber: string | null;
  paymentStatus: string;
  kycStatus: string;
}

function KycPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order');

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imei, setImei] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!orderId) {
      setError('No order specified. Please complete checkout first.');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        const foundOrder = data.orders?.find((o: any) => o.id === orderId);
        
        if (!foundOrder) {
          setError('Order not found');
          return;
        }

        if (foundOrder.paymentStatus !== 'paid') {
          setError('Payment not completed. Please complete payment first.');
          return;
        }

        // Fetch product name
        let productName = 'Unknown';
        if (foundOrder.productId) {
          try {
            const prodRes = await fetch(`/api/products/${foundOrder.productId}`);
            if (prodRes.ok) {
              const prodData = await prodRes.json();
              productName = prodData.product?.name || 'Unknown';
            }
          } catch { /* ignore */ }
        }

        setOrder({
          id: foundOrder.id,
          orderNumber: foundOrder.orderNumber,
          fullName: foundOrder.fullName,
          customerEmail: foundOrder.customerEmail,
          productName,
          total: foundOrder.total,
          imeiNumber: foundOrder.imeiNumber,
          paymentStatus: foundOrder.paymentStatus,
          kycStatus: foundOrder.kycStatus,
        });

        if (foundOrder.imeiNumber) {
          setImei(foundOrder.imeiNumber);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleImeiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 15);
    setImei(digitsOnly);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !orderId) {
      setError('Please select a passport photo');
      return;
    }
    if (imei.length !== 15) {
      setError('Valid 15-digit IMEI is required');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Step 1: Upload image to Cloudinary
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/kyc/upload', {
        method: 'POST',
        headers: { 'X-Order-Id': orderId, 'X-IMEI': imei },
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      setSuccess(true);
      
      // Redirect to order detail page after success
      setTimeout(() => {
        router.push(`/order/${orderId}` as any);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to Proceed</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Passport Uploaded!</h1>
          <p className="text-gray-500 mb-2">Your passport has been submitted for verification.</p>
          <p className="text-sm text-gray-400">Redirecting to order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pt-32 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Identity Verification</h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">Upload your passport photo to activate your SIM card</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Link */}
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Identity Verification</h1>
          <p className="text-gray-500 mt-1">Upload your passport photo for SIM card activation</p>
        </div>

        {/* Order Summary */}
        {order && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Order</p>
                <p className="font-mono font-medium text-gray-900">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Product</p>
                <p className="font-medium text-gray-900">{order.productName}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <form onSubmit={handleSubmit}>
            {/* Passport Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passport Photo *
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Ensure text is clear, avoid glare, and do not crop the document.
              </p>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  preview ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                {preview ? (
                  <div>
                    <img
                      src={preview}
                      alt="Passport preview"
                      className="mx-auto max-h-64 object-contain mb-4 rounded-lg"
                      crossOrigin="anonymous"
                    />
                    <p className="text-green-600 font-medium flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" /> Photo uploaded successfully!
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Click to change</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600 font-medium">Click to upload passport photo</p>
                    <p className="text-sm text-gray-500 mt-1">JPG, PNG up to 5MB</p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>

            {/* IMEI */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IMEI Number * <span className="text-gray-400 font-normal">(15 digits)</span>
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={imei}
                  onChange={handleImeiChange}
                  required
                  maxLength={15}
                  pattern="\d{15}"
                  inputMode="numeric"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="15-digit IMEI number"
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-gray-500">{imei.length}/15 digits</p>
                {imei.length === 15 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Valid
                  </p>
                )}
              </div>
            </div>

            {/* Consent */}
            <div className="flex items-start gap-2 mb-6">
              <input
                type="checkbox"
                id="consent"
                required
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="consent" className="text-sm text-gray-700">
                I consent to the processing of my personal data in accordance with the privacy policy
              </label>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!file || isUploading || imei.length !== 15}
              className="w-full py-3 px-4 rounded-xl text-white font-medium bg-blue-600 hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Submit Passport
                </>
              )}
            </button>
          </form>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-900 mb-2">Why do we need this?</h3>
          <p className="text-sm text-blue-700">
            Identity verification is required for SIM card activation as mandated by Indonesian telecommunications regulations.
            Your document will be securely stored and automatically deleted after 30 days.
          </p>
        </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

export default function KycPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <KycPageContent />
    </Suspense>
  );
}
