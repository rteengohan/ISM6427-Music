const BASE = "https://api.sunoapi.org/api/v1";

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function suno(path, options = {}) {
  const key = process.env.SUNO_API_KEY;
  if (!key) {
    return json({ code: 500, msg: "SUNO_API_KEY is not set in Netlify environment variables." }, 500);
  }
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}
