const GROQ_API_KEY = "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";
const OPENROUTER_API_KEY = "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";
const GEMINI_API_KEY = "AQ.Ab8RN6LpTM4RAbIbD8y1zfo6ottT2lXVlz57Yd7xRtV40Q2Yfg";
// ============================================================
// MODELS
// ============================================================

const GROQ_MODEL = "openai/gpt-oss-20b";

// مدل رایگان OpenRouter
const OPENROUTER_MODEL = "openrouter/free";

// Gemini
const GEMINI_MODEL = "gemini-2.0-flash";


// ============================================================
// CORS
// ============================================================

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
        "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
};


// ============================================================
// JSON RESPONSE
// ============================================================

function json(data: unknown, status = 200) {

    return new Response(
        JSON.stringify(data),
        {
            status,

            headers: {
                ...corsHeaders,
                "Content-Type":
                    "application/json; charset=utf-8"
            }
        }
    );
}


// ============================================================
// READ JSON
// ============================================================

async function readJSON(request: Request) {

    try {

        return await request.json();

    } catch {

        return null;

    }

}


// ============================================================
// GROQ
// ============================================================

async function callGroq(body: any) {

    try {

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Authorization":
                        `Bearer ${GROQ_API_KEY}`,

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    model: GROQ_MODEL,

                    messages:
                        body.messages,

                    temperature:
                        body.temperature ?? 0.3,

                    max_tokens:
                        body.max_tokens ?? 800

                })
            }
        );


        const text =
            await response.text();


        let data;

        try {

            data = JSON.parse(text);

        } catch {

            data = {
                raw: text
            };

        }


        console.log(
            "[GROQ]",
            response.status,
            JSON.stringify(data)
        );


        const content =
            data?.choices?.[0]
                ?.message?.content ?? null;


        return {

            ok:
                response.ok &&
                !!content,

            status:
                response.status,

            content,

            error:
                response.ok
                    ? null
                    : data

        };


    } catch (error) {

        console.error(
            "[GROQ ERROR]",
            error
        );


        return {

            ok: false,

            status: 500,

            content: null,

            error:
                String(error)

        };

    }

}


// ============================================================
// OPENROUTER
// ============================================================

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

                    model:
                        OPENROUTER_MODEL,

                    messages:
                        body.messages,

                    temperature:
                        body.temperature ?? 0.3,

                    max_tokens:
                        body.max_tokens ?? 800

                })
            }
        );


        const text =
            await response.text();


        let data;

        try {

            data = JSON.parse(text);

        } catch {

            data = {
                raw: text
            };

        }


        console.log(
            "[OPENROUTER]",
            response.status,
            JSON.stringify(data)
        );


        const content =
            data?.choices?.[0]
                ?.message?.content ?? null;


        return {

            ok:
                response.ok &&
                !!content,

            status:
                response.status,

            content,

            error:
                response.ok &&
                content
                    ? null
                    : data

        };


    } catch (error) {

        console.error(
            "[OPENROUTER ERROR]",
            error
        );


        return {

            ok: false,

            status: 500,

            content: null,

            error:
                String(error)

        };

    }

}


// ============================================================
// تبدیل پیام‌ها به متن برای Gemini
// ============================================================

function convertToGemini(
    messages: any[]
) {

    if (!Array.isArray(messages)) {

        return "";

    }


    return messages
        .map((message: any) => {

            let role = "دانش‌آموز";


            if (
                message.role === "system"
            ) {

                role = "دستور سیستم";

            }

            else if (
                message.role === "assistant"
            ) {

                role = "دستیار";

            }


            return (
                role +
                ":\n" +
                String(
                    message.content ?? ""
                )
            );

        })
        .join("\n\n");

}


// ============================================================
// GEMINI TEXT
// ============================================================

async function callGemini(
    body: any
) {

    try {

        const prompt =
            convertToGemini(
                body.messages
            );


        const response = await fetch(

            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    // روش رسمی API key
                    "x-goog-api-key":
                        GEMINI_API_KEY

                },


                body: JSON.stringify({

                    contents: [

                        {

                            role: "user",

                            parts: [

                                {
                                    text: prompt
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


        const text =
            await response.text();


        let data;

        try {

            data =
                JSON.parse(text);

        } catch {

            data = {
                raw: text
            };

        }


        console.log(
            "[GEMINI]",
            response.status,
            JSON.stringify(data)
        );


        const content =
            data?.candidates?.[0]
                ?.content?.parts
                ?.map(
                    (part: any) =>
                        part.text || ""
                )
                .join("") || null;


        return {

            ok:
                response.ok &&
                !!content,

            status:
                response.status,

            content,

            error:
                response.ok &&
                content
                    ? null
                    : data

        };


    } catch (error) {

        console.error(
            "[GEMINI ERROR]",
            error
        );


        return {

            ok: false,

            status: 500,

            content: null,

            error:
                String(error)

        };

    }

}


// ============================================================
// GEMINI VISION
// ============================================================

async function callGeminiVision(
    body: any
) {

    try {

        const imageData =
            body.imageData;

        const mimeType =
            body.mimeType ||
            "image/jpeg";

        const question =
            body.question ||
            "این تصویر را توضیح بده";


        // ----------------------------------------------------
        // اعتبارسنجی
        // ----------------------------------------------------

        if (
            typeof imageData !== "string" ||
            !imageData.trim()
        ) {

            return {

                ok: false,

                status: 400,

                content: null,

                error: {
                    message:
                        "imageData ارسال نشده است"
                }

            };

        }


        if (
            !mimeType.startsWith("image/")
        ) {

            return {

                ok: false,

                status: 400,

                content: null,

                error: {
                    message:
                        "mimeType باید از نوع image باشد"
                }

            };

        }


        // اگر data:image/...;base64,... ارسال شده
        // قسمت header را حذف می‌کنیم.

        const cleanBase64 =
            imageData
                .replace(
                    /^data:[^;]+;base64,/,
                    ""
                )
                .replace(
                    /\s/g,
                    ""
                );


        // ----------------------------------------------------
        // Gemini request
        // ----------------------------------------------------

        const response = await fetch(

            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "x-goog-api-key":
                        GEMINI_API_KEY

                },


                body: JSON.stringify({

                    contents: [

                        {

                            role: "user",

                            parts: [

                                {

                                    inline_data: {

                                        mime_type:
                                            mimeType,

                                        data:
                                            cleanBase64

                                    }

                                },

                                {

                                    text:
                                        question

                                }

                            ]

                        }

                    ],


                    generationConfig: {

                        temperature:
                            body.temperature ??
                            0.3,

                        maxOutputTokens:
                            body.max_tokens ??
                            1000

                    }

                })

            }

        );


        const text =
            await response.text();


        let data;

        try {

            data =
                JSON.parse(text);

        } catch {

            data = {
                raw: text
            };

        }


        console.log(
            "[GEMINI VISION]",
            response.status,
            JSON.stringify(data)
        );


        const content =
            data?.candidates?.[0]
                ?.content?.parts
                ?.map(
                    (part: any) =>
                        part.text || ""
                )
                .join("") || null;


        return {

            ok:
                response.ok &&
                !!content,

            status:
                response.status,

            content,

            error:
                response.ok &&
                content
                    ? null
                    : data

        };


    } catch (error) {

        console.error(
            "[GEMINI VISION ERROR]",
            error
        );


        return {

            ok: false,

            status: 500,

            content: null,

            error:
                String(error)

        };

    }

}


// ============================================================
// CHAT HANDLER
// ============================================================

async function handleChat(
    request: Request
) {

    const body =
        await readJSON(request);


    if (!body) {

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
                    "messages باید آرایه باشد"
            },

            400
        );

    }


    const results: any = {};


    // ========================================================
    // GROQ
    // ========================================================

    console.log(
        "========== GROQ =========="
    );


    results.groq =
        await callGroq(body);


    if (
        results.groq.ok
    ) {

        return json({

            success: true,

            provider: "groq",

            content:
                results.groq.content

        });

    }


    // ========================================================
    // OPENROUTER
    // ========================================================

    console.log(
        "========== OPENROUTER =========="
    );


    results.openrouter =
        await callOpenRouter(body);


    if (
        results.openrouter.ok
    ) {

        return json({

            success: true,

            provider: "openrouter",

            content:
                results.openrouter.content

        });

    }


    // ========================================================
    // GEMINI
    // ========================================================

    console.log(
        "========== GEMINI =========="
    );


    results.gemini =
        await callGemini(body);


    if (
        results.gemini.ok
    ) {

        return json({

            success: true,

            provider: "gemini",

            content:
                results.gemini.content

        });

    }


    // ========================================================
    // ALL FAILED
    // ========================================================

    return json(

        {

            success: false,

            error:
                "تمام Providerها شکست خوردند",

            results,

            timestamp:
                new Date().toISOString()

        },

        502

    );

}


// ============================================================
// VISION HANDLER
// ============================================================

async function handleVision(
    request: Request
) {

    const body =
        await readJSON(request);


    if (!body) {

        return json(

            {
                success: false,

                error:
                    "JSON نامعتبر است"
            },

            400

        );

    }


    const result =
        await callGeminiVision(
            body
        );


    if (
        result.ok
    ) {

        return json({

            success: true,

            provider: "gemini",

            content:
                result.content

        });

    }


    return json(

        {

            success: false,

            provider: "gemini",

            error:
                result.error,

            status:
                result.status

        },

        result.status >= 400
            ? result.status
            : 502

    );

}


// ============================================================
// PROVIDER TEST
// ============================================================

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


    const results: any = {};


    console.log(
        "================================"
    );

    console.log(
        "HENDESYAR PROVIDER TEST"
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


// ============================================================
// HEALTH
// ============================================================

function handleHealth() {

    return json({

        success: true,

        status:
            "ok",

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


// ============================================================
// MAIN ROUTER
// ============================================================

async function handleRequest(
    request: Request
) {

    // --------------------------------------------------------
    // CORS
    // --------------------------------------------------------

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

        // ----------------------------------------------------
        // HEALTH
        // ----------------------------------------------------

        if (
            url.pathname === "/health"
        ) {

            return handleHealth();

        }


        // ----------------------------------------------------
        // TEST
        // ----------------------------------------------------

        if (
            url.pathname === "/api/test"
        ) {

            return handleTest(
                request
            );

        }


        // ----------------------------------------------------
        // CHAT
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // VISION
        // ----------------------------------------------------

        if (
            url.pathname === "/api/vision"
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


            return handleVision(
                request
            );

        }


        // ----------------------------------------------------
        // 404
        // ----------------------------------------------------

        return json(

            {
                success: false,

                error:
                    "مسیر نامعتبر",

                path:
                    url.pathname

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


// ============================================================
// START SERVER
// ============================================================

Deno.serve(
    handleRequest
);
