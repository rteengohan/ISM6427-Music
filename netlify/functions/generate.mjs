import { json, suno } from "./_suno.mjs";

const MODELS = ["V6", "V6_MINI", "V6_WILD"];

export default async (req) => {
  if (req.method !== "POST") return json({ code: 405, msg: "Use POST" }, 405);

  let input;
  try {
    input = await req.json();
  } catch {
    return json({ code: 400, msg: "Invalid JSON body" }, 400);
  }

  const customMode = Boolean(input.customMode);
  const instrumental = Boolean(input.instrumental);
  const model = MODELS.includes(input.model) ? input.model : "V6";
  const origin = new URL(req.url).origin;

  const body = {
    customMode,
    instrumental,
    model,
    // Required by the API; we poll for results instead, so this just acknowledges.
    callBackUrl: `${origin}/api/callback`,
  };

  const clip = (s, n) => (typeof s === "string" ? s.trim().slice(0, n) : "");

  if (customMode) {
    const style = clip(input.style, 1000);
    const lyrics = clip(input.lyrics, 5000);
    const title = clip(input.title, 80);
    if (!style && !lyrics) return json({ code: 400, msg: "Custom mode needs a style or lyrics." }, 400);
    if (style) body.style = style;
    if (title) body.title = title;
    if (lyrics && !instrumental) body.lyrics = lyrics;
    if (input.vocalGender === "m" || input.vocalGender === "f") body.vocalGender = input.vocalGender;
    const d = Number(input.duration);
    if (d >= 10 && d <= 360) body.duration = Math.round(d);
  } else {
    let prompt = clip(input.prompt, 3000);
    if (!prompt) return json({ code: 400, msg: "Describe the song you want." }, 400);
    if (instrumental && !/instrumental/i.test(prompt)) {
      prompt = `Instrumental, no vocals, no lyrics. ${prompt}`.slice(0, 3000);
    }
    body.prompt = prompt;
    const style = clip(input.style, 1000);
    body.style = style || prompt.slice(0, 200);
  }

  return suno("/generate", { method: "POST", body: JSON.stringify(body) });
};
