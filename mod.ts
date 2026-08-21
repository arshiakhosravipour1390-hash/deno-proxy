const GROQ_API_KEY = 'کلید را اینجا قرار بده';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

async function handleRequest(request) {
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: corsHeaders
        });
    }

    const url = new URL(request.url);

    try {

        if (
            url.pathname === '/v1/chat/completions' ||
            url.pathname === '/openai/v1/chat/completions'
        ) {

            const body = await request.json();

            // کلید را فقط از سمت سرور استفاده کن
            const response = await fetch(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                }
            );

            const data = await response.json();

            return new Response(JSON.stringify(data), {
                status: response.status,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });
        }

        if (url.pathname === '/health') {
            return new Response(
                JSON.stringify({
                    status: 'ok',
                    service: 'groq',
                    timestamp: new Date().toISOString()
                }),
                {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json'
                    }
                }
            );
        }

        return new Response(
            JSON.stringify({
                error: 'مسیر نامعتبر'
            }),
            {
                status: 404,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            }
        );

    } catch (error) {

        return new Response(
            JSON.stringify({
                error: error instanceof Error
                    ? error.message
                    : String(error)
            }),
            {
                status: 500,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}

Deno.serve(handleRequest);
