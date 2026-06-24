export type AsaasWebhookEvent = {
  event: string;
  payment?: {
    id: string;
    customer?: string;
    status?: string;
    billingType?: string;
    value?: number;
    netValue?: number;
    dueDate?: string;
    paymentDate?: string;
    clientPaymentDate?: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    externalReference?: string;
  };
};

export function isPaymentConfirmedEvent(event: string) {
  return event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED";
}

export function isPaymentCancelledEvent(event: string) {
  return event === "PAYMENT_DELETED" || event === "PAYMENT_OVERDUE";
}