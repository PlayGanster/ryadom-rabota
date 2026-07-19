import type { VercelRequest, VercelResponse } from "@vercel/node";

const BACKEND = "https://168.222.194.152:1822";

// Self-signed backend cert — окружение Vercel не доверяет ему по умолчанию.
if (process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const forward = (req.query.forward as string | string[] | undefined);
  const path = Array.isArray(forward) ? forward.join("/") : (forward ?? "");
  const target = `${BACKEND}/api/${path}${req.url?.includes("?") ? "?" + (req.url.split("?")[1] ?? "") : ""}`;

  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (k.toLowerCase() === "host" || k.toLowerCase() === "connection") continue;
    if (typeof v === "string") headers[k] = v;
    else if (Array.isArray(v)) headers[k] = v.join(", ");
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    const resp = await fetch(target, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
      signal: controller.signal,
    } as RequestInit);
    clearTimeout(timeout);

    const contentType = resp.headers.get("content-type") ?? "application/json";
    res.setHeader("content-type", contentType);
    resp.headers.forEach((val, key) => {
      if (key.toLowerCase() !== "content-encoding" && key.toLowerCase() !== "content-length") {
        res.setHeader(key, val);
      }
    });

    const buf = Buffer.from(await resp.arrayBuffer());
    res.status(resp.status).send(buf);
  } catch (err) {
    console.error("proxy error:", err);
    res.status(502).json({ detail: "Backend unreachable", error: String(err) });
  }
}
