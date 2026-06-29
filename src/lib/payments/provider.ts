import { createPaymentCustomer } from "./customer";
import { createPaymentCharge } from "./charge";
import { payPaymentWithCreditCard } from "./credit-card";
import { cancelPaymentCharge } from "./cancel";

export const paymentProvider = {
  createCustomer: createPaymentCustomer,
  createCharge: createPaymentCharge,
  payWithCreditCard: payPaymentWithCreditCard,
  cancelCharge: cancelPaymentCharge,
};