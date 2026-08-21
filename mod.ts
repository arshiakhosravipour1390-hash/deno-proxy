const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
};

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
        }
    });
}

async function callGroq(body) {
    const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ...body,
                model: "openai/gpt-oss-120b"
            })
        }
    );

    const data = await response.json();

    return {
        ok: response.ok,
        status: response.status,
        data
    };
}

async function callOpenRouter(body) {
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
                ...body,
                model: "openrouter/free"
            })
        }
    );

    const data = await response.json();

    return {
        ok: response.ok,
        status: response.status,
        data
    };
}

async function callGemini(body) {
    const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=" +
        encodeURIComponent(GEMINI_API_KEY),
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        }
    );

    const data = await response.json();

    return {
        ok: response.ok,
        status: response.status,
        data
    };
}

async function handleRequest(request) {
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    const url = new URL(request.url);

    try {
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

        if (url.pathname === "/api/chat") {
            const body = await request.json();

            const groq = await callGroq(body);

            if (groq.ok && groq.data?.choices?.[0]?.message?.content) {
                return json({
                    success: true,
                    provider: "groq",
                    content: groq.data.choices[0].message.content
                });
            }

            const openrouter = await callOpenRouter(body);

            if (
                openrouter.ok &&
                openrouter.data?.choices?.[0]?.message?.content
            ) {
                return json({
                    success: true,
                    provider: "openrouter",
                    content: openrouter.data.choices[0].message.content
                });
            }

            return json({
                success: false,
                provider: "none",
                error: {
                    groq: groq.data,
                    openrouter: openrouter.data
                }
            }, 502);
        }

        if (url.pathname === "/api/vision") {
            const body = await request.json();

            const mimeType = body.mimeType || "image/jpeg";
            const imageData = body.imageData;
            const question = body.question || "";

            if (!imageData) {
                return json({
                    success: false,
                    error: "تصویر دریافت نشد"
                }, 400);
            }

            const prompt = `
تو دستیار هوشمند هندسیار هستی؛ یک معلم ریاضی فارسی‌زبان برای دانش‌آموزان پایه هشتم و نهم.

تمرکز اصلی:
- هندسه
- مثلث‌ها
- هم‌نهشتی
- تشابه
- زاویه‌ها
- قضایای هندسی
- حل مرحله‌به‌مرحله مسائل

این تصویر یک سؤال یا شکل هندسی است.

${question ? `توضیح دانش‌آموز: ${question}` : ""}

دستورها:
1. ابتدا متن سؤال و اطلاعات شکل را با دقت بخوان.
2. اگر شکل هندسی دارد، نقاط، ضلع‌ها، زاویه‌ها و علامت‌های مساوی را بررسی کن.
3. اگر اطلاعات تصویر کافی نیست، حدس نزن و بگو چه چیزی مشخص نیست.
4. راه‌حل را کاملاً مرحله‌به‌مرحله توضیح بده.
5. فرمول‌های ریاضی را با LaTeX بنویس.
6. پاسخ را به فارسی روان و مناسب پایه هشتم و نهم بده.
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
                        gemini.data.candidates[0].content.parts[0].text
                });
            }

            return json({
                success: false,
                provider: "gemini",
                error: gemini.data
            }, 502);
        }

        return json({
            success: false,
            error: "مسیر نامعتبر"
        }, 404);

    } catch (error) {
        return json({
            success: false,
            error: error instanceof Error
                ? error.message
                : String(error)
        }, 500);
    }
}

Deno.serve(handleRequest);
