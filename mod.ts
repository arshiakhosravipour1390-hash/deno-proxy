
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
const OPENROUTER_API_KEY = "YOUR_OPENROUTER_API_KEY";

const GROQ_MODEL = "openai/gpt-oss-20b";
const OPENROUTER_MODEL = "openrouter/free";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
};

function json(data: unknown, status = 200) {
    return new Response(
        JSON.stringify(data),
        {
            status,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json; charset=utf-8"
            }
        }
    );
}


// =====================================================
// GROQ
// =====================================================

async function callGroq(body: any) {

    try {

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    model: GROQ_MODEL,

                    messages: body.messages,

                    temperature:
                        body.temperature ?? 0.3,

                    max_tokens:
                        body.max_tokens ?? 1200
                })
            }
        );

        const text = await response.text();

        let data;

        try {
            data = JSON.parse(text);
        } catch {
            data = {
                raw: text
            };
        }

        console.log(
            `[GROQ] ${response.status}`,
            JSON.stringify(data)
        );

        const content =
            data?.choices?.[0]?.message?.content ??
            null;

        return {
            ok: response.ok && !!content,
            status: response.status,
            content,
            error:
                response.ok && content
                    ? null
                    : data
        };

    } catch (error) {

        console.error(
            "[GROQ]",
            error
        );

        return {
            ok: false,
            status: 500,
            content: null,
            error: String(error)
        };
    }
}


// =====================================================
// OPENROUTER
// =====================================================

async function callOpenRouter(body: any) {

    try {

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Authorization":
                        `Bearer ${OPENROUTER_API_KEY}`,

                    "Content-Type":
                        "application/json",

                    "HTTP-Referer":
                        "https://hendesyar.ir",

                    "X-Title":
                        "Hendesyar"
                },

                body: JSON.stringify({
                    model: OPENROUTER_MODEL,

                    messages:
                        body.messages,

                    temperature:
                        body.temperature ?? 0.3,

                    max_tokens:
                        body.max_tokens ?? 1200
                })
            }
        );

        const text = await response.text();

        let data;

        try {
            data = JSON.parse(text);
        } catch {
            data = {
                raw: text
            };
        }

        console.log(
            `[OPENROUTER] ${response.status}`,
            JSON.stringify(data)
        );

        const content =
            data?.choices?.[0]
                ?.message
                ?.content ??
            null;

        return {
            ok: response.ok && !!content,
            status: response.status,
            content,
            error:
                response.ok && content
                    ? null
                    : data
        };

    } catch (error) {

        console.error(
            "[OPENROUTER]",
            error
        );

        return {
            ok: false,
            status: 500,
            content: null,
            error: String(error)
        };
    }
}


// =====================================================
// CHAT
// =====================================================

async function handleChat(
    request: Request
) {

    let body: any;

    try {

        body =
            await request.json();

    } catch {

        return json(
            {
                success: false,
                error:
                    "JSON نامعتبر است"
            },
            400
        );
    }


    if (
        !Array.isArray(
            body.messages
        )
    ) {

        return json(
            {
                success: false,
                error:
                    "messages ارسال نشده است"
            },
            400
        );
    }


    // ==========================================
    // GROQ
    // ==========================================

    console.log(
        "========== GROQ =========="
    );

    const groq =
        await callGroq(body);


    if (
        groq.ok &&
        groq.content
    ) {

        console.log(
            "✅ پاسخ از GROQ"
        );

        return json({
            success: true,
            provider: "groq",
            content: groq.content
        });
    }


    // ==========================================
    // OPENROUTER
    // ==========================================

    console.log(
        "========== OPENROUTER =========="
    );

    const openrouter =
        await callOpenRouter(body);


    if (
        openrouter.ok &&
        openrouter.content
    ) {

        console.log(
            "✅ پاسخ از OPENROUTER"
        );

        return json({
            success: true,
            provider: "openrouter",
            content:
                openrouter.content
        });
    }


    // ==========================================
    // FAILED
    // ==========================================

    console.error(
        "❌ ALL CHAT PROVIDERS FAILED"
    );

    return json(
        {
            success: false,

            error:
                "تمام Providerهای چت شکست خوردند",

            results: {
                groq,
                openrouter
            },

            timestamp:
                new Date().toISOString()
        },

        502
    );
}


// =====================================================
// TEST
// =====================================================

async function handleTest(
    request: Request
) {

    if (
        request.method !== "POST"
    ) {

        return json(
            {
                success: false,
                error:
                    "روش درخواست باید POST باشد"
            },
            405
        );
    }


    const body = {

        messages: [

            {
                role: "system",

                content:
                    "تو یک دستیار فارسی هستی."
            },

            {
                role: "user",

                content:
                    "فقط بنویس: تست موفق بود"
            }

        ],

        temperature: 0.2,

        max_tokens: 100
    };


    const groq =
        await callGroq(body);

    const openrouter =
        await callOpenRouter(body);


    return json({

        success:
            groq.ok ||
            openrouter.ok,

        results: {
            groq,
            openrouter
        },

        timestamp:
            new Date().toISOString()
    });
}


// =====================================================
// HEALTH
// =====================================================

function handleHealth() {

    return json({

        success: true,

        status: "ok",

        service:
            "hendesyar-ai",

        models: {
            groq: GROQ_MODEL,
            openrouter: OPENROUTER_MODEL
        },

        providers: {
            groq:
                !!GROQ_API_KEY,

            openrouter:
                !!OPENROUTER_API_KEY
        },

        timestamp:
            new Date().toISOString()
    });
}


// =====================================================
// SERVER
// =====================================================

async function handleRequest(
    request: Request
) {

    // CORS
    if (
        request.method === "OPTIONS"
    ) {

        return new Response(
            null,
            {
                status: 204,
                headers:
                    corsHeaders
            }
        );
    }


    const url =
        new URL(request.url);


    try {

        // -------------------------------
        // HEALTH
        // -------------------------------

        if (
            url.pathname === "/health"
        ) {

            return handleHealth();
        }


        // -------------------------------
        // TEST
        // -------------------------------

        if (
            url.pathname === "/api/test"
        ) {

            return handleTest(
                request
            );
        }


        // -------------------------------
        // CHAT
        // -------------------------------

        if (
            url.pathname === "/api/chat"
        ) {

            if (
                request.method !== "POST"
            ) {

                return json(
                    {
                        success: false,
                        error:
                            "روش درخواست باید POST باشد"
                    },
                    405
                );
            }

            return handleChat(
                request
            );
        }


        // -------------------------------
        // 404
        // -------------------------------

        return json(
            {
                success: false,
                error:
                    "مسیر نامعتبر"
            },
            404
        );

    } catch (error) {

        console.error(
            "SERVER ERROR:",
            error
        );

        return json(
            {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : String(error)
            },
            500
        );
    }
}


Deno.serve(
    handleRequest
);
