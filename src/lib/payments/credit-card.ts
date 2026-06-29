import { asaasRequest } from "./asaas";
import type { PayCreditCardInput, PayCreditCardResult } from "./types";

type AsaasPayWithCreditCardResponse = {
  id: string;
  status: string;
  invoiceUrl?: string | null;
};

function cleanUndefinedValues<T extends Record<string, unknown>>(object: T) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined)
  );
}

export async function payPaymentWithCreditCard(
  input: PayCreditCardInput
): Promise<PayCreditCardResult> {
  const creditCardHolderInfo = cleanUndefinedValues({
    name: input.creditCardHolderInfo.name,
    email: input.creditCardHolderInfo.email,
    cpfCnpj: input.creditCardHolderInfo.cpfCnpj,
    postalCode: input.creditCardHolderInfo.postalCode,
    addressNumber: input.creditCardHolderInfo.addressNumber,
    addressComplement: input.creditCardHolderInfo.addressComplement,
    phone: input.creditCardHolderInfo.phone,
    mobilePhone: input.creditCardHolderInfo.mobilePhone,
  });

  console.log("Payload cartão Asaas:", {
    paymentId: input.gatewayPaymentId,
    creditCardHolderInfo,
    installmentCount: input.installmentCount ?? 1,
    totalValue: input.totalValue,
  });

  const response = await asaasRequest<AsaasPayWithCreditCardResponse>(
    `/payments/${input.gatewayPaymentId}/payWithCreditCard`,
    {
      method: "POST",
      body: {
        creditCard: {
          holderName: input.creditCard.holderName,
          number: input.creditCard.number,
          expiryMonth: input.creditCard.expiryMonth,
          expiryYear: input.creditCard.expiryYear,
          ccv: input.creditCard.ccv,
        },
        creditCardHolderInfo,
        installmentCount: input.installmentCount ?? 1,
        totalValue: input.totalValue,
      },
    }
  );

  return {
    id: response.id,
    status: response.status,
    invoiceUrl: response.invoiceUrl ?? null,
  };
}