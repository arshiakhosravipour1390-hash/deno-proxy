
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
  Deno.env.get("GROQ_MODEL") ||
  "llama-3.3-70b-versatile";

const OPENROUTER_MODEL =
  Deno.env.get("OPENROUTER_MODEL") ||
  "meta-llama/llama-3.3-70b-instruct:free";

const PORT =
  Number(Deno.env.get("PORT") || 8000);


// ============================================================
// CORS
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers":
    "Content-Type, Authorization",

  "Access-Control-Allow-Methods":
    "GET, POST, OPTIONS",

  "Access-Control-Max-Age":
    "86400",
};


// ============================================================
// JSON RESPONSE
// ============================================================

function json(data, status = 200) {

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
// ERROR RESPONSE
// ============================================================

function errorResponse(
  message,
  status = 500,
  provider = null,
) {

  return json(
    {
      success: false,

      provider,

      content: null,

      error: {
        message,
      },
    },

    status,
  );
}


// ============================================================
// PARSE JSON
// ============================================================

async function parseJson(req) {

  try {

    return await req.json();

  } catch {

    throw new Error(
      "JSON ارسال‌شده معتبر نیست.",
    );
  }
}


// ============================================================
// CLEAN MESSAGES
// ============================================================

function cleanMessages(messages) {

  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message) => {

      if (!message) {
        return false;
      }

      if (
        ![
          "system",
          "user",
          "assistant",
        ].includes(message.role)
      ) {
        return false;
      }

      return (
        typeof message.content ===
        "string"
      );
    })

    .map((message) => ({
      role: message.role,

      content:
        message.content
          .slice(0, 20000),
    }))

    .slice(-20);
}


// ============================================================
// GROQ
// ============================================================

async function callGroq(
  messages,
  temperature = 0.2,
  maxTokens = 1800,
) {

  if (!GROQ_API_KEY) {

    throw new Error(
      "GROQ_API_KEY روی سرور تنظیم نشده است.",
    );
  }


  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",

    {
      method: "POST",

      headers: {

        "Content-Type":
          "application/json",

        "Authorization":
          `Bearer ${GROQ_API_KEY}`,
      },

      body: JSON.stringify({

        model: GROQ_MODEL,

        messages,

        temperature:
          typeof temperature === "number"
            ? Math.max(
                0,
                Math.min(temperature, 1),
              )
            : 0.2,

        max_completion_tokens:
          Math.min(
            Math.max(
              Number(maxTokens) || 1800,
              100,
            ),
            4000,
          ),

        stream: false,
      }),
    },
  );


  const raw =
    await response.text();


  let data;

  try {

    data = JSON.parse(raw);

  } catch {

    throw new Error(
      "پاسخ Groq قابل پردازش نیست.",
    );
  }


  if (!response.ok) {

    console.error(
      "GROQ ERROR:",
      data,
    );

    throw new Error(
      data?.error?.message ||
      `Groq HTTP ${response.status}`,
    );
  }


  const content =
    data?.choices?.[0]
      ?.message?.content;


  if (
    typeof content !== "string" ||
    !content.trim()
  ) {

    throw new Error(
      "Groq پاسخ خالی برگرداند.",
    );
  }


  return {

    success: true,

    provider: "groq",

    content: content.trim(),

    model:
      data.model ||
      GROQ_MODEL,

    usage:
      data.usage ||
      null,
  };
}


// ============================================================
// OPENROUTER
// ============================================================

async function callOpenRouter(
  messages,
  temperature = 0.2,
  maxTokens = 1800,
) {

  if (!OPENROUTER_API_KEY) {

    throw new Error(
      "OPENROUTER_API_KEY روی سرور تنظیم نشده است.",
    );
  }


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
          "HendESyar",
      },

      body: JSON.stringify({

        model:
          OPENROUTER_MODEL,

        messages,

        temperature:
          typeof temperature === "number"
            ? Math.max(
                0,
                Math.min(temperature, 1),
              )
            : 0.2,

        max_tokens:
          Math.min(
            Math.max(
              Number(maxTokens) || 1800,
              100,
            ),
            4000,
          ),

        stream: false,
      }),
    },
  );


  const raw =
    await response.text();


  let data;

  try {

    data = JSON.parse(raw);

  } catch {

    throw new Error(
      "پاسخ OpenRouter قابل پردازش نیست.",
    );
  }


  if (!response.ok) {

    console.error(
      "OPENROUTER ERROR:",
      data,
    );

    throw new Error(
      data?.error?.message ||
      `OpenRouter HTTP ${response.status}`,
    );
  }


  const content =
    data?.choices?.[0]
      ?.message?.content;


  if (
    typeof content !== "string" ||
    !content.trim()
  ) {

    throw new Error(
      "OpenRouter پاسخ خالی برگرداند.",
    );
  }


  return {

    success: true,

    provider: "openrouter",

    content: content.trim(),

    model:
      data.model ||
      OPENROUTER_MODEL,

    usage:
      data.usage ||
      null,
  };
}


// ============================================================
// CHAT
//
// Primary:
//   Groq
//
// Fallback:
//   OpenRouter
// ============================================================

async function handleChat(body) {

  if (
    !Array.isArray(body?.messages)
  ) {

    return errorResponse(
      "messages باید آرایه باشد.",
      400,
      "proxy",
    );
  }


  const messages =
    cleanMessages(
      body.messages,
    );


  if (!messages.length) {

    return errorResponse(
      "هیچ پیام معتبری ارسال نشده است.",
      400,
      "proxy",
    );
  }


  const temperature =
    typeof body.temperature ===
    "number"

      ? body.temperature

      : 0.2;


  const maxTokens =
    typeof body.max_tokens ===
    "number"

      ? body.max_tokens

      : 1800;


  // ----------------------------------------------------------
  // GROQ
  // ----------------------------------------------------------

  if (GROQ_API_KEY) {

    try {

      const result =
        await callGroq(
          messages,
          temperature,
          maxTokens,
        );

      return json(
        result,
        200,
      );

    } catch (error) {

      console.error(
        "Groq failed:",
        error instanceof Error
          ? error.message
          : error,
      );
    }
  }


  // ----------------------------------------------------------
  // OPENROUTER FALLBACK
  // ----------------------------------------------------------

  if (OPENROUTER_API_KEY) {

    try {

      const result =
        await callOpenRouter(
          messages,
          temperature,
          maxTokens,
        );

      return json(
        result,
        200,
      );

    } catch (error) {

      console.error(
        "OpenRouter failed:",
        error instanceof Error
          ? error.message
          : error,
      );
    }
  }


  return errorResponse(
    "هیچ‌کدام از سرویس‌های هوش مصنوعی در دسترس نیستند.",
    503,
    "proxy",
  );
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

      // ------------------------------------------------------
      // CORS PREFLIGHT
      // ------------------------------------------------------

      if (
        req.method ===
        "OPTIONS"
      ) {

        return new Response(
          null,
          {
            status: 204,
            headers: corsHeaders,
          },
        );
      }


      const url =
        new URL(req.url);


      // ------------------------------------------------------
      // HEALTH CHECK
      // ------------------------------------------------------

      if (
        req.method === "GET" &&
        url.pathname === "/"
      ) {

        return json({

          success: true,

          service:
            "HendESyar AI Proxy",

          status:
            "online",

          services: {

            chat:
              Boolean(
                GROQ_API_KEY ||
                OPENROUTER_API_KEY,
              ),

            groq:
              Boolean(
                GROQ_API_KEY,
              ),

            openrouter:
              Boolean(
                OPENROUTER_API_KEY,
              ),

            gemini:
              false,
          },

          models: {

            groq:
              GROQ_MODEL,

            openrouter:
              OPENROUTER_MODEL,
          },

        });
      }


      // ------------------------------------------------------
      // CHAT
      // ------------------------------------------------------

      if (
        req.method === "POST" &&
        url.pathname === "/api/chat"
      ) {

        const body =
          await parseJson(req);

        return await handleChat(
          body,
        );
      }


      // ------------------------------------------------------
      // NOT FOUND
      // ------------------------------------------------------

      return errorResponse(
        "Endpoint پیدا نشد.",
        404,
        "proxy",
      );

    } catch (error) {

      console.error(
        "SERVER ERROR:",
        error,
      );

      return errorResponse(
        error instanceof Error
          ? error.message
          : "خطای ناشناخته سرور.",
        500,
        "proxy",
      );
    }
  },
);


console.log(
  "🚀 HendESyar AI Proxy started",
);

console.log(
  `Port: ${PORT}`,
);

console.log(
  `Groq: ${
    GROQ_API_KEY
      ? "configured"
      : "missing"
  }`,
);

console.log(
  `OpenRouter: ${
    OPENROUTER_API_KEY
      ? "configured"
      : "missing"
  }`,
);


await server.finished;
