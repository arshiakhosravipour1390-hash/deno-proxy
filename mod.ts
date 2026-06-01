// mod.ts - پروکسی ساده برای Groq API

Deno.serve(async (req) => {
  const url = new URL(req.url);
  
  // فقط درخواست‌های مربوط به چت رو پروکسی کن
  if (url.pathname === '/v1/chat/completions') {
    const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
    
    // هدرها رو کپی کن ولی هاست رو عوض کن
    const headers = new Headers(req.headers);
    headers.set('Host', 'api.groq.com');
    
    try {
      const response = await fetch(groqUrl, {
        method: req.method,
        headers: headers,
        body: req.body
      });
      
      // پاسخ رو با CORS مناسب برگردون
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Proxy error: ' + error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  // پاسخ برای درخواست‌های دیگر
  return new Response('Proxy is running! Use POST /v1/chat/completions', { 
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
});
