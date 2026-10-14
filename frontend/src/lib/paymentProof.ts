import { api } from './api';

/** Opens a private payment proof using the existing bearer-token API client. */
export async function openPaymentProof(paymentId: number): Promise<void> {
  const response = await api.get(`/payments/${paymentId}/proof-file`, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(response.data as Blob);
  const opened = window.open(objectUrl, '_blank', 'noopener,noreferrer');
  if (!opened) {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `payment-proof-${paymentId}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
