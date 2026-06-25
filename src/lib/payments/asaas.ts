type AsaasRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

function getAsaasApiKey() {
  const keyWithoutDollar = process.env.ASAAS_API_KEY_BASE64;

  if (keyWithoutDollar) {
    return `$${keyWithoutDollar}`;
  }

  return process.env.ASAAS_API_KEY ?? null;
}

export async function asaasRequest<T>(
  path: string,
  options: AsaasRequestOptions = {}
): Promise<T> {
  const asaasApiKey = getAsaasApiKey();
  const asaasBaseUrl =
    process.env.ASAAS_BASE_URL ?? "https://api-sandbox.asaas.com/v3";

  if (!asaasApiKey) {
    console.error("ASAAS_API_KEY disponível?", Boolean(asaasApiKey));
    console.error("ASAAS_API_KEY_BASE64 disponível?", Boolean(process.env.ASAAS_API_KEY_BASE64));
    console.error("ASAAS_BASE_URL:", asaasBaseUrl);

    throw new Error("ASAAS_API_KEY não configurada no .env");
  }

  const response = await fetch(`${asaasBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      access_token: asaasApiKey,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Erro Asaas:", data);

    throw new Error("Erro ao comunicar com o Asaas");
  }

  return data as T;
}