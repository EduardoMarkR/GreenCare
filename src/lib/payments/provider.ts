import {
  createPaymentCustomer,
} from "./customer";
import {
  createPaymentCharge,
} from "./charge";

export const paymentProvider = {
  createCustomer: createPaymentCustomer,
  createCharge: createPaymentCharge,
};