import { asaasRequest } from "./asaas";
import type {
  CreatePaymentCustomerInput,
  PaymentCustomerResult,
} from "./types";

type AsaasCustomerResponse = {
  id: string;
  name: string;
  email: string;
};

export async function createPaymentCustomer(
  input: CreatePaymentCustomerInput
): Promise<PaymentCustomerResult> {
  const customer = await asaasRequest<AsaasCustomerResponse>("/customers", {
    method: "POST",
    body: {
      name: input.name,
      email: input.email,
      mobilePhone: input.phone ?? undefined,
      cpfCnpj: input.cpfCnpj ?? undefined,
    },
  });

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
  };
}