import { asaasRequest } from "./asaas";

type CancelPaymentChargeResult = {
  deleted: boolean;
  id: string;
};

export async function cancelPaymentCharge(
  gatewayPaymentId: string
): Promise<CancelPaymentChargeResult> {
  await asaasRequest(`/payments/${gatewayPaymentId}`, {
    method: "DELETE",
  });

  return {
    deleted: true,
    id: gatewayPaymentId,
  };
}