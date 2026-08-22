
// ============================================================
// HENDESYAR AI PROXY - DENO
// ============================================================

// ============================================================
// API KEYS
// ============================================================

const GROQ_API_KEY =
    "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";

const OPENROUTER_API_KEY =
    "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";

const GEMINI_API_KEY =
    "AQ.Ab8RN6JjegnWSWIblMqyIilM0FkfQdlqcIJDfwfPBK0_eXTnAw";


// ============================================================
// MODELS
// ============================================================

const GEMINI_MODEL =
    "gemini-3.7-flash";

const GROQ_MODEL =
    "openai/gpt-oss-20b";

const OPENROUTER_MODEL =
    "openrouter/free";


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

function json(
    data: unknown,
    status = 200
) {
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
// SAFE JSON PARSE
// ============================================================

async function readResponse(response: Response) {

    const text =
        await response.text();

    try {
        return JSON.parse(text);
    } catch {
        return {
            raw: text
        };
    }
}


// ============================================================
// GROQ - TEXT
// ============================================================

async function callGroq(body: any) {

    try {

        const response =
            await fetch(
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
                        model:
                            GROQ_MODEL,

                        messages:
                            body.messages,

                        max_completion_tokens:
                            body.max_tokens ?? 800
                    })
                }
            );

        const data =
            await readResponse(response);

        console.log(
            "[GROQ]",
            response.status,
            JSON.stringify(data)
        );

        const content =
            data?.choices?.[0]
                ?.message
                ?.content ?? null;

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
            "[GROQ ERROR]",
            error
        );

        return {
            ok: false,
            status: 500,
            content: null,
            error:
                error instanceof Error
                    ? error.message
                    : String(error)
        };
    }
}


// ============================================================
// OPENROUTER - TEXT
// ============================================================

async function callOpenRouter(body: any) {

    try {

        const response =
            await fetch(
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

                        max_tokens:
                            body.max_tokens ?? 800
                    })
                }
            );

        const data =
            await readResponse(response);

        console.log(
            "[OPENROUTER]",
            response.status,
            JSON.stringify(data)
        );

        const content =
            data?.choices?.[0]
                ?.message
                ?.content ?? null;

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
            "[OPENROUTER ERROR]",
            error
        );

        return {
            ok: false,
            status: 500,
            content: null,
            error:
                error instanceof Error
                    ? error.message
                    : String(error)
        };
    }
}


// ============================================================
// GEMINI - TEXT
// ============================================================

async function callGemini(body: any) {

    try {

        const contents =
            convertMessagesToGemini(
                body.messages
            );

        const response =
            await fetch(
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

                        contents,

                        generationConfig: {

                            maxOutputTokens:
                                body.max_tokens ?? 800,

                            thinkingConfig: {
                                thinkingLevel:
                                    "low"
                            }
                        }
                    })
                }
            );

        const data =
            await readResponse(response);

        console.log(
            "[GEMINI]",
            response.status,
            JSON.stringify(data)
        );

        const content =
            extractGeminiText(data);

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
            "[GEMINI ERROR]",
            error
        );

        return {
            ok: false,
            status: 500,
            content: null,
            error:
                error instanceof Error
                    ? error.message
                    : String(error)
        };
    }
}


// ============================================================
// GEMINI MESSAGE CONVERTER
// ============================================================

function convertMessagesToGemini(
    messages: any[]
) {

    return messages
        .filter(
            (message: any) =>
                message &&
                message.content
        )
        .map(
            (message: any) => {

                let role =
                    "user";

                if (
                    message.role ===
                    "assistant"
                ) {
                    role =
                        "model";
                }

                return {
                    role,

                    parts: [
                        {
                            text:
                                String(
                                    message.content
                                )
                        }
                    ]
                };
            }
        );
}


// ============================================================
// GEMINI TEXT EXTRACTOR
// ============================================================

function extractGeminiText(
    data: any
) {

    return (
        data?.candidates?.[0]
            ?.content
            ?.parts
            ?.map(
                (part: any) =>
                    part?.text || ""
            )
            .join("")
            .trim() || null
    );
}


// ============================================================
// GEMINI VISION
// ============================================================

async function callGeminiVision(
    body: any
) {

    try {

        if (!body.imageData) {

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


        const mimeType =
            body.mimeType ||
            "image/jpeg";


        let base64Data =
            String(body.imageData);


        // ----------------------------------------------------
        // حذف data:image/jpeg;base64,
        // ----------------------------------------------------

        if (
            base64Data.startsWith(
                "data:"
            )
        ) {

            const comma =
                base64Data.indexOf(",");

            if (comma !== -1) {

                base64Data =
                    base64Data.substring(
                        comma + 1
                    );
            }
        }


        // ----------------------------------------------------
        // حذف فاصله / newline
        // ----------------------------------------------------

        base64Data =
            base64Data
                .replace(/\s/g, "");


        const question =
            body.question ||
            "این تصویر را دقیقاً توضیح بده.";


        // ----------------------------------------------------
        // Gemini Vision Request
        // ----------------------------------------------------

        const payload = {

            contents: [

                {
                    role: "user",

                    parts: [

                        {
                            inlineData: {
                                mimeType,
                                data:
                                    base64Data
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

                maxOutputTokens:
                    body.max_tokens ??
                    1200,

                thinkingConfig: {
                    thinkingLevel:
                        body.mode ===
                        "deep"
                            ? "medium"
                            : "low"
                }
            }
        };


        const response =
            await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "x-goog-api-key":
                            GEMINI_API_KEY
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        const data =
            await readResponse(response);


        console.log(
            "[GEMINI VISION]",
            response.status,
            JSON.stringify(data)
        );


        const content =
            extractGeminiText(data);


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
            "[GEMINI VISION ERROR]",
            error
        );

        return {

            ok: false,

            status: 500,

            content: null,

            error:
                error instanceof Error
                    ? error.message
                    : String(error)
        };
    }
}


// ============================================================
// CHAT
// ============================================================

async function handleChat(
    request: Request
) {

    let body;

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


    const results: any = {};


    // ========================================================
    // 1. GROQ
    // ========================================================

    console.log(
        "========== GROQ =========="
    );

    results.groq =
        await callGroq(body);


    if (
        results.groq.ok &&
        results.groq.content
    ) {

        return json({
            success: true,
            provider: "groq",
            content:
                results.groq.content
        });
    }


    // ========================================================
    // 2. OPENROUTER
    // ========================================================

    console.log(
        "========== OPENROUTER =========="
    );

    results.openrouter =
        await callOpenRouter(body);


    if (
        results.openrouter.ok &&
        results.openrouter.content
    ) {

        return json({
            success: true,
            provider:
                "openrouter",
            content:
                results.openrouter.content
        });
    }


    // ========================================================
    // 3. GEMINI
    // ========================================================

    console.log(
        "========== GEMINI =========="
    );

    results.gemini =
        await callGemini(body);


    if (
        results.gemini.ok &&
        results.gemini.content
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

            message:
                "تمام Providerها شکست خوردند",

            results,

            timestamp:
                new Date().toISOString()
        },

        502
    );
}


// ============================================================
// VISION
// ============================================================

async function handleVision(
    request: Request
) {

    let body;

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
        !body.imageData
    ) {

        return json(
            {
                success: false,
                error:
                    "imageData ارسال نشده است"
            },
            400
        );
    }


    const result =
        await callGeminiVision(
            body
        );


    return json(
        {
            success:
                result.ok,

            provider:
                "gemini",

            content:
                result.content,

            error:
                result.error,

            status:
                result.status
        },

        result.ok
            ? 200
            : result.status
    );
}


// ============================================================
// TEST
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

        max_tokens: 100
    };


    console.log(
        "===================================="
    );

    console.log(
        "HENDESYAR PROVIDER TEST"
    );

    console.log(
        "===================================="
    );


    const results: any = {};


    // Test Groq
    results.groq =
        await callGroq(body);


    // Test OpenRouter
    results.openrouter =
        await callOpenRouter(body);


    // Test Gemini
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

        models: {

            groq:
                GROQ_MODEL,

            openrouter:
                OPENROUTER_MODEL,

            gemini:
                GEMINI_MODEL
        },

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
// SERVER
// ============================================================

async function handleRequest(
    request: Request
) {

    // ========================================================
    // CORS
    // ========================================================

    if (
        request.method ===
        "OPTIONS"
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
        new URL(
            request.url
        );


    try {

        // ====================================================
        // HEALTH
        // ====================================================

        if (
            url.pathname ===
            "/health"
        ) {

            return handleHealth();
        }


        // ====================================================
        // TEST
        // ====================================================

        if (
            url.pathname ===
            "/api/test"
        ) {

            return handleTest(
                request
            );
        }


        // ====================================================
        // CHAT
        // ====================================================

        if (
            url.pathname ===
            "/api/chat"
        ) {

            if (
                request.method !==
                "POST"
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


        // ====================================================
        // VISION
        // ====================================================

        if (
            url.pathname ===
            "/api/vision"
        ) {

            if (
                request.method !==
                "POST"
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


        // ====================================================
        // 404
        // ====================================================

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
            "[SERVER ERROR]",
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
// START
// ============================================================

Deno.serve(
    handleRequest
);
