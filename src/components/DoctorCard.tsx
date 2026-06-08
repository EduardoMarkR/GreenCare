import Link from "next/link";

type DoctorCardProps = {
  id: string;
  name: string;
  specialty: string;
  location: string;
  price: string;
};

export default function DoctorCard({
  id,
  name,
  specialty,
  location,
  price,
}: DoctorCardProps) {
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-[#C6C6C6]/60 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="h-2 bg-gradient-to-r from-[#08553F] to-[#00CF7B]" />

      <div className="p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F7F4E7] text-3xl shadow-inner">
            ⚕️
          </div>

          <span className="rounded-full bg-[#F3EFA1] px-3 py-1 text-xs font-bold text-[#08553F]">
            Online
          </span>
        </div>

        <h3 className="text-xl font-extrabold text-[#08553F]">{name}</h3>

        <p className="mt-2 w-fit rounded-full bg-[#00CF7B]/10 px-3 py-1 text-sm font-bold text-[#08553F]">
          {specialty}
        </p>

        <div className="mt-5 space-y-3 text-sm text-[#878787]">
          <p className="flex items-center gap-2">
            <span>📍</span>
            {location}
          </p>

          <p className="flex items-center gap-2 font-semibold text-[#08553F]">
            <span>💳</span>
            {price}
          </p>
        </div>

        <Link
          href={`/medicos/${id}`}
          className="mt-6 block w-full rounded-2xl bg-[#08553F] px-4 py-3 text-center font-bold text-white transition group-hover:bg-[#00CF7B] group-hover:text-[#08553F]"
        >
          Ver horários disponíveis
        </Link>
      </div>
    </article>
  );
}