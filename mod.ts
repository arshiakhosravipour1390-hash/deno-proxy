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

async function readResponse(response: Response) {
    const raw = await response.text();

    if (!raw) {
        return {
            raw: "",
            data: null
        };
    }

    try {
        return {
            raw,
            data: JSON.parse(raw)
        };
    } catch {
        return {
            raw,
            data: {
                raw
            }
        };
    }
}

async function callGroq(body: any) {

    try {

        const payload = {
            model: "llama-3.3-70b-versatile",
            messages: Array.isArray(body.messages)
                ? body.messages
                : [],
            temperature:
                typeof body.temperature === "number"
                    ? body.temperature
                    : 0.25,
            max_tokens:
                typeof body.max_tokens === "number"
                    ? body.max_tokens
                    : 1800
        };

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify(payload)
            }
        );

        const result = await readResponse(response);

        return {
            ok: response.ok,
            status: response.status,
            data: result.data,
            raw: result.raw
        };

    } catch (error) {

        return {
            ok: false,
            status: 0,
            data: {
                error:
                    error instanceof Error
                        ? error.message
                        : String(error)
            },
            raw: ""
        };
    }
}

async function callOpenRouter(body: any) {

    try {

        const payload = {
            model: "meta-llama/llama-3.3-70b-instruct:free",

            messages: Array.isArray(body.messages)
                ? body.messages
                : [],

            temperature:
                typeof body.temperature === "number"
                    ? body.temperature
                    : 0.25,

            max_tokens:
                typeof body.max_tokens === "number"
                    ? body.max_tokens
                    : 1800
        };

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "HTTP-Referer": "https://hendesyar.ir",
                    "X-Title": "Hendesyar"
                },

                body: JSON.stringify(payload)
            }
        );

        const result = await readResponse(response);

        return {
            ok: response.ok,
            status: response.status,
            data: result.data,
            raw: result.raw
        };

    } catch (error) {

        return {
            ok: false,
            status: 0,
            data: {
                error:
                    error instanceof Error
                        ? error.message
                        : String(error)
            },
            raw: ""
        };
    }
}

async function callGemini(body: any) {

    try {

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
            encodeURIComponent(GEMINI_API_KEY),

            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify(body)
            }
        );

        const result = await readResponse(response);

        return {
            ok: response.ok,
            status: response.status,
            data: result.data,
            raw: result.raw
        };

    } catch (error) {

        return {
            ok: false,
            status: 0,
            data: {
                error:
                    error instanceof Error
                        ? error.message
                        : String(error)
            },
            raw: ""
        };
    }
}

function extractOpenAIContent(data: any) {

    return data?.choices?.[0]?.message?.content || null;
}

function extractGeminiContent(data: any) {

    const parts =
        data?.candidates?.[0]?.content?.parts;

    if (!Array.isArray(parts)) {
        return null;
    }

    return parts
        .map((part: any) => part?.text || "")
        .filter(Boolean)
        .join("\n")
        .trim() || null;
}

async function handleRequest(request: Request) {

    if (request.method === "OPTIONS") {

        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    const url = new URL(request.url);

    try {

        /* =========================
           HEALTH
        ========================= */

        if (url.pathname === "/health") {

            return json({
                status: "ok",
                service: "hendesyar-ai",

                providers: {
                    groq: !!GROQ_API_KEY,
                    openrouter: !!OPENROUTER_API_KEY,
                    gemini: !!GEMINI_API_KEY
                },

                timestamp: new Date().toISOString()
            });
        }

        /* =========================
           CHAT
        ========================= */

        if (
            url.pathname === "/api/chat" &&
            request.method === "POST"
        ) {

            let body: any;

            try {

                body = await request.json();

            } catch {

                return json({
                    success: false,
                    error: "بدنه درخواست JSON معتبر نیست."
                }, 400);
            }

            if (
                !body ||
                !Array.isArray(body.messages)
            ) {

                return json({
                    success: false,
                    error: "messages باید یک آرایه باشد."
                }, 400);
            }

            if (body.messages.length === 0) {

                return json({
                    success: false,
                    error: "حداقل یک پیام لازم است."
                }, 400);
            }

            /*
             * اول Groq
             */

            const groq = await callGroq(body);

            const groqContent =
                extractOpenAIContent(groq.data);

            if (
                groq.ok &&
                groqContent
            ) {

                return json({
                    success: true,
                    provider: "groq",
                    content: groqContent
                });
            }

            /*
             * اگر Groq شکست خورد:
             * OpenRouter
             */

            const openrouter =
                await callOpenRouter(body);

            const openrouterContent =
                extractOpenAIContent(
                    openrouter.data
                );

            if (
                openrouter.ok &&
                openrouterContent
            ) {

                return json({
                    success: true,
                    provider: "openrouter",
                    content: openrouterContent
                });
            }

            /*
             * هیچ Provider موفق نشد
             */

            console.error(
                "GROQ FAILED",
                JSON.stringify({
                    status: groq.status,
                    data: groq.data
                })
            );

            console.error(
                "OPENROUTER FAILED",
                JSON.stringify({
                    status: openrouter.status,
                    data: openrouter.data
                })
            );

            return json({
                success: false,

                provider: "none",

                error: {
                    message:
                        "تمام سرویس‌های متنی ناموفق بودند.",

                    groq: {
                        status: groq.status,
                        error: groq.data
                    },

                    openrouter: {
                        status: openrouter.status,
                        error: openrouter.data
                    }
                }

            }, 502);
        }

        /* =========================
           VISION
        ========================= */

        if (
            url.pathname === "/api/vision" &&
            request.method === "POST"
        ) {

            let body: any;

            try {

                body = await request.json();

            } catch {

                return json({
                    success: false,
                    error: "بدنه درخواست JSON معتبر نیست."
                }, 400);
            }

            const mimeType =
                body?.mimeType ||
                "image/jpeg";

            const imageData =
                body?.imageData;

            const question =
                body?.question || "";

            const mode =
                body?.mode || "normal";

            if (!imageData) {

                return json({
                    success: false,
                    error: "تصویر دریافت نشد."
                }, 400);
            }

            let modeInstruction = "";

            if (mode === "solve") {

                modeInstruction = `
حالت حل مسئله فعال است.
مسئله را کامل و مرحله‌به‌مرحله حل کن.
داده‌ها، خواسته و راه‌حل را جدا کن.
`;
            }

            if (mode === "hint") {

                modeInstruction = `
حالت راهنمایی فعال است.
جواب نهایی را مستقیماً نگو.
فقط راهنمایی مرحله‌ای بده تا دانش‌آموز خودش حل کند.
`;
            }

            if (mode === "check") {

                modeInstruction = `
حالت بررسی جواب فعال است.
جواب دانش‌آموز را بررسی کن.
اگر اشتباه است دقیقاً مرحله اشتباه را مشخص کن.
`;
            }

            const prompt = `
تو دستیار هوشمند «هندسیار» هستی؛
یک معلم ریاضی فارسی‌زبان برای دانش‌آموزان
پایه هشتم و نهم.

تمرکز اصلی:

- هندسه
- مثلث‌ها
- هم‌نهشتی
- تشابه
- زاویه‌ها
- قضایای هندسی
- حل مسائل هندسی

این تصویر یک سؤال یا شکل هندسی است.

${question
    ? `توضیح دانش‌آموز:
${question}`
    : ""}

${modeInstruction}

دستورها:

1. ابتدا متن سؤال را با دقت بخوان.
2. اگر شکل دارد، نقاط و ضلع‌ها و زاویه‌ها را بررسی کن.
3. علامت‌های مساوی و داده‌های روی شکل را بررسی کن.
4. اگر اطلاعات کافی نیست، حدس نزن.
5. راه‌حل را مرحله‌به‌مرحله توضیح بده.
6. فرمول‌ها را با LaTeX بنویس.
7. فارسی روان و مناسب پایه هشتم و نهم استفاده کن.
8. در پایان یک سؤال کوتاه برای مشارکت دانش‌آموز مطرح کن.

اگر متن سؤال داخل تصویر ناخوانا است،
صادقانه اعلام کن.
`;

            const gemini =
                await callGemini({

                    contents: [
                        {
                            role: "user",

                            parts: [
                                {
                                    text: prompt
                                },

                                {
                                    inline_data: {
                                        mime_type:
                                            mimeType,
                                        data:
                                            imageData
                                    }
                                }
                            ]
                        }
                    ],

                    generationConfig: {
                        temperature: 0.25,
                        maxOutputTokens: 1800
                    }
                });

            const geminiContent =
                extractGeminiContent(
                    gemini.data
                );

            if (
                gemini.ok &&
                geminiContent
            ) {

                return json({
                    success: true,
                    provider: "gemini",
                    content: geminiContent
                });
            }

            console.error(
                "GEMINI FAILED",
                JSON.stringify({
                    status: gemini.status,
                    data: gemini.data
                })
            );

            return json({

                success: false,

                provider: "gemini",

                error: {
                    status: gemini.status,
                    data: gemini.data
                }

            }, 502);
        }

        /* =========================
           NOT FOUND
        ========================= */

        return json({
            success: false,
            error: "مسیر نامعتبر است."
        }, 404);

    } catch (error) {

        console.error(
            "SERVER ERROR:",
            error
        );

        return json({

            success: false,

            error:
                error instanceof Error
                    ? error.message
                    : String(error)

        }, 500);
    }
}

Deno.serve(handleRequest);
