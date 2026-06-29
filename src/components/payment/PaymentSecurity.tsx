export default function PaymentSecurity() {
  const items = [
    "Ambiente seguro",
    "Pagamento processado pelo Asaas",
    "Dados protegidos",
    "Nenhum dado do cartão fica salvo no CannaDoctor",
  ];

  return (
    <div className="rounded-[2rem] border border-[#C6C6C6]/60 bg-white p-7 shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#08553F] text-2xl text-white">
        🔒
      </div>

      <h3 className="mt-5 text-2xl font-extrabold text-[#08553F]">
        Pagamento seguro
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#878787]">
        O CannaDoctor usa integração segura com gateway de pagamento. Seus dados
        são tratados com segurança durante todo o processo.
      </p>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 rounded-2xl bg-[#F7F4E7] p-4"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00CF7B] text-xs font-extrabold text-white">
              ✓
            </span>

            <p className="text-sm font-bold text-[#08553F]">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}