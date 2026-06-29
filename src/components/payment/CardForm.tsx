"use client";

import { useMemo, useState, useTransition } from "react";
import CardPreview from "./CardPreview";
import Installments from "./Installments";
import { payWithCreditCard } from "@/app/dashboard/paciente/pagamentos/[id]/actions";

type Props = {
  paymentId: string;
  amount: number;
};

function detectBrand(number: string) {
  const value = number.replace(/\s/g, "");

  if (/^4/.test(value)) return "VISA";
  if (/^(5[1-5])/.test(value)) return "MASTERCARD";
  if (/^3[47]/.test(value)) return "AMEX";
  if (/^(4011|4312|4389)/.test(value)) return "ELO";

  return "";
}

function maskCard(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function maskExpiry(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 4)
    .replace(/(\d{2})(\d)/, "$1/$2");
}

function maskCpf(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function maskPhone(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function maskCep(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export default function CardForm({ paymentId, amount }: Props) {
  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("(11) 99999-9999");
  const [postalCode, setPostalCode] = useState("01311-000");
  const [addressNumber, setAddressNumber] = useState("100");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [installmentCount, setInstallmentCount] = useState("1");
  const [isPending, startTransition] = useTransition();

  const brand = useMemo(() => detectBrand(number), [number]);

  function handleSubmit(formData: FormData) {
    startTransition(() => {
      payWithCreditCard(formData);
    });
  }

  return (
    <div className="space-y-6">
      <CardPreview
        number={number}
        holder={holder}
        expiry={expiry}
        brand={brand}
      />

      <form
        action={handleSubmit}
        className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-7 shadow-sm"
      >
        <input type="hidden" name="paymentId" value={paymentId} />

        <h3 className="text-2xl font-extrabold text-[#08553F]">
          Cartão de crédito
        </h3>

        <p className="mt-2 text-sm leading-6 text-[#878787]">
          Preencha os dados do cartão para pagar sem sair do CannaDoctor.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="mb-2 block font-bold text-[#08553F]">
              Número
            </label>

            <input
              name="cardNumber"
              value={number}
              onChange={(event) => setNumber(maskCard(event.target.value))}
              placeholder="0000 0000 0000 0000"
              inputMode="numeric"
              autoComplete="cc-number"
              disabled={isPending}
              className="w-full rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/40 focus:border-[#00CF7B] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold text-[#08553F]">
              Nome do titular
            </label>

            <input
              name="holderName"
              value={holder}
              onChange={(event) => setHolder(event.target.value.toUpperCase())}
              placeholder="NOME COMO ESTÁ NO CARTÃO"
              autoComplete="cc-name"
              disabled={isPending}
              className="w-full rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/40 focus:border-[#00CF7B] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label className="mb-2 block font-bold text-[#08553F]">
              CPF do titular
            </label>

            <input
              name="cpfCnpj"
              value={cpf}
              onChange={(event) => setCpf(maskCpf(event.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
              autoComplete="off"
              disabled={isPending}
              className="w-full rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/40 focus:border-[#00CF7B] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-bold text-[#08553F]">
                Telefone com DDD
              </label>

              <input
                name="phone"
                value={phone}
                onChange={(event) => setPhone(maskPhone(event.target.value))}
                placeholder="(11) 99999-9999"
                inputMode="numeric"
                autoComplete="tel"
                disabled={isPending}
                className="w-full rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/40 focus:border-[#00CF7B] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-2 block font-bold text-[#08553F]">
                CEP
              </label>

              <input
                name="postalCode"
                value={postalCode}
                onChange={(event) => setPostalCode(maskCep(event.target.value))}
                placeholder="00000-000"
                inputMode="numeric"
                autoComplete="postal-code"
                disabled={isPending}
                className="w-full rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/40 focus:border-[#00CF7B] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block font-bold text-[#08553F]">
              Número do endereço
            </label>

            <input
              name="addressNumber"
              value={addressNumber}
              onChange={(event) =>
                setAddressNumber(event.target.value.replace(/\D/g, ""))
              }
              placeholder="100"
              inputMode="numeric"
              autoComplete="address-line2"
              disabled={isPending}
              className="w-full rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/40 focus:border-[#00CF7B] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-bold text-[#08553F]">
                Validade
              </label>

              <input
                name="expiry"
                value={expiry}
                onChange={(event) => setExpiry(maskExpiry(event.target.value))}
                placeholder="MM/AA"
                inputMode="numeric"
                autoComplete="cc-exp"
                disabled={isPending}
                className="w-full rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/40 focus:border-[#00CF7B] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label className="mb-2 block font-bold text-[#08553F]">
                CVV
              </label>

              <input
                name="ccv"
                value={cvv}
                onChange={(event) =>
                  setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="123"
                inputMode="numeric"
                autoComplete="cc-csc"
                disabled={isPending}
                className="w-full rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition placeholder:text-[#08553F]/40 focus:border-[#00CF7B] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          <Installments
            value={amount}
            name="installmentCount"
            valueSelected={installmentCount}
            onChange={setInstallmentCount}
            disabled={isPending}
          />

          <button
            type="submit"
            disabled={isPending}
            className="mt-4 w-full rounded-2xl bg-[#08553F] py-5 text-lg font-extrabold text-white transition hover:bg-[#00CF7B] hover:text-[#08553F] disabled:cursor-not-allowed disabled:bg-[#878787] disabled:text-white"
          >
            {isPending
              ? "Processando pagamento..."
              : `Pagar ${amount.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}`}
          </button>

          <p className="text-center text-xs leading-5 text-[#878787]">
            Os dados do cartão são enviados com segurança para processamento no
            gateway de pagamento.
          </p>
        </div>
      </form>
    </div>
  );
}