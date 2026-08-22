const GROQ_API_KEY = "YOUR_GROQ_API_KEY";
const OPENROUTER_API_KEY = "YOUR_OPENROUTER_API_KEY";
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json; charset=utf-8"
        }
    });
}

function logProvider(
    provider: string,
    status: number,
    data: any,
    extra = ""
) {
    console.log(
        `[AI:${provider}] ${status} ${extra}`,
        JSON.stringify(data)
    );
}

async function safeJson(response: Response) {
    const text = await response.text();

    try {
        return JSON.parse(text);
    } catch {
        return {
            raw: text
        };
    }
}

async function callGroq(body: any) {
    console.log("[AI:GROQ] Request started");

    try {
        const payload = {
            ...body,
            model: "llama-3.3-70b-versatile"
        };

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );

        const data = await safeJson(response);

        logProvider(
            "GROQ",
            response.status,
            data,
            response.ok ? "SUCCESS" : "FAILED"
        );

        return {
            ok: response.ok,
            status: response.status,
            data
        };
    } catch (error) {
        console.error("[AI:GROQ] NETWORK ERROR:", error);

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

async function callOpenRouter(body: any) {
    console.log("[AI:OPENROUTER] Request started");

    try {
        const payload = {
            ...body,
            model: "meta-llama/llama-3.3-70b-instruct:free"
        };

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
                body: JSON.stringify(payload)
            }
        );

        const data = await safeJson(response);

        logProvider(
            "OPENROUTER",
            response.status,
            data,
            response.ok ? "SUCCESS" : "FAILED"
        );

        return {
            ok: response.ok,
            status: response.status,
            data
        };
    } catch (error) {
        console.error("[AI:OPENROUTER] NETWORK ERROR:", error);

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

async function callGemini(body: any) {
    console.log("[AI:GEMINI] Request started");

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
            encodeURIComponent(GEMINI_API_KEY),
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            }
        );

        const data = await safeJson(response);

        logProvider(
            "GEMINI",
            response.status,
            data,
            response.ok ? "SUCCESS" : "FAILED"
        );

        return {
            ok: response.ok,
            status: response.status,
            data
        };
    } catch (error) {
        console.error("[AI:GEMINI] NETWORK ERROR:", error);

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

function extractOpenAIContent(data: any) {
    return data?.choices?.[0]?.message?.content || null;
}

function extractGeminiContent(data: any) {
    return data?.candidates?.[0]?.content?.parts
        ?.map((p: any) => p.text || "")
        .join("") || null;
}

async function handleRequest(request: Request) {

    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    const url = new URL(request.url);

    console.log(
        `[REQUEST] ${request.method} ${url.pathname}`
    );

    try {

        // --------------------------------
        // HEALTH
        // --------------------------------

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

        // --------------------------------
        // PROVIDER TEST
        // --------------------------------

        if (url.pathname === "/api/test") {

            if (request.method !== "GET" && request.method !== "POST") {
                return json({
                    success: false,
                    error: "روش درخواست باید GET یا POST باشد"
                }, 405);
            }

            const testMessages = [
                {
                    role: "system",
                    content: "You are a test assistant."
                },
                {
                    role: "user",
                    content: "Reply with exactly: HENDESYAR_OK"
                }
            ];

            const results: any = {};

            // GROQ

            const groq = await callGroq({
                messages: testMessages,
                temperature: 0,
                max_tokens: 20
            });

            results.groq = {
                ok: groq.ok,
                status: groq.status,
                content: extractOpenAIContent(groq.data),
                error: groq.ok ? null : groq.data
            };

            // OPENROUTER

            const openrouter = await callOpenRouter({
                messages: testMessages,
                temperature: 0,
                max_tokens: 20
            });

            results.openrouter = {
                ok: openrouter.ok,
                status: openrouter.status,
                content: extractOpenAIContent(openrouter.data),
                error: openrouter.ok ? null : openrouter.data
            };

            // GEMINI

            const gemini = await callGemini({
                contents: [
                    {
                        parts: [
                            {
                                text: "Reply with exactly: HENDESYAR_OK"
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0,
                    maxOutputTokens: 20
                }
            });

            results.gemini = {
                ok: gemini.ok,
                status: gemini.status,
                content: extractGeminiContent(gemini.data),
                error: gemini.ok ? null : gemini.data
            };

            const successful =
                groq.ok ||
                openrouter.ok ||
                gemini.ok;

            return json({
                success: successful,
                message: successful
                    ? "حداقل یک Provider سالم است"
                    : "تمام Providerها شکست خوردند",
                results,
                timestamp: new Date().toISOString()
            }, successful ? 200 : 502);
        }

        // --------------------------------
        // CHAT
        // --------------------------------

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

            if (!body?.messages || !Array.isArray(body.messages)) {
                return json({
                    success: false,
                    error: "messages ارسال نشده یا آرایه نیست"
                }, 400);
            }

            console.log(
                `[CHAT] messages=${body.messages.length}`
            );

            // --------------------------------
            // 1. GROQ
            // --------------------------------

            const groq = await callGroq(body);

            const groqContent =
                extractOpenAIContent(groq.data);

            if (groq.ok && groqContent) {

                console.log(
                    "[CHAT] Provider selected: GROQ"
                );

                return json({
                    success: true,
                    provider: "groq",
                    content: groqContent
                });
            }

            console.warn(
                "[CHAT] Groq failed, switching to OpenRouter"
            );

            // --------------------------------
            // 2. OPENROUTER
            // --------------------------------

            const openrouter =
                await callOpenRouter(body);

            const openrouterContent =
                extractOpenAIContent(openrouter.data);

            if (openrouter.ok && openrouterContent) {

                console.log(
                    "[CHAT] Provider selected: OPENROUTER"
                );

                return json({
                    success: true,
                    provider: "openrouter",
                    content: openrouterContent
                });
            }

            console.error(
                "[CHAT] Groq + OpenRouter failed"
            );

            return json({
                success: false,
                provider: "none",
                error: {
                    message: "تمام سرویس‌های متنی شکست خوردند",

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

        // --------------------------------
        // VISION
        // --------------------------------

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
تو دستیار هوشمند هندسیار هستی؛
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
    ? `توضیح دانش‌آموز: ${question}`
    : ""}

دستورها:

1. ابتدا متن سؤال و اطلاعات شکل را دقیق بخوان.
2. نقاط، ضلع‌ها، زاویه‌ها و علامت‌های شکل را بررسی کن.
3. اگر اطلاعات کافی نیست، حدس نزن.
4. راه‌حل را مرحله‌به‌مرحله توضیح بده.
5. فرمول‌ها را با LaTeX بنویس.
6. فارسی روان و مناسب پایه هشتم و نهم استفاده کن.
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

            const content =
                extractGeminiContent(gemini.data);

            if (gemini.ok && content) {

                console.log(
                    "[VISION] Provider selected: GEMINI"
                );

                return json({
                    success: true,
                    provider: "gemini",
                    content
                });
            }

            return json({
                success: false,
                provider: "gemini",
                error: gemini.data
            }, 502);
        }

        // --------------------------------
        // 404
        // --------------------------------

        return json({
            success: false,
            error: "مسیر نامعتبر",
            path: url.pathname
        }, 404);

    } catch (error) {

        console.error(
            "[SERVER ERROR]",
            error
        );

        return json({
            success: false,
            error: error instanceof Error
                ? error.message
                : String(error)
        }, 500);
    }
}

console.log("================================");
console.log("🚀 Hendesyar AI Proxy Started");
console.log("================================");
console.log("Groq:", Boolean(GROQ_API_KEY));
console.log("OpenRouter:", Boolean(OPENROUTER_API_KEY));
console.log("Gemini:", Boolean(GEMINI_API_KEY));
console.log("================================");

Deno.serve(handleRequest);
