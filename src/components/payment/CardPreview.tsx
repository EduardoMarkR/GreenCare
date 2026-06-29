type Props = {
  number?: string;
  holder?: string;
  expiry?: string;
  brand?: string;
};

export default function CardPreview({
  number,
  holder,
  expiry,
  brand,
}: Props) {
  return (
    <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#08553F] to-[#00CF7B] p-7 text-white shadow-xl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold uppercase tracking-[0.2em] opacity-80">
          CannaDoctor
        </span>

        <span className="font-extrabold">
          {brand || "CARD"}
        </span>
      </div>

      <div className="mt-10 text-3xl font-extrabold tracking-[0.25em]">
        {number || "•••• •••• •••• ••••"}
      </div>

      <div className="mt-8 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase opacity-70">
            Titular
          </p>

          <p className="mt-1 font-bold">
            {holder || "NOME DO TITULAR"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs uppercase opacity-70">
            Validade
          </p>

          <p className="mt-1 font-bold">
            {expiry || "MM/AA"}
          </p>
        </div>
      </div>
    </div>
  );
}