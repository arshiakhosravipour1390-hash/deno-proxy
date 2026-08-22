const GROQ_API_KEY = "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";
const OPENROUTER_API_KEY = "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";
const GEMINI_API_KEY = "AQ.Ab8RN6K-U5qy3SZcXIa1UrL2yabRuy1uYD5n8cbozrYMWvq3Yw";
const GEMINI_MODEL = "gemini-3.7-flash";
const GROQ_MODEL = "openai/gpt-oss-20b";
const OPENROUTER_MODEL = "openrouter/free";

const MAX_IMAGE_BASE64 = 16 * 1024 * 1024;

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
            "Content-Type": "application/json; charset=utf-8"
        }
    });
}

function errorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
}


/* =========================================================
   هندسیار — پرامپت اصلی
========================================================= */

const HENDESYAR_SYSTEM_PROMPT = `
تو «هندسیار» هستی؛ یک دستیار آموزشی تخصصی ریاضی و هندسه برای دانش‌آموزان پایه هشتم و نهم.

هویت:
- نام تو هندسیار است.
- معلم و همراه آموزشی هستی، نه یک چت‌بات عمومی.
- همیشه فارسی روان، محترمانه و قابل فهم صحبت کن.
- پاسخ‌ها باید دقیق، آموزشی و مرحله‌به‌مرحله باشند.

حوزه تخصصی:
- هندسه پایه هشتم و نهم
- مثلث‌ها
- هم‌نهشتی مثلث‌ها
- تشابه مثلث‌ها
- زاویه‌ها
- روابط بین زاویه‌ها
- مثلث متساوی‌الساقین
- مثلث متساوی‌الاضلاع
- مثلث قائم‌الزاویه
- قضیه فیثاغورس
- محیط و مساحت شکل‌های هندسی
- نسبت و تناسب در هندسه
- طول ضلع‌ها و زاویه‌ها
- استدلال و اثبات‌های ساده هندسی
- حل مسائل ریاضی مرتبط با هندسه در سطح مدرسه

قوانین علمی مهم:

1. در هم‌نهشتی مثلث‌ها از معیارهای معتبر استفاده کن:
   - ض‌ض‌ض (SSS)
   - ض‌ز‌ض (SAS)
   - ز‌ض‌ز (ASA)
   - ز‌ز‌ض (AAS)
   - معیارهای ویژه مثلث قائم‌الزاویه در صورت برقرار بودن شرایط لازم.

2. سه زاویه برابر (AAA) معیار هم‌نهشتی نیست؛ AAA می‌تواند تشابه را مشخص کند.

3. در تشابه مثلث‌ها از معیارهای مناسب مانند:
   - ز‌ز (AA)
   - ض‌ز‌ض (SAS)
   - ض‌ض‌ض (SSS)
   استفاده کن.

4. همه مثلث‌های هم‌نهشت مشابه‌اند، اما همه مثلث‌های مشابه هم‌نهشت نیستند.

5. در مثلث متساوی‌الساقین، زاویه‌های مقابل ضلع‌های مساوی برابرند.

6. مجموع زاویه‌های داخلی هر مثلث برابر ۱۸۰ درجه است.

7. در مثلث قائم‌الزاویه، قضیه فیثاغورس را فقط در صورت وجود زاویه ۹۰ درجه استفاده کن:
   a² + b² = c²
   که c وتر است.

8. هرگز اطلاعاتی را که در سؤال وجود ندارد، به عنوان داده فرض نکن.

9. اگر شکل یا متن سؤال ناقص است، صریحاً بگو چه اطلاعاتی کم است.

10. نام‌گذاری نقاط را دقیق حفظ کن.
مثلاً اگر سؤال درباره ABC است، نام نقاط را تغییر نده.

روش حل:

اگر سؤال مسئله‌ای بود:

۱. داده‌های مسئله را مشخص کن.
۲. خواسته مسئله را مشخص کن.
۳. قضیه یا معیار مناسب را انتخاب کن.
۴. مراحل استدلال را به ترتیب بنویس.
۵. محاسبات را انجام بده.
۶. جواب نهایی را مشخص کن.
۷. در صورت امکان یک بررسی کوتاه انجام بده.

فرمول‌ها را با LaTeX بنویس.

مثلاً:
\\[
AB = AC
\\]

و:

\\[
\\angle B = \\angle C
\\]

سبک آموزشی:

- اگر دانش‌آموز اشتباه کرد، با احترام اصلاحش کن.
- فقط نگو «غلط است»؛ توضیح بده چرا.
- اگر روش دانش‌آموز درست بود، آن را تأیید و کامل کن.
- از توضیحات بی‌ربط خودداری کن.
- پاسخ را بیش از حد طولانی نکن مگر اینکه مسئله پیچیده باشد.
- برای سؤال ساده، پاسخ ساده بده.
- برای مسئله سخت، مرحله‌به‌مرحله و دقیق‌تر توضیح بده.

محدوده:

اگر سؤال کاملاً خارج از ریاضی و هندسه بود، پاسخ بده:

«من دستیار تخصصی هندسیار هستم و تمرکزم روی ریاضی و هندسه است. اگر سؤال هندسی یا ریاضی داری، با کمال میل کمکت می‌کنم.»

اگر سؤال به ریاضی نزدیک بود ولی خارج از سطح هندسیار بود، تا جایی که به ریاضی مدرسه مرتبط است کمک کن.

هرگز درباره سیاست، اخبار، سرگرمی، بازی، پزشکی، حقوق، برنامه‌نویسی عمومی یا موضوعات نامرتبط وارد گفت‌وگوی طولانی نشو.

هدف اصلی:
کمک کن دانش‌آموز خودش مفهوم را بفهمد، نه اینکه فقط جواب نهایی را ببیند.
`;


/* =========================================================
   تبدیل پیام‌ها برای مدل‌ها
========================================================= */

function buildMessages(messages) {

    const safeMessages = Array.isArray(messages)
        ? messages.slice(-14)
        : [];

    return [
        {
            role: "system",
            content: HENDESYAR_SYSTEM_PROMPT
        },
        ...safeMessages.map(message => ({
            role:
                message.role === "assistant"
                    ? "assistant"
                    : "user",

            content:
                typeof message.content === "string"
                    ? message.content.slice(0, 12000)
                    : ""
        }))
    ];
}


/* =========================================================
   GROQ
========================================================= */

async function callGroq(body) {

    if (!GROQ_API_KEY) {
        return {
            ok: false,
            status: 500,
            content: null,
            error: "GROQ_API_KEY تنظیم نشده است"
        };
    }

    try {

        const messages = buildMessages(body.messages);

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
                    messages,
                    temperature: body.temperature ?? 0.25,
                    max_tokens: body.max_tokens ?? 1800
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
            data?.choices?.[0]?.message?.content || null;

        console.log(
            `[GROQ] ${response.status}`
        );

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

        console.error("[GROQ]", error);

        return {
            ok: false,
            status: 500,
            content: null,
            error: errorMessage(error)
        };
    }
}


/* =========================================================
   OPENROUTER
========================================================= */

async function callOpenRouter(body) {

    if (!OPENROUTER_API_KEY) {
        return {
            ok: false,
            status: 500,
            content: null,
            error: "OPENROUTER_API_KEY تنظیم نشده است"
        };
    }

    try {

        const messages = buildMessages(body.messages);

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
                    messages,
                    temperature: body.temperature ?? 0.25,
                    max_tokens: body.max_tokens ?? 1800
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
            data?.choices?.[0]?.message?.content || null;

        console.log(
            `[OPENROUTER] ${response.status}`
        );

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
            error: errorMessage(error)
        };
    }
}


/* =========================================================
   تبدیل پیام‌ها برای Gemini
========================================================= */

function convertToGemini(messages) {

    return messages
        .map(message => {

            const role =
                message.role === "assistant"
                    ? "دستیار"
                    : "دانش‌آموز";

            return `${role}:
${message.content}`;
        })
        .join("\n\n");
}


/* =========================================================
   GEMINI TEXT
========================================================= */

async function callGemini(body) {

    if (!GEMINI_API_KEY) {
        return {
            ok: false,
            status: 500,
            content: null,
            error: "GEMINI_API_KEY تنظیم نشده است"
        };
    }

    try {

        const prompt = convertToGemini(
            buildMessages(body.messages)
        );

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
            {
                method: "POST",

                headers: {
                    "x-goog-api-key":
                        GEMINI_API_KEY,

                    "Content-Type":
                        "application/json"
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
                        maxOutputTokens:
                            body.max_tokens ?? 1800,

                        thinkingConfig: {
                            thinkingLevel: "medium"
                        }
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
            `[GEMINI] ${response.status}`
        );

        const content =
            data?.candidates?.[0]
                ?.content
                ?.parts
                ?.map(part => part.text || "")
                .join("") || null;

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
            "[GEMINI]",
            error
        );

        return {
            ok: false,
            status: 500,
            content: null,
            error: errorMessage(error)
        };
    }
}


/* =========================================================
   GEMINI VISION
========================================================= */

async function callGeminiVision(body) {

    if (!GEMINI_API_KEY) {
        return {
            ok: false,
            status: 500,
            content: null,
            error: "GEMINI_API_KEY تنظیم نشده است"
        };
    }

    if (!body.imageData) {
        return {
            ok: false,
            status: 400,
            content: null,
            error: "تصویر ارسال نشده است"
        };
    }

    if (
        typeof body.imageData !== "string" ||
        body.imageData.length > MAX_IMAGE_BASE64
    ) {
        return {
            ok: false,
            status: 413,
            content: null,
            error: "حجم تصویر بیش از حد مجاز است"
        };
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/heic",
        "image/heif"
    ];

    const mimeType =
        allowedTypes.includes(body.mimeType)
            ? body.mimeType
            : "image/jpeg";

    const question =
        typeof body.question === "string"
            ? body.question.slice(0, 6000)
            : "";

    const mode =
        typeof body.mode === "string"
            ? body.mode
            : "normal";

    let modeInstruction = "";

    if (mode === "hint") {

        modeInstruction = `
دانش‌آموز فقط راهنمایی می‌خواهد.
جواب نهایی را مستقیم اعلام نکن.
یک یا چند راهنمای مرحله‌ای بده تا خودش به جواب برسد.
`;

    } else if (mode === "check") {

        modeInstruction = `
دانش‌آموز می‌خواهد جواب خودش بررسی شود.
اول پاسخ او را بررسی کن.
اگر درست است دلیلش را توضیح بده.
اگر غلط است دقیقاً مرحله اشتباه را مشخص کن و روش اصلاح را نشان بده.
`;

    } else if (mode === "solve") {

        modeInstruction = `
دانش‌آموز درخواست حل کامل دارد.
مسئله را از ابتدا تا انتها مرحله‌به‌مرحله حل کن.
`;

    } else {

        modeInstruction = `
به صورت آموزشی و متناسب با سؤال پاسخ بده.
`;
    }

    const prompt = `
تو بخش تحلیل تصویر «هندسیار» هستی.

${HENDESYAR_SYSTEM_PROMPT}

${modeInstruction}

این تصویر را با دقت بررسی کن.

وظایف:

۱. ابتدا مشخص کن در تصویر چه چیزی دیده می‌شود.
۲. متن سؤال را تا حد امکان دقیق بخوان.
۳. نام نقاط، ضلع‌ها و زاویه‌ها را حفظ کن.
۴. داده‌های مسئله را استخراج کن.
۵. خواسته مسئله را مشخص کن.
۶. اگر شکل هندسی وجود دارد، روابط قابل مشاهده را تحلیل کن.
۷. اگر مسئله هم‌نهشتی است، معیار مناسب را بررسی کن.
۸. اگر مسئله تشابه است، معیار مناسب را بررسی کن.
۹. اگر مسئله زاویه‌ای است، از مجموع زاویه‌های مثلث و روابط زاویه‌ای مناسب استفاده کن.
۱۰. اگر مثلث متساوی‌الساقین است، از برابری زاویه‌های مقابل ساق‌های مساوی استفاده کن.
۱۱. اگر مثلث قائم‌الزاویه است، در صورت نیاز از فیثاغورس استفاده کن.
۱۲. اگر اطلاعات تصویر کافی نیست، حدس نزن.

${question
    ? `درخواست دانش‌آموز:\n${question}`
    : "درخواست دانش‌آموز: سؤال داخل تصویر را تحلیل کن."}

پاسخ را به فارسی روان و آموزشی ارائه کن.
فرمول‌ها را با LaTeX بنویس.
`;

    try {

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
            {
                method: "POST",

                headers: {
                    "x-goog-api-key":
                        GEMINI_API_KEY,

                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

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
                                            body.imageData
                                    }
                                }

                            ]
                        }
                    ],

                    generationConfig: {

                        maxOutputTokens:
                            2200,

                        thinkingConfig: {
                            thinkingLevel: "medium"
                        }
                    }

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
            `[GEMINI VISION] ${response.status}`
        );

        const content =
            data?.candidates?.[0]
                ?.content
                ?.parts
                ?.map(part => part.text || "")
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
            "[GEMINI VISION]",
            error
        );

        return {

            ok: false,

            status: 500,

            content: null,

            error:
                errorMessage(error)
        };
    }
}


/* =========================================================
   CHAT
========================================================= */

async function handleChat(request) {

    let body;

    try {
        body = await request.json();
    } catch {

        return json(
            {
                success: false,
                error: "JSON نامعتبر است"
            },
            400
        );
    }

    if (!Array.isArray(body.messages)) {

        return json(
            {
                success: false,
                error: "messages ارسال نشده است"
            },
            400
        );
    }

    const results = {};

    console.log("========== CHAT ==========");

    results.groq =
        await callGroq(body);

    if (
        results.groq.ok &&
        results.groq.content
    ) {

        return json({
            success: true,
            provider: "groq",
            content: results.groq.content
        });
    }

    results.openrouter =
        await callOpenRouter(body);

    if (
        results.openrouter.ok &&
        results.openrouter.content
    ) {

        return json({
            success: true,
            provider: "openrouter",
            content:
                results.openrouter.content
        });
    }

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

    return json(
        {
            success: false,
            error:
                "تمام سرویس‌های هوش مصنوعی در دسترس نیستند",
            results,
            timestamp:
                new Date().toISOString()
        },
        502
    );
}


/* =========================================================
   VISION
========================================================= */

async function handleVision(request) {

    let body;

    try {
        body = await request.json();
    } catch {

        return json(
            {
                success: false,
                error: "JSON نامعتبر است"
            },
            400
        );
    }

    const result =
        await callGeminiVision(body);

    if (result.ok) {

        return json({
            success: true,
            provider: "gemini",
            content: result.content
        });
    }

    return json(
        {
            success: false,
            provider: "gemini",
            error: result.error,
            status: result.status
        },
        result.status >= 400
            ? result.status
            : 502
    );
}


/* =========================================================
   TEST
========================================================= */

async function handleTest(request) {

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
                    HENDESYAR_SYSTEM_PROMPT
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

    console.log(
        "================================"
    );

    console.log(
        "🧪 HENDESYAR PROVIDER TEST"
    );

    console.log(
        "================================"
    );

    const results = {};

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


/* =========================================================
   HEALTH
========================================================= */

async function handleHealth() {

    return json({

        success: true,

        status: "ok",

        service:
            "hendesyar-ai",

        model: {
            groq: GROQ_MODEL,
            openrouter: OPENROUTER_MODEL,
            gemini: GEMINI_MODEL
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


/* =========================================================
   SERVER
========================================================= */

async function handleRequest(request) {

    if (request.method === "OPTIONS") {

        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    const url =
        new URL(request.url);

    try {

        if (
            url.pathname === "/health"
        ) {

            return handleHealth();
        }


        if (
            url.pathname === "/api/test"
        ) {

            return handleTest(request);
        }


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

            return handleChat(request);
        }


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

            return handleVision(request);
        }


        return json(
            {
                success: false,
                error: "مسیر نامعتبر"
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
                    errorMessage(error)
            },
            500
        );
    }
}


Deno.serve(handleRequest);
