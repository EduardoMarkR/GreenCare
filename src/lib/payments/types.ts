import type { PaymentMethod } from "@/generated/prisma";

export type CreatePaymentCustomerInput = {
  name: string;
  email: string;
  phone?: string | null;
  cpfCnpj?: string | null;
};

export type CreatePaymentChargeInput = {
  customerId: string;
  value: number;
  dueDate: string;
  description: string;
  externalReference: string;
  method?: PaymentMethod | null;
};

export type PaymentCustomerResult = {
  id: string;
  name: string;
  email: string;
};

export type PaymentChargeResult = {
  id: string;
  status: string;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  pixQrCode?: string | null;
  pixCopyPaste?: string | null;
};