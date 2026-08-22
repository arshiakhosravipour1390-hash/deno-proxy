const GROQ_API_KEY =
    "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";

const OPENROUTER_API_KEY =
    "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";
// HENDESYAR AI PROXY - DENO
// Groq + OpenRouter ONLY
// Gemini is NOT handled by Deno.
// ============================================================

// ============================================================
// API KEYS
// کلیدها مستقیماً داخل همین فایل قرار می‌گیرند.
// ============================================================

// ============================================================
// CONFIG
// ============================================================

const GROQ_MODEL = "openai/gpt-oss-20b";
const OPENROUTER_MODEL = "openrouter/free";

const PORT = 8000;

// ============================================================
// CORS
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization",
  "Access-Control-Allow-Methods":
    "GET, POST, OPTIONS",
};

// ============================================================
// JSON RESPONSE
// ============================================================

function json(
  data: unknown,
  status = 200,
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json; charset=utf-8",
      },
    },
  );
}

// ============================================================
// PARSE JSON
// ============================================================

async function parseJson(req: Request) {
  try {
    return await req.json();
  } catch {
    throw new Error("JSON نامعتبر است.");
  }
}

// ============================================================
// VALIDATE MESSAGES
// ============================================================

function getMessages(body: any) {
  if (!Array.isArray(body?.messages)) {
    return {
      error: "messages باید آرایه باشد.",
      messages: null,
    };
  }

  const messages = body.messages
    .filter(
      (m: any) =>
        m &&
        ["system", "user", "assistant"].includes(
          m.role,
        ) &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-20);

  if (!messages.length) {
    return {
      error: "هیچ پیام معتبری ارسال نشده است.",
      messages: null,
    };
  }

  return {
    error: null,
    messages,
  };
}

// ============================================================
// GROQ
// POST /api/chat
// ============================================================

async function handleGroq(body: any) {
  if (!GROQ_API_KEY) {
    return json(
      {
        success: false,
        provider: "groq",
        content: null,
        error: {
          message:
            "GROQ_API_KEY تنظیم نشده است.",
        },
      },
      500,
    );
  }

  const validation = getMessages(body);

  if (validation.error) {
    return json(
      {
        success: false,
        provider: "groq",
        content: null,
        error: {
          message: validation.error,
        },
      },
      400,
    );
  }

  const messages = validation.messages;

  const temperature =
    typeof body.temperature === "number"
      ? Math.max(
          0,
          Math.min(body.temperature, 2),
        )
      : 0.2;

  const maxTokens =
    typeof body.max_tokens === "number"
      ? Math.min(
          Math.max(body.max_tokens, 1),
          4000,
        )
      : 1800;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization":
            `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages,
          temperature,
          max_completion_tokens:
            maxTokens,
          stream: false,
        }),
      },
    );

    const raw = await response.text();

    let data: any;

    try {
      data = JSON.parse(raw);
    } catch {
      return json(
        {
          success: false,
          provider: "groq",
          content: null,
          error: {
            message:
              "پاسخ Groq معتبر نیست.",
          },
        },
        502,
      );
    }

    if (!response.ok) {
      console.error(
        "Groq API error:",
        data,
      );

      return json(
        {
          success: false,
          provider: "groq",
          content: null,
          error:
            data?.error || {
              message:
                "خطا در ارتباط با Groq.",
            },
          status: response.status,
        },
        response.status,
      );
    }

    const content =
      data?.choices?.[0]?.message?.content;

    if (
      typeof content !== "string" ||
      !content.trim()
    ) {
      return json(
        {
          success: false,
          provider: "groq",
          content: null,
          error: {
            message:
              "Groq پاسخ متنی خالی برگرداند.",
          },
        },
        502,
      );
    }

    return json({
      success: true,
      provider: "groq",
      content: content.trim(),
      model:
        data?.model || GROQ_MODEL,
      usage:
        data?.usage || null,
    });
  } catch (error) {
    console.error(
      "Groq network error:",
      error,
    );

    return json(
      {
        success: false,
        provider: "groq",
        content: null,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "خطا در ارتباط با Groq.",
        },
      },
      502,
    );
  }
}

// ============================================================
// OPENROUTER
// POST /api/openrouter
// ============================================================

async function handleOpenRouter(body: any) {
  if (!OPENROUTER_API_KEY) {
    return json(
      {
        success: false,
        provider: "openrouter",
        content: null,
        error: {
          message:
            "OPENROUTER_API_KEY تنظیم نشده است.",
        },
      },
      500,
    );
  }

  const validation = getMessages(body);

  if (validation.error) {
    return json(
      {
        success: false,
        provider: "openrouter",
        content: null,
        error: {
          message: validation.error,
        },
      },
      400,
    );
  }

  const messages = validation.messages;

  const temperature =
    typeof body.temperature === "number"
      ? Math.max(
          0,
          Math.min(body.temperature, 2),
        )
      : 0.2;

  const maxTokens =
    typeof body.max_tokens === "number"
      ? Math.min(
          Math.max(body.max_tokens, 1),
          4000,
        )
      : 1800;

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",

          "Authorization":
            `Bearer ${OPENROUTER_API_KEY}`,

          "HTTP-Referer":
            "https://hendesyar.ir",

          "X-Title":
            "HendESyar AI",
        },

        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
      },
    );

    const raw = await response.text();

    let data: any;

    try {
      data = JSON.parse(raw);
    } catch {
      return json(
        {
          success: false,
          provider: "openrouter",
          content: null,
          error: {
            message:
              "پاسخ OpenRouter معتبر نیست.",
          },
        },
        502,
      );
    }

    if (!response.ok) {
      console.error(
        "OpenRouter API error:",
        data,
      );

      return json(
        {
          success: false,
          provider: "openrouter",
          content: null,
          error:
            data?.error || {
              message:
                "خطا در ارتباط با OpenRouter.",
            },
          status: response.status,
        },
        response.status,
      );
    }

    const content =
      data?.choices?.[0]?.message?.content;

    if (
      typeof content !== "string" ||
      !content.trim()
    ) {
      return json(
        {
          success: false,
          provider: "openrouter",
          content: null,
          error: {
            message:
              "OpenRouter پاسخ متنی خالی برگرداند.",
          },
        },
        502,
      );
    }

    return json({
      success: true,
      provider: "openrouter",
      content: content.trim(),
      model:
        data?.model || OPENROUTER_MODEL,
      usage:
        data?.usage || null,
    });
  } catch (error) {
    console.error(
      "OpenRouter network error:",
      error,
    );

    return json(
      {
        success: false,
        provider: "openrouter",
        content: null,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "خطا در ارتباط با OpenRouter.",
        },
      },
      502,
    );
  }
}

// ============================================================
// HEALTH CHECK
// GET /
// ============================================================

function healthCheck() {
  return json({
    success: true,
    service: "HendESyar AI Proxy",
    status: "online",

    services: {
      groq: Boolean(GROQ_API_KEY),
      openrouter: Boolean(OPENROUTER_API_KEY),
      gemini: false,
    },

    models: {
      groq: GROQ_MODEL,
      openrouter: OPENROUTER_MODEL,
    },
  });
}

// ============================================================
// SERVER
// ============================================================

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

      // ------------------------------------------------------
      // HEALTH CHECK
      // ------------------------------------------------------

      if (
        req.method === "GET" &&
        url.pathname === "/"
      ) {
        return healthCheck();
      }

      // ------------------------------------------------------
      // GROQ
      // ------------------------------------------------------

      if (
        req.method === "POST" &&
        url.pathname === "/api/chat"
      ) {
        const body = await parseJson(req);
        return await handleGroq(body);
      }

      // ------------------------------------------------------
      // OPENROUTER
      // ------------------------------------------------------

      if (
        req.method === "POST" &&
        url.pathname === "/api/openrouter"
      ) {
        const body = await parseJson(req);
        return await handleOpenRouter(body);
      }

      // ------------------------------------------------------
      // GEMINI IS NOT HANDLED BY DENO
      // ------------------------------------------------------

      if (
        url.pathname === "/api/vision"
      ) {
        return json(
          {
            success: false,
            provider: "gemini",
            content: null,
            error: {
              message:
                "Gemini از Deno ارائه نمی‌شود. درخواست Gemini باید از طریق Supabase ارسال شود.",
            },
          },
          410,
        );
      }

      // ------------------------------------------------------
      // 404
      // ------------------------------------------------------

      return json(
        {
          success: false,
          error: {
            message:
              "Endpoint پیدا نشد.",
          },
        },
        404,
      );
    } catch (error) {
      console.error(
        "SERVER ERROR:",
        error,
      );

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
