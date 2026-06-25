export default function TesteEnvPage() {
  return (
    <main className="p-10">
      <h1>Teste ENV</h1>

      <p>
        ASAAS_API_KEY_BASE64:{" "}
        {process.env.ASAAS_API_KEY_BASE64 ? "CONFIGURADA" : "NÃO CONFIGURADA"}
    </p>

      <p>ASAAS_BASE_URL: {process.env.ASAAS_BASE_URL}</p>
    </main>
  );
}