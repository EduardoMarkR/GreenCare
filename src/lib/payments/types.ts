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

export type CreditCardHolderInfo = {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  phone?: string | null;
  mobilePhone?: string | null;
};

export type CreditCardData = {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
};

export type PayCreditCardInput = {
  gatewayPaymentId: string;
  creditCard: CreditCardData;
  creditCardHolderInfo: CreditCardHolderInfo;
  installmentCount?: number;
  totalValue?: number;
};

export type PayCreditCardResult = {
  id: string;
  status: string;
  invoiceUrl?: string | null;
};

export type PaymentStatusResult = {
  id: string;
  status: string;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
};