// ============================================================
// پروکسی Deno با پشتیبانی کامل از CORS
// ============================================================

const GROQ_API_KEY = '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';

// هدرهای CORS - این کلید اصلی حل مشکل است
const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // اجازه دسترسی به همه
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', // متدهای مجاز
    'Access-Control-Allow-Headers': 'Content-Type, Authorization', // هدرهای مجاز
    'Access-Control-Max-Age': '86400', // کش کردن پاسخ CORS به مدت ۱ روز
};

async function handleRequest(request: Request): Promise<Response> {
    // مدیریت درخواست OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
        // مسیر اصلی: /openai/v1/chat/completions و /v1/chat/completions
        if (path === '/v1/chat/completions' || path === '/openai/v1/chat/completions') {
            const body = await request.json();
            const authHeader = request.headers.get('Authorization');
            const apiKey = authHeader?.replace('Bearer ', '') || GROQ_API_KEY;

            // ارسال به Groq
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            
            // اضافه کردن هدرهای CORS به پاسخ
            return new Response(JSON.stringify(data), {
                headers: { 
                    ...corsHeaders, 
                    'Content-Type': 'application/json' 
                },
            });
        }

        // مسیر سلامت
        if (path === '/health') {
            return new Response(JSON.stringify({
                status: 'ok',
                service: 'groq',
                timestamp: new Date().toISOString(),
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // مسیر پیش‌فرض
        return new Response(JSON.stringify({
            error: 'مسیر نامعتبر',
            paths: ['/v1/chat/completions', '/openai/v1/chat/completions', '/health'],
        }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
}

Deno.serve(handleRequest);
