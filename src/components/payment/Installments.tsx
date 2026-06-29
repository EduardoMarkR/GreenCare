type Props = {
  value: number;
  name?: string;
  valueSelected?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

export default function Installments({
  value,
  name = "installmentCount",
  valueSelected = "1",
  onChange,
  disabled = false,
}: Props) {
  const options = Array.from({ length: 12 }).map((_, index) => {
    const installment = index + 1;
    const amount = value / installment;

    return {
      installment,
      amount,
    };
  });

  return (
    <div>
      <label className="mb-2 block font-bold text-[#08553F]">
        Parcelamento
      </label>

      <select
        name={name}
        value={valueSelected}
        onChange={(event) => onChange?.(event.target.value)}
        disabled={disabled}
        className="w-full rounded-2xl border border-[#C6C6C6]/60 bg-[#F7F4E7] px-4 py-4 text-[#08553F] outline-none transition focus:border-[#00CF7B] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.installment} value={option.installment}>
            {option.installment}x de{" "}
            {option.amount.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </option>
        ))}
      </select>
    </div>
  );
}