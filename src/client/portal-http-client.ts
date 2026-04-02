import { ApiError } from "../errors";

export type TransportRequest = {
  url: string;
  method?: "GET" | "POST";
  form?: Record<string, unknown> | undefined;
  responseType?: "json" | "text" | "arrayBuffer";
};

export type TransportResponse<T = unknown> = {
  status: number;
  data: T;
  headers?: Headers;
};

export type HttpTransport = <T = unknown>(
  request: TransportRequest,
) => Promise<TransportResponse<T>>;

export const defaultHttpTransport: HttpTransport = async <T>(
  request: TransportRequest,
) => {
  const method = request.method ?? "POST";
  const body = request.form
    ? new URLSearchParams(
        Object.entries(request.form).map(([key, value]) => [
          key,
          typeof value === "string" ? value : String(value),
        ]),
      ).toString()
    : undefined;

  const response = await fetch(request.url, {
    method,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    ...(body ? { body } : {}),
  });

  let data: unknown;
  if (request.responseType === "arrayBuffer") {
    data = new Uint8Array(await response.arrayBuffer());
  } else if (request.responseType === "text") {
    data = await response.text();
  } else {
    data = await response.json();
  }

  return {
    status: response.status,
    data: data as T,
    headers: response.headers,
  };
};

export class PortalHttpClient {
  constructor(
    private readonly transport: HttpTransport = defaultHttpTransport,
  ) {}

  public async requestJson<T = Record<string, unknown>>(
    url: string,
    form?: Record<string, unknown>,
    method: "GET" | "POST" = "POST",
  ): Promise<T> {
    const response = await this.transport<T>({
      url,
      method,
      form,
      responseType: "json",
    });
    const payload = response.data as Record<string, unknown>;

    if (
      !payload ||
      payload.error ||
      (typeof payload.data === "object" &&
        payload.data &&
        "hata" in payload.data)
    ) {
      throw new ApiError(
        "İstek başarısız oldu.",
        form,
        payload,
        response.status,
      );
    }

    return response.data;
  }

  public async requestBinary(url: string): Promise<Uint8Array> {
    const response = await this.transport<Uint8Array>({
      url,
      method: "GET",
      responseType: "arrayBuffer",
    });

    return response.data;
  }
}
