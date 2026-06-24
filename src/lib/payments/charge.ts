import { PaymentMethod } from "@/generated/prisma";
import { asaasRequest } from "./asaas";
import type {
  CreatePaymentChargeInput,
  PaymentChargeResult,
} from "./types";

type AsaasChargeResponse = {
  id: string;
  status: string;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
};

type AsaasPixQrCodeResponse = {
  encodedImage?: string | null;
  payload?: string | null;
};

function getAsaasBillingType(method?: PaymentMethod | null) {
  if (method === PaymentMethod.CREDIT_CARD) return "CREDIT_CARD";
  if (method === PaymentMethod.BOLETO) return "BOLETO";
  if (method === PaymentMethod.PIX) return "PIX";

  return "UNDEFINED";
}

export async function createPaymentCharge(
  input: CreatePaymentChargeInput
): Promise<PaymentChargeResult> {
  const charge = await asaasRequest<AsaasChargeResponse>("/payments", {
    method: "POST",
    body: {
      customer: input.customerId,
      billingType: getAsaasBillingType(input.method),
      value: input.value,
      dueDate: input.dueDate,
      description: input.description,
      externalReference: input.externalReference,
    },
  });

  let pixQrCode: string | null = null;
  let pixCopyPaste: string | null = null;

  if (input.method === PaymentMethod.PIX) {
    const pix = await asaasRequest<AsaasPixQrCodeResponse>(
      `/payments/${charge.id}/pixQrCode`
    );

    pixQrCode = pix.encodedImage ?? null;
    pixCopyPaste = pix.payload ?? null;
  }

  return {
    id: charge.id,
    status: charge.status,
    invoiceUrl: charge.invoiceUrl ?? null,
    bankSlipUrl: charge.bankSlipUrl ?? null,
    pixQrCode,
    pixCopyPaste,
  };
}