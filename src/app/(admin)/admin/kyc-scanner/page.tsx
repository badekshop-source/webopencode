// src/app/(admin)/admin/kyc-scanner/page.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { QrCode, ScanLine, CheckCircle2, XCircle, Loader2, Smartphone, User, Package, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/status-badge";

interface ScannedOrder {
  id: string;
  orderNumber: string;
  fullName: string;
  customerEmail: string;
  flightNumber: string;
  productName: string;
  kycStatus: string;
  orderStatus: string;
  activationOutlet: string;
}

export default function KycScannerPage() {
  const router = useRouter();
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [order, setOrder] = useState<ScannedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>(null);

  const fetchOrder = useCallback(async (searchValue: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/track?orderNumber=${encodeURIComponent(searchValue)}`);
      const data = await response.json();

      if (!response.ok || !data.orders?.length) {
        throw new Error(data.error || 'Order not found');
      }

      const foundOrder = data.orders[0];
      setScannedData(foundOrder.id);
      setOrder({
        id: foundOrder.id,
        orderNumber: foundOrder.orderNumber,
        fullName: foundOrder.fullName,
        customerEmail: foundOrder.customerEmail,
        flightNumber: foundOrder.flightNumber || 'N/A',
        productName: foundOrder.productName || 'N/A',
        kycStatus: foundOrder.kycStatus,
        orderStatus: foundOrder.orderStatus,
        activationOutlet: foundOrder.activationOutlet || 'Ngurah Rai Airport',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find order');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          // QR Code detected! Format: badekshop:orderId
          const orderId = code.data.replace('badekshop:', '');
          if (orderId) {
            setIsScanning(false);
            fetchOrder(orderId);
            return;
          }
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [fetchOrder]);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch {
      setError("Could not access camera. Please ensure you have granted permission.");
    }
  }, []);

  const startScanning = useCallback(() => {
    setIsScanning(true);
    animationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [scanFrame]);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    stopScanning();
    await fetchOrder(manualInput.trim());
  };

  const processPickup = async () => {
    if (!order) return;
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to process pickup');
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process pickup');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    stopScanning();
    setScannedData(null);
    setOrder(null);
    setError(null);
    setIsSuccess(false);
    setManualInput("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">QR Code Scanner</h1>
        <p className="text-sm text-gray-500 mt-1">Scan customer QR code to verify and process SIM card pickup</p>
      </div>

      {/* Hidden canvas for QR processing */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scanner */}
        <div className="space-y-6">
          {/* Camera */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-gray-400" />
                Camera Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                {isCameraActive ? (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-white/50 rounded-lg">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-500 -mt-0.5 -ml-0.5 rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-500 -mt-0.5 -mr-0.5 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-500 -mb-0.5 -ml-0.5 rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-500 -mb-0.5 -mr-0.5 rounded-br-lg" />
                      </div>
                    </div>
                    {isScanning && (
                      <div className="absolute bottom-3 left-0 right-0 text-center">
                        <span className="inline-flex items-center gap-2 px-3 py-1 bg-black/60 text-white text-xs rounded-full">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Scanning for QR code...
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <QrCode className="h-12 w-12 mb-3" />
                    <p className="text-sm">Camera is off</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                {!isCameraActive ? (
                  <Button onClick={startCamera} className="flex-1">
                    <QrCode className="h-4 w-4 mr-2" />
                    Start Camera
                  </Button>
                ) : isScanning ? (
                  <Button onClick={stopScanning} variant="outline" className="flex-1">
                    Stop Scanning
                  </Button>
                ) : (
                  <Button onClick={startScanning} className="flex-1">
                    <ScanLine className="h-4 w-4 mr-2" />
                    Start Scanning
                  </Button>
                )}
                {isCameraActive && (
                  <Button variant="outline" onClick={stopCamera}>
                    Stop
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Manual Entry */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-gray-400" />
                Manual Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter order ID or number"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1 bg-gray-50 border-gray-200"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !manualInput.trim()}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <Card className="border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-red-700">
                  <XCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results */}
        <div className="space-y-6">
          {!order && !isSuccess && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-gray-500">
                  <QrCode className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No order scanned</p>
                  <p className="text-sm mt-1">Scan a QR code or enter order ID manually</p>
                </div>
              </CardContent>
            </Card>
          )}

          {order && !isSuccess && (
            <>
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="h-5 w-5" />
                    Order Found
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-600 font-mono">{order.orderNumber}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-400" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <InfoRow label="Name" value={order.fullName} />
                  <InfoRow label="Email" value={order.customerEmail} />
                  <InfoRow label="Flight" value={order.flightNumber} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-5 w-5 text-gray-400" />
                    Order
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <InfoRow label="Product" value={order.productName} />
                  <InfoRow label="KYC" value={<StatusBadge status={order.kycStatus} />} />
                  <InfoRow label="Status" value={<StatusBadge status={order.orderStatus} />} />
                  <InfoRow label="Outlet" value={<span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{order.activationOutlet}</span>} />
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button onClick={processPickup} disabled={isProcessing} className="flex-1 bg-green-600 hover:bg-green-700">
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Pickup"
                  )}
                </Button>
                <Button variant="outline" onClick={resetScanner}>
                  Cancel
                </Button>
              </div>
            </>
          )}

          {isSuccess && (
            <Card className="border-green-200">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-green-700">Pickup Confirmed!</h3>
                  <p className="text-sm text-green-600 mt-1">SIM card has been handed over to {order?.fullName}</p>
                  <Button onClick={resetScanner} className="mt-6">
                    Scan Next Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Staff Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              Start camera and point at customer&apos;s QR code
            </li>
            <li className="flex items-start gap-2">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              Or enter order number manually if QR scanning fails
            </li>
            <li className="flex items-start gap-2">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              Verify customer&apos;s passport matches the system
            </li>
            <li className="flex items-start gap-2">
              <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
              Click &quot;Confirm Pickup&quot; to complete the order
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
