type DoctorCardProps = {
  name: string;
  specialty: string;
  location: string;
  price: string;
};

export default function DoctorCard({
  name,
  specialty,
  location,
  price,
}: DoctorCardProps) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl">
        👩‍⚕️
      </div>

      <h3 className="text-xl font-bold text-gray-900">{name}</h3>

      <p className="mt-1 text-green-700">{specialty}</p>
      <p className="mt-2 text-sm text-gray-600">{location}</p>

      <p className="mt-4 font-semibold text-gray-900">{price}</p>

      <button className="mt-5 w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700">
        Ver horários
      </button>
    </article>
  );
}