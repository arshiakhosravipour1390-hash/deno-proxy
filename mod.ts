const GROQ_API_KEY = "gsk_FS8EBS8GtrTDAXZTuKmdjWGdyb3FYrycic7pDrT6h3rDWdyWCDf81";
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

async function safeJson(response: Response) {
    const text = await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch {
        return {
            raw: text
        };
    }
}

/* =========================
   GROQ
========================= */

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
                    model: "llama-3.3-70b-versatile",
                    messages: body.messages,
                    temperature: body.temperature ?? 0.25,
                    max_tokens: body.max_tokens ?? 1800
                })
            }
        );

        const data = await safeJson(response);

        return {
            ok: response.ok,
            status: response.status,
            data
        };

    } catch (error) {
        return {
            ok: false,
            status: 0,
            data: {
                error: error instanceof Error
                    ? error.message
                    : String(error)
            }
        };
    }
}

/* =========================
   OPENROUTER
========================= */

async function callOpenRouter(body: any) {
    try {
        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://hendesyar.ir",
                    "X-Title": "Hendesyar"
                },
                body: JSON.stringify({
                    model: "meta-llama/llama-3.3-70b-instruct:free",
                    messages: body.messages,
                    temperature: body.temperature ?? 0.25,
                    max_tokens: body.max_tokens ?? 1800
                })
            }
        );

        const data = await safeJson(response);

        return {
            ok: response.ok,
            status: response.status,
            data
        };

    } catch (error) {
        return {
            ok: false,
            status: 0,
            data: {
                error: error instanceof Error
                    ? error.message
                    : String(error)
            }
        };
    }
}

/* =========================
   GEMINI
========================= */

async function callGemini(body: any) {
    try {
        const url =
            "https://generativelanguage.googleapis.com/v1beta/models/" +
            "gemini-2.0-flash:generateContent?key=" +
            encodeURIComponent(GEMINI_API_KEY);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await safeJson(response);

        return {
            ok: response.ok,
            status: response.status,
            data
        };

    } catch (error) {
        return {
            ok: false,
            status: 0,
            data: {
                error: error instanceof Error
                    ? error.message
                    : String(error)
            }
        };
    }
}

/* =========================
   MAIN HANDLER
========================= */

async function handleRequest(request: Request): Promise<Response> {

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
                success: true,
                status: "ok",
                service: "hendesyar-ai",
                providers: {
                    groq: Boolean(GROQ_API_KEY),
                    openrouter: Boolean(OPENROUTER_API_KEY),
                    gemini: Boolean(GEMINI_API_KEY)
                },
                timestamp: new Date().toISOString()
            });
        }

        /* =========================
           CHAT
        ========================= */

        if (url.pathname === "/api/chat") {

            if (request.method !== "POST") {
                return json({
                    success: false,
                    error: "روش درخواست باید POST باشد"
                }, 405);
            }

            let body: any;

            try {
                body = await request.json();
            } catch {
                return json({
                    success: false,
                    error: "JSON نامعتبر است"
                }, 400);
            }

            if (
                !body ||
                !Array.isArray(body.messages) ||
                body.messages.length === 0
            ) {
                return json({
                    success: false,
                    error: "messages ارسال نشده یا نامعتبر است"
                }, 400);
            }

            /*
             * اول Groq
             */

            const groq = await callGroq(body);

            if (
                groq.ok &&
                groq.data?.choices?.[0]?.message?.content
            ) {
                return json({
                    success: true,
                    provider: "groq",
                    content: groq.data.choices[0].message.content
                });
            }

            /*
             * اگر Groq شکست خورد → OpenRouter
             */

            const openrouter = await callOpenRouter(body);

            if (
                openrouter.ok &&
                openrouter.data?.choices?.[0]?.message?.content
            ) {
                return json({
                    success: true,
                    provider: "openrouter",
                    content:
                        openrouter.data.choices[0].message.content
                });
            }

            /*
             * هیچ Providerای جواب نداده
             */

            return json({
                success: false,
                provider: "none",

                error: {
                    message: "تمام سرویس‌های متنی شکست خوردند",

                    groq: {
                        status: groq.status,
                        error: groq.data?.error || groq.data
                    },

                    openrouter: {
                        status: openrouter.status,
                        error:
                            openrouter.data?.error ||
                            openrouter.data
                    }
                }
            }, 502);
        }

        /* =========================
           VISION
        ========================= */

        if (url.pathname === "/api/vision") {

            if (request.method !== "POST") {
                return json({
                    success: false,
                    error: "روش درخواست باید POST باشد"
                }, 405);
            }

            let body: any;

            try {
                body = await request.json();
            } catch {
                return json({
                    success: false,
                    error: "JSON نامعتبر است"
                }, 400);
            }

            const mimeType =
                body.mimeType || "image/jpeg";

            const imageData =
                body.imageData;

            const question =
                body.question || "";

            if (!imageData) {
                return json({
                    success: false,
                    error: "تصویر دریافت نشد"
                }, 400);
            }

            const prompt = `
تو دستیار هوشمند «هندسیار» هستی؛
یک معلم ریاضی فارسی‌زبان برای دانش‌آموزان پایه هشتم و نهم.

تمرکز اصلی:

- هندسه
- مثلث‌ها
- هم‌نهشتی
- تشابه
- زاویه‌ها
- قضایای هندسی
- حل مرحله‌به‌مرحله مسائل

این تصویر یک سؤال یا شکل هندسی است.

${question
    ? `توضیح دانش‌آموز:
${question}`
    : ""
}

دستورها:

1. ابتدا متن سؤال و اطلاعات شکل را با دقت بخوان.
2. نقاط، ضلع‌ها، زاویه‌ها و علامت‌های شکل را بررسی کن.
3. اگر اطلاعات کافی نیست، حدس نزن.
4. راه‌حل را مرحله‌به‌مرحله توضیح بده.
5. فرمول‌های ریاضی را با LaTeX بنویس.
6. پاسخ را فارسی و مناسب پایه هشتم و نهم بنویس.
7. در پایان یک سؤال کوتاه برای مشارکت دانش‌آموز مطرح کن.
`;

            const gemini = await callGemini({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: imageData
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

            if (
                gemini.ok &&
                gemini.data?.candidates?.[0]?.content?.parts?.[0]?.text
            ) {
                return json({
                    success: true,
                    provider: "gemini",
                    content:
                        gemini.data.candidates[0]
                            .content.parts[0].text
                });
            }

            return json({
                success: false,
                provider: "gemini",

                error: {
                    status: gemini.status,
                    details:
                        gemini.data?.error ||
                        gemini.data
                }
            }, 502);
        }

        /* =========================
           404
        ========================= */

        return json({
            success: false,
            error: "مسیر نامعتبر",
            path: url.pathname
        }, 404);

    } catch (error) {

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
