export default function Navbar() {
  return (
    <nav className="flex justify-between items-center p-6 border-b">
      <h1 className="text-2xl font-bold text-green-700">
        Dr Cannabis
      </h1>

      <div className="flex gap-4">
        <button>Entrar</button>

        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Sou Médico
        </button>
      </div>
    </nav>
  );
}