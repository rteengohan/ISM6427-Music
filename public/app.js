const $ = (id) => document.getElementById(id);
let mode = "simple";

document.querySelectorAll(".tab").forEach((tab) =>
  tab.addEventListener("click", () => {
    mode = tab.dataset.mode;
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
    document.querySelectorAll(".mode").forEach((m) => m.classList.toggle("hidden", !m.classList.contains(mode)));
  })
);

document.querySelectorAll(".chip").forEach((chip) =>
  chip.addEventListener("click", () => {
    const s = $("style");
    s.value = s.value ? `${s.value}, ${chip.textContent}` : chip.textContent;
  })
);

function setStatus(html, error = false) {
  $("status").innerHTML = html;
  $("status").classList.toggle("error", error);
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function loadCredits() {
  try {
    const r = await fetch("/api/credits").then((x) => x.json());
    if (r.code === 200) $("credits").textContent = `Credits remaining: ${r.data}`;
  } catch {}
}

const FAIL = ["CREATE_TASK_FAILED", "GENERATE_AUDIO_FAILED", "CALLBACK_EXCEPTION", "SENSITIVE_WORD_ERROR"];
const LABEL = {
  PENDING: "Queued… warming up the studio",
  TEXT_SUCCESS: "Lyrics written, recording the track…",
  FIRST_SUCCESS: "First version ready! Finishing the second…",
};

function render(tracks) {
  $("results").innerHTML = tracks
    .map((t) => {
      const src = t.audio_url || t.stream_audio_url || t.source_stream_audio_url;
      if (!src) return "";
      return `
      <article class="card track">
        <img src="${esc(t.image_url)}" alt="Cover art" />
        <div>
          <h3>${esc(t.title || "Untitled")}</h3>
          <p class="tags">${esc(t.tags)}${t.duration ? ` · ${Math.round(t.duration)}s` : ""}</p>
          <audio controls preload="none" src="${esc(src)}"></audio>
          <div class="actions">
            ${t.audio_url ? `<a href="${esc(t.audio_url)}" target="_blank" rel="noopener" download>Download MP3</a>` : "<span>Streaming preview — full file still rendering</span>"}
          </div>
          ${t.prompt ? `<details><summary>Lyrics</summary><pre>${esc(t.prompt)}</pre></details>` : ""}
        </div>
      </article>`;
    })
    .join("");
}

async function poll(taskId) {
  const started = Date.now();
  while (Date.now() - started < 10 * 60 * 1000) {
    await new Promise((r) => setTimeout(r, 5000));
    let r;
    try {
      r = await fetch(`/api/status?taskId=${encodeURIComponent(taskId)}`).then((x) => x.json());
    } catch {
      continue;
    }
    if (r.code !== 200) throw new Error(r.msg || "Status check failed");
    const d = r.data || {};
    const tracks = d.response?.sunoData || [];
    if (tracks.length) render(tracks);
    if (d.status === "SUCCESS") return;
    if (FAIL.includes(d.status)) throw new Error(d.errorMessage || d.status.replace(/_/g, " ").toLowerCase());
    const secs = Math.round((Date.now() - started) / 1000);
    setStatus(`<span class="spinner"></span>${LABEL[d.status] || "Working…"} (${secs}s)`);
  }
  throw new Error("Timed out after 10 minutes. Try again.");
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    customMode: mode === "custom",
    instrumental: $("instrumental").checked,
    model: $("model").value,
    style: $("style").value,
    prompt: $("prompt").value,
    title: $("title").value,
    lyrics: $("lyrics").value,
    vocalGender: $("vocal").value,
    duration: $("duration").value,
  };

  $("go").disabled = true;
  $("results").innerHTML = "";
  setStatus('<span class="spinner"></span>Sending your idea to the studio…');

  try {
    const r = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((x) => x.json());
    if (r.code !== 200 || !r.data?.taskId) throw new Error(r.msg || "Generation request failed");
    await poll(r.data.taskId);
    setStatus("✅ Done! Two versions generated.");
    loadCredits();
  } catch (err) {
    setStatus(`⚠️ ${esc(err.message)}`, true);
  } finally {
    $("go").disabled = false;
  }
});

loadCredits();
