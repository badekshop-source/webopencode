// src/lib/midtrans.ts
import midtransClient from 'midtrans-client';

// Initialize Midtrans Snap API (Client-side)
export const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_MODE === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
  clientKey: process.env.MIDTRANS_CLIENT_KEY!,
});

// Initialize Midtrans Core API (Server-side)
export const core = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_MODE === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY!,
});

const MIDTRANS_BASE_URL = process.env.MIDTRANS_MODE === 'production'
  ? 'https://api.midtrans.com'
  : 'https://api.sandbox.midtrans.com';

/**
 * Process a refund for a Midtrans transaction
 * @param orderId - The order ID to refund
 * @param refundAmount - Amount to refund (in IDR)
 * @param reason - Reason for the refund
 * @returns Midtrans refund response
 */
export async function refundTransaction(
  orderId: string,
  refundAmount: number,
  reason: string
): Promise<any> {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const authHeader = `Basic ${Buffer.from(serverKey + ':').toString('base64')}`;

    const response = await fetch(`${MIDTRANS_BASE_URL}/v2/${orderId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        refund_key: `refund-${orderId}-${Date.now()}`,
        amount: refundAmount,
        reason: reason,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.status_message || 'Refund failed');
    }

    return data;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
}

export default {
  snap,
  core,
  refundTransaction,
};