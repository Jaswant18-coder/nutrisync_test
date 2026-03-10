/// <reference types="@cloudflare/workers-types" />
// Cloudflare Pages Function — proxies /api/* to the backend on Render
interface Env {
  BACKEND_URL: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const backendBase = context.env.BACKEND_URL || "https://nutrisync-backend.onrender.com";
  const url = new URL(context.request.url);
  const target = `${backendBase}${url.pathname}${url.search}`;

  const headers = new Headers(context.request.headers);
  headers.set("X-Forwarded-Host", url.hostname);

  const res = await fetch(target, {
    method: context.request.method,
    headers,
    body: context.request.method !== "GET" && context.request.method !== "HEAD"
      ? context.request.body
      : undefined,
  });

  const response = new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });

  // Allow CORS from the Pages domain
  response.headers.set("Access-Control-Allow-Origin", url.origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");

  return response;
};
