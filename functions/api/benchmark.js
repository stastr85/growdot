export const onRequestPost = async ({ request, env }) => {
  try {
    const { company, region } = await request.json();
    const name = (company || '').toString().trim();
    const reg = (region || 'US').toString().trim();
    if (name.length < 2 || name.length > 80) return json({ error: 'Invalid company name.' }, 400);
    if (!env.OPENAI_API_KEY) return json({ error: 'Server is not configured.' }, 500);

    const system = `
You are a precise business analyst.
Task: Compare the named company to industry best practices of comparable size.
Then identify only TWO specific areas where they show potential weakness or underperformance.
Support each weakness with brief, factual reasoning and relevant market examples or data points.
Keep the analysis short, clear, concise, and tailored to a U.S. business audience.
Deliver your answer in **3 sections**.
Each section must start with a **bold title** on its own line, e.g., **Overview**, **Strengths & Gaps**, **Recommendations**.
Leave one blank line between sections.
Tone: professional, concise, neutral. Avoid disclaimers. Max 300 words total.
`;

    const user = `Company: "${name}". Region: ${reg}.`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.5,
        max_tokens: 400,
        messages: [
          { role: 'system', content: system.trim() },
          { role: 'user', content: user }
        ]
      })
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return json({ error: `Upstream error: ${resp.status} ${txt.slice(0,300)}` }, 502);
    }
    const data = await resp.json();
    const summary = (data?.choices?.[0]?.message?.content || '').trim();
    if (!summary) return json({ error: 'Empty response.' }, 502);

    return json({ summary });
  } catch (e) {
    return json({ error: e.message || 'Unexpected error' }, 500);
  }
};

function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...headers
    }
  });
}
