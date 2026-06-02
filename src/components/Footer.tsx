export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <h3 className="text-2xl font-bold text-green-400">
              GreenCare
            </h3>

            <p className="mt-4 text-gray-300">
              Conectando pacientes a médicos especializados em cannabis medicinal.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">Links</h4>

            <ul className="mt-4 space-y-2 text-gray-300">
              <li>Sobre nós</li>
              <li>Médicos</li>
              <li>Contato</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Legal</h4>

            <ul className="mt-4 space-y-2 text-gray-300">
              <li>Política de Privacidade</li>
              <li>Termos de Uso</li>
              <li>LGPD</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-700 pt-6 text-center text-gray-400">
          © 2026 GreenCare. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}