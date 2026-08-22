const GROQ_API_KEY = "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";
const OPENROUTER_API_KEY = "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";
const GEMINI_API_KEY = "AQ.Ab8RN6K-U5qy3SZcXIa1UrL2yabRuy1uYD5n8cbozrYMWvq3Yw";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8"
        }
    });
}


// ======================================
// GROQ
// ======================================

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
                    model: "llama-3.1-8b-instant",
                    messages: body.messages,
                    temperature: body.temperature ?? 0.3,
                    max_tokens: body.max_tokens ?? 800
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

        return {
            ok: response.ok,
            status: response.status,
            content:
                data?.choices?.[0]?.message?.content ?? null,
            error:
                response.ok ? null : data
        };

    } catch (error) {

        console.error("[GROQ]", error);

        return {
            ok: false,
            status: 500,
            content: null,
            error: String(error)
        };
    }
}


// ======================================
// OPENROUTER
// ======================================

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
                    // مدل پولی قبلی را استفاده نمی‌کنیم
                    model: "openrouter/free",

                    messages: body.messages,

                    temperature:
                        body.temperature ?? 0.3,

                    max_tokens:
                        body.max_tokens ?? 800
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

        return {
            ok: response.ok,
            status: response.status,

            content:
                data?.choices?.[0]?.message?.content ?? null,

            error:
                response.ok ? null : data
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


// ======================================
// GEMINI
// ======================================

async function callGemini(body: any) {

    try {

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
            encodeURIComponent(GEMINI_API_KEY),

            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    contents: [
                        {
                            role: "user",

                            parts: [
                                {
                                    text:
                                        convertToGemini(
                                            body.messages
                                        )
                                }
                            ]
                        }
                    ],

                    generationConfig: {
                        temperature:
                            body.temperature ?? 0.3,

                        maxOutputTokens:
                            body.max_tokens ?? 800
                    }
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
            `[GEMINI] ${response.status}`,
            JSON.stringify(data)
        );

        const content =
            data?.candidates?.[0]
                ?.content
                ?.parts
                ?.map((x: any) => x.text || "")
                .join("") || null;

        return {
            ok:
                response.ok &&
                !!content,

            status:
                response.status,

            content,

            error:
                response.ok && content
                    ? null
                    : data
        };

    } catch (error) {

        console.error(
            "[GEMINI]",
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


// ======================================
// تبدیل پیام‌ها برای Gemini
// ======================================

function convertToGemini(messages: any[]) {

    return messages
        .map((message: any) => {

            let role;

            if (message.role === "system") {
                role = "دستور سیستم";
            }

            else if (
                message.role === "assistant"
            ) {
                role = "دستیار";
            }

            else {
                role = "دانش‌آموز";
            }

            return (
                role +
                ":\n" +
                message.content
            );
        })
        .join("\n\n");
}


// ======================================
// CHAT
// ======================================

async function handleChat(request: Request) {

    let body;

    try {

        body = await request.json();

    } catch {

        return json(
            {
                success: false,
                message: "JSON نامعتبر است"
            },
            400
        );
    }

    if (!Array.isArray(body.messages)) {

        return json(
            {
                success: false,
                message:
                    "messages ارسال نشده است"
            },
            400
        );
    }

    const results: any = {};


    // ------------------------------
    // GROQ
    // ------------------------------

    console.log("========== GROQ ==========");

    results.groq =
        await callGroq(body);

    if (
        results.groq.ok &&
        results.groq.content
    ) {

        console.log(
            "✅ پاسخ از GROQ"
        );

        return json({
            success: true,
            provider: "groq",
            content:
                results.groq.content
        });
    }


    // ------------------------------
    // OPENROUTER
    // ------------------------------

    console.log(
        "========== OPENROUTER =========="
    );

    results.openrouter =
        await callOpenRouter(body);

    if (
        results.openrouter.ok &&
        results.openrouter.content
    ) {

        console.log(
            "✅ پاسخ از OPENROUTER"
        );

        return json({
            success: true,
            provider: "openrouter",
            content:
                results.openrouter.content
        });
    }


    // ------------------------------
    // GEMINI
    // ------------------------------

    console.log(
        "========== GEMINI =========="
    );

    results.gemini =
        await callGemini(body);

    if (
        results.gemini.ok &&
        results.gemini.content
    ) {

        console.log(
            "✅ پاسخ از GEMINI"
        );

        return json({
            success: true,
            provider: "gemini",
            content:
                results.gemini.content
        });
    }


    // ------------------------------
    // همه شکست خوردند
    // ------------------------------

    console.error(
        "❌ ALL PROVIDERS FAILED"
    );

    return json(
        {
            success: false,

            message:
                "تمام Providerها شکست خوردند",

            results,

            timestamp:
                new Date().toISOString()
        },

        502
    );
}


// ======================================
// TEST
// ======================================

async function handleTest(request: Request) {

    if (request.method !== "POST") {

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


    const results: any = {};


    console.log(
        "================================"
    );

    console.log(
        "🧪 PROVIDER TEST"
    );

    console.log(
        "================================"
    );


    results.groq =
        await callGroq(body);


    results.openrouter =
        await callOpenRouter(body);


    results.gemini =
        await callGemini(body);


    return json({

        success:
            results.groq.ok ||
            results.openrouter.ok ||
            results.gemini.ok,

        results,

        timestamp:
            new Date().toISOString()
    });
}


// ======================================
// SERVER
// ======================================

async function handleRequest(
    request: Request
) {

    // CORS

    if (
        request.method === "OPTIONS"
    ) {

        return new Response(null, {

            status: 204,

            headers:
                corsHeaders
        });
    }


    const url =
        new URL(request.url);


    try {


        // --------------------------
        // HEALTH
        // --------------------------

        if (
            url.pathname === "/health"
        ) {

            return json({

                success: true,

                status: "ok",

                service:
                    "hendesyar-ai",

                providers: {

                    groq:
                        !!GROQ_API_KEY,

                    openrouter:
                        !!OPENROUTER_API_KEY,

                    gemini:
                        !!GEMINI_API_KEY
                },

                timestamp:
                    new Date().toISOString()
            });
        }


        // --------------------------
        // TEST
        // --------------------------

        if (
            url.pathname === "/api/test"
        ) {

            return handleTest(
                request
            );
        }


        // --------------------------
        // CHAT
        // --------------------------

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


        // --------------------------
        // 404
        // --------------------------

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


Deno.serve(handleRequest);
