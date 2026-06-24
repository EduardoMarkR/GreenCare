const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_BASE_URL =
  process.env.ASAAS_BASE_URL ?? "https://sandbox.asaas.com/api/v3";

type AsaasRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

export async function asaasRequest<T>(
  path: string,
  options: AsaasRequestOptions = {}
): Promise<T> {
  if (!ASAAS_API_KEY) {
    throw new Error("ASAAS_API_KEY não configurada no .env");
  }

  const response = await fetch(`${ASAAS_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      access_token: ASAAS_API_KEY,
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