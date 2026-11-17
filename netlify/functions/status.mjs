import { json, suno } from "./_suno.mjs";

export default async (req) => {
  const taskId = new URL(req.url).searchParams.get("taskId");
  if (!taskId || !/^[\w-]+$/.test(taskId)) return json({ code: 400, msg: "Missing or invalid taskId" }, 400);
  return suno(`/generate/record-info?taskId=${encodeURIComponent(taskId)}`);
};
