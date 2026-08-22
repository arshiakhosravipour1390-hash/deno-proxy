
// ============================================================
// HENDESYAR AI PROXY - DENO
// ============================================================

// ============================================================
// API KEYS
// ============================================================

const GROQ_API_KEY =
    "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";

const OPENROUTER_API_KEY =
    "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";const GROQ_API_KEY = "YOUR_GROQ_API_KEY";
const GROQ_MODEL =
  Deno.env.get("GROQ_MODEL") || "llama-3.3-70b-versatile";

const GEMINI_MODEL =
  Deno.env.get("GEMINI_MODEL") || "gemini-3.7-flash";

const PORT = Number(Deno.env.get("PORT") || 8000);

if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY is missing");
}

if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

async function parseJson(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new Error("JSON نامعتبر است.");
  }
}

/* =========================================================
   GROQ CHAT
   ========================================================= */

async function handleChat(body: any) {
  if (!GROQ_API_KEY) {
    return json(
      {
        success: false,
        provider: "groq",
        content: null,
        error: {
          message: "GROQ_API_KEY روی سرور تنظیم نشده است.",
        },
      },
      500,
    );
  }

  if (!Array.isArray(body.messages)) {
    return json(
      {
        success: false,
        provider: "groq",
        content: null,
        error: {
          message: "messages باید آرایه باشد.",
        },
      },
      400,
    );
  }

  const messages = body.messages
    .filter((m: any) =>
      m &&
      ["system", "user", "assistant"].includes(m.role) &&
      typeof m.content === "string"
    )
    .slice(-20);

  if (!messages.length) {
    return json(
      {
        success: false,
        provider: "groq",
        content: null,
        error: {
          message: "هیچ پیام معتبری ارسال نشده است.",
        },
      },
      400,
    );
  }

  const groqResponse = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature:
          typeof body.temperature === "number"
            ? body.temperature
            : 0.2,
        max_completion_tokens:
          typeof body.max_tokens === "number"
            ? Math.min(body.max_tokens, 4000)
            : 1800,
        stream: false,
      }),
    },
  );

  const raw = await groqResponse.text();

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    return json(
      {
        success: false,
        provider: "groq",
        content: null,
        error: {
          message: "پاسخ Groq معتبر نیست.",
        },
      },
      502,
    );
  }

  if (!groqResponse.ok) {
    console.error("Groq error:", data);

    return json(
      {
        success: false,
        provider: "groq",
        content: null,
        error: data.error || {
          message: "خطا در ارتباط با Groq.",
        },
        status: groqResponse.status,
      },
      groqResponse.status,
    );
  }

  const content =
    data?.choices?.[0]?.message?.content;

  if (!content) {
    return json(
      {
        success: false,
        provider: "groq",
        content: null,
        error: {
          message: "Groq پاسخ متنی خالی برگرداند.",
        },
      },
      502,
    );
  }

  return json({
    success: true,
    provider: "groq",
    content,
    model: data.model || GROQ_MODEL,
    usage: data.usage || null,
  });
}

/* =========================================================
   GEMINI VISION
   ========================================================= */

async function handleVision(body: any) {
  if (!GEMINI_API_KEY) {
    return json(
      {
        success: false,
        provider: "gemini",
        content: null,
        error: {
          message: "GEMINI_API_KEY روی سرور تنظیم نشده است.",
        },
      },
      500,
    );
  }

  const imageData = body?.imageData;
  const mimeType = body?.mimeType || "image/jpeg";
  const question =
    body?.question ||
    "این تصویر را دقیقاً تحلیل کن و هر چیزی که در آن می‌بینی توضیح بده.";

  if (
    typeof imageData !== "string" ||
    !imageData.length
  ) {
    return json(
      {
        success: false,
        provider: "gemini",
        content: null,
        error: {
          message: "imageData ارسال نشده است.",
        },
      },
      400,
    );
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (!allowedTypes.includes(mimeType)) {
    return json(
      {
        success: false,
        provider: "gemini",
        content: null,
        error: {
          message: "فرمت تصویر پشتیبانی نمی‌شود.",
        },
      },
      400,
    );
  }

  /*
   * محدودیت امنیتی سمت Proxy
   * حدود 12MB Base64
   */
  if (imageData.length > 12 * 1024 * 1024) {
    return json(
      {
        success: false,
        provider: "gemini",
        content: null,
        error: {
          message: "حجم تصویر بیش از حد مجاز است.",
        },
      },
      413,
    );
  }

  const prompt = `
تو بخش تحلیل تصویر «هندسیار» هستی.

${question}

اگر تصویر شامل سؤال هندسه است:

1. متن سؤال را بخوان.
2. شکل را بررسی کن.
3. نام نقاط، اعداد، ضلع‌ها و زاویه‌های قابل مشاهده را استخراج کن.
4. اطلاعاتی که واقعاً در تصویر دیده می‌شود را از حدس جدا کن.
5. اگر بخشی ناخوانا است، حدس نزن.
6. مسئله را مرحله‌به‌مرحله و آموزشی حل کن.
7. پاسخ مناسب دانش‌آموز پایه هفتم تا نهم باشد.
8. از LaTeX برای فرمول‌های ریاضی استفاده کن.

اگر اطلاعات تصویر برای حل کافی نیست، دقیقاً بگو چه چیزی مشخص نیست.
`;

  const geminiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const geminiResponse = await fetch(
    geminiUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageData,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 3000,
        },
      }),
    },
  );

  const raw = await geminiResponse.text();

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    return json(
      {
        success: false,
        provider: "gemini",
        content: null,
        error: {
          message: "پاسخ Gemini معتبر نیست.",
        },
      },
      502,
    );
  }

  if (!geminiResponse.ok) {
    console.error("Gemini error:", data);

    return json(
      {
        success: false,
        provider: "gemini",
        content: null,
        error: data.error || {
          message: "خطا در ارتباط با Gemini.",
        },
        status: geminiResponse.status,
      },
      geminiResponse.status,
    );
  }

  const content =
    data?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part.text || "")
      .join("")
      .trim();

  if (!content) {
    return json(
      {
        success: false,
        provider: "gemini",
        content: null,
        error: {
          message: "Gemini پاسخ خالی برگرداند.",
        },
      },
      502,
    );
  }

  return json({
    success: true,
    provider: "gemini",
    content,
    model: GEMINI_MODEL,
    usage: data.usageMetadata || null,
  });
}

/* =========================================================
   SERVER
   ========================================================= */

const server = Deno.serve(
  {
    port: PORT,
  },
  async (req) => {
    try {
      if (req.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: corsHeaders,
        });
      }

      const url = new URL(req.url);

      if (
        req.method === "GET" &&
        url.pathname === "/"
      ) {
        return json({
          success: true,
          service: "HendESyar AI Proxy",
          status: "online",
          services: {
            chat: Boolean(GROQ_API_KEY),
            vision: Boolean(GEMINI_API_KEY),
          },
          models: {
            groq: GROQ_MODEL,
            gemini: GEMINI_MODEL,
          },
        });
      }

      if (
        req.method === "POST" &&
        url.pathname === "/api/chat"
      ) {
        const body = await parseJson(req);
        return await handleChat(body);
      }

      if (
        req.method === "POST" &&
        url.pathname === "/api/vision"
      ) {
        const body = await parseJson(req);
        return await handleVision(body);
      }

      return json(
        {
          success: false,
          error: {
            message: "Endpoint پیدا نشد.",
          },
        },
        404,
      );
    } catch (error) {
      console.error("SERVER ERROR:", error);

      return json(
        {
          success: false,
          error: {
            message:
              error instanceof Error
                ? error.message
                : "خطای ناشناخته سرور.",
          },
        },
        500,
      );
    }
  },
);

console.log(
  `🚀 HendESyar AI Proxy running on port ${PORT}`,
);

await server.finished;
