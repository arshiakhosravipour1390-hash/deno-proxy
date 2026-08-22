const GROQ_API_KEY = "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";
const OPENROUTER_API_KEY = "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";
const GEMINI_API_KEY = "AQ.Ab8RN6K-U5qy3SZcXIa1UrL2yabRuy1uYD5n8cbozrYMWvq3Yw";
const GROQ_API_KEY = "GROQ_API_KEY";
const OPENROUTER_API_KEY = "OPENROUTER_API_KEY";
const GEMINI_API_KEY = "GEMINI_API_KEY";

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

function extractText(data: any) {
    return (
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        null
    );
}

function extractGeminiText(data: any) {
    return (
        data?.candidates?.[0]?.content?.parts
            ?.map((x: any) => x.text || "")
            .join("")
            .trim() || null
    );
}

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
                    model: "openai/gpt-oss-20b",
                    messages: body.messages,
                    temperature: body.temperature ?? 0.3,
                    max_tokens: body.max_tokens ?? 1200
                })
            }
        );

        const text = await response.text();

        let data;

        try {
            data = JSON.parse(text);
        } catch {
            data = { raw: text };
        }

        const content = extractText(data);

        return {
            ok: response.ok && !!content,
            status: response.status,
            content,
            error: response.ok && content ? null : data
        };

    } catch (error) {
        return {
            ok: false,
            status: 500,
            content: null,
            error: String(error)
        };
    }
}

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
                    model: "openrouter/free",
                    messages: body.messages,
                    temperature: body.temperature ?? 0.3,
                    max_tokens: body.max_tokens ?? 1200
                })
            }
        );

        const text = await response.text();

        let data;

        try {
            data = JSON.parse(text);
        } catch {
            data = { raw: text };
        }

        const content = extractText(data);

        return {
            ok: response.ok && !!content,
            status: response.status,
            content,
            error: response.ok && content ? null : data
        };

    } catch (error) {
        return {
            ok: false,
            status: 500,
            content: null,
            error: String(error)
        };
    }
}

function convertToGemini(messages: any[]) {
    return messages
        .map((message: any) => {
            let role = "دانش‌آموز";

            if (message.role === "system") {
                role = "دستور سیستم";
            }

            if (message.role === "assistant") {
                role = "دستیار";
            }

            return `${role}:\n${message.content}`;
        })
        .join("\n\n");
}

async function callGemini(body: any) {
    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": GEMINI_API_KEY
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text: convertToGemini(body.messages)
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: body.temperature ?? 0.3,
                        maxOutputTokens: body.max_tokens ?? 1200
                    }
                })
            }
        );

        const text = await response.text();

        let data;

        try {
            data = JSON.parse(text);
        } catch {
            data = { raw: text };
        }

        const content = extractGeminiText(data);

        return {
            ok: response.ok && !!content,
            status: response.status,
            content,
            error: response.ok && content ? null : data
        };

    } catch (error) {
        return {
            ok: false,
            status: 500,
            content: null,
            error: String(error)
        };
    }
}

async function callGeminiVision(body: any) {
    try {
        if (!body.imageData) {
            return {
                ok: false,
                status: 400,
                content: null,
                error: "imageData ارسال نشده است"
            };
        }

        const mimeType =
            body.mimeType || "image/jpeg";

        const question =
            body.question ||
            "این تصویر را بررسی کن و اگر مربوط به هندسه یا ریاضی است، آن را آموزشی و مرحله‌به‌مرحله تحلیل کن.";

        const systemInstruction = `
تو «دستیار هوشمند هندسیار» هستی.

وظیفه تو آموزش هندسه و ریاضی به دانش‌آموزان پایه هشتم و نهم است.

در تحلیل تصویر:

- ابتدا تصویر را با دقت بررسی کن.
- اگر تصویر شامل سؤال هندسه یا ریاضی است، متن سؤال را استخراج کن.
- نام نقاط، ضلع‌ها، زاویه‌ها و اعداد را دقیق حفظ کن.
- اگر شکل هندسی وجود دارد، روابط قابل مشاهده در شکل را توضیح بده.
- از حدس زدن اطلاعاتی که در تصویر مشخص نیست خودداری کن.
- داده‌های مسئله را جدا کن.
- خواسته مسئله را مشخص کن.
- سپس راه‌حل را مرحله‌به‌مرحله ارائه بده.
- از فرمول‌های LaTeX استفاده کن.
- اگر سؤال درباره هم‌نهشتی است، معیار مناسب مانند SSS، SAS، ASA، AAS یا حالت‌های مربوط به مثلث قائم‌الزاویه را بررسی کن.
- AAA را معیار هم‌نهشتی معرفی نکن.
- اگر سؤال درباره تشابه است، AA، SAS و SSS را بررسی کن.
- اگر دانش‌آموز در متن سؤال اشتباه کرده باشد، محترمانه آن را اصلاح کن.
- پاسخ برای دانش‌آموز قابل فهم و آموزشی باشد.
- اگر تصویر تار، ناقص یا غیرقابل خواندن است، صریحاً اعلام کن.
- اگر تصویر اصلاً مربوط به ریاضی و هندسه نیست، وارد موضوعات نامرتبط نشو.
`;

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": GEMINI_API_KEY
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [
                            {
                                text: systemInstruction
                            }
                        ]
                    },

                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text: question
                                },
                                {
                                    inline_data: {
                                        mime_type: mimeType,
                                        data: body.imageData
                                    }
                                }
                            ]
                        }
                    ],

                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 1800
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

        const content =
            extractGeminiText(data);

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
        return {
            ok: false,
            status: 500,
            content: null,
            error: String(error)
        };
    }
}

async function callGroqVision(body: any) {
    try {
        if (!body.imageData) {
            return {
                ok: false,
                status: 400,
                content: null,
                error: "imageData ارسال نشده است"
            };
        }

        const mimeType =
            body.mimeType || "image/jpeg";

        const question =
            body.question ||
            "این تصویر را از نظر هندسی و ریاضی تحلیل کن.";

        const systemPrompt = `
تو دستیار آموزشی هندسیار هستی.

تمرکز تو فقط روی ریاضی و هندسه در سطح دانش‌آموزان پایه هشتم و نهم است.

اگر تصویر سؤال هندسه دارد:
1. متن سؤال را استخراج کن.
2. داده‌ها را مشخص کن.
3. خواسته را مشخص کن.
4. شکل را تحلیل کن.
5. راه‌حل را مرحله‌به‌مرحله بنویس.
6. از LaTeX استفاده کن.
7. نام نقاط و روابط را دقیق حفظ کن.
8. در هم‌نهشتی معیار درست را انتخاب کن.
9. AAA را هم‌نهشتی حساب نکن.
10. در صورت ناکافی بودن اطلاعات، حدس نزن.

اگر تصویر مربوط به موضوع دیگری است، فقط بگو که برای تحلیل مسائل هندسه و ریاضی طراحی شده‌ای.
`;

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "qwen/qwen3.6-27b",

                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: question
                                },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url:
                                            `data:${mimeType};base64,${body.imageData}`
                                    }
                                }
                            ]
                        }
                    ],

                    temperature: 0.2,
                    max_tokens: 1800
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

        const content = extractText(data);

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
        return {
            ok: false,
            status: 500,
            content: null,
            error: String(error)
        };
    }
}

async function handleChat(request: Request) {
    let body;

    try {
        body = await request.json();
    } catch {
        return json({
            success: false,
            error: "JSON نامعتبر است"
        }, 400);
    }

    if (!Array.isArray(body.messages)) {
        return json({
            success: false,
            error: "messages ارسال نشده است"
        }, 400);
    }

    const groq =
        await callGroq(body);

    if (groq.ok) {
        return json({
            success: true,
            provider: "groq",
            content: groq.content
        });
    }

    const openrouter =
        await callOpenRouter(body);

    if (openrouter.ok) {
        return json({
            success: true,
            provider: "openrouter",
            content: openrouter.content
        });
    }

    const gemini =
        await callGemini(body);

    if (gemini.ok) {
        return json({
            success: true,
            provider: "gemini",
            content: gemini.content
        });
    }

    return json({
        success: false,
        message: "تمام سرویس‌های متنی ناموفق بودند",
        results: {
            groq,
            openrouter,
            gemini
        }
    }, 502);
}

async function handleVision(request: Request) {
    let body;

    try {
        body = await request.json();
    } catch {
        return json({
            success: false,
            error: "JSON نامعتبر است"
        }, 400);
    }

    if (!body.imageData) {
        return json({
            success: false,
            error: "imageData ارسال نشده است"
        }, 400);
    }

    const gemini =
        await callGeminiVision(body);

    if (gemini.ok) {
        return json({
            success: true,
            provider: "gemini",
            content: gemini.content
        });
    }

    const groq =
        await callGroqVision(body);

    if (groq.ok) {
        return json({
            success: true,
            provider: "groq-vision",
            content: groq.content
        });
    }

    return json({
        success: false,
        provider: "vision",
        error: {
            gemini: gemini.error,
            groq: groq.error
        },
        status: gemini.status || groq.status
    }, 502);
}

async function handleTest(request: Request) {
    if (request.method !== "POST") {
        return json({
            success: false,
            error: "روش درخواست باید POST باشد"
        }, 405);
    }

    const body = {
        messages: [
            {
                role: "system",
                content: "تو یک دستیار فارسی هستی."
            },
            {
                role: "user",
                content: "فقط بنویس: تست موفق بود"
            }
        ],
        temperature: 0.2,
        max_tokens: 100
    };

    const groq =
        await callGroq(body);

    const openrouter =
        await callOpenRouter(body);

    const gemini =
        await callGemini(body);

    return json({
        success:
            groq.ok ||
            openrouter.ok ||
            gemini.ok,

        results: {
            groq,
            openrouter,
            gemini
        },

        timestamp:
            new Date().toISOString()
    });
}

async function handleHealth() {
    return json({
        success: true,
        status: "ok",
        service: "hendesyar-ai",
        providers: {
            groq: !!GROQ_API_KEY,
            openrouter: !!OPENROUTER_API_KEY,
            gemini: !!GEMINI_API_KEY
        },
        timestamp:
            new Date().toISOString()
    });
}

async function handleRequest(request: Request) {
    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    const url =
        new URL(request.url);

    try {
        if (url.pathname === "/health") {
            return handleHealth();
        }

        if (url.pathname === "/api/test") {
            return handleTest(request);
        }

        if (
            url.pathname === "/api/chat" &&
            request.method === "POST"
        ) {
            return handleChat(request);
        }

        if (
            url.pathname === "/api/vision" &&
            request.method === "POST"
        ) {
            return handleVision(request);
        }

        return json({
            success: false,
            error: "مسیر نامعتبر"
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
