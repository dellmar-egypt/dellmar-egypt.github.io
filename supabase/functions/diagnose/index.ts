// Dellmar Egypt — AI plant diagnosis proxy (OpenRouter free vision models)
// Secret needed: OPENROUTER_API_KEY
const OR_KEY = Deno.env.get("OPENROUTER_API_KEY") ?? "";
const MODELS = [
  "nvidia/nemotron-3.5-super-vl:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "inclusionai/ling-3.2-flash:free",
  "particle-ai/particle-1:free",
];
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PROMPT = `أنت دكتور زراعي مصري خبير في أمراض النباتات والآفات ونقص العناصر.
شوف صورة النبات/الورقة وقدم تشخيصاً محتملاً بناء على العلامات المرئية فقط، ولا تجزم بمرض لا تميزه الصورة. لا تخترع أعراضاً. اذكر الحاجة لفحص مهندس عند الشك.
رد بصيغة JSON فقط بدون أي نص إضافي وبدون markdown، بالشكل ده بالظبط:
{"plant":"اسم النبات","status":"الحالة باختصار","problem":"التشخيص: اسم المرض أو الآفة أو نقص العنصر بالعربي","confidence":رقم من 0 ل100,"advice":["نصيحة عملية 1","نصيحة عملية 2","نصيحة عملية 3"],"products":["اسم منتج علاجي عام 1","اسم منتج علاجي عام 2"]}
لو الصورة مش نبات أو مش واضحة، حط unreadable=true وproblem="صورة غير واضحة" واطلب في advice إعادة التصوير. خلاف كده unreadable=false. لا تنصح بحرق النباتات أو رش مبيد عشوائياً. لا تحدد جرعات أو تخلط مبيدات، وذكّر باتباع ملصق المنتج وتأكيد التشخيص قبل العلاج الكيميائي.
كل الرد بالعربي المصري الواضح.`;

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function extractJson(msg: any): any | null {
  let text = (msg?.content || "").trim();
  if (!text && msg?.reasoning) {
    const m = String(msg.reasoning).match(/\{[\s\S]*"problem"[\s\S]*\}/);
    text = m ? m[0] : "";
  }
  if (!text) return null;
  const jm = text.match(/\{[\s\S]*\}/);
  if (!jm) return null;
  try { return JSON.parse(jm[0]); } catch { return null; }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "method" }), { status: 405, headers: { ...CORS, "Content-Type": "application/json" } });
  }
  if (!OR_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "server key missing" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
  let image = "", crop = "";
  try {
    const body = await req.json();
    image = String(body.image || "");
    crop = String(body.crop || "").slice(0, 100);
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "bad body" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }
  if (!image.startsWith("data:image/") || image.length > 7_000_000) {
    return new Response(JSON.stringify({ ok: false, error: "bad image" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const payload = {
    messages: [{ role: "user", content: [
      { type: "text", text: PROMPT + (crop ? "\nالمحصول الذي حدده المستخدم: " + crop : "") },
      { type: "image_url", image_url: { url: image } },
    ]}],
    max_tokens: 1200,
    temperature: 0.2,
  };

  const deadline = Date.now() + 140_000;
  let lastErr = "";
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (Date.now() > deadline) break;
      try {
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": "Bearer " + OR_KEY, "Content-Type": "application/json", "HTTP-Referer": "https://dellmar-egypt.github.io", "X-Title": "Dellmar Egypt" },
          body: JSON.stringify({ ...payload, model }),
          signal: AbortSignal.timeout(25_000),
        });
        if (!r.ok) {
          lastErr = model + " " + r.status;
          console.warn("provider_attempt", JSON.stringify({ model, status: r.status, attempt: attempt + 1 }));
          if (r.status === 429 || r.status >= 500) { await sleep(1500 * (attempt + 1)); continue; }
          break; // خطأ غير مؤقت — جرّب الموديل التالي
        }
        const data = await r.json();
        const parsed = extractJson(data?.choices?.[0]?.message);
        if (parsed) {
          return new Response(JSON.stringify({ ok: true, model, result: parsed }), { headers: { ...CORS, "Content-Type": "application/json" } });
        }
        lastErr = model + " empty";
        await sleep(800);
      } catch (e) {
        lastErr = model + " " + String(e).slice(0, 80);
        await sleep(1200);
      }
    }
  }
  return new Response(JSON.stringify({ ok: false, error: "all models busy", detail: lastErr }), { status: 503, headers: { ...CORS, "Content-Type": "application/json" } });
});
